package workflow

import (
	"backend/internal/workflow/interfaces"
	"context"
	"time"

	"github.com/google/uuid"
)

// ExecutionStatus represents the status of a workflow execution
type ExecutionStatus string

const (
	StatusPending   ExecutionStatus = "pending"
	StatusRunning   ExecutionStatus = "running"
	StatusCompleted ExecutionStatus = "completed"
	StatusFailed    ExecutionStatus = "failed"
	StatusCancelled ExecutionStatus = "cancelled"
)

// StepStatus represents the status of a workflow step
type StepStatus string

const (
	StepStatusPending   StepStatus = "pending"
	StepStatusRunning   StepStatus = "running"
	StepStatusCompleted StepStatus = "completed"
	StepStatusFailed    StepStatus = "failed"
	StepStatusSkipped   StepStatus = "skipped"
)

// WorkflowDefinition represents the structure of a workflow
type WorkflowDefinition struct {
	Version   string                 `json:"version"`
	Name      string                 `json:"name"`
	Trigger   TriggerConfig          `json:"trigger"`
	Steps     []StepConfig           `json:"steps"`
	Settings  WorkflowSettings       `json:"settings"`
	Variables map[string]interface{} `json:"variables,omitempty"`
}

// TriggerConfig defines how a workflow is triggered
type TriggerConfig struct {
	Type   string                 `json:"type"`   // "http", "schedule", "manual", "webhook", etc.
	Config map[string]interface{} `json:"config"` // Trigger-specific configuration
}

// StepConfig defines a single step in the workflow
type StepConfig struct {
	ID        string                 `json:"id"`
	Type      string                 `json:"type"` // "action", "condition", "loop", etc.
	Name      string                 `json:"name"`
	Action    *ActionConfig          `json:"action,omitempty"`
	Condition *ConditionConfig       `json:"condition,omitempty"`
	OnSuccess []string               `json:"on_success,omitempty"` // Next step IDs
	OnFailure []string               `json:"on_failure,omitempty"` // Next step IDs
	OnError   *ErrorHandlingConfig   `json:"on_error,omitempty"`
	Retry     *RetryConfig           `json:"retry,omitempty"`
	Timeout   *time.Duration         `json:"timeout,omitempty"`
	Variables map[string]interface{} `json:"variables,omitempty"`
}

// ActionConfig defines an action to be performed
type ActionConfig struct {
	Type   string                 `json:"type"`   // "http", "email", "database", "webhook", etc.
	Config map[string]interface{} `json:"config"` // Action-specific configuration
}

// ConditionConfig defines a condition to evaluate
type ConditionConfig struct {
	Expression string                 `json:"expression"` // Condition expression
	Variables  map[string]interface{} `json:"variables,omitempty"`
}

// ErrorHandlingConfig defines how errors should be handled
type ErrorHandlingConfig struct {
	Strategy string `json:"strategy"`           // "stop", "continue", "retry", "fallback"
	Fallback string `json:"fallback,omitempty"` // Fallback step ID
}

// RetryConfig defines retry behavior
type RetryConfig struct {
	MaxAttempts int           `json:"max_attempts"`
	Delay       time.Duration `json:"delay"`
	Backoff     string        `json:"backoff"` // "fixed", "exponential", "linear"
}

// WorkflowSettings contains global workflow settings
type WorkflowSettings struct {
	Timeout           *time.Duration `json:"timeout,omitempty"`
	MaxRetries        int            `json:"max_retries,omitempty"`
	EnableLogging     bool           `json:"enable_logging"`
	ParallelExecution bool           `json:"parallel_execution"`
}

// ExecutionContext contains runtime information for workflow execution
type ExecutionContext struct {
	WorkflowID  uuid.UUID              `json:"workflow_id"`
	ExecutionID uuid.UUID              `json:"execution_id"`
	UserID      string                 `json:"user_id"`
	TriggerData map[string]interface{} `json:"trigger_data"`
	Variables   map[string]interface{} `json:"variables"`
	Environment string                 `json:"environment"`
	StartedAt   time.Time              `json:"started_at"`
	CompletedAt *time.Time             `json:"completed_at,omitempty"`
	Status      ExecutionStatus        `json:"status"`
	Error       string                 `json:"error,omitempty"`
	Steps       map[string]*StepResult `json:"steps"`
}

// StepResult contains the result of a step execution
type StepResult struct {
	StepID       string                 `json:"step_id"`
	Status       StepStatus             `json:"status"`
	StartedAt    time.Time              `json:"started_at"`
	CompletedAt  *time.Time             `json:"completed_at,omitempty"`
	Duration     time.Duration          `json:"duration"`
	InputData    map[string]interface{} `json:"input_data"`
	OutputData   map[string]interface{} `json:"output_data"`
	ErrorMessage string                 `json:"error_message,omitempty"`
	Attempts     int                    `json:"attempts"`
}

// WorkflowEngine defines the main workflow execution engine
type WorkflowEngine interface {
	// RegisterTrigger registers a new trigger type
	RegisterTrigger(trigger interfaces.Trigger) error

	// RegisterAction registers a new action type
	RegisterAction(action interfaces.Action) error

	// ExecuteWorkflow starts a workflow execution
	ExecuteWorkflow(ctx context.Context, workflowID uuid.UUID, triggerData map[string]interface{}) (*ExecutionContext, error)

	// GetExecution retrieves an execution context
	GetExecution(ctx context.Context, executionID uuid.UUID) (*ExecutionContext, error)

	// CancelExecution cancels a running workflow execution
	CancelExecution(ctx context.Context, executionID uuid.UUID) error

	// StartTriggers starts all triggers for active workflows
	StartTriggers(ctx context.Context) error

	// StopTriggers stops all triggers
	StopTriggers(ctx context.Context) error
}

// WorkflowRegistry manages workflow definitions and their triggers
type WorkflowRegistry interface {
	// RegisterWorkflow registers a workflow and starts its trigger
	RegisterWorkflow(ctx context.Context, workflowID uuid.UUID, definition WorkflowDefinition) error

	// UnregisterWorkflow removes a workflow and stops its trigger
	UnregisterWorkflow(ctx context.Context, workflowID uuid.UUID) error

	// GetWorkflow retrieves a workflow definition
	GetWorkflow(ctx context.Context, workflowID uuid.UUID) (*WorkflowDefinition, error)

	// ListActiveWorkflows returns all active workflows
	ListActiveWorkflows(ctx context.Context) ([]uuid.UUID, error)
}
