package services

import (
	"backend/internal/db"
	sqlcdb "backend/internal/db/sqlc"
	"backend/internal/models"
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type ExecutionService struct {
	db *db.DB
}

func NewExecutionService(db *db.DB) *ExecutionService {
	return &ExecutionService{db: db}
}

func (s *ExecutionService) GetExecution(ctx context.Context, executionID string) (models.Execution, error) {
	id, err := uuid.Parse(executionID)
	if err != nil {
		return models.Execution{}, err
	}

	execution, err := s.db.Queries().GetExecutionByID(ctx, pgtype.UUID{Bytes: id, Valid: true})
	if err != nil {
		return models.Execution{}, err
	}

	return s.convertDBExecutionToModel(execution)
}

func (s *ExecutionService) CreateExecution(ctx context.Context, execution models.Execution) (models.Execution, error) {
	inputDataJSON, err := json.Marshal(execution.InputData)
	if err != nil {
		return models.Execution{}, err
	}

	params := sqlcdb.CreateExecutionParams{
		WorkflowID: pgtype.UUID{Bytes: execution.WorkflowID, Valid: true},
		AgentID:    pgtype.UUID{Bytes: execution.AgentID, Valid: true},
		Status:     pgtype.Text{String: execution.Status, Valid: execution.Status != ""},
		InputData:  inputDataJSON,
		StartedAt:  pgtype.Timestamptz{Time: execution.StartedAt, Valid: true},
	}

	createdExecution, err := s.db.Queries().CreateExecution(ctx, params)
	if err != nil {
		return models.Execution{}, err
	}

	return s.convertDBExecutionToModel(createdExecution)
}

func (s *ExecutionService) UpdateExecutionStatus(ctx context.Context, executionID string, status string, outputData map[string]interface{}, completedAt *time.Time, executionTimeMs int32, errorMessage string) (models.Execution, error) {
	id, err := uuid.Parse(executionID)
	if err != nil {
		return models.Execution{}, err
	}

	outputDataJSON, err := json.Marshal(outputData)
	if err != nil {
		return models.Execution{}, err
	}

	var completedAtPg pgtype.Timestamptz
	if completedAt != nil {
		completedAtPg = pgtype.Timestamptz{Time: *completedAt, Valid: true}
	}

	params := sqlcdb.UpdateExecutionStatusParams{
		ID:              pgtype.UUID{Bytes: id, Valid: true},
		Status:          pgtype.Text{String: status, Valid: status != ""},
		OutputData:      outputDataJSON,
		CompletedAt:     completedAtPg,
		ExecutionTimeMs: pgtype.Int4{Int32: executionTimeMs, Valid: true},
		ErrorMessage:    pgtype.Text{String: errorMessage, Valid: errorMessage != ""},
	}

	updatedExecution, err := s.db.Queries().UpdateExecutionStatus(ctx, params)
	if err != nil {
		return models.Execution{}, err
	}

	return s.convertDBExecutionToModel(updatedExecution)
}

func (s *ExecutionService) GetExecutions(ctx context.Context, userID string, limit int32) ([]models.Execution, error) {
	if limit <= 0 {
		limit = 50 // Default limit
	}

	params := sqlcdb.GetExecutionsByUserIDParams{
		UserID: userID,
		Limit:  limit,
	}

	executions, err := s.db.Queries().GetExecutionsByUserID(ctx, params)
	if err != nil {
		return nil, err
	}

	result := make([]models.Execution, len(executions))
	for i, execution := range executions {
		convertedExecution, err := s.convertDBExecutionToModel(execution)
		if err != nil {
			return nil, err
		}
		result[i] = convertedExecution
	}
	return result, nil
}

func (s *ExecutionService) GetExecutionsByWorkflowID(ctx context.Context, workflowID string, limit int32) ([]models.Execution, error) {
	id, err := uuid.Parse(workflowID)
	if err != nil {
		return nil, err
	}

	if limit <= 0 {
		limit = 50 // Default limit
	}

	params := sqlcdb.GetExecutionsByWorkflowIDParams{
		WorkflowID: pgtype.UUID{Bytes: id, Valid: true},
		Limit:      limit,
	}

	executions, err := s.db.Queries().GetExecutionsByWorkflowID(ctx, params)
	if err != nil {
		return nil, err
	}

	result := make([]models.Execution, len(executions))
	for i, execution := range executions {
		convertedExecution, err := s.convertDBExecutionToModel(execution)
		if err != nil {
			return nil, err
		}
		result[i] = convertedExecution
	}
	return result, nil
}

func (s *ExecutionService) GetExecutionsByAgentID(ctx context.Context, agentID string, limit int32) ([]models.Execution, error) {
	id, err := uuid.Parse(agentID)
	if err != nil {
		return nil, err
	}

	if limit <= 0 {
		limit = 50 // Default limit
	}

	params := sqlcdb.GetExecutionsByAgentIDParams{
		AgentID: pgtype.UUID{Bytes: id, Valid: true},
		Limit:   limit,
	}

	executions, err := s.db.Queries().GetExecutionsByAgentID(ctx, params)
	if err != nil {
		return nil, err
	}

	result := make([]models.Execution, len(executions))
	for i, execution := range executions {
		convertedExecution, err := s.convertDBExecutionToModel(execution)
		if err != nil {
			return nil, err
		}
		result[i] = convertedExecution
	}
	return result, nil
}

func (s *ExecutionService) convertDBExecutionToModel(dbExecution sqlcdb.Execution) (models.Execution, error) {
	var inputData map[string]interface{}
	if err := json.Unmarshal(dbExecution.InputData, &inputData); err != nil {
		return models.Execution{}, err
	}

	var outputData map[string]interface{}
	if err := json.Unmarshal(dbExecution.OutputData, &outputData); err != nil {
		return models.Execution{}, err
	}

	// Convert pgtype.UUID to uuid.UUID
	var id uuid.UUID
	if dbExecution.ID.Valid {
		id = dbExecution.ID.Bytes
	}

	var workflowID uuid.UUID
	if dbExecution.WorkflowID.Valid {
		workflowID = dbExecution.WorkflowID.Bytes
	}

	var agentID uuid.UUID
	if dbExecution.AgentID.Valid {
		agentID = dbExecution.AgentID.Bytes
	}

	// Convert pgtype.Text to string
	status := ""
	if dbExecution.Status.Valid {
		status = dbExecution.Status.String
	}

	errorMessage := ""
	if dbExecution.ErrorMessage.Valid {
		errorMessage = dbExecution.ErrorMessage.String
	}

	// Convert pgtype.Int4 to int32
	executionTimeMs := int32(0)
	if dbExecution.ExecutionTimeMs.Valid {
		executionTimeMs = dbExecution.ExecutionTimeMs.Int32
	}

	// Convert pgtype.Timestamptz to *time.Time for CompletedAt
	var completedAt *time.Time
	if dbExecution.CompletedAt.Valid {
		completedAt = &dbExecution.CompletedAt.Time
	}

	return models.Execution{
		ID:              id,
		WorkflowID:      workflowID,
		AgentID:         agentID,
		Status:          status,
		InputData:       inputData,
		OutputData:      outputData,
		ErrorMessage:    errorMessage,
		ExecutionTimeMs: executionTimeMs,
		StartedAt:       dbExecution.StartedAt.Time,
		CompletedAt:     completedAt,
		CreatedAt:       dbExecution.CreatedAt.Time,
	}, nil
}
