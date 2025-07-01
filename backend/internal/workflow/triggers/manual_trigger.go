package triggers

import (
	"backend/internal/workflow/interfaces"
	"context"
	"fmt"

	"github.com/google/uuid"
)

// ManualTrigger implements manual workflow trigger
type ManualTrigger struct {
	workflowID uuid.UUID
	handler    interfaces.TriggerHandler
}

// NewManualTrigger creates a new manual trigger
func NewManualTrigger() *ManualTrigger {
	return &ManualTrigger{}
}

// GetType returns the trigger type
func (t *ManualTrigger) GetType() string {
	return "manual"
}

// Initialize sets up the manual trigger
func (t *ManualTrigger) Initialize(config map[string]interface{}) error {
	workflowIDStr, ok := config["workflow_id"].(string)
	if !ok {
		return fmt.Errorf("workflow_id is required for manual trigger")
	}

	workflowID, err := uuid.Parse(workflowIDStr)
	if err != nil {
		return fmt.Errorf("invalid workflow_id: %w", err)
	}
	t.workflowID = workflowID

	return nil
}

// Start sets up the trigger handler (manual triggers don't actively listen)
func (t *ManualTrigger) Start(ctx context.Context, handler interfaces.TriggerHandler) error {
	t.handler = handler
	// Manual triggers don't actively listen, they wait to be triggered
	<-ctx.Done()
	return nil
}

// Stop stops the manual trigger (no-op)
func (t *ManualTrigger) Stop(ctx context.Context) error {
	return nil
}

// Validate checks the trigger configuration
func (t *ManualTrigger) Validate(config map[string]interface{}) error {
	if _, ok := config["workflow_id"]; !ok {
		return fmt.Errorf("workflow_id is required for manual trigger")
	}
	return nil
}

// Execute manually triggers the workflow
func (t *ManualTrigger) Execute(ctx context.Context, triggerData map[string]interface{}) error {
	if t.handler == nil {
		return fmt.Errorf("trigger handler not set")
	}

	if triggerData == nil {
		triggerData = make(map[string]interface{})
	}

	// Add metadata about manual execution
	triggerData["trigger_type"] = "manual"
	triggerData["triggered_at"] = ctx.Value("triggered_at")

	return t.handler(ctx, t.workflowID, triggerData)
}
