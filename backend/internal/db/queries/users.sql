-- name: GetUserByID :one
SELECT * FROM "user"
WHERE id = $1;

-- name: GetUserByEmail :one
SELECT * FROM "user"
WHERE email = $1;

-- name: CreateUser :one
INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: UpdateUser :one
UPDATE "user"
SET name = $2, email = $3, "emailVerified" = $4, image = $5, "updatedAt" = $6
WHERE id = $1

-- name: DeleteUser :exec
DELETE FROM "user" WHERE id = $1; 