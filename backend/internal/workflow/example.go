package workflow

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
)

// Example demonstrates how to use the workflow system
func ExampleWorkflowUsage() {
	fmt.Println("=== Workflow System Usage Example ===")

	// 1. Create a sample workflow definition
	definition := WorkflowDefinition{
		Version: "1.0",
		Name:    "Sample API Call Workflow",
		Trigger: TriggerConfig{
			Type: "manual",
			Config: map[string]interface{}{
				"description": "Manually triggered workflow",
			},
		},
		Steps: []StepConfig{
			{
				ID:   "step1",
				Type: "action",
				Name: "Log Start",
				Action: &ActionConfig{
					Type: "log",
					Config: map[string]interface{}{
						"message": "Starting workflow execution...",
						"level":   "info",
					},
				},
				OnSuccess: []string{"step2"},
			},
			{
				ID:   "step2",
				Type: "action",
				Name: "Make API Call",
				Action: &ActionConfig{
					Type: "http",
					Config: map[string]interface{}{
						"url":    "https://jsonplaceholder.typicode.com/posts/1",
						"method": "GET",
						"headers": map[string]interface{}{
							"User-Agent": "Voltig-Workflow/1.0",
						},
					},
				},
				OnSuccess: []string{"step3"},
				OnFailure: []string{"step4"},
			},
			{
				ID:   "step3",
				Type: "action",
				Name: "Log Success",
				Action: &ActionConfig{
					Type: "log",
					Config: map[string]interface{}{
						"message": "API call successful! Response: {{body}}",
						"level":   "info",
					},
				},
			},
			{
				ID:   "step4",
				Type: "action",
				Name: "Log Error",
				Action: &ActionConfig{
					Type: "log",
					Config: map[string]interface{}{
						"message": "API call failed: {{error}}",
						"level":   "error",
					},
				},
			},
		},
		Settings: WorkflowSettings{
			EnableLogging: true,
		},
		Variables: map[string]interface{}{
			"api_timeout": 30,
			"user_id":     "example-user",
		},
	}

	// 2. Print the workflow definition as JSON
	definitionJSON, err := json.MarshalIndent(definition, "", "  ")
	if err != nil {
		log.Printf("Error marshaling workflow definition: %v", err)
		return
	}

	fmt.Println("\n=== Workflow Definition (JSON) ===")
	fmt.Println(string(definitionJSON))

	// 3. Simulate workflow execution steps
	fmt.Println("\n=== Simulated Workflow Execution ===")

	executionID := uuid.New()
	workflowID := uuid.New()

	executionContext := ExecutionContext{
		WorkflowID:  workflowID,
		ExecutionID: executionID,
		UserID:      "user123",
		TriggerData: map[string]interface{}{
			"trigger_type": "manual",
			"user_input":   "test data",
		},
		Variables: map[string]interface{}{
			"api_timeout": 30,
			"user_id":     "example-user",
		},
		Environment: "development",
		StartedAt:   time.Now(),
		Status:      StatusRunning,
		Steps:       make(map[string]*StepResult),
	}

	// Simulate step executions
	for _, step := range definition.Steps {
		stepResult := &StepResult{
			StepID:    step.ID,
			Status:    StepStatusRunning,
			StartedAt: time.Now(),
			InputData: executionContext.Variables,
			Attempts:  1,
		}

		// Simulate processing time
		time.Sleep(100 * time.Millisecond)

		// Simulate step completion
		completedAt := time.Now()
		stepResult.CompletedAt = &completedAt
		stepResult.Duration = stepResult.CompletedAt.Sub(stepResult.StartedAt)
		stepResult.Status = StepStatusCompleted

		// Add mock output data
		switch step.Action.Type {
		case "log":
			stepResult.OutputData = map[string]interface{}{
				"logged_message": "Sample log message",
				"timestamp":      completedAt,
			}
		case "http":
			stepResult.OutputData = map[string]interface{}{
				"status_code": 200,
				"body":        map[string]interface{}{"id": 1, "title": "Sample Post"},
				"duration_ms": 150,
			}
		}

		executionContext.Steps[step.ID] = stepResult

		fmt.Printf("✅ Step '%s' completed in %v\n", step.Name, stepResult.Duration)
	}

	// Complete execution
	completedAt := time.Now()
	executionContext.CompletedAt = &completedAt
	executionContext.Status = StatusCompleted

	fmt.Printf("\n✅ Workflow execution completed in %v\n",
		executionContext.CompletedAt.Sub(executionContext.StartedAt))

	// 4. Show execution summary
	fmt.Println("\n=== Execution Summary ===")
	fmt.Printf("Workflow ID: %s\n", executionContext.WorkflowID)
	fmt.Printf("Execution ID: %s\n", executionContext.ExecutionID)
	fmt.Printf("Status: %s\n", executionContext.Status)
	fmt.Printf("Duration: %v\n", executionContext.CompletedAt.Sub(executionContext.StartedAt))
	fmt.Printf("Steps Completed: %d/%d\n", len(executionContext.Steps), len(definition.Steps))

	// 5. Show available trigger types
	fmt.Println("\n=== Available Trigger Types ===")
	triggerTypes := []string{"manual", "http", "schedule"}
	for _, triggerType := range triggerTypes {
		fmt.Printf("- %s: %s\n", triggerType, getTriggerDescription(triggerType))
	}

	// 6. Show available action types
	fmt.Println("\n=== Available Action Types ===")
	actionTypes := []string{"log", "http", "email", "database"}
	for _, actionType := range actionTypes {
		fmt.Printf("- %s: %s\n", actionType, getActionDescription(actionType))
	}

	fmt.Println("\n=== Example Complete ===")
}

// getTriggerDescription returns a description for a trigger type
func getTriggerDescription(triggerType string) string {
	descriptions := map[string]string{
		"manual":   "Manually triggered workflows for testing and on-demand execution",
		"http":     "HTTP webhook triggers for API integrations",
		"schedule": "Cron-based scheduled triggers for periodic execution",
	}
	if desc, ok := descriptions[triggerType]; ok {
		return desc
	}
	return "Custom trigger type"
}

// getActionDescription returns a description for an action type
func getActionDescription(actionType string) string {
	descriptions := map[string]string{
		"log":      "Log messages for debugging and monitoring",
		"http":     "Make HTTP requests to external APIs",
		"email":    "Send email notifications",
		"database": "Perform database operations",
	}
	if desc, ok := descriptions[actionType]; ok {
		return desc
	}
	return "Custom action type"
}

// CreateExampleWorkflows creates several example workflow definitions
func CreateExampleWorkflows() []WorkflowDefinition {
	return []WorkflowDefinition{
		{
			Version: "1.0",
			Name:    "API Data Processor",
			Trigger: TriggerConfig{
				Type: "http",
				Config: map[string]interface{}{
					"path":   "/webhook/data-processor",
					"method": "POST",
				},
			},
			Steps: []StepConfig{
				{
					ID:   "validate",
					Type: "action",
					Name: "Validate Input",
					Action: &ActionConfig{
						Type: "log",
						Config: map[string]interface{}{
							"message": "Validating input data: {{body}}",
							"level":   "info",
						},
					},
					OnSuccess: []string{"process"},
				},
				{
					ID:   "process",
					Type: "action",
					Name: "Process Data",
					Action: &ActionConfig{
						Type: "http",
						Config: map[string]interface{}{
							"url":    "https://api.example.com/process",
							"method": "POST",
							"body":   "{{body}}",
						},
					},
					OnSuccess: []string{"notify"},
					OnFailure: []string{"error"},
				},
				{
					ID:   "notify",
					Type: "action",
					Name: "Send Notification",
					Action: &ActionConfig{
						Type: "log",
						Config: map[string]interface{}{
							"message": "Data processed successfully",
							"level":   "info",
						},
					},
				},
				{
					ID:   "error",
					Type: "action",
					Name: "Handle Error",
					Action: &ActionConfig{
						Type: "log",
						Config: map[string]interface{}{
							"message": "Processing failed: {{error}}",
							"level":   "error",
						},
					},
				},
			},
		},
		{
			Version: "1.0",
			Name:    "Daily Report Generator",
			Trigger: TriggerConfig{
				Type: "schedule",
				Config: map[string]interface{}{
					"schedule": "0 9 * * *", // Daily at 9 AM
					"timezone": "UTC",
				},
			},
			Steps: []StepConfig{
				{
					ID:   "fetch_data",
					Type: "action",
					Name: "Fetch Report Data",
					Action: &ActionConfig{
						Type: "http",
						Config: map[string]interface{}{
							"url":    "https://api.example.com/daily-stats",
							"method": "GET",
						},
					},
					OnSuccess: []string{"generate_report"},
				},
				{
					ID:   "generate_report",
					Type: "action",
					Name: "Generate Report",
					Action: &ActionConfig{
						Type: "log",
						Config: map[string]interface{}{
							"message": "Generated daily report with {{status_code}} data points",
							"level":   "info",
						},
					},
				},
			},
		},
	}
}
