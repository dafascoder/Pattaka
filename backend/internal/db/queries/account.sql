-- name: GetAccountByUserID :one
SELECT * FROM account
WHERE user_id = $1;

-- name: GetAccountByID :one
SELECT * FROM account
WHERE id = $1;

-- name: CreateAccount :one
INSERT INTO account (user_id, provider, provider_id, access_token, refresh_token, access_token_expires_at)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;