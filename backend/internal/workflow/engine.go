package workflow

import (
	"backend/internal/db"
	"backend/internal/models"
	"backend/internal/services"
	"backend/internal/workflow/interfaces"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
)

// DefaultEngine is the main implementation of WorkflowEngine
type DefaultEngine struct {
	db               *db.DB
	workflowService  *services.WorkflowService
	executionService *services.ExecutionService

	// Registry of triggers and actions
	triggers map[string]interfaces.Trigger
	actions  map[string]interfaces.Action

	// Active executions
	executions map[uuid.UUID]*ExecutionContext
	mutex      sync.RWMutex

	// Trigger management
	activeTriggers map[uuid.UUID]interfaces.Trigger
	triggerMutex   sync.RWMutex

	// Context for cancellation
	ctx    context.Context
	cancel context.CancelFunc
}

// NewEngine creates a new workflow engine
func NewEngine(db *db.DB, workflowService *services.WorkflowService, executionService *services.ExecutionService) *DefaultEngine {
	ctx, cancel := context.WithCancel(context.Background())

	engine := &DefaultEngine{
		db:               db,
		workflowService:  workflowService,
		executionService: executionService,
		triggers:         make(map[string]interfaces.Trigger),
		actions:          make(map[string]interfaces.Action),
		executions:       make(map[uuid.UUID]*ExecutionContext),
		activeTriggers:   make(map[uuid.UUID]interfaces.Trigger),
		ctx:              ctx,
		cancel:           cancel,
	}

	return engine
}

// RegisterTrigger registers a new trigger type
func (e *DefaultEngine) RegisterTrigger(trigger interfaces.Trigger) error {
	e.mutex.Lock()
	defer e.mutex.Unlock()

	triggerType := trigger.GetType()
	if triggerType == "" {
		return fmt.Errorf("trigger type cannot be empty")
	}

	e.triggers[triggerType] = trigger
	log.Printf("Registered trigger type: %s", triggerType)
	return nil
}

// RegisterAction registers a new action type
func (e *DefaultEngine) RegisterAction(action interfaces.Action) error {
	e.mutex.Lock()
	defer e.mutex.Unlock()

	actionType := action.GetType()
	if actionType == "" {
		return fmt.Errorf("action type cannot be empty")
	}

	e.actions[actionType] = action
	log.Printf("Registered action type: %s", actionType)
	return nil
}

// ExecuteWorkflow starts a workflow execution
func (e *DefaultEngine) ExecuteWorkflow(ctx context.Context, workflowID uuid.UUID, triggerData map[string]interface{}) (*ExecutionContext, error) {
	// Get workflow definition from database
	workflow, err := e.workflowService.GetWorkflow(ctx, workflowID.String())
	if err != nil {
		return nil, fmt.Errorf("failed to get workflow: %w", err)
	}

	// Parse workflow definition
	var definition WorkflowDefinition
	if err := json.Unmarshal([]byte(fmt.Sprintf("%v", workflow.Definition)), &definition); err != nil {
		return nil, fmt.Errorf("failed to parse workflow definition: %w", err)
	}

	// Create execution context
	executionID := uuid.New()
	execCtx := &ExecutionContext{
		WorkflowID:  workflowID,
		ExecutionID: executionID,
		UserID:      workflow.UserID,
		TriggerData: triggerData,
		Variables:   make(map[string]interface{}),
		Environment: "production", // TODO: Make configurable
		StartedAt:   time.Now(),
		Status:      StatusPending,
		Steps:       make(map[string]*StepResult),
	}

	// Merge workflow variables
	for k, v := range definition.Variables {
		execCtx.Variables[k] = v
	}

	// Store execution context
	e.mutex.Lock()
	e.executions[executionID] = execCtx
	e.mutex.Unlock()

	// Start execution in goroutine
	go e.executeWorkflowSteps(ctx, execCtx, &definition)

	return execCtx, nil
}

// executeWorkflowSteps executes the workflow steps
func (e *DefaultEngine) executeWorkflowSteps(ctx context.Context, execCtx *ExecutionContext, definition *WorkflowDefinition) {
	defer e.cleanupExecution(execCtx.ExecutionID)

	// Update status to running
	e.updateExecutionStatus(execCtx, StatusRunning)

	// Create execution record in database
	execution := models.Execution{
		ID:         execCtx.ExecutionID,
		WorkflowID: execCtx.WorkflowID,
		Status:     string(StatusRunning),
		InputData:  execCtx.TriggerData,
		StartedAt:  execCtx.StartedAt,
	}

	_, err := e.executionService.CreateExecution(ctx, execution)
	if err != nil {
		log.Printf("Failed to create execution record: %v", err)
		e.updateExecutionStatus(execCtx, StatusFailed)
		execCtx.Error = fmt.Sprintf("Failed to create execution record: %v", err)
		return
	}

	// Execute steps in order
	if len(definition.Steps) == 0 {
		e.completeExecution(execCtx, nil)
		return
	}

	// Start with the first step
	currentStepID := definition.Steps[0].ID
	visitedSteps := make(map[string]bool)

	for currentStepID != "" {
		// Prevent infinite loops
		if visitedSteps[currentStepID] {
			e.failExecution(execCtx, fmt.Errorf("infinite loop detected at step: %s", currentStepID))
			return
		}
		visitedSteps[currentStepID] = true

		// Find step configuration
		var stepConfig *StepConfig
		for i := range definition.Steps {
			if definition.Steps[i].ID == currentStepID {
				stepConfig = &definition.Steps[i]
				break
			}
		}

		if stepConfig == nil {
			e.failExecution(execCtx, fmt.Errorf("step not found: %s", currentStepID))
			return
		}

		// Execute step
		nextStepID, err := e.executeStep(ctx, execCtx, stepConfig)
		if err != nil {
			e.failExecution(execCtx, err)
			return
		}

		currentStepID = nextStepID
	}

	// All steps completed successfully
	e.completeExecution(execCtx, nil)
}

// executeStep executes a single workflow step
func (e *DefaultEngine) executeStep(ctx context.Context, execCtx *ExecutionContext, stepConfig *StepConfig) (string, error) {
	stepResult := &StepResult{
		StepID:    stepConfig.ID,
		Status:    StepStatusRunning,
		StartedAt: time.Now(),
		InputData: make(map[string]interface{}),
		Attempts:  1,
	}

	// Store step result
	execCtx.Steps[stepConfig.ID] = stepResult

	// Handle different step types
	switch stepConfig.Type {
	case "action":
		return e.executeActionStep(ctx, execCtx, stepConfig, stepResult)
	case "condition":
		return e.executeConditionStep(ctx, execCtx, stepConfig, stepResult)
	default:
		return "", fmt.Errorf("unknown step type: %s", stepConfig.Type)
	}
}

// executeActionStep executes an action step
func (e *DefaultEngine) executeActionStep(ctx context.Context, execCtx *ExecutionContext, stepConfig *StepConfig, stepResult *StepResult) (string, error) {
	if stepConfig.Action == nil {
		return "", fmt.Errorf("action configuration missing for step: %s", stepConfig.ID)
	}

	// Get action implementation
	e.mutex.RLock()
	action, exists := e.actions[stepConfig.Action.Type]
	e.mutex.RUnlock()

	if !exists {
		return "", fmt.Errorf("unknown action type: %s", stepConfig.Action.Type)
	}

	// Prepare input data
	inputData := make(map[string]interface{})
	for k, v := range execCtx.Variables {
		inputData[k] = v
	}
	for k, v := range execCtx.TriggerData {
		inputData[k] = v
	}
	for k, v := range stepConfig.Variables {
		inputData[k] = v
	}

	stepResult.InputData = inputData

	// Execute action with retry logic
	var outputData map[string]interface{}
	var err error

	maxAttempts := 1
	if stepConfig.Retry != nil {
		maxAttempts = stepConfig.Retry.MaxAttempts
	}

	for attempt := 1; attempt <= maxAttempts; attempt++ {
		stepResult.Attempts = attempt

		outputData, err = action.Execute(ctx, stepConfig.Action.Config, inputData)
		if err == nil {
			break
		}

		if attempt < maxAttempts && stepConfig.Retry != nil {
			time.Sleep(stepConfig.Retry.Delay)
		}
	}

	// Update step result
	stepResult.CompletedAt = &time.Time{}
	*stepResult.CompletedAt = time.Now()
	stepResult.Duration = stepResult.CompletedAt.Sub(stepResult.StartedAt)
	stepResult.OutputData = outputData

	if err != nil {
		stepResult.Status = StepStatusFailed
		stepResult.ErrorMessage = err.Error()

		// Handle error based on configuration
		if stepConfig.OnError != nil {
			switch stepConfig.OnError.Strategy {
			case "continue":
				stepResult.Status = StepStatusSkipped
				return e.getNextStepID(stepConfig, true), nil
			case "fallback":
				if stepConfig.OnError.Fallback != "" {
					return stepConfig.OnError.Fallback, nil
				}
			}
		}

		return "", err
	}

	stepResult.Status = StepStatusCompleted

	// Update execution variables with output data
	for k, v := range outputData {
		execCtx.Variables[k] = v
	}

	return e.getNextStepID(stepConfig, true), nil
}

// executeConditionStep executes a condition step
func (e *DefaultEngine) executeConditionStep(ctx context.Context, execCtx *ExecutionContext, stepConfig *StepConfig, stepResult *StepResult) (string, error) {
	if stepConfig.Condition == nil {
		return "", fmt.Errorf("condition configuration missing for step: %s", stepConfig.ID)
	}

	// TODO: Implement condition evaluation logic
	// For now, just return success path
	stepResult.Status = StepStatusCompleted
	stepResult.CompletedAt = &time.Time{}
	*stepResult.CompletedAt = time.Now()
	stepResult.Duration = stepResult.CompletedAt.Sub(stepResult.StartedAt)

	return e.getNextStepID(stepConfig, true), nil
}

// getNextStepID determines the next step based on execution result
func (e *DefaultEngine) getNextStepID(stepConfig *StepConfig, success bool) string {
	if success && len(stepConfig.OnSuccess) > 0 {
		return stepConfig.OnSuccess[0]
	}
	if !success && len(stepConfig.OnFailure) > 0 {
		return stepConfig.OnFailure[0]
	}
	return ""
}

// updateExecutionStatus updates the execution status
func (e *DefaultEngine) updateExecutionStatus(execCtx *ExecutionContext, status ExecutionStatus) {
	e.mutex.Lock()
	defer e.mutex.Unlock()
	execCtx.Status = status
}

// completeExecution marks an execution as completed
func (e *DefaultEngine) completeExecution(execCtx *ExecutionContext, outputData map[string]interface{}) {
	now := time.Now()
	execCtx.CompletedAt = &now
	execCtx.Status = StatusCompleted

	if outputData == nil {
		outputData = execCtx.Variables
	}

	// Update database
	duration := int32(execCtx.CompletedAt.Sub(execCtx.StartedAt).Milliseconds())
	_, err := e.executionService.UpdateExecutionStatus(
		context.Background(),
		execCtx.ExecutionID.String(),
		string(StatusCompleted),
		outputData,
		execCtx.CompletedAt,
		duration,
		"",
	)
	if err != nil {
		log.Printf("Failed to update execution status: %v", err)
	}
}

// failExecution marks an execution as failed
func (e *DefaultEngine) failExecution(execCtx *ExecutionContext, err error) {
	now := time.Now()
	execCtx.CompletedAt = &now
	execCtx.Status = StatusFailed
	execCtx.Error = err.Error()

	// Update database
	duration := int32(execCtx.CompletedAt.Sub(execCtx.StartedAt).Milliseconds())
	_, dbErr := e.executionService.UpdateExecutionStatus(
		context.Background(),
		execCtx.ExecutionID.String(),
		string(StatusFailed),
		make(map[string]interface{}),
		execCtx.CompletedAt,
		duration,
		err.Error(),
	)
	if dbErr != nil {
		log.Printf("Failed to update execution status: %v", dbErr)
	}
}

// cleanupExecution removes execution from memory
func (e *DefaultEngine) cleanupExecution(executionID uuid.UUID) {
	e.mutex.Lock()
	defer e.mutex.Unlock()
	delete(e.executions, executionID)
}

// GetExecution retrieves an execution context
func (e *DefaultEngine) GetExecution(ctx context.Context, executionID uuid.UUID) (*ExecutionContext, error) {
	e.mutex.RLock()
	defer e.mutex.RUnlock()

	execCtx, exists := e.executions[executionID]
	if !exists {
		return nil, fmt.Errorf("execution not found: %s", executionID)
	}

	return execCtx, nil
}

// CancelExecution cancels a running workflow execution
func (e *DefaultEngine) CancelExecution(ctx context.Context, executionID uuid.UUID) error {
	e.mutex.Lock()
	defer e.mutex.Unlock()

	execCtx, exists := e.executions[executionID]
	if !exists {
		return fmt.Errorf("execution not found: %s", executionID)
	}

	if execCtx.Status == StatusRunning {
		execCtx.Status = StatusCancelled
		now := time.Now()
		execCtx.CompletedAt = &now

		// Update database
		duration := int32(execCtx.CompletedAt.Sub(execCtx.StartedAt).Milliseconds())
		_, err := e.executionService.UpdateExecutionStatus(
			ctx,
			executionID.String(),
			string(StatusCancelled),
			make(map[string]interface{}),
			execCtx.CompletedAt,
			duration,
			"Execution cancelled by user",
		)
		return err
	}

	return nil
}

// StartTriggers starts all triggers for active workflows
func (e *DefaultEngine) StartTriggers(ctx context.Context) error {
	// TODO: Implement trigger startup logic
	// This would fetch all active workflows and start their triggers
	return nil
}

// StopTriggers stops all triggers
func (e *DefaultEngine) StopTriggers(ctx context.Context) error {
	e.triggerMutex.Lock()
	defer e.triggerMutex.Unlock()

	for workflowID, trigger := range e.activeTriggers {
		if err := trigger.Stop(ctx); err != nil {
			log.Printf("Failed to stop trigger for workflow %s: %v", workflowID, err)
		}
	}

	e.activeTriggers = make(map[uuid.UUID]interfaces.Trigger)
	return nil
}

// Shutdown gracefully shuts down the engine
func (e *DefaultEngine) Shutdown(ctx context.Context) error {
	e.cancel()
	return e.StopTriggers(ctx)
}
