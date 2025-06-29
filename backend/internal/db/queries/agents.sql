-- name: GetAgentsByUserID :many
SELECT id, name, description, config, status, user_id, created_at, updated_at 
FROM agents 
WHERE user_id = $1 
ORDER BY created_at DESC;

-- name: GetAgentByID :one
SELECT id, name, description, config, status, user_id, created_at, updated_at 
FROM agents 
WHERE id = $1;

-- name: CreateAgent :one
INSERT INTO agents (name, description, config, status, user_id) 
VALUES ($1, $2, $3, $4, $5) 
RETURNING id, name, description, config, status, user_id, created_at, updated_at;

-- name: UpdateAgent :one
UPDATE agents 
SET name = $2, description = $3, config = $4, status = $5, updated_at = NOW() 
WHERE id = $1 
RETURNING id, name, description, config, status, user_id, created_at, updated_at;

-- name: DeleteAgent :exec
DELETE FROM agents 
WHERE id = $1; 