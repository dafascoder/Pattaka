-- +goose Up
-- Flow Architecture Update Migration
-- Restructure database to match Activepieces architecture model

-- Create projects table (container for flows and resources)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    display_name VARCHAR(255) NOT NULL,
    owner_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    platform_id UUID DEFAULT uuid_generate_v4(), -- For future multi-tenancy
    notify_status VARCHAR(50) DEFAULT 'ALWAYS',
    external_id VARCHAR(255),
    releases_enabled BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create folders table (for organizing flows within projects)
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    display_name VARCHAR(255) NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create flows table (flow definitions, separate from versions)
CREATE TABLE IF NOT EXISTS flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'ENABLED' CHECK (status IN ('ENABLED', 'DISABLED')),
    schedule JSONB DEFAULT NULL, -- For scheduled flows
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create flow_versions table (versioned flow definitions)
CREATE TABLE IF NOT EXISTS flow_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    trigger JSONB DEFAULT '{}', -- Trigger configuration
    steps JSONB DEFAULT '{}', -- Step definitions
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'LOCKED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(flow_id, version)
);

-- Create flow_runs table (execution instances)
CREATE TABLE IF NOT EXISTS flow_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flow_version_id UUID NOT NULL REFERENCES flow_versions(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'SUCCEEDED', 'FAILED', 'PAUSED', 'CANCELLED', 'QUOTA_EXCEEDED')),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finish_time TIMESTAMP WITH TIME ZONE,
    environment VARCHAR(20) DEFAULT 'PRODUCTION' CHECK (environment IN ('PRODUCTION', 'TESTING')),
    flow_display_name VARCHAR(255),
    logs_file_id UUID,
    tags TEXT[] DEFAULT '{}',
    pause_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create step_runs table (individual step execution details)
CREATE TABLE IF NOT EXISTS step_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flow_run_id UUID NOT NULL REFERENCES flow_runs(id) ON DELETE CASCADE,
    step_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED', 'PAUSED')),
    input JSONB DEFAULT '{}',
    output JSONB DEFAULT '{}',
    error_message TEXT,
    duration INTEGER, -- Duration in milliseconds
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finish_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create app_connections table (for external service integrations)
CREATE TABLE IF NOT EXISTS app_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    app_name VARCHAR(255) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    credentials JSONB DEFAULT '{}', -- Encrypted credentials
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ERROR')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, name)
);

-- Create trigger_events table (for webhook and trigger event logging)
CREATE TABLE IF NOT EXISTS trigger_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_id VARCHAR(255),
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create file_storage table (for storing files used in flows)
CREATE TABLE IF NOT EXISTS file_storage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    size INTEGER NOT NULL,
    data BYTEA NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migrate existing data from workflows table to new structure
-- Create a default project for existing workflows
INSERT INTO projects (id, display_name, owner_id, created_at, updated_at)
SELECT 
    uuid_generate_v4() as id,
    'Default Project' as display_name,
    user_id as owner_id,
    MIN(created_at) as created_at,
    MAX(updated_at) as updated_at
FROM workflows 
GROUP BY user_id
ON CONFLICT DO NOTHING;

-- Create flows from existing workflows (group by name)
INSERT INTO flows (id, project_id, status, created_at, updated_at)
SELECT 
    uuid_generate_v4() as id,
    p.id as project_id,
    CASE WHEN w.is_active THEN 'ENABLED' ELSE 'DISABLED' END as status,
    MIN(w.created_at) as created_at,
    MAX(w.updated_at) as updated_at
FROM workflows w
JOIN projects p ON p.owner_id = w.user_id
GROUP BY w.name, w.user_id, p.id, w.is_active;

-- Create flow_versions from existing workflows
INSERT INTO flow_versions (id, flow_id, version, display_name, steps, status, created_at, updated_at)
SELECT 
    w.id as id, -- Keep original workflow ID as flow_version ID
    f.id as flow_id,
    w.version,
    w.name as display_name,
    w.definition as steps,
    CASE WHEN w.is_active THEN 'PUBLISHED' ELSE 'DRAFT' END as status,
    w.created_at,
    w.updated_at
FROM workflows w
JOIN projects p ON p.owner_id = w.user_id
JOIN flows f ON f.project_id = p.id;

-- Migrate existing executions to flow_runs
INSERT INTO flow_runs (id, flow_version_id, project_id, status, start_time, finish_time, created_at)
SELECT 
    e.id as id,
    e.workflow_id as flow_version_id,
    p.id as project_id,
    CASE 
        WHEN e.status = 'completed' THEN 'SUCCEEDED'
        WHEN e.status = 'failed' THEN 'FAILED'
        WHEN e.status = 'running' THEN 'RUNNING'
        WHEN e.status = 'cancelled' THEN 'CANCELLED'
        ELSE 'PAUSED'
    END as status,
    e.started_at as start_time,
    e.completed_at as finish_time,
    e.created_at
FROM executions e
JOIN workflows w ON w.id = e.workflow_id
JOIN projects p ON p.owner_id = w.user_id;

-- Migrate execution steps to step_runs
INSERT INTO step_runs (id, flow_run_id, step_name, status, input, output, error_message, duration, start_time, finish_time, created_at)
SELECT 
    es.id as id,
    es.execution_id as flow_run_id,
    es.step_name,
    CASE 
        WHEN es.status = 'completed' THEN 'SUCCEEDED'
        WHEN es.status = 'failed' THEN 'FAILED'
        WHEN es.status = 'running' THEN 'RUNNING'
        WHEN es.status = 'skipped' THEN 'SKIPPED'
        ELSE 'PAUSED'
    END as status,
    es.input_data as input,
    es.output_data as output,
    es.error_message,
    es.execution_time_ms as duration,
    es.started_at as start_time,
    es.completed_at as finish_time,
    es.created_at
FROM execution_steps es
WHERE EXISTS (
    SELECT 1 FROM flow_runs fr WHERE fr.id = es.execution_id
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_folders_project_id ON folders(project_id);
CREATE INDEX IF NOT EXISTS idx_flows_project_id ON flows(project_id);
CREATE INDEX IF NOT EXISTS idx_flows_folder_id ON flows(folder_id);
CREATE INDEX IF NOT EXISTS idx_flows_status ON flows(status);
CREATE INDEX IF NOT EXISTS idx_flow_versions_flow_id ON flow_versions(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_versions_version ON flow_versions(version);
CREATE INDEX IF NOT EXISTS idx_flow_versions_status ON flow_versions(status);
CREATE INDEX IF NOT EXISTS idx_flow_runs_flow_version_id ON flow_runs(flow_version_id);
CREATE INDEX IF NOT EXISTS idx_flow_runs_project_id ON flow_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_flow_runs_status ON flow_runs(status);
CREATE INDEX IF NOT EXISTS idx_flow_runs_start_time ON flow_runs(start_time);
CREATE INDEX IF NOT EXISTS idx_step_runs_flow_run_id ON step_runs(flow_run_id);
CREATE INDEX IF NOT EXISTS idx_step_runs_status ON step_runs(status);
CREATE INDEX IF NOT EXISTS idx_app_connections_project_id ON app_connections(project_id);
CREATE INDEX IF NOT EXISTS idx_trigger_events_flow_id ON trigger_events(flow_id);
CREATE INDEX IF NOT EXISTS idx_trigger_events_project_id ON trigger_events(project_id);
CREATE INDEX IF NOT EXISTS idx_file_storage_project_id ON file_storage(project_id);

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_flows_updated_at BEFORE UPDATE ON flows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_flow_versions_updated_at BEFORE UPDATE ON flow_versions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_flow_runs_updated_at BEFORE UPDATE ON flow_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_connections_updated_at BEFORE UPDATE ON app_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- +goose StatementBegin
DO $$
BEGIN
    RAISE NOTICE 'Flow architecture updated successfully at %', NOW();
END $$;
-- +goose StatementEnd

-- +goose Down
-- Drop new tables in reverse order
DROP TABLE IF EXISTS file_storage CASCADE;
DROP TABLE IF EXISTS trigger_events CASCADE;
DROP TABLE IF EXISTS app_connections CASCADE;
DROP TABLE IF EXISTS step_runs CASCADE;
DROP TABLE IF EXISTS flow_runs CASCADE;
DROP TABLE IF EXISTS flow_versions CASCADE;
DROP TABLE IF EXISTS flows CASCADE;
DROP TABLE IF EXISTS folders CASCADE;
DROP TABLE IF EXISTS projects CASCADE; 