package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"backend/internal/db"
	sqlc "backend/internal/db/sqlc"
	"backend/internal/events"
	"backend/internal/logger"
	"backend/internal/models"
	"backend/internal/workflow"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type FlowService struct {
	db     *db.DB
	logger *logger.Logger
}

func NewFlowService(db *db.DB) *FlowService {
	return &FlowService{
		db:     db,
		logger: logger.Get(),
	}
}

// Extended Flow model with FolderName for responses that include joined folder data
type FlowWithFolder struct {
	ID         uuid.UUID              `json:"id"`
	ProjectID  uuid.UUID              `json:"project_id"`
	FolderID   *uuid.UUID             `json:"folder_id,omitempty"`
	FolderName *string                `json:"folder_name,omitempty"`
	Status     string                 `json:"status"`
	Schedule   map[string]interface{} `json:"schedule,omitempty"`
	CreatedAt  time.Time              `json:"created_at"`
	UpdatedAt  time.Time              `json:"updated_at"`
}

func (s *FlowService) convertDBFlowToModelWithFolder(flow sqlc.GetFlowByIDRow) FlowWithFolder {
	var folderID *uuid.UUID
	if flow.FolderID.Valid {
		id := uuid.UUID(flow.FolderID.Bytes)
		folderID = &id
	}

	var folderName *string
	if flow.FolderName.Valid {
		folderName = &flow.FolderName.String
	}

	var schedule map[string]interface{}
	if flow.Schedule != nil {
		if err := json.Unmarshal(flow.Schedule, &schedule); err != nil {
			schedule = make(map[string]interface{})
		}
	}

	return FlowWithFolder{
		ID:         uuid.UUID(flow.ID.Bytes),
		ProjectID:  uuid.UUID(flow.ProjectID.Bytes),
		FolderID:   folderID,
		FolderName: folderName,
		Status:     flow.Status.String,
		Schedule:   schedule,
		CreatedAt:  flow.CreatedAt.Time,
		UpdatedAt:  flow.UpdatedAt.Time,
	}
}

func (s *FlowService) convertDBFlowCreateToModel(flow sqlc.Flow) models.Flow {
	var folderID *uuid.UUID
	if flow.FolderID.Valid {
		id := uuid.UUID(flow.FolderID.Bytes)
		folderID = &id
	}

	var schedule map[string]interface{}
	if flow.Schedule != nil {
		if err := json.Unmarshal(flow.Schedule, &schedule); err != nil {
			schedule = make(map[string]interface{})
		}
	}

	return models.Flow{
		ID:        uuid.UUID(flow.ID.Bytes),
		ProjectID: uuid.UUID(flow.ProjectID.Bytes),
		FolderID:  folderID,
		Status:    flow.Status.String,
		Schedule:  schedule,
		CreatedAt: flow.CreatedAt.Time,
		UpdatedAt: flow.UpdatedAt.Time,
	}
}

func (s *FlowService) convertDBFlowsToModelsWithFolder(flows []sqlc.GetFlowsByProjectIDRow) []FlowWithFolder {
	flowsModels := make([]FlowWithFolder, len(flows))
	for i, flow := range flows {
		var folderID *uuid.UUID
		if flow.FolderID.Valid {
			id := uuid.UUID(flow.FolderID.Bytes)
			folderID = &id
		}

		var folderName *string
		if flow.FolderName.Valid {
			folderName = &flow.FolderName.String
		}

		var schedule map[string]interface{}
		if flow.Schedule != nil {
			if err := json.Unmarshal(flow.Schedule, &schedule); err != nil {
				schedule = make(map[string]interface{})
			}
		}

		flowsModels[i] = FlowWithFolder{
			ID:         uuid.UUID(flow.ID.Bytes),
			ProjectID:  uuid.UUID(flow.ProjectID.Bytes),
			FolderID:   folderID,
			FolderName: folderName,
			Status:     flow.Status.String,
			Schedule:   schedule,
			CreatedAt:  flow.CreatedAt.Time,
			UpdatedAt:  flow.UpdatedAt.Time,
		}
	}
	return flowsModels
}

// Flow methods
func (s *FlowService) GetFlowsByProjectID(ctx context.Context, projectID uuid.UUID) ([]FlowWithFolder, error) {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	flows, err := s.db.Queries().WithTx(tx).GetFlowsByProjectID(ctx, pgtype.UUID{Bytes: projectID, Valid: true})
	if err != nil {
		return nil, err
	}

	result := s.convertDBFlowsToModelsWithFolder(flows)

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return result, nil
}

func (s *FlowService) GetFlowByID(ctx context.Context, flowID uuid.UUID) (FlowWithFolder, error) {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return FlowWithFolder{}, err
	}
	defer tx.Rollback(ctx)

	flow, err := s.db.Queries().WithTx(tx).GetFlowByID(ctx, pgtype.UUID{Bytes: flowID, Valid: true})
	if err != nil {
		return FlowWithFolder{}, err
	}

	result := s.convertDBFlowToModelWithFolder(flow)

	if err := tx.Commit(ctx); err != nil {
		return FlowWithFolder{}, err
	}

	return result, nil
}

func (s *FlowService) CreateFlow(ctx context.Context, projectID uuid.UUID, folderID *uuid.UUID, status string, schedule map[string]interface{}) (models.Flow, error) {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return models.Flow{}, err
	}
	defer tx.Rollback(ctx)

	// Convert schedule to JSON
	var scheduleBytes []byte
	if schedule != nil {
		scheduleBytes, err = json.Marshal(schedule)
		if err != nil {
			return models.Flow{}, fmt.Errorf("failed to marshal schedule: %w", err)
		}
	}

	var folderUUID pgtype.UUID
	if folderID != nil {
		folderUUID = pgtype.UUID{Bytes: *folderID, Valid: true}
	}

	flow, err := s.db.Queries().WithTx(tx).CreateFlow(ctx, sqlc.CreateFlowParams{
		ProjectID: pgtype.UUID{Bytes: projectID, Valid: true},
		FolderID:  folderUUID,
		Status:    pgtype.Text{String: status, Valid: true},
		Schedule:  scheduleBytes,
	})
	if err != nil {
		return models.Flow{}, err
	}

	result := s.convertDBFlowCreateToModel(flow)

	if err := tx.Commit(ctx); err != nil {
		return models.Flow{}, err
	}

	return result, nil
}

func (s *FlowService) UpdateFlow(ctx context.Context, flowID uuid.UUID, folderID *uuid.UUID, status string, schedule map[string]interface{}) (models.Flow, error) {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return models.Flow{}, err
	}
	defer tx.Rollback(ctx)

	// Convert schedule to JSON
	var scheduleBytes []byte
	if schedule != nil {
		scheduleBytes, err = json.Marshal(schedule)
		if err != nil {
			return models.Flow{}, fmt.Errorf("failed to marshal schedule: %w", err)
		}
	}

	var folderUUID pgtype.UUID
	if folderID != nil {
		folderUUID = pgtype.UUID{Bytes: *folderID, Valid: true}
	}

	flow, err := s.db.Queries().WithTx(tx).UpdateFlow(ctx, sqlc.UpdateFlowParams{
		ID:       pgtype.UUID{Bytes: flowID, Valid: true},
		FolderID: folderUUID,
		Status:   pgtype.Text{String: status, Valid: true},
		Schedule: scheduleBytes,
	})
	if err != nil {
		return models.Flow{}, err
	}

	result := s.convertDBFlowCreateToModel(flow)

	if err := tx.Commit(ctx); err != nil {
		return models.Flow{}, err
	}

	return result, nil
}

func (s *FlowService) DeleteFlow(ctx context.Context, flowID uuid.UUID) error {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	err = s.db.Queries().WithTx(tx).DeleteFlow(ctx, pgtype.UUID{Bytes: flowID, Valid: true})
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *FlowService) UpdateFlowStatus(ctx context.Context, flowID uuid.UUID, status string) error {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	err = s.db.Queries().WithTx(tx).UpdateFlowStatus(ctx, sqlc.UpdateFlowStatusParams{
		ID:     pgtype.UUID{Bytes: flowID, Valid: true},
		Status: pgtype.Text{String: status, Valid: true},
	})
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// Flow Version methods
func (s *FlowService) GetFlowVersionsByFlowID(ctx context.Context, flowID uuid.UUID) ([]sqlc.FlowVersion, error) {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	versions, err := s.db.Queries().WithTx(tx).GetFlowVersionsByFlowID(ctx, pgtype.UUID{Bytes: flowID, Valid: true})
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return versions, nil
}

func (s *FlowService) GetFlowVersionByID(ctx context.Context, versionID uuid.UUID) (sqlc.FlowVersion, error) {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return sqlc.FlowVersion{}, err
	}
	defer tx.Rollback(ctx)

	version, err := s.db.Queries().WithTx(tx).GetFlowVersionByID(ctx, pgtype.UUID{Bytes: versionID, Valid: true})
	if err != nil {
		return sqlc.FlowVersion{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return sqlc.FlowVersion{}, err
	}

	return version, nil
}

func (s *FlowService) GetLatestFlowVersion(ctx context.Context, flowID uuid.UUID) (sqlc.FlowVersion, error) {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return sqlc.FlowVersion{}, err
	}
	defer tx.Rollback(ctx)

	version, err := s.db.Queries().WithTx(tx).GetLatestFlowVersion(ctx, pgtype.UUID{Bytes: flowID, Valid: true})
	if err != nil {
		return sqlc.FlowVersion{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return sqlc.FlowVersion{}, err
	}

	return version, nil
}

func (s *FlowService) CreateFlowVersion(ctx context.Context, params sqlc.CreateFlowVersionParams) (sqlc.FlowVersion, error) {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return sqlc.FlowVersion{}, err
	}
	defer tx.Rollback(ctx)

	version, err := s.db.Queries().WithTx(tx).CreateFlowVersion(ctx, params)
	if err != nil {
		return sqlc.FlowVersion{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return sqlc.FlowVersion{}, err
	}

	return version, nil
}

func (s *FlowService) UpdateFlowVersion(ctx context.Context, params sqlc.UpdateFlowVersionParams) (sqlc.FlowVersion, error) {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return sqlc.FlowVersion{}, err
	}
	defer tx.Rollback(ctx)

	version, err := s.db.Queries().WithTx(tx).UpdateFlowVersion(ctx, params)
	if err != nil {
		return sqlc.FlowVersion{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return sqlc.FlowVersion{}, err
	}

	return version, nil
}

func (s *FlowService) GetNextVersionNumber(ctx context.Context, flowID uuid.UUID) (int32, error) {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	nextVersion, err := s.db.Queries().WithTx(tx).GetNextVersionNumber(ctx, pgtype.UUID{Bytes: flowID, Valid: true})
	if err != nil {
		return 0, err
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}

	return nextVersion, nil
}

func (s *FlowService) DeleteFlowVersion(ctx context.Context, versionID uuid.UUID) error {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	err = s.db.Queries().WithTx(tx).DeleteFlowVersion(ctx, pgtype.UUID{Bytes: versionID, Valid: true})
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *FlowService) PublishFlowVersion(ctx context.Context, versionID uuid.UUID) error {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	err = s.db.Queries().WithTx(tx).UpdateFlowVersionStatus(ctx, sqlc.UpdateFlowVersionStatusParams{
		ID:     pgtype.UUID{Bytes: versionID, Valid: true},
		Status: pgtype.Text{String: "PUBLISHED", Valid: true},
	})
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// Flow Run methods
func (s *FlowService) GetFlowRunsByProjectID(ctx context.Context, projectID uuid.UUID, limit, offset int32) ([]sqlc.GetFlowRunsByProjectIDRow, error) {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	runs, err := s.db.Queries().WithTx(tx).GetFlowRunsByProjectID(ctx, sqlc.GetFlowRunsByProjectIDParams{
		ProjectID: pgtype.UUID{Bytes: projectID, Valid: true},
		Limit:     limit,
		Offset:    offset,
	})
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return runs, nil
}

func (s *FlowService) GetFlowRunsByFlowID(ctx context.Context, flowID uuid.UUID, limit, offset int32) ([]sqlc.GetFlowRunsByFlowIDRow, error) {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	runs, err := s.db.Queries().WithTx(tx).GetFlowRunsByFlowID(ctx, sqlc.GetFlowRunsByFlowIDParams{
		ID:     pgtype.UUID{Bytes: flowID, Valid: true},
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return runs, nil
}

func (s *FlowService) GetFlowRunByID(ctx context.Context, runID uuid.UUID) (sqlc.GetFlowRunByIDRow, error) {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return sqlc.GetFlowRunByIDRow{}, err
	}
	defer tx.Rollback(ctx)

	run, err := s.db.Queries().WithTx(tx).GetFlowRunByID(ctx, pgtype.UUID{Bytes: runID, Valid: true})
	if err != nil {
		return sqlc.GetFlowRunByIDRow{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return sqlc.GetFlowRunByIDRow{}, err
	}

	return run, nil
}

func (s *FlowService) CreateFlowRun(ctx context.Context, params sqlc.CreateFlowRunParams) (sqlc.FlowRun, error) {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return sqlc.FlowRun{}, err
	}
	defer tx.Rollback(ctx)

	run, err := s.db.Queries().WithTx(tx).CreateFlowRun(ctx, params)
	if err != nil {
		return sqlc.FlowRun{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return sqlc.FlowRun{}, err
	}

	return run, nil
}

func (s *FlowService) UpdateFlowRunStatus(ctx context.Context, runID uuid.UUID, status string) error {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	err = s.db.Queries().WithTx(tx).UpdateFlowRunStatus(ctx, sqlc.UpdateFlowRunStatusParams{
		ID:     pgtype.UUID{Bytes: runID, Valid: true},
		Status: pgtype.Text{String: status, Valid: true},
	})
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *FlowService) UpdateFlowRunPauseMetadata(ctx context.Context, runID uuid.UUID, metadata json.RawMessage) error {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	err = s.db.Queries().WithTx(tx).UpdateFlowRunPauseMetadata(ctx, sqlc.UpdateFlowRunPauseMetadataParams{
		ID:            pgtype.UUID{Bytes: runID, Valid: true},
		PauseMetadata: metadata,
	})
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *FlowService) GetFlowRunStats(ctx context.Context, projectID uuid.UUID, from string) (sqlc.GetFlowRunStatsRow, error) {
	fromTime, err := parseTimeString(from)
	if err != nil {
		return sqlc.GetFlowRunStatsRow{}, fmt.Errorf("invalid from time: %w", err)
	}

	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return sqlc.GetFlowRunStatsRow{}, err
	}
	defer tx.Rollback(ctx)

	stats, err := s.db.Queries().WithTx(tx).GetFlowRunStats(ctx, sqlc.GetFlowRunStatsParams{
		ProjectID: pgtype.UUID{Bytes: projectID, Valid: true},
		StartTime: pgtype.Timestamptz{Time: fromTime.Time, Valid: fromTime.Valid},
	})
	if err != nil {
		return sqlc.GetFlowRunStatsRow{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return sqlc.GetFlowRunStatsRow{}, err
	}

	return stats, nil
}

func (s *FlowService) GetFlowRunsWithFilters(ctx context.Context, params sqlc.GetFlowRunsWithFiltersParams) ([]sqlc.GetFlowRunsWithFiltersRow, error) {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	runs, err := s.db.Queries().WithTx(tx).GetFlowRunsWithFilters(ctx, params)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return runs, nil
}

func (s *FlowService) GetRunningFlowRuns(ctx context.Context) ([]sqlc.GetRunningFlowRunsRow, error) {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	runs, err := s.db.Queries().WithTx(tx).GetRunningFlowRuns(ctx)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return runs, nil
}

func (s *FlowService) RetryFlowRun(ctx context.Context, runID uuid.UUID) (sqlc.FlowRun, error) {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return sqlc.FlowRun{}, err
	}
	defer tx.Rollback(ctx)

	run, err := s.db.Queries().WithTx(tx).RetryFlowRun(ctx, pgtype.UUID{Bytes: runID, Valid: true})
	if err != nil {
		return sqlc.FlowRun{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return sqlc.FlowRun{}, err
	}

	return run, nil
}

// Step Run methods
func (s *FlowService) GetStepRunsByFlowRunID(ctx context.Context, flowRunID uuid.UUID) ([]sqlc.StepRun, error) {
	s.logger.WithField("flow_run_id", flowRunID.String()).Debug("Getting step runs by flow run ID")

	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		s.logger.WithError(err).WithField("flow_run_id", flowRunID.String()).Error("Failed to begin transaction for step runs")
		return nil, err
	}
	defer tx.Rollback(ctx)

	stepRuns, err := s.db.Queries().WithTx(tx).GetStepRunsByFlowRunID(ctx, pgtype.UUID{Bytes: flowRunID, Valid: true})
	if err != nil {
		s.logger.WithError(err).WithField("flow_run_id", flowRunID.String()).Error("Failed to query step runs")
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		s.logger.WithError(err).Error("Failed to commit transaction")
		return nil, err
	}

	s.logger.WithFields(map[string]interface{}{
		"flow_run_id": flowRunID.String(),
		"step_count":  len(stepRuns),
	}).Debug("Retrieved step runs successfully")

	return stepRuns, nil
}

func (s *FlowService) CreateStepRun(ctx context.Context, flowRunID uuid.UUID, stepName string, status string) (*sqlc.StepRun, error) {
	s.logger.WithFields(map[string]interface{}{
		"flow_run_id": flowRunID.String(),
		"step_name":   stepName,
		"status":      status,
	}).Debug("Creating step run")

	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	stepRun, err := s.db.Queries().WithTx(tx).CreateStepRun(ctx, sqlc.CreateStepRunParams{
		FlowRunID: pgtype.UUID{Bytes: flowRunID, Valid: true},
		StepName:  stepName,
		Status:    pgtype.Text{String: status, Valid: true},
		Input:     json.RawMessage("{}"),
		StartTime: pgtype.Timestamptz{Time: time.Now(), Valid: true},
	})
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	s.logger.WithFields(map[string]interface{}{
		"step_run_id": uuid.UUID(stepRun.ID.Bytes).String(),
		"flow_run_id": flowRunID.String(),
		"step_name":   stepName,
	}).Debug("Step run created successfully")

	return &stepRun, nil
}

func (s *FlowService) UpdateStepRunStatus(ctx context.Context, stepRunID uuid.UUID, status string) error {
	s.logger.WithFields(map[string]interface{}{
		"step_run_id": stepRunID.String(),
		"status":      status,
	}).Debug("Updating step run status")

	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = s.db.Queries().WithTx(tx).UpdateStepRunStatus(ctx, sqlc.UpdateStepRunStatusParams{
		ID:     pgtype.UUID{Bytes: stepRunID, Valid: true},
		Status: pgtype.Text{String: status, Valid: true},
	})
	if err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return err
	}

	s.logger.WithFields(map[string]interface{}{
		"step_run_id": stepRunID.String(),
		"status":      status,
	}).Debug("Step run status updated successfully")

	return nil
}

// Helper functions
func parseTimeString(timeStr string) (sql.NullTime, error) {
	if timeStr == "" {
		return sql.NullTime{Valid: false}, nil
	}

	// Add proper time parsing logic here
	// For now, return a placeholder
	return sql.NullTime{Valid: false}, nil
}

// broadcastExecutionEvent broadcasts execution events via WebSocket
func (s *FlowService) broadcastExecutionEvent(eventType, flowRunID, stepName, status, errorMsg string, data map[string]interface{}, duration int64) {
	event := events.ExecutionEvent{
		Type:      eventType,
		Timestamp: time.Now(),
		FlowRunID: flowRunID,
		StepName:  stepName,
		Status:    status,
		Data:      data,
		Error:     errorMsg,
		Duration:  duration,
	}

	s.logger.WithFields(map[string]interface{}{
		"event_type":  eventType,
		"flow_run_id": flowRunID,
		"step_name":   stepName,
		"status":      status,
	}).Debug("Broadcasting execution event")

	events.BroadcastExecutionEvent(event)
}

// ExecuteFlow starts a new flow execution
func (s *FlowService) ExecuteFlow(ctx context.Context, flowID uuid.UUID, projectID uuid.UUID, environment string, triggerPayload map[string]interface{}) (sqlc.FlowRun, error) {
	s.logger.WithFields(map[string]interface{}{
		"flow_id":     flowID.String(),
		"project_id":  projectID.String(),
		"environment": environment,
	}).Info("Starting flow execution")

	// Get the latest published version
	latestVersion, err := s.GetLatestFlowVersion(ctx, flowID)
	if err != nil {
		s.logger.WithError(err).WithFields(map[string]interface{}{
			"flow_id":    flowID.String(),
			"project_id": projectID.String(),
		}).Error("Failed to get latest flow version")
		return sqlc.FlowRun{}, fmt.Errorf("failed to get latest flow version: %w", err)
	}

	s.logger.WithFields(map[string]interface{}{
		"flow_id":         flowID.String(),
		"flow_version_id": uuid.UUID(latestVersion.ID.Bytes).String(),
		"version_number":  latestVersion.Version,
		"flow_name":       latestVersion.DisplayName,
	}).Info("Found latest flow version")

	// Create flow run
	flowRun, err := s.CreateFlowRun(ctx, sqlc.CreateFlowRunParams{
		FlowVersionID:   latestVersion.ID,
		ProjectID:       pgtype.UUID{Bytes: projectID, Valid: true},
		Status:          pgtype.Text{String: "RUNNING", Valid: true},
		Environment:     pgtype.Text{String: environment, Valid: true},
		FlowDisplayName: pgtype.Text{String: latestVersion.DisplayName, Valid: true},
		Tags:            []string{}, // Empty string array
		PauseMetadata:   json.RawMessage("{}"),
	})
	if err != nil {
		s.logger.WithError(err).WithFields(map[string]interface{}{
			"flow_id":    flowID.String(),
			"project_id": projectID.String(),
		}).Error("Failed to create flow run")
		return sqlc.FlowRun{}, fmt.Errorf("failed to create flow run: %w", err)
	}

	runID := uuid.UUID(flowRun.ID.Bytes)
	s.logger.WithFields(map[string]interface{}{
		"flow_run_id":     runID.String(),
		"flow_id":         flowID.String(),
		"flow_version_id": uuid.UUID(latestVersion.ID.Bytes).String(),
		"environment":     environment,
	}).Info("Flow run created, starting async execution")

	// Broadcast flow started event
	s.logger.WithField("flow_run_id", runID.String()).Info("Broadcasting flow_started event")
	s.broadcastExecutionEvent(
		"flow_started",
		runID.String(),
		"",
		"RUNNING",
		"",
		map[string]interface{}{
			"flowName":    latestVersion.DisplayName,
			"environment": environment,
			"trigger":     triggerPayload,
		},
		0,
	)

	// Execute the flow asynchronously
	go func() {
		// Delay to allow WebSocket connections to be established
		time.Sleep(500 * time.Millisecond)

		startTime := time.Now()
		engine := workflow.NewExecutionEngine(s.db)

		if err := engine.ExecuteFlowVersion(context.Background(), &flowRun, &latestVersion); err != nil {
			s.logger.WithError(err).WithField("flow_run_id", runID.String()).Error("Flow execution failed")

			// Broadcast flow failed event
			s.logger.WithField("flow_run_id", runID.String()).Info("Broadcasting flow_completed (FAILED) event")
			s.broadcastExecutionEvent(
				"flow_completed",
				runID.String(),
				"",
				"FAILED",
				err.Error(),
				map[string]interface{}{
					"flowName": latestVersion.DisplayName,
				},
				time.Since(startTime).Milliseconds(),
			)
		} else {
			// Broadcast flow completed event
			s.logger.WithField("flow_run_id", runID.String()).Info("Broadcasting flow_completed (SUCCEEDED) event")
			s.broadcastExecutionEvent(
				"flow_completed",
				runID.String(),
				"",
				"SUCCEEDED",
				"",
				map[string]interface{}{
					"flowName": latestVersion.DisplayName,
				},
				time.Since(startTime).Milliseconds(),
			)
		}
	}()

	return flowRun, nil
}
