package services

import (
	"backend/internal/db"
	sqlcdb "backend/internal/db/sqlc"
	"backend/internal/models"
	"context"
	"encoding/json"

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
	definitionJSON, err := json.Marshal(workflow.Definition)
	if err != nil {
		return models.Workflow{}, err
	}

	params := sqlcdb.CreateWorkflowParams{
		AgentID:     pgtype.UUID{Bytes: workflow.AgentID, Valid: true},
		Name:        workflow.Name,
		Description: pgtype.Text{String: workflow.Description, Valid: workflow.Description != ""},
		Definition:  definitionJSON,
		Version:     pgtype.Int4{Int32: workflow.Version, Valid: true},
		IsActive:    pgtype.Bool{Bool: workflow.IsActive, Valid: true},
	}

	createdWorkflow, err := s.db.Queries().CreateWorkflow(ctx, params)
	if err != nil {
		return models.Workflow{}, err
	}

	return s.convertDBWorkflowToModel(createdWorkflow)
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

	var agentID uuid.UUID
	if dbWorkflow.AgentID.Valid {
		agentID = dbWorkflow.AgentID.Bytes
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
		AgentID:     agentID,
		Name:        dbWorkflow.Name,
		Description: description,
		Definition:  definition,
		Version:     version,
		IsActive:    isActive,
		CreatedAt:   dbWorkflow.CreatedAt.Time,
		UpdatedAt:   dbWorkflow.UpdatedAt.Time,
	}, nil
}
