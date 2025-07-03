-- Remove workflow and execution tables in favor of flow system
-- Migration: 20250630000001_remove_workflows_executions.sql
-- +goose Up
-- Drop execution-related tables first (due to foreign key constraints)
DROP TABLE IF EXISTS execution_steps CASCADE;

DROP TABLE IF EXISTS executions CASCADE;

-- Drop workflow-related tables
DROP TABLE IF EXISTS agent_workflows CASCADE;

DROP TABLE IF EXISTS workflows CASCADE;

-- Drop related indexes if they exist
DROP INDEX IF EXISTS idx_workflows_user_id;

DROP INDEX IF EXISTS idx_workflows_name;

DROP INDEX IF EXISTS idx_workflows_is_active;

DROP INDEX IF EXISTS idx_workflows_version;

-- Note: Flow system tables (flows, flow_versions, flow_runs) are already created
-- in previous migration 20250630000000_flow_architecture_update.sql
-- +goose Down
-- Recreating these tables would require restoring from backup
-- This is intentionally left empty as this is a destructive migration