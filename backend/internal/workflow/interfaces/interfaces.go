package interfaces

import (
	"context"

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

// TriggerHandler is called when a trigger fires
type TriggerHandler func(ctx context.Context, workflowID uuid.UUID, triggerData map[string]interface{}) error

// Trigger interface defines the contract for all trigger types
type Trigger interface {
	// GetType returns the trigger type identifier
	GetType() string

	// Initialize sets up the trigger with configuration
	Initialize(config map[string]interface{}) error

	// Start begins listening for trigger events
	Start(ctx context.Context, handler TriggerHandler) error

	// Stop stops the trigger
	Stop(ctx context.Context) error

	// Validate checks if the trigger configuration is valid
	Validate(config map[string]interface{}) error
}

// Action interface defines the contract for all action types
type Action interface {
	// GetType returns the action type identifier
	GetType() string

	// Execute performs the action
	Execute(ctx context.Context, config map[string]interface{}, input map[string]interface{}) (map[string]interface{}, error)

	// Validate checks if the action configuration is valid
	Validate(config map[string]interface{}) error
}
