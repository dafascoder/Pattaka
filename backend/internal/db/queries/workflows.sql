-- name: GetWorkflowsByAgentID :many
SELECT id, agent_id, name, description, definition, version, is_active, created_at, updated_at 
FROM workflows 
WHERE agent_id = $1 
ORDER BY created_at DESC;

-- name: GetWorkflowsByUserID :many
SELECT w.id, w.agent_id, w.name, w.description, w.definition, w.version, w.is_active, w.created_at, w.updated_at 
FROM workflows w 
JOIN agents a ON w.agent_id = a.id 
WHERE a.user_id = $1 
ORDER BY w.created_at DESC;

-- name: GetWorkflowByID :one
SELECT id, agent_id, name, description, definition, version, is_active, created_at, updated_at 
FROM workflows 
WHERE id = $1;

-- name: CreateWorkflow :one
INSERT INTO workflows (agent_id, name, description, definition, version, is_active) 
VALUES ($1, $2, $3, $4, $5, $6) 
RETURNING id, agent_id, name, description, definition, version, is_active, created_at, updated_at;

-- name: UpdateWorkflow :one
UPDATE workflows 
SET name = $2, description = $3, definition = $4, is_active = $5, updated_at = NOW() 
WHERE id = $1 
RETURNING id, agent_id, name, description, definition, version, is_active, created_at, updated_at;

-- name: DeleteWorkflow :exec
DELETE FROM workflows 
WHERE id = $1; 