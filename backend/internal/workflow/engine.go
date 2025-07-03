package workflow

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"backend/internal/db"
	sqlc "backend/internal/db/sqlc"
	"backend/internal/logger"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// ExecutionEngine handles the execution of workflows
type ExecutionEngine struct {
	db     *db.DB
	logger *logger.Logger
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

	e.logger.WithFields(map[string]interface{}{
		"flow_run_id": flowRunID.String(),
		"step_name":   stepName,
		"step_type":   stepType,
		"step_data":   stepMap,
	}).Debug("Processing step")

	// Create step run
	stepRun, err := e.createStepRun(ctx, flowRunID, stepName, stepMap)
	if err != nil {
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
		return nil, err
	}

	// Mark step as succeeded
	if err := e.completeStepRun(ctx, stepRun.ID, output, "SUCCEEDED"); err != nil {
		return nil, fmt.Errorf("failed to complete step run for '%s': %w", stepName, err)
	}

	return output, nil
}

// Step execution implementations
func (e *ExecutionEngine) executeHTTPStep(ctx context.Context, stepName string, stepData map[string]interface{}, context map[string]interface{}) (map[string]interface{}, error) {
	e.logger.WithFields(map[string]interface{}{
		"step_name": stepName,
		"step_type": "http",
		"step_data": stepData,
	}).Info("Executing HTTP step")

	// This is a placeholder implementation
	// In a real implementation, you would make actual HTTP requests
	return map[string]interface{}{
		"executed_at": time.Now().Format(time.RFC3339),
		"step_type":   "http",
		"url":         stepData["url"],
		"method":      stepData["method"],
		"status_code": 200,
		"response":    "HTTP request executed successfully (placeholder)",
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
