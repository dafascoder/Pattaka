-- Flow Runs queries (execution instances)

-- name: GetFlowRunsByProjectID :many
SELECT fr.id, fr.flow_version_id, fr.project_id, fr.status, fr.start_time, fr.finish_time, 
       fr.environment, fr.flow_display_name, fr.logs_file_id, fr.tags, fr.pause_metadata, fr.created_at, fr.updated_at,
       fv.display_name as flow_version_name, fv.version as flow_version_number
FROM flow_runs fr
LEFT JOIN flow_versions fv ON fr.flow_version_id = fv.id
WHERE fr.project_id = $1
ORDER BY fr.start_time DESC
LIMIT $2 OFFSET $3;

-- name: GetFlowRunsByFlowID :many
SELECT fr.id, fr.flow_version_id, fr.project_id, fr.status, fr.start_time, fr.finish_time, 
       fr.environment, fr.flow_display_name, fr.logs_file_id, fr.tags, fr.pause_metadata, fr.created_at, fr.updated_at,
       fv.display_name as flow_version_name, fv.version as flow_version_number
FROM flow_runs fr
LEFT JOIN flow_versions fv ON fr.flow_version_id = fv.id
LEFT JOIN flows f ON fv.flow_id = f.id
WHERE f.id = $1
ORDER BY fr.start_time DESC
LIMIT $2 OFFSET $3;

-- name: GetFlowRunByID :one
SELECT fr.id, fr.flow_version_id, fr.project_id, fr.status, fr.start_time, fr.finish_time, 
       fr.environment, fr.flow_display_name, fr.logs_file_id, fr.tags, fr.pause_metadata, fr.created_at, fr.updated_at,
       fv.display_name as flow_version_name, fv.version as flow_version_number, fv.steps, fv.trigger
FROM flow_runs fr
LEFT JOIN flow_versions fv ON fr.flow_version_id = fv.id
WHERE fr.id = $1;

-- name: CreateFlowRun :one
INSERT INTO flow_runs (flow_version_id, project_id, status, environment, flow_display_name, tags, pause_metadata)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, flow_version_id, project_id, status, start_time, finish_time, environment, flow_display_name, logs_file_id, tags, pause_metadata, created_at, updated_at;

-- name: UpdateFlowRunStatus :exec
UPDATE flow_runs
SET status = $2, updated_at = NOW()
WHERE id = $1;

-- name: UpdateFlowRunStatusWithFinishTime :exec
UPDATE flow_runs
SET status = $2, finish_time = NOW(), updated_at = NOW()
WHERE id = $1;

-- name: UpdateFlowRunPauseMetadata :exec
UPDATE flow_runs
SET pause_metadata = $2, updated_at = NOW()
WHERE id = $1;

-- name: DeleteFlowRun :exec
DELETE FROM flow_runs
WHERE id = $1;

-- name: GetFlowRunsByStatus :many
SELECT fr.id, fr.flow_version_id, fr.project_id, fr.status, fr.start_time, fr.finish_time, 
       fr.environment, fr.flow_display_name, fr.logs_file_id, fr.tags, fr.pause_metadata, fr.created_at, fr.updated_at
FROM flow_runs fr
WHERE fr.project_id = $1 AND fr.status = ANY($2::text[])
ORDER BY fr.start_time DESC
LIMIT $3 OFFSET $4;

-- name: GetFlowRunsWithFilters :many
SELECT fr.id, fr.flow_version_id, fr.project_id, fr.status, fr.start_time, fr.finish_time, 
       fr.environment, fr.flow_display_name, fr.logs_file_id, fr.tags, fr.pause_metadata, fr.created_at, fr.updated_at,
       fv.display_name as flow_version_name, fv.version as flow_version_number
FROM flow_runs fr
LEFT JOIN flow_versions fv ON fr.flow_version_id = fv.id
LEFT JOIN flows f ON fv.flow_id = f.id
WHERE fr.project_id = $1
  AND ($2::uuid[] IS NULL OR f.id = ANY($2::uuid[]))
  AND ($3::text[] IS NULL OR fr.status = ANY($3::text[]))
  AND ($4::text[] IS NULL OR fr.tags && $4::text[])
  AND ($5::timestamp IS NULL OR fr.start_time >= $5)
  AND ($6::timestamp IS NULL OR fr.start_time <= $6)
ORDER BY fr.start_time DESC
LIMIT $7 OFFSET $8;

-- name: GetFlowRunStats :one
SELECT 
    fr.project_id,
    COUNT(*) as total_runs,
    COUNT(CASE WHEN fr.status = 'SUCCEEDED' THEN 1 END) as success_count,
    COUNT(CASE WHEN fr.status = 'FAILED' THEN 1 END) as failure_count,
    COUNT(CASE WHEN fr.status = 'RUNNING' THEN 1 END) as running_count,
    COUNT(CASE WHEN fr.status = 'PAUSED' THEN 1 END) as paused_count,
    AVG(EXTRACT(EPOCH FROM (fr.finish_time - fr.start_time))) as avg_duration_seconds
FROM flow_runs fr
WHERE fr.project_id = $1 
  AND fr.start_time >= $2
GROUP BY fr.project_id;

-- name: GetRunningFlowRuns :many
SELECT id, flow_version_id, project_id, status, start_time, flow_display_name, pause_metadata
FROM flow_runs
WHERE status IN ('RUNNING', 'PAUSED')
ORDER BY start_time;

-- name: RetryFlowRun :one
INSERT INTO flow_runs (flow_version_id, project_id, status, environment, flow_display_name, tags, pause_metadata)
SELECT flow_version_id, project_id, 'RUNNING', environment, flow_display_name, tags, '{}'::jsonb
FROM flow_runs
WHERE flow_runs.id = $1
RETURNING id, flow_version_id, project_id, status, start_time, finish_time, environment, flow_display_name, logs_file_id, tags, pause_metadata, created_at, updated_at; 