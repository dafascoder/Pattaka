# Flow Execution Logging Test Guide

This guide shows you how to test the comprehensive flow execution logging system that was just implemented.

## What's Been Added

1. **SQL Queries for Step Runs**: Complete CRUD operations for step execution tracking
2. **Workflow Execution Engine**: Processes individual steps with detailed logging
3. **Comprehensive Logging**: Every stage of execution is logged with structured data
4. **API Endpoints**: Get detailed step execution information

## Testing the System

### 1. Generate SQLC Code (Required First)

The step_runs.sql queries need to be generated into Go code:

```bash
cd backend
sqlc generate
```

### 2. Start the Backend

```bash
cd backend
go run main.go
```

You should see logs like:

```
INFO[2025-01-28T18:53:51Z] Starting Voltig API server on port :8080
```

### 3. Create a Flow and Execute It

First, create a project and flow (replace with your actual IDs):

```bash
# Create a project
curl -X POST http://localhost:8080/api/v1/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "displayName": "Test Project",
    "notifyStatus": "ALWAYS",
    "releasesEnabled": true
  }'

# Create a flow
curl -X POST http://localhost:8080/api/v1/projects/PROJECT_ID/flows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "ENABLED"
  }'

# Create a flow version with steps
curl -X POST http://localhost:8080/api/v1/flows/FLOW_ID/versions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "displayName": "Test Flow v1",
    "status": "PUBLISHED",
    "trigger": {
      "type": "manual"
    },
    "steps": {
      "log_step": {
        "type": "log",
        "message": "Hello from workflow!"
      },
      "http_step": {
        "type": "http",
        "url": "https://api.example.com/test",
        "method": "GET"
      }
    }
  }'
```

### 4. Execute the Flow

```bash
curl -X POST http://localhost:8080/api/v1/flows/FLOW_ID/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "environment": "TESTING",
    "payload": {
      "test": "data"
    }
  }'
```

### 5. Check the Logs

You'll see comprehensive logs like:

```
INFO[2025-01-28T18:54:12Z] Flow execution request received
  endpoint="/api/v1/flows/123e4567-e89b-12d3-a456-426614174000/execute"
  flow_id="123e4567-e89b-12d3-a456-426614174000"
  method="POST"
  user_id="user123"

INFO[2025-01-28T18:54:12Z] Starting flow execution
  environment="TESTING"
  flow_id="123e4567-e89b-12d3-a456-426614174000"
  project_id="456e7890-e89b-12d3-a456-426614174001"

INFO[2025-01-28T18:54:12Z] Found latest flow version
  flow_id="123e4567-e89b-12d3-a456-426614174000"
  flow_name="Test Flow v1"
  flow_version_id="789e0123-e89b-12d3-a456-426614174002"
  version_number=1

INFO[2025-01-28T18:54:12Z] Flow run created, starting async execution
  environment="TESTING"
  flow_id="123e4567-e89b-12d3-a456-426614174000"
  flow_run_id="abc1234d-e89b-12d3-a456-426614174003"
  flow_version_id="789e0123-e89b-12d3-a456-426614174002"

INFO[2025-01-28T18:54:12Z] Starting flow execution
  environment="TESTING"
  flow_name="Test Flow v1"
  flow_run_id="abc1234d-e89b-12d3-a456-426614174003"
  flow_version_id="789e0123-e89b-12d3-a456-426614174002"
  version=1

INFO[2025-01-28T18:54:12Z] Flow execution plan created
  flow_run_id="abc1234d-e89b-12d3-a456-426614174003"
  step_count=2
  trigger_type="manual"

INFO[2025-01-28T18:54:12Z] Trigger executed successfully
  flow_run_id="abc1234d-e89b-12d3-a456-426614174003"
  trigger_output={"triggered_at":"2025-01-28T18:54:12Z","trigger_type":"manual"}

INFO[2025-01-28T18:54:12Z] Starting step execution sequence
  execution_order=["http_step","log_step"]
  flow_run_id="abc1234d-e89b-12d3-a456-426614174003"

INFO[2025-01-28T18:54:12Z] Executing step
  flow_run_id="abc1234d-e89b-12d3-a456-426614174003"
  step_index=1
  step_name="http_step"
  total_steps=2

INFO[2025-01-28T18:54:12Z] Executing HTTP step
  step_data={"method":"GET","type":"http","url":"https://api.example.com/test"}
  step_name="http_step"
  step_type="http"

INFO[2025-01-28T18:54:12Z] Step executed successfully
  context_size=2
  flow_run_id="abc1234d-e89b-12d3-a456-426614174003"
  step_index=1
  step_name="http_step"
  step_output={"executed_at":"2025-01-28T18:54:12Z","method":"GET","response":"HTTP request executed successfully (placeholder)","status_code":200,"step_type":"http","url":"https://api.example.com/test"}

INFO[2025-01-28T18:54:12Z] Executing step
  flow_run_id="abc1234d-e89b-12d3-a456-426614174003"
  step_index=2
  step_name="log_step"
  total_steps=2

INFO[2025-01-28T18:54:12Z] Executing log step
  context={"http_step":{"executed_at":"2025-01-28T18:54:12Z","method":"GET","response":"HTTP request executed successfully (placeholder)","status_code":200,"step_type":"http","url":"https://api.example.com/test"},"triggered_at":"2025-01-28T18:54:12Z","trigger_type":"manual"}
  message="Hello from workflow!"
  step_name="log_step"
  step_type="log"

INFO[2025-01-28T18:54:12Z] Step executed successfully
  context_size=3
  flow_run_id="abc1234d-e89b-12d3-a456-426614174003"
  step_index=2
  step_name="log_step"
  step_output={"executed_at":"2025-01-28T18:54:12Z","logged":true,"message":"Hello from workflow!","step_type":"log"}

INFO[2025-01-28T18:54:12Z] Flow execution completed successfully
  execution_time="127.456ms"
  flow_run_id="abc1234d-e89b-12d3-a456-426614174003"
  total_steps=2
```

### 6. Get Detailed Step Information

Get the flow run details:

```bash
curl -X GET http://localhost:8080/api/v1/flow-runs/FLOW_RUN_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Get individual step execution details:

```bash
curl -X GET http://localhost:8080/api/v1/flow-runs/FLOW_RUN_ID/steps \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

This will return detailed step information:

```json
{
  "data": [
    {
      "id": "def5678e-e89b-12d3-a456-426614174004",
      "flowRunId": "abc1234d-e89b-12d3-a456-426614174003",
      "stepName": "trigger",
      "status": "SUCCEEDED",
      "input": { "type": "manual" },
      "output": {
        "triggered_at": "2025-01-28T18:54:12Z",
        "trigger_type": "manual"
      },
      "duration": 45,
      "startTime": "2025-01-28T18:54:12.123Z",
      "finishTime": "2025-01-28T18:54:12.168Z",
      "created": "2025-01-28T18:54:12.123Z"
    },
    {
      "id": "ghi9012f-e89b-12d3-a456-426614174005",
      "flowRunId": "abc1234d-e89b-12d3-a456-426614174003",
      "stepName": "http_step",
      "status": "SUCCEEDED",
      "input": {
        "type": "http",
        "url": "https://api.example.com/test",
        "method": "GET"
      },
      "output": {
        "executed_at": "2025-01-28T18:54:12Z",
        "step_type": "http",
        "status_code": 200,
        "response": "HTTP request executed successfully (placeholder)"
      },
      "duration": 82,
      "startTime": "2025-01-28T18:54:12.168Z",
      "finishTime": "2025-01-28T18:54:12.250Z",
      "created": "2025-01-28T18:54:12.168Z"
    }
  ]
}
```

## Key Logging Features

1. **Structured Logging**: All logs include relevant IDs and context
2. **Execution Timeline**: Track start/end times for each step
3. **Error Tracking**: Failed steps are logged with error details
4. **Performance Metrics**: Duration tracking for optimization
5. **Context Propagation**: See how data flows between steps
6. **Database Persistence**: All execution details stored for audit

## Next Steps

- **Real Step Implementations**: Replace placeholder step executions with actual HTTP calls, email sending, etc.
- **Error Scenarios**: Test what happens when steps fail
- **Performance Analysis**: Use duration metrics to optimize slow steps
- **Monitoring**: Set up log aggregation for production monitoring

Now you have complete visibility into what's happening during flow execution!
