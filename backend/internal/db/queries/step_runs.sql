-- name: CreateStepRun :one
INSERT INTO step_runs (
    flow_run_id,
    step_name,
    status,
    input,
    start_time
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: UpdateStepRunStatus :one
UPDATE step_runs 
SET 
    status = $2,
    finish_time = CASE WHEN $2::TEXT IN ('SUCCEEDED', 'FAILED', 'SKIPPED') THEN NOW() ELSE finish_time END,
    duration = CASE WHEN $2::TEXT IN ('SUCCEEDED', 'FAILED', 'SKIPPED') THEN EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000 ELSE duration END,
    updated_at = NOW()
WHERE id = $1 
RETURNING *;

-- name: UpdateStepRunOutput :one
UPDATE step_runs 
SET 
    output = $2,
    status = $3,
    finish_time = NOW(),
    duration = EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000,
    updated_at = NOW()
WHERE id = $1 
RETURNING *;

-- name: UpdateStepRunError :one
UPDATE step_runs 
SET 
    error_message = $2,
    status = 'FAILED',
    finish_time = NOW(),
    duration = EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000,
    updated_at = NOW()
WHERE id = $1 
RETURNING *;

-- name: GetStepRunsByFlowRunID :many
SELECT * FROM step_runs 
WHERE flow_run_id = $1 
ORDER BY created_at ASC;

-- name: GetStepRunByID :one
SELECT * FROM step_runs 
WHERE id = $1;

-- name: GetStepRunByFlowRunAndName :one
SELECT * FROM step_runs 
WHERE flow_run_id = $1 AND step_name = $2;

-- name: GetRunningStepRuns :many
SELECT sr.*, fr.project_id 
FROM step_runs sr
JOIN flow_runs fr ON fr.id = sr.flow_run_id
WHERE sr.status = 'RUNNING'
ORDER BY sr.start_time ASC;

-- name: GetStepRunStats :one
SELECT 
    COUNT(*) as total_steps,
    COUNT(CASE WHEN status = 'SUCCEEDED' THEN 1 END) as succeeded_steps,
    COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_steps,
    COUNT(CASE WHEN status = 'RUNNING' THEN 1 END) as running_steps,
    COUNT(CASE WHEN status = 'PAUSED' THEN 1 END) as paused_steps,
    COUNT(CASE WHEN status = 'SKIPPED' THEN 1 END) as skipped_steps,
    AVG(duration) as avg_duration_ms
FROM step_runs 
WHERE flow_run_id = $1;

-- name: DeleteStepRunsByFlowRunID :exec
DELETE FROM step_runs 
WHERE flow_run_id = $1; 