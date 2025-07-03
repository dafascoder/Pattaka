-- +goose Up
--- Database initialization script for Voltig Agent Builder Platform
-- Better Auth will create its own tables automatically, but this script can be used for additional setup

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set default timezone
-- SET timezone = 'UTC';

-- Agent Builder Platform Tables
create table "user" ("id" text not null primary key, "name" text not null, "email" text not null unique, "emailVerified" boolean not null, "image" text, "createdAt" timestamp not null, "updatedAt" timestamp not null, "last_login" timestamp);

create table "session" ("id" text not null primary key, "expiresAt" timestamp not null, "token" text not null unique, "createdAt" timestamp not null, "updatedAt" timestamp not null, "ipAddress" text, "userAgent" text, "userId" text not null references "user" ("id"));

create table account (
    id text primary key,
    account_id text not null,
    provider text not null,
    provider_id text not null,
    user_id text not null references "user" (id),
    access_token text,
    refresh_token text,
    id_token text,
    access_token_expires_at timestamp,
    refresh_token_expires_at timestamp,
    scope text,
    password text,
    created_at timestamp not null DEFAULT NOW(),
    updated_at timestamp not null DEFAULT NOW()
);

create table "verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" timestamp not null, "createdAt" timestamp, "updatedAt" timestamp);

-- Agents table - stores agent configurations
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'error')),
    user_id text not null references "user" (id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integrations table - stores available service integrations
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'api', 'webhook', 'database', etc.
    config JSONB NOT NULL DEFAULT '{}',
    credentials JSONB DEFAULT '{}', -- Encrypted credentials
    user_id VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type);

-- Insert some default integrations for the MVP
INSERT INTO integrations (name, type, config, user_id) VALUES 
('HTTP API', 'api', '{"method": "GET", "headers": {}, "timeout": 30}', 'system'),
('Webhook', 'webhook', '{"method": "POST", "headers": {"Content-Type": "application/json"}}', 'system'),
('Email', 'email', '{"provider": "smtp", "port": 587, "secure": true}', 'system'),
('Slack', 'api', '{"base_url": "https://slack.com/api", "version": "v1"}', 'system'),
('Discord', 'api', '{"base_url": "https://discord.com/api", "version": "v10"}', 'system')
ON CONFLICT DO NOTHING;

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

-- Create triggers for updated_at
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- +goose StatementBegin
DO $$
BEGIN
    RAISE NOTICE 'Agent Builder Platform database initialized at %', NOW();
END $$;
-- +goose StatementEnd

-- +goose StatementBegin
SELECT 'up SQL query';
-- +goose StatementEnd

-- +goose Down
DROP TABLE IF EXISTS integrations CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS "verification" CASCADE;
DROP TABLE IF EXISTS account CASCADE;
-- +goose StatementBegin
SELECT 'down SQL query';
-- +goose StatementEnd
