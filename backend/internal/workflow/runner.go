package workflow

import (
	"backend/internal/db"
	"backend/internal/models"
	"backend/internal/services"
	"backend/internal/workflow/actions"
	"backend/internal/workflow/interfaces"
	"backend/internal/workflow/triggers"
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/google/uuid"
)

// WorkflowRunner provides a high-level interface for workflow operations
type WorkflowRunner struct {
	engine           *DefaultEngine
	workflowService  *services.WorkflowService
	executionService *services.ExecutionService
}

// NewWorkflowRunner creates a new workflow runner
func NewWorkflowRunner(db *db.DB) *WorkflowRunner {
	workflowService := services.NewWorkflowService(db)
	executionService := services.NewExecutionService(db)
	engine := NewEngine(db, workflowService, executionService)

	runner := &WorkflowRunner{
		engine:           engine,
		workflowService:  workflowService,
		executionService: executionService,
	}

	// Register built-in triggers
	runner.registerBuiltinTriggers()

	// Register built-in actions
	runner.registerBuiltinActions()

	return runner
}

// registerBuiltinTriggers registers all built-in trigger types
func (r *WorkflowRunner) registerBuiltinTriggers() {
	triggers := []interfaces.Trigger{
		triggers.NewHTTPTrigger(),
		triggers.NewManualTrigger(),
		triggers.NewScheduleTrigger(),
	}

	for _, trigger := range triggers {
		if err := r.engine.RegisterTrigger(trigger); err != nil {
			log.Printf("Failed to register trigger %s: %v", trigger.GetType(), err)
		}
	}
}

// registerBuiltinActions registers all built-in action types
func (r *WorkflowRunner) registerBuiltinActions() {
	actions := []interfaces.Action{
		actions.NewHTTPAction(),
		actions.NewLogAction(),
	}

	for _, action := range actions {
		if err := r.engine.RegisterAction(action); err != nil {
			log.Printf("Failed to register action %s: %v", action.GetType(), err)
		}
	}
}

// RegisterTrigger registers a custom trigger
func (r *WorkflowRunner) RegisterTrigger(trigger interfaces.Trigger) error {
	return r.engine.RegisterTrigger(trigger)
}

// RegisterAction registers a custom action
func (r *WorkflowRunner) RegisterAction(action interfaces.Action) error {
	return r.engine.RegisterAction(action)
}

// ExecuteWorkflow manually executes a workflow
func (r *WorkflowRunner) ExecuteWorkflow(ctx context.Context, workflowID uuid.UUID, triggerData map[string]interface{}) (*ExecutionContext, error) {
	return r.engine.ExecuteWorkflow(ctx, workflowID, triggerData)
}

// GetExecution retrieves an execution context
func (r *WorkflowRunner) GetExecution(ctx context.Context, executionID uuid.UUID) (*ExecutionContext, error) {
	return r.engine.GetExecution(ctx, executionID)
}

// CancelExecution cancels a running execution
func (r *WorkflowRunner) CancelExecution(ctx context.Context, executionID uuid.UUID) error {
	return r.engine.CancelExecution(ctx, executionID)
}

// ValidateWorkflowDefinition validates a workflow definition
func (r *WorkflowRunner) ValidateWorkflowDefinition(definition WorkflowDefinition) error {
	// Validate trigger
	if definition.Trigger.Type == "" {
		return fmt.Errorf("trigger type is required")
	}

	// Validate steps
	if len(definition.Steps) == 0 {
		return fmt.Errorf("at least one step is required")
	}

	stepIDs := make(map[string]bool)
	for _, step := range definition.Steps {
		if step.ID == "" {
			return fmt.Errorf("step ID is required")
		}

		if stepIDs[step.ID] {
			return fmt.Errorf("duplicate step ID: %s", step.ID)
		}
		stepIDs[step.ID] = true

		if step.Type == "" {
			return fmt.Errorf("step type is required for step: %s", step.ID)
		}

		// Validate step-specific configuration
		switch step.Type {
		case "action":
			if step.Action == nil {
				return fmt.Errorf("action configuration is required for action step: %s", step.ID)
			}
			if step.Action.Type == "" {
				return fmt.Errorf("action type is required for step: %s", step.ID)
			}
		case "condition":
			if step.Condition == nil {
				return fmt.Errorf("condition configuration is required for condition step: %s", step.ID)
			}
			if step.Condition.Expression == "" {
				return fmt.Errorf("condition expression is required for step: %s", step.ID)
			}
		}
	}

	// Validate step references
	for _, step := range definition.Steps {
		for _, nextStepID := range step.OnSuccess {
			if !stepIDs[nextStepID] {
				return fmt.Errorf("invalid step reference in on_success: %s", nextStepID)
			}
		}
		for _, nextStepID := range step.OnFailure {
			if !stepIDs[nextStepID] {
				return fmt.Errorf("invalid step reference in on_failure: %s", nextStepID)
			}
		}
		if step.OnError != nil && step.OnError.Fallback != "" {
			if !stepIDs[step.OnError.Fallback] {
				return fmt.Errorf("invalid step reference in fallback: %s", step.OnError.Fallback)
			}
		}
	}

	return nil
}

// CreateWorkflowFromDefinition creates a workflow from a definition
func (r *WorkflowRunner) CreateWorkflowFromDefinition(ctx context.Context, userID string, definition WorkflowDefinition) (uuid.UUID, error) {
	// Validate definition
	if err := r.ValidateWorkflowDefinition(definition); err != nil {
		return uuid.Nil, fmt.Errorf("invalid workflow definition: %w", err)
	}

	// Convert definition to JSON
	definitionJSON, err := json.Marshal(definition)
	if err != nil {
		return uuid.Nil, fmt.Errorf("failed to marshal workflow definition: %w", err)
	}

	// Create workflow model
	workflow := models.Workflow{
		UserID:      userID,
		Name:        definition.Name,
		Description: fmt.Sprintf("Workflow with %s trigger", definition.Trigger.Type),
		Definition:  make(map[string]interface{}),
		Version:     1,
		IsActive:    true,
	}

	// Parse JSON back to map[string]interface{} for the model
	if err := json.Unmarshal(definitionJSON, &workflow.Definition); err != nil {
		return uuid.Nil, fmt.Errorf("failed to unmarshal workflow definition: %w", err)
	}

	// Create workflow in database
	createdWorkflow, err := r.workflowService.CreateWorkflow(ctx, workflow)
	if err != nil {
		return uuid.Nil, fmt.Errorf("failed to create workflow: %w", err)
	}

	return createdWorkflow.ID, nil
}

// GetWorkflowDefinition retrieves and parses a workflow definition
func (r *WorkflowRunner) GetWorkflowDefinition(ctx context.Context, workflowID uuid.UUID) (*WorkflowDefinition, error) {
	// Get workflow from database
	workflow, err := r.workflowService.GetWorkflow(ctx, workflowID.String())
	if err != nil {
		return nil, fmt.Errorf("failed to get workflow: %w", err)
	}

	// Parse definition
	definitionJSON, err := json.Marshal(workflow.Definition)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal workflow definition: %w", err)
	}

	var definition WorkflowDefinition
	if err := json.Unmarshal(definitionJSON, &definition); err != nil {
		return nil, fmt.Errorf("failed to parse workflow definition: %w", err)
	}

	return &definition, nil
}

// StartTriggers starts all triggers for active workflows
func (r *WorkflowRunner) StartTriggers(ctx context.Context) error {
	return r.engine.StartTriggers(ctx)
}

// StopTriggers stops all triggers
func (r *WorkflowRunner) StopTriggers(ctx context.Context) error {
	return r.engine.StopTriggers(ctx)
}

// Shutdown gracefully shuts down the workflow runner
func (r *WorkflowRunner) Shutdown(ctx context.Context) error {
	return r.engine.Shutdown(ctx)
}

// CreateSampleWorkflow creates a sample workflow for testing
func (r *WorkflowRunner) CreateSampleWorkflow(ctx context.Context, userID string) (uuid.UUID, error) {
	definition := WorkflowDefinition{
		Version: "1.0",
		Name:    "Sample HTTP to Log Workflow",
		Trigger: TriggerConfig{
			Type: "manual",
			Config: map[string]interface{}{
				"workflow_id": "placeholder", // Will be replaced after creation
			},
		},
		Steps: []StepConfig{
			{
				ID:   "log_start",
				Type: "action",
				Name: "Log Start",
				Action: &ActionConfig{
					Type: "log",
					Config: map[string]interface{}{
						"message": "Workflow started with trigger data: {{trigger_data}}",
						"level":   "info",
					},
				},
				OnSuccess: []string{"http_request"},
			},
			{
				ID:   "http_request",
				Type: "action",
				Name: "Make HTTP Request",
				Action: &ActionConfig{
					Type: "http",
					Config: map[string]interface{}{
						"url":    "https://jsonplaceholder.typicode.com/posts/1",
						"method": "GET",
					},
				},
				OnSuccess: []string{"log_result"},
				OnFailure: []string{"log_error"},
			},
			{
				ID:   "log_result",
				Type: "action",
				Name: "Log Success",
				Action: &ActionConfig{
					Type: "log",
					Config: map[string]interface{}{
						"message": "HTTP request successful. Status: {{status_code}}, Body: {{body}}",
						"level":   "info",
					},
				},
			},
			{
				ID:   "log_error",
				Type: "action",
				Name: "Log Error",
				Action: &ActionConfig{
					Type: "log",
					Config: map[string]interface{}{
						"message": "HTTP request failed: {{error}}",
						"level":   "error",
					},
				},
			},
		},
		Settings: WorkflowSettings{
			EnableLogging: true,
		},
	}

	return r.CreateWorkflowFromDefinition(ctx, userID, definition)
}
