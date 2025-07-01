-- name: GetWorkflowsByUserID :many
SELECT id, user_id, name, description, definition, version, is_active, created_at, updated_at 
FROM workflows 
WHERE user_id = $1 
ORDER BY created_at DESC;

-- name: GetWorkflowsByAgentID :many
SELECT w.id, w.user_id, w.name, w.description, w.definition, w.version, w.is_active, w.created_at, w.updated_at 
FROM workflows w 
JOIN agent_workflows aw ON w.id = aw.workflow_id 
WHERE aw.agent_id = $1 
ORDER BY w.created_at DESC;

-- name: GetWorkflowByID :one
SELECT id, user_id, name, description, definition, version, is_active, created_at, updated_at 
FROM workflows 
WHERE id = $1;

-- name: GetLatestWorkflowVersionByName :one
SELECT id, user_id, name, description, definition, version, is_active, created_at, updated_at 
FROM workflows 
WHERE name = $1 AND user_id = $2 
ORDER BY version DESC 
LIMIT 1;

-- name: GetWorkflowVersionHistory :many
SELECT id, user_id, name, description, definition, version, is_active, created_at, updated_at 
FROM workflows 
WHERE name = $1 AND user_id = $2 
ORDER BY version DESC;

-- name: GetWorkflowVersion :one
SELECT id, user_id, name, description, definition, version, is_active, created_at, updated_at 
FROM workflows 
WHERE name = $1 AND user_id = $2 AND version = $3;

-- name: CreateWorkflow :one
INSERT INTO workflows (user_id, name, description, definition, version, is_active) 
VALUES ($1, $2, $3, $4, $5, $6) 
RETURNING id, user_id, name, description, definition, version, is_active, created_at, updated_at;

-- name: CreateWorkflowVersion :one
INSERT INTO workflows (user_id, name, description, definition, version, is_active) 
VALUES ($1, $2, $3, $4, $5, $6) 
RETURNING id, user_id, name, description, definition, version, is_active, created_at, updated_at;

-- name: UpdateWorkflow :one
UPDATE workflows 
SET name = $2, description = $3, definition = $4, is_active = $5, updated_at = NOW() 
WHERE id = $1 
RETURNING id, user_id, name, description, definition, version, is_active, created_at, updated_at;

-- name: DeactivateWorkflowVersions :exec
UPDATE workflows 
SET is_active = false 
WHERE name = $1 AND user_id = $2;

-- name: ActivateWorkflowVersion :exec
UPDATE workflows 
SET is_active = true 
WHERE name = $1 AND user_id = $2 AND version = $3;

-- name: DeleteWorkflow :exec
DELETE FROM workflows 
WHERE id = $1;

-- name: DeleteAllWorkflowVersions :exec
DELETE FROM workflows 
WHERE name = $1 AND user_id = $2;

-- Agent-Workflow Association queries
-- name: AssociateAgentWithWorkflow :one
INSERT INTO agent_workflows (agent_id, workflow_id, is_primary) 
VALUES ($1, $2, $3) 
RETURNING id, agent_id, workflow_id, is_primary, created_at;

-- name: RemoveAgentWorkflowAssociation :exec
DELETE FROM agent_workflows 
WHERE agent_id = $1 AND workflow_id = $2;

-- name: GetAgentWorkflowAssociations :many
SELECT id, agent_id, workflow_id, is_primary, created_at 
FROM agent_workflows 
WHERE agent_id = $1;

-- name: SetPrimaryWorkflowForAgent :exec
UPDATE agent_workflows 
SET is_primary = CASE WHEN workflow_id = $2 THEN true ELSE false END 
WHERE agent_id = $1; 