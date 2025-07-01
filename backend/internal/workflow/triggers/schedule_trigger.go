package triggers

import (
	"backend/internal/workflow/interfaces"
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/robfig/cron/v3"
)

// ScheduleTrigger implements scheduled workflow trigger using cron
type ScheduleTrigger struct {
	workflowID uuid.UUID
	schedule   string
	cron       *cron.Cron
	handler    interfaces.TriggerHandler
	timezone   *time.Location
}

// NewScheduleTrigger creates a new schedule trigger
func NewScheduleTrigger() *ScheduleTrigger {
	return &ScheduleTrigger{
		timezone: time.UTC, // Default to UTC
	}
}

// GetType returns the trigger type
func (t *ScheduleTrigger) GetType() string {
	return "schedule"
}

// Initialize sets up the schedule trigger
func (t *ScheduleTrigger) Initialize(config map[string]interface{}) error {
	workflowIDStr, ok := config["workflow_id"].(string)
	if !ok {
		return fmt.Errorf("workflow_id is required for schedule trigger")
	}

	workflowID, err := uuid.Parse(workflowIDStr)
	if err != nil {
		return fmt.Errorf("invalid workflow_id: %w", err)
	}
	t.workflowID = workflowID

	schedule, ok := config["schedule"].(string)
	if !ok {
		return fmt.Errorf("schedule is required for schedule trigger")
	}
	t.schedule = schedule

	// Parse timezone if provided
	if timezoneStr, ok := config["timezone"].(string); ok {
		timezone, err := time.LoadLocation(timezoneStr)
		if err != nil {
			return fmt.Errorf("invalid timezone: %w", err)
		}
		t.timezone = timezone
	}

	// Validate cron expression
	parser := cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow | cron.Descriptor)
	_, err = parser.Parse(schedule)
	if err != nil {
		return fmt.Errorf("invalid cron schedule: %w", err)
	}

	return nil
}

// Start begins the scheduled execution
func (t *ScheduleTrigger) Start(ctx context.Context, handler interfaces.TriggerHandler) error {
	t.handler = handler

	// Create cron scheduler with timezone support
	t.cron = cron.New(
		cron.WithParser(cron.NewParser(cron.Minute|cron.Hour|cron.Dom|cron.Month|cron.Dow|cron.Descriptor)),
		cron.WithLocation(t.timezone),
	)

	// Add the scheduled job
	_, err := t.cron.AddFunc(t.schedule, func() {
		t.executeScheduledWorkflow()
	})
	if err != nil {
		return fmt.Errorf("failed to add cron job: %w", err)
	}

	// Start the cron scheduler
	t.cron.Start()
	log.Printf("Schedule trigger started for workflow %s with schedule: %s (timezone: %s)",
		t.workflowID, t.schedule, t.timezone.String())

	// Wait for shutdown signal
	<-ctx.Done()
	return t.Stop(context.Background())
}

// Stop stops the scheduled trigger
func (t *ScheduleTrigger) Stop(ctx context.Context) error {
	if t.cron != nil {
		log.Printf("Stopping schedule trigger for workflow %s", t.workflowID)
		cronCtx := t.cron.Stop()

		// Wait for running jobs to complete or timeout
		select {
		case <-cronCtx.Done():
			log.Printf("Schedule trigger stopped gracefully for workflow %s", t.workflowID)
		case <-time.After(30 * time.Second):
			log.Printf("Schedule trigger stop timeout for workflow %s", t.workflowID)
		}
	}
	return nil
}

// Validate checks the trigger configuration
func (t *ScheduleTrigger) Validate(config map[string]interface{}) error {
	if _, ok := config["workflow_id"]; !ok {
		return fmt.Errorf("workflow_id is required for schedule trigger")
	}

	schedule, ok := config["schedule"].(string)
	if !ok {
		return fmt.Errorf("schedule is required for schedule trigger")
	}

	// Validate cron expression
	parser := cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow | cron.Descriptor)
	_, err := parser.Parse(schedule)
	if err != nil {
		return fmt.Errorf("invalid cron schedule '%s': %w", schedule, err)
	}

	// Validate timezone if provided
	if timezoneStr, ok := config["timezone"]; ok {
		if _, ok := timezoneStr.(string); !ok {
			return fmt.Errorf("timezone must be a string")
		}
		if _, err := time.LoadLocation(timezoneStr.(string)); err != nil {
			return fmt.Errorf("invalid timezone '%s': %w", timezoneStr, err)
		}
	}

	return nil
}

// executeScheduledWorkflow executes the workflow when scheduled
func (t *ScheduleTrigger) executeScheduledWorkflow() {
	triggerData := map[string]interface{}{
		"trigger_type":   "schedule",
		"scheduled_at":   time.Now().In(t.timezone),
		"schedule":       t.schedule,
		"timezone":       t.timezone.String(),
		"execution_time": time.Now().Unix(),
	}

	fmt.Println("triggerData", triggerData)

	ctx := context.Background()
	fmt.Println("ctx", ctx)
	if err := t.handler(ctx, t.workflowID, triggerData); err != nil {
		log.Printf("Scheduled workflow execution failed for workflow %s: %v", t.workflowID, err)
	} else {
		log.Printf("Scheduled workflow executed successfully for workflow %s", t.workflowID)
	}
}

// GetNextRun returns the next scheduled execution time
func (t *ScheduleTrigger) GetNextRun() (time.Time, error) {
	if t.cron == nil {
		return time.Time{}, fmt.Errorf("cron scheduler not initialized")
	}

	entries := t.cron.Entries()
	if len(entries) == 0 {
		return time.Time{}, fmt.Errorf("no scheduled entries found")
	}

	return entries[0].Next, nil
}
