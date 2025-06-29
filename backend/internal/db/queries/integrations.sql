-- name: GetIntegrationsByUserID :many
SELECT id, name, type, config, user_id, is_active, created_at, updated_at 
FROM integrations 
WHERE user_id = $1 OR user_id = 'system' 
ORDER BY created_at DESC;

-- name: GetIntegrationByID :one
SELECT id, name, type, config, credentials, user_id, is_active, created_at, updated_at 
FROM integrations 
WHERE id = $1;

-- name: CreateIntegration :one
INSERT INTO integrations (name, type, config, credentials, user_id, is_active) 
VALUES ($1, $2, $3, $4, $5, $6) 
RETURNING id, name, type, config, user_id, is_active, created_at, updated_at;

-- name: UpdateIntegration :one
UPDATE integrations 
SET name = $2, type = $3, config = $4, credentials = $5, is_active = $6, updated_at = NOW() 
WHERE id = $1 
RETURNING id, name, type, config, user_id, is_active, created_at, updated_at;

-- name: DeleteIntegration :exec
DELETE FROM integrations 
WHERE id = $1 AND user_id != 'system'; 