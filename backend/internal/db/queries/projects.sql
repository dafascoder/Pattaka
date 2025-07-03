-- Projects queries

-- name: GetProjectsByOwnerID :many
SELECT id, display_name, owner_id, platform_id, notify_status, external_id, releases_enabled, metadata, created_at, updated_at
FROM projects
WHERE owner_id = $1
ORDER BY created_at DESC;

-- name: GetProjectByID :one
SELECT id, display_name, owner_id, platform_id, notify_status, external_id, releases_enabled, metadata, created_at, updated_at
FROM projects
WHERE id = $1;

-- name: CreateProject :one
INSERT INTO projects (display_name, owner_id, platform_id, notify_status, external_id, releases_enabled, metadata)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, display_name, owner_id, platform_id, notify_status, external_id, releases_enabled, metadata, created_at, updated_at;

-- name: UpdateProject :one
UPDATE projects
SET display_name = $2, notify_status = $3, external_id = $4, releases_enabled = $5, metadata = $6, updated_at = NOW()
WHERE id = $1
RETURNING id, display_name, owner_id, platform_id, notify_status, external_id, releases_enabled, metadata, created_at, updated_at;

-- name: DeleteProject :exec
DELETE FROM projects
WHERE id = $1;

-- name: GetProjectUsage :one
SELECT 
    p.id,
    p.display_name,
    COUNT(DISTINCT f.id) as flow_count,
    COUNT(DISTINCT fr.id) as flow_run_count,
    COUNT(DISTINCT ac.id) as connection_count
FROM projects p
LEFT JOIN flows f ON f.project_id = p.id
LEFT JOIN flow_runs fr ON fr.project_id = p.id AND fr.created_at >= NOW() - INTERVAL '30 days'
LEFT JOIN app_connections ac ON ac.project_id = p.id
WHERE p.id = $1
GROUP BY p.id, p.display_name; 