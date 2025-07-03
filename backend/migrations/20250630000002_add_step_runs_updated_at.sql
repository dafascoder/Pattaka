-- Add missing updated_at column to step_runs table
-- Migration: 20250630000002_add_step_runs_updated_at.sql
-- +goose Up
ALTER TABLE step_runs
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP
WITH
    TIME ZONE DEFAULT NOW ();

-- Create trigger for updated_at on step_runs
CREATE TRIGGER update_step_runs_updated_at BEFORE
UPDATE ON step_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column ();

-- +goose Down
DROP TRIGGER IF EXISTS update_step_runs_updated_at ON step_runs;

ALTER TABLE step_runs
DROP COLUMN IF EXISTS updated_at;