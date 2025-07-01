# Workflow Engine Documentation

## Overview

The Voltig Workflow Engine is a powerful, extensible system for defining and executing automated workflows. It provides a plugin-based architecture that allows you to easily add new triggers and actions to create complex automation workflows.

## Architecture

### Core Components

1. **Workflow Engine** (`engine.go`) - The core execution engine that orchestrates workflow runs
2. **Workflow Runner** (`runner.go`) - High-level interface for workflow operations
3. **Types** (`types.go`) - Core data structures and interfaces
4. **Triggers** (`triggers/`) - Components that initiate workflow execution
5. **Actions** (`actions/`) - Components that perform work within workflows

### Key Concepts

- **Workflow Definition**: JSON-based configuration defining the workflow structure
- **Triggers**: Events that start workflow execution (HTTP webhooks, schedules, manual)
- **Actions**: Individual operations performed during workflow execution
- **Steps**: Workflow building blocks that can contain actions or conditions
- **Execution Context**: Runtime state tracking for workflow executions

## Workflow Definition Schema

```json
{
  "version": "1.0",
  "name": "My Workflow",
  "trigger": {
    "type": "http",
    "config": {
      "path": "/webhook/my-workflow",
      "method": "POST"
    }
  },
  "steps": [
    {
      "id": "step1",
      "type": "action",
      "name": "Log Message",
      "action": {
        "type": "log",
        "config": {
          "message": "Workflow started with data: {{body}}",
          "level": "info"
        }
      },
      "on_success": ["step2"],
      "on_failure": ["error_handler"]
    }
  ],
  "settings": {
    "enable_logging": true,
    "timeout": "300s"
  },
  "variables": {
    "api_key": "your-api-key",
    "timeout": 30
  }
}
```

## Built-in Triggers

### Manual Trigger

Allows manual execution of workflows, useful for testing and on-demand execution.

```json
{
  "type": "manual",
  "config": {
    "description": "Manual execution trigger"
  }
}
```

### HTTP Trigger

Listens for HTTP requests and triggers workflow execution.

```json
{
  "type": "http",
  "config": {
    "path": "/webhook/my-workflow",
    "method": "POST",
    "port": 8081
  }
}
```

### Schedule Trigger

Executes workflows on a cron schedule.

```json
{
  "type": "schedule",
  "config": {
    "schedule": "0 9 * * *",
    "timezone": "UTC"
  }
}
```

## Built-in Actions

### Log Action

Logs messages for debugging and monitoring.

```json
{
  "type": "log",
  "config": {
    "message": "Processing data: {{variable_name}}",
    "level": "info",
    "include_input": true
  }
}
```

### HTTP Action

Makes HTTP requests to external APIs.

```json
{
  "type": "http",
  "config": {
    "url": "https://api.example.com/data",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer {{api_token}}",
      "Content-Type": "application/json"
    },
    "body": {
      "data": "{{input_data}}"
    },
    "timeout": 30
  }
}
```

## Variable Substitution

The workflow engine supports template variable substitution using the `{{variable_name}}` syntax. Variables can come from:

- Workflow-level variables
- Trigger data
- Previous step outputs
- Step-level variables

### Example:

```json
{
  "message": "Hello {{user_name}}, your order {{order_id}} is {{status}}"
}
```

## Error Handling

Workflows support sophisticated error handling strategies:

### Retry Configuration

```json
{
  "retry": {
    "max_attempts": 3,
    "delay": "5s",
    "backoff": "exponential"
  }
}
```

### Error Handling Strategies

```json
{
  "on_error": {
    "strategy": "fallback",
    "fallback": "error_handler_step"
  }
}
```

Available strategies:

- `stop`: Stop workflow execution (default)
- `continue`: Continue to next step
- `retry`: Retry the current step
- `fallback`: Jump to a fallback step

## Usage Examples

### Basic HTTP to Log Workflow

```go
package main

import (
    "context"
    "backend/internal/workflow"
    "fmt"
)

func main() {
    // Create workflow definition
    definition := workflow.WorkflowDefinition{
        Version: "1.0",
        Name:    "HTTP to Log Example",
        Trigger: workflow.TriggerConfig{
            Type: "http",
            Config: map[string]interface{}{
                "path":   "/webhook/example",
                "method": "POST",
            },
        },
        Steps: []workflow.StepConfig{
            {
                ID:   "log_request",
                Type: "action",
                Name: "Log Incoming Request",
                Action: &workflow.ActionConfig{
                    Type: "log",
                    Config: map[string]interface{}{
                        "message": "Received request: {{body}}",
                        "level":   "info",
                    },
                },
                OnSuccess: []string{"make_api_call"},
            },
            {
                ID:   "make_api_call",
                Type: "action",
                Name: "Call External API",
                Action: &workflow.ActionConfig{
                    Type: "http",
                    Config: map[string]interface{}{
                        "url":    "https://api.example.com/process",
                        "method": "POST",
                        "body":   "{{body}}",
                    },
                },
                OnSuccess: []string{"log_success"},
                OnFailure: []string{"log_error"},
            },
            {
                ID:   "log_success",
                Type: "action",
                Name: "Log Success",
                Action: &workflow.ActionConfig{
                    Type: "log",
                    Config: map[string]interface{}{
                        "message": "API call successful: {{status_code}}",
                        "level":   "info",
                    },
                },
            },
            {
                ID:   "log_error",
                Type: "action",
                Name: "Log Error",
                Action: &workflow.ActionConfig{
                    Type: "log",
                    Config: map[string]interface{}{
                        "message": "API call failed: {{error}}",
                        "level":   "error",
                    },
                },
            },
        },
        Settings: workflow.WorkflowSettings{
            EnableLogging: true,
        },
    }

    // Use the workflow
    fmt.Println("Workflow definition created successfully!")
}
```

### Scheduled Data Processing Workflow

```json
{
  "version": "1.0",
  "name": "Daily Data Processing",
  "trigger": {
    "type": "schedule",
    "config": {
      "schedule": "0 2 * * *",
      "timezone": "UTC"
    }
  },
  "steps": [
    {
      "id": "fetch_data",
      "type": "action",
      "name": "Fetch Daily Data",
      "action": {
        "type": "http",
        "config": {
          "url": "https://api.example.com/daily-data",
          "method": "GET",
          "headers": {
            "Authorization": "Bearer {{api_token}}"
          }
        }
      },
      "on_success": ["process_data"],
      "on_failure": ["notify_error"]
    },
    {
      "id": "process_data",
      "type": "action",
      "name": "Process Data",
      "action": {
        "type": "http",
        "config": {
          "url": "https://api.example.com/process",
          "method": "POST",
          "body": "{{body}}"
        }
      },
      "on_success": ["notify_success"],
      "on_failure": ["notify_error"]
    },
    {
      "id": "notify_success",
      "type": "action",
      "name": "Send Success Notification",
      "action": {
        "type": "log",
        "config": {
          "message": "Daily processing completed successfully",
          "level": "info"
        }
      }
    },
    {
      "id": "notify_error",
      "type": "action",
      "name": "Send Error Notification",
      "action": {
        "type": "log",
        "config": {
          "message": "Daily processing failed: {{error}}",
          "level": "error"
        }
      }
    }
  ],
  "variables": {
    "api_token": "your-api-token"
  }
}
```

## Extending the System

### Creating Custom Triggers

```go
package mytriggers

import (
    "context"
    "backend/internal/workflow"
    "github.com/google/uuid"
)

type CustomTrigger struct {
    // Your custom fields
}

func (t *CustomTrigger) GetType() string {
    return "custom"
}

func (t *CustomTrigger) Initialize(config map[string]interface{}) error {
    // Initialize your trigger
    return nil
}

func (t *CustomTrigger) Start(ctx context.Context, handler workflow.TriggerHandler) error {
    // Start listening for events
    // When an event occurs, call: handler(ctx, workflowID, triggerData)
    return nil
}

func (t *CustomTrigger) Stop(ctx context.Context) error {
    // Clean up resources
    return nil
}

func (t *CustomTrigger) Validate(config map[string]interface{}) error {
    // Validate configuration
    return nil
}
```

### Creating Custom Actions

```go
package myactions

import (
    "context"
    "backend/internal/workflow"
)

type CustomAction struct {
    // Your custom fields
}

func (a *CustomAction) GetType() string {
    return "custom"
}

func (a *CustomAction) Execute(ctx context.Context, config map[string]interface{}, input map[string]interface{}) (map[string]interface{}, error) {
    // Perform your custom action

    output := map[string]interface{}{
        "result": "success",
        "data": "your output data",
    }

    return output, nil
}

func (a *CustomAction) Validate(config map[string]interface{}) error {
    // Validate configuration
    return nil
}
```

## API Integration

The workflow system integrates with your existing API handlers:

```go
// In your main.go or handler setup
func setupWorkflowEngine(db *db.DB) *workflow.WorkflowRunner {
    runner := workflow.NewWorkflowRunner(db)

    // Register custom triggers and actions
    runner.RegisterTrigger(&mytriggers.CustomTrigger{})
    runner.RegisterAction(&myactions.CustomAction{})

    return runner
}

// In your HTTP handlers
func workflowHandler(w http.ResponseWriter, r *http.Request) {
    // Create workflow from request
    var definition workflow.WorkflowDefinition
    if err := json.NewDecoder(r.Body).Decode(&definition); err != nil {
        http.Error(w, "Invalid workflow definition", http.StatusBadRequest)
        return
    }

    // Create and execute workflow
    workflowID, err := runner.CreateWorkflowFromDefinition(r.Context(), userID, definition)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    // Execute workflow
    execution, err := runner.ExecuteWorkflow(r.Context(), workflowID, map[string]interface{}{
        "user_id": userID,
        "timestamp": time.Now(),
    })
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    json.NewEncoder(w).Encode(execution)
}
```

## Best Practices

1. **Keep Steps Small**: Break complex operations into smaller, manageable steps
2. **Use Descriptive Names**: Give your workflows, steps, and variables clear names
3. **Handle Errors Gracefully**: Always define error handling strategies
4. **Use Variables**: Leverage variables for reusability and configuration
5. **Test Thoroughly**: Use manual triggers for testing before deploying
6. **Monitor Executions**: Enable logging and monitor workflow execution status
7. **Version Control**: Use version numbers in your workflow definitions
8. **Document Dependencies**: Clearly document any external service dependencies

## Performance Considerations

- Workflows execute asynchronously by default
- Large workflows are automatically broken into manageable chunks
- Database connections are pooled and reused
- Failed executions are automatically cleaned up
- Consider using timeouts for long-running operations

## Security

- All user inputs are validated before execution
- SQL injection protection through parameterized queries
- Rate limiting can be implemented at the trigger level
- Sensitive data should be stored in environment variables
- Use HTTPS for all external API calls

## Troubleshooting

### Common Issues

1. **Import Cycles**: Keep trigger/action implementations in separate packages
2. **Missing Dependencies**: Ensure all required Go modules are installed
3. **Database Connections**: Check database connection strings and permissions
4. **Network Timeouts**: Set appropriate timeouts for external API calls
5. **Memory Usage**: Monitor memory usage for long-running workflows

### Debugging

- Enable debug logging in workflow settings
- Use the log action to output intermediate values
- Check execution status in the database
- Use manual triggers to test individual workflows
- Monitor system logs for error messages

## Example Usage

To see the workflow system in action, run the example:

```go
package main

import "backend/internal/workflow"

func main() {
    workflow.ExampleWorkflowUsage()
}
```

This will demonstrate:

- Creating workflow definitions
- Simulating workflow execution
- Showing available triggers and actions
- Displaying execution results

## Future Enhancements

Planned features for future releases:

- Visual workflow designer
- Workflow templates and marketplace
- Advanced condition expressions
- Parallel step execution
- Workflow versioning and rollback
- Integration with external workflow engines
- Real-time execution monitoring dashboard
