-- name: GetExecutionsByWorkflowID :many
SELECT id, workflow_id, agent_id, status, input_data, output_data, error_message, 
       execution_time_ms, started_at, completed_at, created_at 
FROM executions 
WHERE workflow_id = $1 
ORDER BY started_at DESC 
LIMIT $2;

-- name: GetExecutionsByAgentID :many
SELECT id, workflow_id, agent_id, status, input_data, output_data, error_message, 
       execution_time_ms, started_at, completed_at, created_at 
FROM executions 
WHERE agent_id = $1 
ORDER BY started_at DESC 
LIMIT $2;

-- name: GetExecutionsByUserID :many
SELECT e.id, e.workflow_id, e.agent_id, e.status, e.input_data, e.output_data, 
       e.error_message, e.execution_time_ms, e.started_at, e.completed_at, e.created_at 
FROM executions e 
JOIN agents a ON e.agent_id = a.id 
WHERE a.user_id = $1 
ORDER BY e.started_at DESC 
LIMIT $2;

-- name: GetExecutionByID :one
SELECT id, workflow_id, agent_id, status, input_data, output_data, error_message, 
       execution_time_ms, started_at, completed_at, created_at 
FROM executions 
WHERE id = $1;

-- name: CreateExecution :one
INSERT INTO executions (workflow_id, agent_id, status, input_data, started_at) 
VALUES ($1, $2, $3, $4, $5) 
RETURNING id, workflow_id, agent_id, status, input_data, output_data, error_message, 
          execution_time_ms, started_at, completed_at, created_at;

-- name: UpdateExecutionStatus :one
UPDATE executions 
SET status = $2, output_data = $3, completed_at = $4, execution_time_ms = $5, error_message = $6 
WHERE id = $1 
RETURNING id, workflow_id, agent_id, status, input_data, output_data, error_message, 
          execution_time_ms, started_at, completed_at, created_at;

-- name: GetAgentIDByWorkflowID :one
SELECT agent_id FROM workflows WHERE id = $1; 