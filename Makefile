# Makefile for Voltig - Better Auth + Go Backend + TanStack Start Frontend

# Variables
FRONTEND_DIR := frontend
BACKEND_DIR := backend
FRONTEND_PORT := 3000
BACKEND_PORT := 8080

# Default target
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  setup       - Install frontend dependencies"
	@echo "  dev         - Run frontend development server"
	@echo "  dev-backend - Run backend development server"
	@echo "  dev-backend-hot - Run backend with hot reload (Air)"
	@echo "  dev-all     - Run both frontend and backend (requires tmux)"
	@echo "  dev-all-hot - Run both servers with hot reload (requires tmux)"
	@echo "  dev-with-db - Start database + both servers (full environment)"
	@echo "  build       - Build frontend for production"
	@echo "  clean       - Clean build artifacts"
	@echo ""
	@echo "Development tools:"
	@echo "  install-air - Install Air for Go hot reloading"
	@echo "  air-init    - Initialize Air configuration"
	@echo "sqlc generate - Generate SQL queries"
	@echo "Database commands:"
	@echo "  db-up       - Start PostgreSQL database with Docker"
	@echo "  db-down     - Stop PostgreSQL database"
	@echo "  db-reset    - Reset database (remove volumes)"
	@echo "  db-logs     - Show database logs"
	@echo "  db-admin    - Start database with pgAdmin"
	@echo "  db-shell    - Open database shell"
	@echo "  db-clear    - Clear all data from application tables"
	@echo "  db-clear-auth - Clear authentication data only"
	@echo "  db-clear-all - Clear all data including auth (full reset)"
	@echo "  migrate-up        - Apply all goose migrations"
	@echo "  migrate-down      - Roll back last migration"
	@echo "  migrate-reset     - Drop and re-run all migrations"
	@echo "  migrate-status    - Show migration status"
	@echo "  migrate-create    - Create new migration (NAME=<name>)"

# Setup
.PHONY: setup
setup:
	@echo "Installing frontend dependencies..."
	cd $(FRONTEND_DIR) && pnpm install

# Development tools
.PHONY: install-air
install-air:
	@echo "Installing Air for Go hot reloading..."
	@if ! command -v air >/dev/null 2>&1; then \
		echo "Installing Air..."; \
		go install github.com/air-verse/air@latest; \
		echo "Air installed successfully!"; \
	else \
		echo "Air is already installed"; \
	fi

.PHONY: air-init
air-init:
	@echo "Initializing Air configuration..."
	cd $(BACKEND_DIR) && air init

# Development
.PHONY: dev
dev:
	@echo "Starting frontend development server on port $(FRONTEND_PORT)..."
	cd $(FRONTEND_DIR) && pnpm dev

.PHONY: dev-backend
dev-backend:
	@echo "Starting backend development server on port $(BACKEND_PORT)..."
	cd $(BACKEND_DIR) && PORT=$(BACKEND_PORT) air

.PHONY: dev-all-hot
dev-all:
	@echo "Starting both frontend and backend servers..."
	@if command -v tmux >/dev/null 2>&1; then \
		tmux new-session -d -s voltig-dev; \
		tmux send-keys -t voltig-dev "cd $(BACKEND_DIR) && PORT=$(BACKEND_PORT) go run main.go" Enter; \
		tmux split-window -t voltig-dev; \
		tmux send-keys -t voltig-dev "cd $(FRONTEND_DIR) && pnpm dev" Enter; \
		tmux attach -t voltig-dev; \
	else \
		echo "tmux not found. Please install tmux or run 'make dev' and 'make dev-backend' in separate terminals."; \
	fi

.PHONY: dev-all-hot
dev-all-hot:
	@echo "Starting both frontend and backend servers with hot reload..."
	@if ! command -v air >/dev/null 2>&1; then \
		echo "Air not found. Installing Air..."; \
		make install-air; \
	fi
	@if command -v tmux >/dev/null 2>&1; then \
		tmux new-session -d -s voltig-dev-hot; \
		tmux send-keys -t voltig-dev-hot "cd $(BACKEND_DIR) && PORT=$(BACKEND_PORT) air" Enter; \
		tmux split-window -t voltig-dev-hot; \
		tmux send-keys -t voltig-dev-hot "cd $(FRONTEND_DIR) && pnpm dev" Enter; \
		tmux attach -t voltig-dev-hot; \
	else \
		echo "tmux not found. Please install tmux or run 'make dev' and 'make dev-backend-hot' in separate terminals."; \
	fi

# Build
.PHONY: build
build:
	@echo "Building frontend for production..."
	cd $(FRONTEND_DIR) && pnpm build

.PHONY: build-backend
build-backend:
	@echo "Building backend..."
	cd $(BACKEND_DIR) && go build -o voltig-server main.go

# Clean
.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	cd $(FRONTEND_DIR) && rm -rf dist
	cd $(BACKEND_DIR) && rm -f voltig-server
	cd $(BACKEND_DIR) && rm -rf tmp
	cd $(BACKEND_DIR) && rm -f build-errors.log

# Database commands
.PHONY: db-up
db-up:
	@echo "Starting PostgreSQL database..."
	docker-compose up -d postgres

.PHONY: db-down
db-down:
	@echo "Stopping PostgreSQL database..."
	docker-compose down

.PHONY: db-reset
db-reset:
	@echo "Resetting database (removing volumes)..."
	docker-compose down -v
	docker-compose up -d postgres

.PHONY: db-logs
db-logs:
	@echo "Showing database logs..."
	docker-compose logs -f postgres

.PHONY: db-admin
db-admin:
	@echo "Starting database with pgAdmin..."
	docker-compose --profile admin up -d

.PHONY: db-shell
db-shell:
	@echo "Opening database shell..."
	docker-compose exec postgres psql -U voltig_user -d voltig

# Database clear commands
.PHONY: db-clear
db-clear:
	@echo "Clearing application data from database..."
	@echo "This will remove all agents, workflows, integrations, and executions."
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	docker-compose exec postgres psql -U voltig_user -d voltig -c "\
		TRUNCATE TABLE execution_steps CASCADE; \
		TRUNCATE TABLE executions CASCADE; \
		TRUNCATE TABLE workflows CASCADE; \
		TRUNCATE TABLE agents CASCADE; \
		DELETE FROM integrations WHERE user_id != 'system'; \
		SELECT 'Application data cleared successfully' as result;"

.PHONY: db-clear-auth
db-clear-auth:
	@echo "Clearing authentication data from database..."
	@echo "This will remove all user accounts and sessions."
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	docker-compose exec postgres psql -U voltig_user -d voltig -c "\
		DELETE FROM account WHERE 1=1; \
		DELETE FROM session WHERE 1=1; \
		DELETE FROM \"user\" WHERE 1=1; \
		DELETE FROM verification WHERE 1=1; \
		SELECT 'Authentication data cleared successfully' as result;"

.PHONY: db-clear-all
db-clear-all:
	@echo "Clearing ALL data from database..."
	@echo "This will remove everything including users, auth data, agents, workflows, etc."
	@read -p "Are you sure? This cannot be undone! (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	docker-compose exec postgres psql -U voltig_user -d voltig -c "\
		TRUNCATE TABLE execution_steps CASCADE; \
		TRUNCATE TABLE executions CASCADE; \
		TRUNCATE TABLE workflows CASCADE; \
		TRUNCATE TABLE agents CASCADE; \
		TRUNCATE TABLE integrations CASCADE; \
		DELETE FROM account WHERE 1=1; \
		DELETE FROM session WHERE 1=1; \
		DELETE FROM \"user\" WHERE 1=1; \
		DELETE FROM verification WHERE 1=1; \
		INSERT INTO integrations (name, type, config, user_id) VALUES \
			('HTTP API', 'api', '{\"method\": \"GET\", \"headers\": {}, \"timeout\": 30}', 'system'), \
			('Webhook', 'webhook', '{\"method\": \"POST\", \"headers\": {\"Content-Type\": \"application/json\"}}', 'system'), \
			('Email', 'email', '{\"provider\": \"smtp\", \"port\": 587, \"secure\": true}', 'system'), \
			('Slack', 'api', '{\"base_url\": \"https://slack.com/api\", \"version\": \"v1\"}', 'system'), \
			('Discord', 'api', '{\"base_url\": \"https://discord.com/api\", \"version\": \"v10\"}', 'system'); \
		SELECT 'All data cleared and default integrations restored' as result;"

# Test backend
.PHONY: test-backend
test-backend:
	@echo "Testing backend API..."
	@curl -s http://localhost:$(BACKEND_PORT)/api/health | jq . || echo "Backend not running or jq not installed"

# Full development setup with database
.PHONY: dev-with-db
dev-with-db:
	@echo "Starting full development environment..."
	@make db-up
	@echo "Waiting for database to be ready..."
	@sleep 5
	@make dev-all-hot

.PHONY: sqlc generate
sqlc generate:
	@echo "Generating SQL queries..."
	cd $(BACKEND_DIR) && sqlc generate

# -----------------------------------------------------------------------------
# Goose database migration helpers
# -----------------------------------------------------------------------------

MIGRATIONS_DIR := backend/migrations
# You can override DBURL when invoking make, e.g.:
# make migrate-up DBURL="postgres://user:pass@host:5432/db?sslmode=disable"
DBURL ?= postgres://voltig_user:voltig_password@localhost:5432/voltig?sslmode=disable

.PHONY: migrate-up migrate-down migrate-reset migrate-status migrate-create

migrate-up:
	@echo "Applying migrations..."
	@goose -dir $(MIGRATIONS_DIR) postgres "$(DBURL)" up

migrate-down:
	@echo "Rolling back last migration..."
	@goose -dir $(MIGRATIONS_DIR) postgres "$(DBURL)" down

migrate-reset:
	@echo "Resetting database with migrations..."
	@goose -dir $(MIGRATIONS_DIR) postgres "$(DBURL)" reset

migrate-status:
	@goose -dir $(MIGRATIONS_DIR) postgres "$(DBURL)" status

# Usage: make migrate-create NAME=create_users_table
migrate-create:
	@if [ -z "$$NAME" ]; then \
		echo "Error: NAME=<migration_name> is required"; \
		exit 1; \
	fi
	@goose -dir $(MIGRATIONS_DIR) create "$$NAME" sql
