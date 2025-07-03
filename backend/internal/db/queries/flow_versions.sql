-- Flow Versions queries (versioned flow definitions)

-- name: GetFlowVersionsByFlowID :many
SELECT id, flow_id, version, display_name, trigger, steps, status, created_at, updated_at
FROM flow_versions
WHERE flow_id = $1
ORDER BY version DESC;

-- name: GetFlowVersionByID :one
SELECT id, flow_id, version, display_name, trigger, steps, status, created_at, updated_at
FROM flow_versions
WHERE id = $1;

-- name: GetLatestFlowVersion :one
SELECT id, flow_id, version, display_name, trigger, steps, status, created_at, updated_at
FROM flow_versions
WHERE flow_id = $1
ORDER BY version DESC
LIMIT 1;

-- name: GetPublishedFlowVersion :one
SELECT id, flow_id, version, display_name, trigger, steps, status, created_at, updated_at
FROM flow_versions
WHERE flow_id = $1 AND status = 'PUBLISHED'
ORDER BY version DESC
LIMIT 1;

-- name: GetFlowVersionByVersion :one
SELECT id, flow_id, version, display_name, trigger, steps, status, created_at, updated_at
FROM flow_versions
WHERE flow_id = $1 AND version = $2;

-- name: CreateFlowVersion :one
INSERT INTO flow_versions (flow_id, version, display_name, trigger, steps, status)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, flow_id, version, display_name, trigger, steps, status, created_at, updated_at;

-- name: UpdateFlowVersion :one
UPDATE flow_versions
SET display_name = $2, trigger = $3, steps = $4, status = $5, updated_at = NOW()
WHERE id = $1
RETURNING id, flow_id, version, display_name, trigger, steps, status, created_at, updated_at;

-- name: UpdateFlowVersionStatus :exec
UPDATE flow_versions
SET status = $2, updated_at = NOW()
WHERE id = $1;

-- name: DeleteFlowVersion :exec
DELETE FROM flow_versions
WHERE id = $1;

-- name: GetNextVersionNumber :one
SELECT COALESCE(MAX(version), 0) + 1 as next_version
FROM flow_versions
WHERE flow_id = $1;

-- name: PublishFlowVersion :exec
UPDATE flow_versions
SET status = CASE WHEN id = $2 THEN 'PUBLISHED' ELSE 'LOCKED' END,
    updated_at = NOW()
WHERE flow_id = $1 AND status IN ('PUBLISHED', 'DRAFT');

-- name: GetFlowVersionsWithRuns :many
SELECT 
    fv.id, fv.flow_id, fv.version, fv.display_name, fv.trigger, fv.steps, fv.status, fv.created_at, fv.updated_at,
    COUNT(fr.id) as run_count,
    COUNT(CASE WHEN fr.status = 'SUCCEEDED' THEN 1 END) as success_count,
    COUNT(CASE WHEN fr.status = 'FAILED' THEN 1 END) as failure_count
FROM flow_versions fv
LEFT JOIN flow_runs fr ON fv.id = fr.flow_version_id
WHERE fv.flow_id = $1
GROUP BY fv.id, fv.flow_id, fv.version, fv.display_name, fv.trigger, fv.steps, fv.status, fv.created_at, fv.updated_at
ORDER BY fv.version DESC; 