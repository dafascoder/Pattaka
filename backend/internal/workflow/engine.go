package workflow

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"backend/internal/db"
	sqlc "backend/internal/db/sqlc"
	"backend/internal/events"
	"backend/internal/logger"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// ExecutionEngine handles the execution of workflows
type ExecutionEngine struct {
	db     *db.DB
	logger *logger.Logger
}

// broadcastStepEvent broadcasts a step-level execution event
func (e *ExecutionEngine) broadcastStepEvent(eventType string, flowRunID uuid.UUID, stepName string, status string, data map[string]interface{}, errorMsg string, duration int64) {
	event := events.ExecutionEvent{
		Type:      eventType,
		Timestamp: time.Now(),
		FlowRunID: flowRunID.String(),
		StepName:  stepName,
		Status:    status,
		Data:      data,
		Error:     errorMsg,
		Duration:  duration,
	}

	e.logger.WithFields(map[string]interface{}{
		"event_type":  eventType,
		"flow_run_id": flowRunID.String(),
		"step_name":   stepName,
		"status":      status,
		"data_size":   len(data),
	}).Debug("Broadcasting step execution event")

	events.BroadcastExecutionEvent(event)
}

// NewExecutionEngine creates a new workflow execution engine
func NewExecutionEngine(database *db.DB) *ExecutionEngine {
	return &ExecutionEngine{
		db:     database,
		logger: logger.Get(),
	}
}

// ExecuteFlowVersion executes a flow version with comprehensive logging
func (e *ExecutionEngine) ExecuteFlowVersion(ctx context.Context, flowRun *sqlc.FlowRun, flowVersion *sqlc.FlowVersion) error {
	runID := uuid.UUID(flowRun.ID.Bytes)
	versionID := uuid.UUID(flowVersion.ID.Bytes)

	e.logger.WithFields(map[string]interface{}{
		"flow_run_id":     runID.String(),
		"flow_version_id": versionID.String(),
		"flow_name":       flowVersion.DisplayName,
		"version":         flowVersion.Version,
		"environment":     flowRun.Environment.String,
	}).Info("Starting flow execution")

	// Parse the steps from the flow version
	var steps map[string]interface{}
	if err := json.Unmarshal(flowVersion.Steps, &steps); err != nil {
		e.logger.WithError(err).WithField("flow_run_id", runID.String()).Error("Failed to parse flow steps")
		return e.markFlowRunFailed(ctx, runID, fmt.Sprintf("Failed to parse flow steps: %v", err))
	}

	// Parse the trigger
	var trigger map[string]interface{}
	if err := json.Unmarshal(flowVersion.Trigger, &trigger); err != nil {
		e.logger.WithError(err).WithField("flow_run_id", runID.String()).Error("Failed to parse flow trigger")
		return e.markFlowRunFailed(ctx, runID, fmt.Sprintf("Failed to parse flow trigger: %v", err))
	}

	// Handle empty trigger data
	if trigger == nil || len(trigger) == 0 {
		e.logger.WithField("flow_run_id", runID.String()).Warn("Empty trigger data, using default manual trigger")
		trigger = map[string]interface{}{
			"type": "manual",
		}
	}

	// Ensure trigger has a type
	triggerType := getTriggerType(trigger)
	if triggerType == "" || triggerType == "manual" {
		trigger["type"] = "manual"
	}

	e.logger.WithFields(map[string]interface{}{
		"flow_run_id":  runID.String(),
		"step_count":   len(steps),
		"trigger_type": getTriggerType(trigger),
	}).Info("Flow execution plan created")

	// Execute the trigger first
	triggerOutput, err := e.executeTrigger(ctx, runID, trigger)
	if err != nil {
		e.logger.WithError(err).WithField("flow_run_id", runID.String()).Error("Trigger execution failed")
		return e.markFlowRunFailed(ctx, runID, fmt.Sprintf("Trigger execution failed: %v", err))
	}

	e.logger.WithFields(map[string]interface{}{
		"flow_run_id":    runID.String(),
		"trigger_output": triggerOutput,
	}).Info("Trigger executed successfully")

	// Execute steps in sequence
	stepContext := triggerOutput
	stepOrder := getStepExecutionOrder(steps)

	e.logger.WithFields(map[string]interface{}{
		"flow_run_id":     runID.String(),
		"execution_order": stepOrder,
	}).Info("Starting step execution sequence")

	for i, stepName := range stepOrder {
		stepData, exists := steps[stepName]
		if !exists {
			e.logger.WithFields(map[string]interface{}{
				"flow_run_id": runID.String(),
				"step_name":   stepName,
				"step_index":  i,
			}).Warn("Step not found in flow definition, skipping")
			continue
		}

		e.logger.WithFields(map[string]interface{}{
			"flow_run_id": runID.String(),
			"step_name":   stepName,
			"step_index":  i + 1,
			"total_steps": len(stepOrder),
		}).Info("Executing step")

		stepOutput, err := e.executeStep(ctx, runID, stepName, stepData, stepContext)
		if err != nil {
			e.logger.WithError(err).WithFields(map[string]interface{}{
				"flow_run_id": runID.String(),
				"step_name":   stepName,
				"step_index":  i + 1,
			}).Error("Step execution failed")
			return e.markFlowRunFailed(ctx, runID, fmt.Sprintf("Step '%s' failed: %v", stepName, err))
		}

		// Update context with step output for next steps
		stepContext = mergeStepContext(stepContext, stepName, stepOutput)

		e.logger.WithFields(map[string]interface{}{
			"flow_run_id":  runID.String(),
			"step_name":    stepName,
			"step_index":   i + 1,
			"step_output":  stepOutput,
			"context_size": len(stepContext),
		}).Info("Step executed successfully")
	}

	// Mark flow run as succeeded
	if err := e.markFlowRunSucceeded(ctx, runID); err != nil {
		e.logger.WithError(err).WithField("flow_run_id", runID.String()).Error("Failed to mark flow run as succeeded")
		return err
	}

	e.logger.WithFields(map[string]interface{}{
		"flow_run_id":    runID.String(),
		"total_steps":    len(stepOrder),
		"execution_time": time.Since(flowRun.StartTime.Time),
	}).Info("Flow execution completed successfully")

	return nil
}

// executeTrigger executes the trigger and returns its output
func (e *ExecutionEngine) executeTrigger(ctx context.Context, flowRunID uuid.UUID, trigger map[string]interface{}) (map[string]interface{}, error) {
	triggerType := getTriggerType(trigger)

	e.logger.WithFields(map[string]interface{}{
		"flow_run_id":  flowRunID.String(),
		"trigger_type": triggerType,
	}).Debug("Processing trigger")

	// Create step run for trigger
	stepRun, err := e.createStepRun(ctx, flowRunID, "trigger", trigger)
	if err != nil {
		return nil, fmt.Errorf("failed to create trigger step run: %w", err)
	}

	var output map[string]interface{}

	switch triggerType {
	case "manual":
		output = map[string]interface{}{
			"triggered_at": time.Now().Format(time.RFC3339),
			"trigger_type": "manual",
		}
	case "webhook":
		// Extract webhook payload if available
		if payload, ok := trigger["payload"]; ok {
			output = map[string]interface{}{
				"triggered_at": time.Now().Format(time.RFC3339),
				"trigger_type": "webhook",
				"payload":      payload,
			}
		} else {
			output = map[string]interface{}{
				"triggered_at": time.Now().Format(time.RFC3339),
				"trigger_type": "webhook",
				"payload":      map[string]interface{}{},
			}
		}
	case "schedule":
		output = map[string]interface{}{
			"triggered_at": time.Now().Format(time.RFC3339),
			"trigger_type": "schedule",
		}
	default:
		e.logger.WithFields(map[string]interface{}{
			"flow_run_id":  flowRunID.String(),
			"trigger_type": triggerType,
		}).Warn("Unknown trigger type, using default output")
		output = map[string]interface{}{
			"triggered_at": time.Now().Format(time.RFC3339),
			"trigger_type": triggerType,
		}
	}

	// Update step run with success
	if err := e.completeStepRun(ctx, stepRun.ID, output, "SUCCEEDED"); err != nil {
		return nil, fmt.Errorf("failed to complete trigger step run: %w", err)
	}

	return output, nil
}

// executeStep executes a single step and returns its output
func (e *ExecutionEngine) executeStep(ctx context.Context, flowRunID uuid.UUID, stepName string, stepData interface{}, context map[string]interface{}) (map[string]interface{}, error) {
	stepMap, ok := stepData.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid step data format for step '%s'", stepName)
	}

	stepType := getStepType(stepMap)
	startTime := time.Now()

	e.logger.WithFields(map[string]interface{}{
		"flow_run_id": flowRunID.String(),
		"step_name":   stepName,
		"step_type":   stepType,
		"step_data":   stepMap,
	}).Debug("Processing step")

	// Broadcast step started event
	e.broadcastStepEvent("step_started", flowRunID, stepName, "RUNNING", map[string]interface{}{
		"stepType": stepType,
		"stepData": stepMap,
		"context":  context,
	}, "", 0)

	// Create step run
	stepRun, err := e.createStepRun(ctx, flowRunID, stepName, stepMap)
	if err != nil {
		// Broadcast step failed event
		e.broadcastStepEvent("step_completed", flowRunID, stepName, "FAILED", map[string]interface{}{
			"stepType": stepType,
		}, fmt.Sprintf("Failed to create step run: %v", err), time.Since(startTime).Milliseconds())
		return nil, fmt.Errorf("failed to create step run for '%s': %w", stepName, err)
	}

	var output map[string]interface{}

	switch stepType {
	case "http":
		output, err = e.executeHTTPStep(ctx, stepName, stepMap, context)
	case "log":
		output, err = e.executeLogStep(ctx, stepName, stepMap, context)
	case "email":
		output, err = e.executeEmailStep(ctx, stepName, stepMap, context)
	case "condition":
		output, err = e.executeConditionStep(ctx, stepName, stepMap, context)
	case "action":
		// Handle generic action type - determine specific action based on step data
		output, err = e.executeActionStep(ctx, stepName, stepMap, context)
	default:
		e.logger.WithFields(map[string]interface{}{
			"flow_run_id": flowRunID.String(),
			"step_name":   stepName,
			"step_type":   stepType,
		}).Warn("Unknown step type, marking as succeeded with empty output")
		output = map[string]interface{}{
			"executed_at": time.Now().Format(time.RFC3339),
			"step_type":   stepType,
			"message":     fmt.Sprintf("Step '%s' of type '%s' executed (placeholder)", stepName, stepType),
		}
	}

	if err != nil {
		// Mark step as failed
		if updateErr := e.failStepRun(ctx, stepRun.ID, err.Error()); updateErr != nil {
			e.logger.WithError(updateErr).WithField("step_run_id", stepRun.ID).Error("Failed to update step run with error")
		}

		// Broadcast step failed event
		e.broadcastStepEvent("step_completed", flowRunID, stepName, "FAILED", map[string]interface{}{
			"stepType": stepType,
		}, err.Error(), time.Since(startTime).Milliseconds())

		return nil, err
	}

	// Mark step as succeeded
	if err := e.completeStepRun(ctx, stepRun.ID, output, "SUCCEEDED"); err != nil {
		// Broadcast step failed event
		e.broadcastStepEvent("step_completed", flowRunID, stepName, "FAILED", map[string]interface{}{
			"stepType": stepType,
		}, fmt.Sprintf("Failed to complete step run: %v", err), time.Since(startTime).Milliseconds())
		return nil, fmt.Errorf("failed to complete step run for '%s': %w", stepName, err)
	}

	// Broadcast step completed event with output data
	e.broadcastStepEvent("step_completed", flowRunID, stepName, "SUCCEEDED", map[string]interface{}{
		"stepType": stepType,
		"output":   output,
	}, "", time.Since(startTime).Milliseconds())

	return output, nil
}

// Step execution implementations
func (e *ExecutionEngine) executeHTTPStep(ctx context.Context, stepName string, stepData map[string]interface{}, context map[string]interface{}) (map[string]interface{}, error) {
	e.logger.WithFields(map[string]interface{}{
		"step_name": stepName,
		"step_type": "http",
		"step_data": stepData,
	}).Info("Executing HTTP step")

	// Extract HTTP configuration from step data
	var httpConfig map[string]interface{}
	if settings, ok := stepData["settings"].(map[string]interface{}); ok {
		httpConfig = settings
	} else {
		httpConfig = stepData
	}

	// Extract URL (required)
	url, ok := httpConfig["url"].(string)
	if !ok || url == "" {
		return nil, fmt.Errorf("URL is required for HTTP step")
	}

	// Extract method (optional, default to GET)
	method := "GET"
	if m, ok := httpConfig["method"].(string); ok && m != "" {
		method = m
	}

	// Extract timeout (optional, default to 10 seconds)
	timeout := 10 * time.Second
	if t, ok := httpConfig["timeout"].(float64); ok && t > 0 {
		timeout = time.Duration(t) * time.Second
	}

	//Implement HTTP step
	// Use a proxy to make the request to the external service

	httpClient := &http.Client{
		Timeout: timeout,
	}

	// Extract request body (optional)
	var requestBody io.Reader
	if body, ok := httpConfig["body"].(string); ok && body != "" {
		requestBody = strings.NewReader(body)
	}

	request, err := http.NewRequestWithContext(ctx, method, url, requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}

	// Add headers (optional)
	if headers, ok := httpConfig["headers"].(map[string]interface{}); ok {
		for key, value := range headers {
			if strValue, ok := value.(string); ok {
				request.Header.Set(key, strValue)
			}
		}
	}

	// Set default Content-Type if body is provided and no Content-Type is set
	if requestBody != nil && request.Header.Get("Content-Type") == "" {
		request.Header.Set("Content-Type", "application/json")
	}

	response, err := httpClient.Do(request)
	if err != nil {
		return nil, fmt.Errorf("failed to make HTTP request: %w", err)
	}

	defer response.Body.Close()

	body, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read HTTP response body: %w", err)
	}

	e.logger.WithFields(map[string]interface{}{
		"step_name":     stepName,
		"step_type":     "http",
		"method":        method,
		"url":           url,
		"status_code":   response.StatusCode,
		"response_body": string(body),
	}).Info("HTTP request executed successfully")

	return map[string]interface{}{
		"executed_at":   time.Now().Format(time.RFC3339),
		"step_type":     "http",
		"method":        method,
		"url":           url,
		"status_code":   response.StatusCode,
		"response_body": string(body),
		"headers":       response.Header,
	}, nil
}

func (e *ExecutionEngine) executeLogStep(ctx context.Context, stepName string, stepData map[string]interface{}, context map[string]interface{}) (map[string]interface{}, error) {
	message := fmt.Sprintf("Log step '%s' executed", stepName)
	if msg, ok := stepData["message"]; ok {
		message = fmt.Sprintf("%v", msg)
	}

	e.logger.WithFields(map[string]interface{}{
		"step_name": stepName,
		"step_type": "log",
		"message":   message,
		"context":   context,
	}).Info("Executing log step")

	return map[string]interface{}{
		"executed_at": time.Now().Format(time.RFC3339),
		"step_type":   "log",
		"message":     message,
		"logged":      true,
	}, nil
}

func (e *ExecutionEngine) executeEmailStep(ctx context.Context, stepName string, stepData map[string]interface{}, context map[string]interface{}) (map[string]interface{}, error) {
	e.logger.WithFields(map[string]interface{}{
		"step_name": stepName,
		"step_type": "email",
		"step_data": stepData,
	}).Info("Executing email step")

	// This is a placeholder implementation
	return map[string]interface{}{
		"executed_at": time.Now().Format(time.RFC3339),
		"step_type":   "email",
		"to":          stepData["to"],
		"subject":     stepData["subject"],
		"sent":        true,
		"message":     "Email sent successfully (placeholder)",
	}, nil
}

func (e *ExecutionEngine) executeConditionStep(ctx context.Context, stepName string, stepData map[string]interface{}, context map[string]interface{}) (map[string]interface{}, error) {
	e.logger.WithFields(map[string]interface{}{
		"step_name": stepName,
		"step_type": "condition",
		"step_data": stepData,
	}).Info("Executing condition step")

	// This is a placeholder implementation
	return map[string]interface{}{
		"executed_at": time.Now().Format(time.RFC3339),
		"step_type":   "condition",
		"condition":   stepData["condition"],
		"result":      true,
		"message":     "Condition evaluated (placeholder)",
	}, nil
}

func (e *ExecutionEngine) executeActionStep(ctx context.Context, stepName string, stepData map[string]interface{}, context map[string]interface{}) (map[string]interface{}, error) {
	e.logger.WithFields(map[string]interface{}{
		"step_name": stepName,
		"step_type": "action",
		"step_data": stepData,
	}).Info("Executing action step")

	// Determine the specific action type from step data
	actionType := "unknown"
	if actionName, ok := stepData["actionName"].(string); ok {
		actionType = actionName
	} else if pieceType, ok := stepData["pieceType"].(string); ok {
		actionType = pieceType
	} else if settings, ok := stepData["settings"].(map[string]interface{}); ok {
		if pieceType, ok := settings["pieceType"].(string); ok {
			actionType = pieceType
		}
	}

	e.logger.WithFields(map[string]interface{}{
		"step_name":   stepName,
		"action_type": actionType,
	}).Debug("Determined action type")

	// Route to specific action handler based on action type
	switch actionType {
	case "http", "http-piece":
		return e.executeHTTPStep(ctx, stepName, stepData, context)
	case "log", "log-piece":
		return e.executeLogStep(ctx, stepName, stepData, context)
	case "email", "email-piece":
		return e.executeEmailStep(ctx, stepName, stepData, context)
	case "if-else", "condition":
		return e.executeIfElseStep(ctx, stepName, stepData, context)
	case "loop", "while":
		return e.executeLoopStep(ctx, stepName, stepData, context)
	case "for-each", "iterate":
		return e.executeForEachStep(ctx, stepName, stepData, context)
	case "switch", "router":
		return e.executeSwitchStep(ctx, stepName, stepData, context)
	default:
		// Generic action execution
		return map[string]interface{}{
			"executed_at": time.Now().Format(time.RFC3339),
			"step_type":   "action",
			"action_type": actionType,
			"message":     fmt.Sprintf("Action step '%s' of type '%s' executed (placeholder)", stepName, actionType),
		}, nil
	}
}

// Conditional step execution methods
func (e *ExecutionEngine) executeIfElseStep(ctx context.Context, stepName string, stepData map[string]interface{}, context map[string]interface{}) (map[string]interface{}, error) {
	e.logger.WithFields(map[string]interface{}{
		"step_name": stepName,
		"step_type": "if-else",
		"step_data": stepData,
	}).Info("Executing if-else step")

	// Extract configuration from step data
	var config map[string]interface{}
	if settings, ok := stepData["settings"].(map[string]interface{}); ok {
		config = settings
	} else {
		config = stepData
	}

	// Get condition
	condition, ok := config["condition"].(string)
	if !ok || condition == "" {
		return nil, fmt.Errorf("condition is required for if-else step")
	}

	// Evaluate condition (placeholder implementation - in real scenario, you'd use an expression evaluator)
	result := e.evaluateCondition(condition, context)

	e.logger.WithFields(map[string]interface{}{
		"step_name": stepName,
		"condition": condition,
		"result":    result,
	}).Info("If-else condition evaluated")

	return map[string]interface{}{
		"executed_at": time.Now().Format(time.RFC3339),
		"step_type":   "if-else",
		"condition":   condition,
		"result":      result,
		"branch":      map[string]interface{}{"condition_met": result},
		"message":     fmt.Sprintf("If-else condition '%s' evaluated to %v", condition, result),
	}, nil
}

func (e *ExecutionEngine) executeLoopStep(ctx context.Context, stepName string, stepData map[string]interface{}, context map[string]interface{}) (map[string]interface{}, error) {
	e.logger.WithFields(map[string]interface{}{
		"step_name": stepName,
		"step_type": "loop",
		"step_data": stepData,
	}).Info("Executing loop step")

	// Extract configuration from step data
	var config map[string]interface{}
	if settings, ok := stepData["settings"].(map[string]interface{}); ok {
		config = settings
	} else {
		config = stepData
	}

	// Get loop condition and max iterations
	condition, ok := config["condition"].(string)
	if !ok || condition == "" {
		return nil, fmt.Errorf("condition is required for loop step")
	}

	maxIterations := 10 // Default
	if max, ok := config["maxIterations"].(float64); ok {
		maxIterations = int(max)
	}
	if maxIterations > 1000 {
		maxIterations = 1000 // Safety limit
	}

	// Execute loop
	var iterations []map[string]interface{}
	iteration := 0

	for iteration < maxIterations {
		// Check condition
		if !e.evaluateCondition(condition, context) {
			break
		}

		iteration++
		iterationResult := map[string]interface{}{
			"iteration": iteration,
			"timestamp": time.Now().Format(time.RFC3339),
			"context":   context,
		}
		iterations = append(iterations, iterationResult)

		// Update context for next iteration (placeholder)
		context["iteration"] = iteration
	}

	e.logger.WithFields(map[string]interface{}{
		"step_name":  stepName,
		"condition":  condition,
		"iterations": iteration,
	}).Info("Loop step completed")

	return map[string]interface{}{
		"executed_at": time.Now().Format(time.RFC3339),
		"step_type":   "loop",
		"condition":   condition,
		"iterations":  iterations,
		"total_count": iteration,
		"message":     fmt.Sprintf("Loop executed %d iterations", iteration),
	}, nil
}

func (e *ExecutionEngine) executeForEachStep(ctx context.Context, stepName string, stepData map[string]interface{}, context map[string]interface{}) (map[string]interface{}, error) {
	e.logger.WithFields(map[string]interface{}{
		"step_name": stepName,
		"step_type": "for-each",
		"step_data": stepData,
	}).Info("Executing for-each step")

	// Extract configuration from step data
	var config map[string]interface{}
	if settings, ok := stepData["settings"].(map[string]interface{}); ok {
		config = settings
	} else {
		config = stepData
	}

	// Get items to iterate over
	var items []interface{}
	if itemsArray, ok := config["items"].([]interface{}); ok {
		items = itemsArray
	} else if itemsExpression, ok := config["itemsExpression"].(string); ok {
		// In a real implementation, you'd evaluate the expression to get the items
		// For now, use a placeholder
		items = []interface{}{"item1", "item2", "item3"}
		e.logger.WithField("expression", itemsExpression).Debug("Using placeholder items for expression")
	} else {
		return nil, fmt.Errorf("items or itemsExpression is required for for-each step")
	}

	// Execute for each item
	var results []map[string]interface{}
	for index, item := range items {
		itemContext := make(map[string]interface{})
		for k, v := range context {
			itemContext[k] = v
		}
		itemContext["item"] = item
		itemContext["index"] = index

		itemResult := map[string]interface{}{
			"index":     index,
			"item":      item,
			"timestamp": time.Now().Format(time.RFC3339),
			"context":   itemContext,
		}
		results = append(results, itemResult)
	}

	e.logger.WithFields(map[string]interface{}{
		"step_name":  stepName,
		"item_count": len(items),
	}).Info("For-each step completed")

	return map[string]interface{}{
		"executed_at": time.Now().Format(time.RFC3339),
		"step_type":   "for-each",
		"items":       items,
		"results":     results,
		"total_count": len(items),
		"message":     fmt.Sprintf("For-each processed %d items", len(items)),
	}, nil
}

func (e *ExecutionEngine) executeSwitchStep(ctx context.Context, stepName string, stepData map[string]interface{}, context map[string]interface{}) (map[string]interface{}, error) {
	e.logger.WithFields(map[string]interface{}{
		"step_name": stepName,
		"step_type": "switch",
		"step_data": stepData,
	}).Info("Executing switch step")

	// Extract configuration from step data
	var config map[string]interface{}
	if settings, ok := stepData["settings"].(map[string]interface{}); ok {
		config = settings
	} else {
		config = stepData
	}

	// Get switch expression
	expression, ok := config["expression"].(string)
	if !ok || expression == "" {
		return nil, fmt.Errorf("expression is required for switch step")
	}

	// Get cases
	cases, ok := config["cases"].([]interface{})
	if !ok || len(cases) == 0 {
		return nil, fmt.Errorf("cases are required for switch step")
	}

	// Evaluate expression (placeholder implementation)
	value := e.evaluateExpression(expression, context)

	// Find matching case
	var matchedCase map[string]interface{}
	var defaultCase map[string]interface{}

	for _, caseItem := range cases {
		if caseMap, ok := caseItem.(map[string]interface{}); ok {
			if caseValue, exists := caseMap["value"]; exists {
				if caseValue == value {
					matchedCase = caseMap
					break
				}
			} else if isDefault, ok := caseMap["default"].(bool); ok && isDefault {
				defaultCase = caseMap
			}
		}
	}

	// Use matched case or default case
	selectedCase := matchedCase
	if selectedCase == nil {
		selectedCase = defaultCase
	}

	var caseResult interface{} = "no_match"
	if selectedCase != nil {
		caseResult = selectedCase["value"]
		if caseResult == nil {
			caseResult = "default"
		}
	}

	e.logger.WithFields(map[string]interface{}{
		"step_name":       stepName,
		"expression":      expression,
		"evaluated_value": value,
		"matched_case":    caseResult,
	}).Info("Switch step completed")

	return map[string]interface{}{
		"executed_at":     time.Now().Format(time.RFC3339),
		"step_type":       "switch",
		"expression":      expression,
		"evaluated_value": value,
		"matched_case":    caseResult,
		"all_cases":       cases,
		"message":         fmt.Sprintf("Switch expression '%s' evaluated to '%v', matched case: %v", expression, value, caseResult),
	}, nil
}

// Helper methods for condition and expression evaluation
func (e *ExecutionEngine) evaluateCondition(condition string, context map[string]interface{}) bool {
	// Placeholder implementation - in a real scenario, you'd use a proper expression evaluator
	// For now, handle some simple cases
	switch condition {
	case "true", "1", "yes":
		return true
	case "false", "0", "no":
		return false
	default:
		// Try to find the condition in context
		if value, exists := context[condition]; exists {
			if boolValue, ok := value.(bool); ok {
				return boolValue
			}
			// Convert other types to boolean
			return value != nil && value != "" && value != 0
		}
		// Default to true for placeholder
		return true
	}
}

func (e *ExecutionEngine) evaluateExpression(expression string, context map[string]interface{}) interface{} {
	// Placeholder implementation - in a real scenario, you'd use a proper expression evaluator
	// Check if expression exists in context
	if value, exists := context[expression]; exists {
		return value
	}
	// Return the expression itself as a fallback
	return expression
}

// Database helper methods
func (e *ExecutionEngine) createStepRun(ctx context.Context, flowRunID uuid.UUID, stepName string, stepData interface{}) (*sqlc.StepRun, error) {
	inputJSON, err := json.Marshal(stepData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal step input: %w", err)
	}

	tx, err := e.db.Pool().Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	stepRun, err := e.db.Queries().WithTx(tx).CreateStepRun(ctx, sqlc.CreateStepRunParams{
		FlowRunID: pgtype.UUID{Bytes: flowRunID, Valid: true},
		StepName:  stepName,
		Status:    pgtype.Text{String: "RUNNING", Valid: true},
		Input:     inputJSON,
		StartTime: pgtype.Timestamptz{Time: time.Now(), Valid: true},
	})
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &stepRun, nil
}

func (e *ExecutionEngine) completeStepRun(ctx context.Context, stepRunID pgtype.UUID, output map[string]interface{}, status string) error {
	outputJSON, err := json.Marshal(output)
	if err != nil {
		return fmt.Errorf("failed to marshal step output: %w", err)
	}

	tx, err := e.db.Pool().Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = e.db.Queries().WithTx(tx).UpdateStepRunOutput(ctx, sqlc.UpdateStepRunOutputParams{
		ID:     stepRunID,
		Output: outputJSON,
		Status: pgtype.Text{String: status, Valid: true},
	})
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (e *ExecutionEngine) failStepRun(ctx context.Context, stepRunID pgtype.UUID, errorMessage string) error {
	tx, err := e.db.Pool().Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = e.db.Queries().WithTx(tx).UpdateStepRunError(ctx, sqlc.UpdateStepRunErrorParams{
		ID:           stepRunID,
		ErrorMessage: pgtype.Text{String: errorMessage, Valid: true},
	})
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (e *ExecutionEngine) markFlowRunSucceeded(ctx context.Context, flowRunID uuid.UUID) error {
	tx, err := e.db.Pool().Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	err = e.db.Queries().WithTx(tx).UpdateFlowRunStatusWithFinishTime(ctx, sqlc.UpdateFlowRunStatusWithFinishTimeParams{
		ID:     pgtype.UUID{Bytes: flowRunID, Valid: true},
		Status: pgtype.Text{String: "SUCCEEDED", Valid: true},
	})
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (e *ExecutionEngine) markFlowRunFailed(ctx context.Context, flowRunID uuid.UUID, errorMessage string) error {
	e.logger.WithFields(map[string]interface{}{
		"flow_run_id":   flowRunID.String(),
		"error_message": errorMessage,
	}).Error("Marking flow run as failed")

	tx, err := e.db.Pool().Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	err = e.db.Queries().WithTx(tx).UpdateFlowRunStatusWithFinishTime(ctx, sqlc.UpdateFlowRunStatusWithFinishTimeParams{
		ID:     pgtype.UUID{Bytes: flowRunID, Valid: true},
		Status: pgtype.Text{String: "FAILED", Valid: true},
	})
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// Helper functions
func getTriggerType(trigger map[string]interface{}) string {
	if triggerType, ok := trigger["type"].(string); ok && triggerType != "" {
		return triggerType
	}
	// Check for alternative field names
	if triggerType, ok := trigger["triggerType"].(string); ok && triggerType != "" {
		return triggerType
	}
	// Default to manual trigger
	return "manual"
}

func getStepType(step map[string]interface{}) string {
	if stepType, ok := step["type"].(string); ok {
		return stepType
	}
	if stepType, ok := step["stepType"].(string); ok {
		return stepType
	}
	return "unknown"
}

func getStepExecutionOrder(steps map[string]interface{}) []string {
	// This is a simple implementation that executes steps in alphabetical order
	// In a real implementation, you would parse the step dependencies and create a proper execution order
	var stepNames []string
	for stepName := range steps {
		stepNames = append(stepNames, stepName)
	}
	return stepNames
}

func mergeStepContext(context map[string]interface{}, stepName string, stepOutput map[string]interface{}) map[string]interface{} {
	if context == nil {
		context = make(map[string]interface{})
	}
	context[stepName] = stepOutput
	return context
}
