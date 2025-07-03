-- App Connections queries (external service integrations)

-- name: GetAppConnectionsByProjectID :many
SELECT id, project_id, name, app_name, config, credentials, status, created_at, updated_at
FROM app_connections
WHERE project_id = $1
ORDER BY created_at DESC;

-- name: GetAppConnectionByID :one
SELECT id, project_id, name, app_name, config, credentials, status, created_at, updated_at
FROM app_connections
WHERE id = $1;

-- name: GetAppConnectionByName :one
SELECT id, project_id, name, app_name, config, credentials, status, created_at, updated_at
FROM app_connections
WHERE project_id = $1 AND name = $2;

-- name: CreateAppConnection :one
INSERT INTO app_connections (project_id, name, app_name, config, credentials, status)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, project_id, name, app_name, config, credentials, status, created_at, updated_at;

-- name: UpdateAppConnection :one
UPDATE app_connections
SET name = $2, app_name = $3, config = $4, credentials = $5, status = $6, updated_at = NOW()
WHERE id = $1
RETURNING id, project_id, name, app_name, config, credentials, status, created_at, updated_at;

-- name: UpdateAppConnectionStatus :exec
UPDATE app_connections
SET status = $2, updated_at = NOW()
WHERE id = $1;

-- name: DeleteAppConnection :exec
DELETE FROM app_connections
WHERE id = $1;

-- name: GetAppConnectionsByAppName :many
SELECT id, project_id, name, app_name, config, credentials, status, created_at, updated_at
FROM app_connections
WHERE project_id = $1 AND app_name = $2
ORDER BY created_at DESC; 