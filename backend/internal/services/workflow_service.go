package services

import (
	"backend/internal/db"
	sqlcdb "backend/internal/db/sqlc"
	"backend/internal/models"
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type WorkflowService struct {
	db *db.DB
}

func NewWorkflowService(db *db.DB) *WorkflowService {
	return &WorkflowService{db: db}
}

func (s *WorkflowService) GetWorkflow(ctx context.Context, workflowID string) (models.Workflow, error) {
	id, err := uuid.Parse(workflowID)
	if err != nil {
		return models.Workflow{}, err
	}

	workflow, err := s.db.Queries().GetWorkflowByID(ctx, pgtype.UUID{Bytes: id, Valid: true})
	if err != nil {
		return models.Workflow{}, err
	}

	return s.convertDBWorkflowToModel(workflow)
}

func (s *WorkflowService) CreateWorkflow(ctx context.Context, workflow models.Workflow) (models.Workflow, error) {
	// Ensure user exists in database first
	if err := s.ensureUserExists(ctx, workflow.UserID); err != nil {
		return models.Workflow{}, err
	}

	definitionJSON, err := json.Marshal(workflow.Definition)
	if err != nil {
		return models.Workflow{}, err
	}

	params := sqlcdb.CreateWorkflowParams{
		UserID:      workflow.UserID,
		Name:        workflow.Name,
		Description: pgtype.Text{String: workflow.Description, Valid: workflow.Description != ""},
		Definition:  definitionJSON,
		Version:     pgtype.Int4{Int32: workflow.Version, Valid: true},
		IsActive:    pgtype.Bool{Bool: workflow.IsActive, Valid: true},
	}

	createdWorkflow, err := s.db.Queries().CreateWorkflow(ctx, params)
	if err != nil {
		// Check if it's a foreign key constraint violation for user_id
		if strings.Contains(err.Error(), "workflows_user_id_fkey") {
			return models.Workflow{}, errors.New("user does not exist in database - please register first")
		}
		return models.Workflow{}, err
	}

	return s.convertDBWorkflowToModel(createdWorkflow)
}

// ensureUserExists creates a minimal user record if it doesn't exist
func (s *WorkflowService) ensureUserExists(ctx context.Context, userID string) error {
	// Check if user exists
	_, err := s.db.Queries().GetUserByID(ctx, userID)
	if err == nil {
		return nil // User exists
	}

	// If it's not a "not found" error, return the error
	if !strings.Contains(err.Error(), "no rows") {
		return err
	}

	// User doesn't exist, create a minimal user record
	// Note: This creates a user with minimal info - in production you might want better data
	now := time.Now()
	params := sqlcdb.CreateUserParams{
		ID:            userID,
		Name:          "User",             // Default name
		Email:         "user@example.com", // Default email - should be updated
		EmailVerified: false,
		Image:         pgtype.Text{Valid: false},
		CreatedAt:     pgtype.Timestamp{Time: now, Valid: true},
		UpdatedAt:     pgtype.Timestamp{Time: now, Valid: true},
	}

	_, err = s.db.Queries().CreateUser(ctx, params)
	return err
}

func (s *WorkflowService) UpdateWorkflow(ctx context.Context, workflowID string, workflow models.Workflow) (models.Workflow, error) {
	id, err := uuid.Parse(workflowID)
	if err != nil {
		return models.Workflow{}, err
	}

	definitionJSON, err := json.Marshal(workflow.Definition)
	if err != nil {
		return models.Workflow{}, err
	}

	params := sqlcdb.UpdateWorkflowParams{
		ID:          pgtype.UUID{Bytes: id, Valid: true},
		Name:        workflow.Name,
		Description: pgtype.Text{String: workflow.Description, Valid: workflow.Description != ""},
		Definition:  definitionJSON,
		IsActive:    pgtype.Bool{Bool: workflow.IsActive, Valid: true},
	}

	updatedWorkflow, err := s.db.Queries().UpdateWorkflow(ctx, params)
	if err != nil {
		return models.Workflow{}, err
	}

	return s.convertDBWorkflowToModel(updatedWorkflow)
}

func (s *WorkflowService) DeleteWorkflow(ctx context.Context, workflowID string) error {
	id, err := uuid.Parse(workflowID)
	if err != nil {
		return err
	}

	return s.db.Queries().DeleteWorkflow(ctx, pgtype.UUID{Bytes: id, Valid: true})
}

func (s *WorkflowService) GetWorkflows(ctx context.Context, userID string) ([]models.Workflow, error) {
	workflows, err := s.db.Queries().GetWorkflowsByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	result := make([]models.Workflow, len(workflows))
	for i, workflow := range workflows {
		convertedWorkflow, err := s.convertDBWorkflowToModel(workflow)
		if err != nil {
			return nil, err
		}
		result[i] = convertedWorkflow
	}
	return result, nil
}

func (s *WorkflowService) GetWorkflowsByAgentID(ctx context.Context, agentID string) ([]models.Workflow, error) {
	id, err := uuid.Parse(agentID)
	if err != nil {
		return nil, err
	}

	workflows, err := s.db.Queries().GetWorkflowsByAgentID(ctx, pgtype.UUID{Bytes: id, Valid: true})
	if err != nil {
		return nil, err
	}

	result := make([]models.Workflow, len(workflows))
	for i, workflow := range workflows {
		convertedWorkflow, err := s.convertDBWorkflowToModel(workflow)
		if err != nil {
			return nil, err
		}
		result[i] = convertedWorkflow
	}
	return result, nil
}

func (s *WorkflowService) convertDBWorkflowToModel(dbWorkflow sqlcdb.Workflow) (models.Workflow, error) {
	var definition map[string]interface{}
	if err := json.Unmarshal(dbWorkflow.Definition, &definition); err != nil {
		return models.Workflow{}, err
	}

	// Convert pgtype.UUID to uuid.UUID
	var id uuid.UUID
	if dbWorkflow.ID.Valid {
		id = dbWorkflow.ID.Bytes
	}
	// Convert pgtype.Text to string
	description := ""
	if dbWorkflow.Description.Valid {
		description = dbWorkflow.Description.String
	}

	// Convert pgtype.Int4 to int32
	version := int32(0)
	if dbWorkflow.Version.Valid {
		version = dbWorkflow.Version.Int32
	}

	// Convert pgtype.Bool to bool
	isActive := false
	if dbWorkflow.IsActive.Valid {
		isActive = dbWorkflow.IsActive.Bool
	}

	return models.Workflow{
		ID:          id,
		UserID:      dbWorkflow.UserID,
		Name:        dbWorkflow.Name,
		Description: description,
		Definition:  definition,
		Version:     version,
		IsActive:    isActive,
		CreatedAt:   dbWorkflow.CreatedAt.Time,
		UpdatedAt:   dbWorkflow.UpdatedAt.Time,
	}, nil
}
