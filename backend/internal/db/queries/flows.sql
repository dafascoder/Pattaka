-- Flows queries (flow definitions)

-- name: GetFlowsByProjectID :many
SELECT f.id, f.project_id, f.folder_id, f.status, f.schedule, f.created_at, f.updated_at,
       fo.display_name as folder_name
FROM flows f
LEFT JOIN folders fo ON f.folder_id = fo.id
WHERE f.project_id = $1
ORDER BY f.created_at DESC;

-- name: GetFlowByID :one
SELECT f.id, f.project_id, f.folder_id, f.status, f.schedule, f.created_at, f.updated_at,
       fo.display_name as folder_name
FROM flows f
LEFT JOIN folders fo ON f.folder_id = fo.id
WHERE f.id = $1;

-- name: CreateFlow :one
INSERT INTO flows (project_id, folder_id, status, schedule)
VALUES ($1, $2, $3, $4)
RETURNING id, project_id, folder_id, status, schedule, created_at, updated_at;

-- name: UpdateFlow :one
UPDATE flows
SET folder_id = $2, status = $3, schedule = $4, updated_at = NOW()
WHERE id = $1
RETURNING id, project_id, folder_id, status, schedule, created_at, updated_at;

-- name: DeleteFlow :exec
DELETE FROM flows
WHERE id = $1;

-- name: GetEnabledFlows :many
SELECT id, project_id, folder_id, status, schedule, created_at, updated_at
FROM flows
WHERE status = 'ENABLED'
ORDER BY created_at;

-- name: GetScheduledFlows :many
SELECT id, project_id, folder_id, status, schedule, created_at, updated_at
FROM flows
WHERE status = 'ENABLED' AND schedule IS NOT NULL
ORDER BY created_at;

-- name: UpdateFlowStatus :exec
UPDATE flows
SET status = $2, updated_at = NOW()
WHERE id = $1; 