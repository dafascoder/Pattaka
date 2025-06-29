-- name: GetSessionByToken :one
SELECT * FROM session
WHERE token = $1;

-- name: GetSessionByID :one
SELECT * FROM session
WHERE id = $1;

-- name: DeleteSession :exec
DELETE FROM session WHERE token = $1;