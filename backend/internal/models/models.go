package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// API Response wrapper
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

// Project represents a project with JSON-serializable fields
type Project struct {
	ID              uuid.UUID              `json:"id"`
	DisplayName     string                 `json:"display_name"`
	OwnerID         string                 `json:"owner_id"`
	PlatformID      uuid.UUID              `json:"platform_id"`
	NotifyStatus    string                 `json:"notify_status"`
	ExternalID      *string                `json:"external_id,omitempty"`
	ReleasesEnabled bool                   `json:"releases_enabled"`
	Metadata        map[string]interface{} `json:"metadata"`
	CreatedAt       time.Time              `json:"created_at"`
	UpdatedAt       time.Time              `json:"updated_at"`
}

// ProjectUsage represents project usage statistics
type ProjectUsage struct {
	ID              uuid.UUID `json:"id"`
	DisplayName     string    `json:"display_name"`
	FlowCount       int64     `json:"flow_count"`
	FlowRunCount    int64     `json:"flow_run_count"`
	ConnectionCount int64     `json:"connection_count"`
}

// Flow represents a flow definition
type Flow struct {
	ID        uuid.UUID              `json:"id"`
	ProjectID uuid.UUID              `json:"project_id"`
	FolderID  *uuid.UUID             `json:"folder_id,omitempty"`
	Status    string                 `json:"status"`
	Schedule  map[string]interface{} `json:"schedule,omitempty"`
	CreatedAt time.Time              `json:"created_at"`
	UpdatedAt time.Time              `json:"updated_at"`
}

// FlowVersion represents a versioned flow definition
type FlowVersion struct {
	ID          uuid.UUID              `json:"id"`
	FlowID      uuid.UUID              `json:"flow_id"`
	Version     int32                  `json:"version"`
	DisplayName string                 `json:"display_name"`
	Trigger     map[string]interface{} `json:"trigger"`
	Steps       map[string]interface{} `json:"steps"`
	Status      string                 `json:"status"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

// FlowRun represents an execution instance
type FlowRun struct {
	ID              uuid.UUID              `json:"id"`
	FlowVersionID   uuid.UUID              `json:"flow_version_id"`
	ProjectID       uuid.UUID              `json:"project_id"`
	Status          string                 `json:"status"`
	StartTime       time.Time              `json:"start_time"`
	FinishTime      *time.Time             `json:"finish_time,omitempty"`
	Environment     string                 `json:"environment"`
	FlowDisplayName *string                `json:"flow_display_name,omitempty"`
	LogsFileID      *uuid.UUID             `json:"logs_file_id,omitempty"`
	Tags            []string               `json:"tags"`
	PauseMetadata   map[string]interface{} `json:"pause_metadata"`
	CreatedAt       time.Time              `json:"created_at"`
	UpdatedAt       time.Time              `json:"updated_at"`
}

// StepRun represents individual step execution details
type StepRun struct {
	ID           uuid.UUID              `json:"id"`
	FlowRunID    uuid.UUID              `json:"flow_run_id"`
	StepName     string                 `json:"step_name"`
	Status       string                 `json:"status"`
	Input        map[string]interface{} `json:"input"`
	Output       map[string]interface{} `json:"output"`
	ErrorMessage *string                `json:"error_message,omitempty"`
	Duration     *int32                 `json:"duration,omitempty"`
	StartTime    time.Time              `json:"start_time"`
	FinishTime   *time.Time             `json:"finish_time,omitempty"`
	CreatedAt    time.Time              `json:"created_at"`
}

// AppConnection represents external service integrations
type AppConnection struct {
	ID          uuid.UUID              `json:"id"`
	ProjectID   uuid.UUID              `json:"project_id"`
	Name        string                 `json:"name"`
	AppName     string                 `json:"app_name"`
	Config      map[string]interface{} `json:"config"`
	Credentials map[string]interface{} `json:"credentials,omitempty"`
	Status      string                 `json:"status"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

// Agent represents an agent with JSON-serializable fields
type Agent struct {
	ID          uuid.UUID              `json:"id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Config      map[string]interface{} `json:"config"`
	Status      string                 `json:"status"`
	UserID      string                 `json:"user_id"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

// Integration represents an integration with JSON-serializable fields
type Integration struct {
	ID          uuid.UUID              `json:"id"`
	Name        string                 `json:"name"`
	Type        string                 `json:"type"`
	Config      map[string]interface{} `json:"config"`
	Credentials map[string]interface{} `json:"credentials,omitempty"`
	UserID      string                 `json:"user_id"`
	IsActive    bool                   `json:"is_active"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

type Session struct {
	ID        string    `json:"id"`
	Token     string    `json:"token"`
	UserID    string    `json:"userId"`
	ExpiresAt time.Time `json:"expiresAt"`
	IPAddress string    `json:"ipAddress"`
	UserAgent string    `json:"userAgent"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type User struct {
	ID            string    `json:"id"`
	Email         string    `json:"email"`
	Name          string    `json:"name"`
	EmailVerified bool      `json:"emailVerified"`
	Image         string    `json:"image"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

// Helper functions to convert pgtype to standard types
func PgtimeToTimePtr(pt pgtype.Timestamptz) *time.Time {
	if pt.Valid {
		return &pt.Time
	}
	return nil
}

func TimePtrToPgtime(t *time.Time) pgtype.Timestamptz {
	if t != nil {
		return pgtype.Timestamptz{Time: *t, Valid: true}
	}
	return pgtype.Timestamptz{Valid: false}
}
