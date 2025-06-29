package db

import (
	"context"
	"fmt"
	"os"

	sqlcdb "backend/internal/db/sqlc"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	queries *sqlcdb.Queries
	pool    *pgxpool.Pool
}

func NewDB(ctx context.Context) (*DB, error) {
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "voltig_user")
	dbPassword := getEnv("DB_PASSWORD", "voltig_password")
	dbName := getEnv("DB_NAME", "voltig")

	databaseURL := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		dbUser, dbPassword, dbHost, dbPort, dbName)

	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	queries := sqlcdb.New(pool)

	return &DB{
		queries: queries,
		pool:    pool,
	}, nil
}

func (db *DB) Close() {
	db.pool.Close()
}

func (db *DB) Pool() *pgxpool.Pool {
	return db.pool
}

func (db *DB) Queries() *sqlcdb.Queries {
	return db.queries
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
