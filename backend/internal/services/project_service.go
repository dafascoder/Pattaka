package services

import (
	"context"
	"encoding/json"
	"errors"

	"backend/internal/db"
	sqlc "backend/internal/db/sqlc"
	"backend/internal/logger"
	"backend/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// ProjectService handles project-related operations
type ProjectService struct {
	db     *db.DB
	logger *logger.Logger
}

// CreateProjectParams contains parameters for creating a project
type CreateProjectParams struct {
	DisplayName     string
	OwnerID         string
	PlatformID      *uuid.UUID
	NotifyStatus    string
	ExternalID      *string
	ReleasesEnabled bool
	Metadata        map[string]interface{}
}

// UpdateProjectParams contains parameters for updating a project
type UpdateProjectParams struct {
	DisplayName     string
	NotifyStatus    string
	ExternalID      *string
	ReleasesEnabled bool
	Metadata        map[string]interface{}
}

func NewProjectService(database *db.DB) *ProjectService {
	return &ProjectService{
		db:     database,
		logger: logger.Get(),
	}
}

// GetProjectsByOwnerID retrieves all projects for a given owner
func (s *ProjectService) GetProjectsByOwnerID(ctx context.Context, ownerID string) ([]models.Project, error) {
	s.logger.WithField("ownerID", ownerID).Info("Getting projects by owner ID")

	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		s.logger.WithError(err).WithField("ownerID", ownerID).Error("Failed to begin transaction")
		return nil, err
	}
	defer tx.Rollback(ctx)

	rows, err := s.db.Queries().WithTx(tx).GetProjectsByOwnerID(ctx, ownerID)
	if err != nil {
		s.logger.WithError(err).WithField("ownerID", ownerID).Error("Failed to query projects")
		return nil, err
	}

	var projects []models.Project
	for _, row := range rows {
		p := s.convertSQLCProjectToModel(row)
		projects = append(projects, p)
	}

	if err := tx.Commit(ctx); err != nil {
		s.logger.WithError(err).Error("Failed to commit transaction")
		return nil, err
	}

	s.logger.WithFields(map[string]interface{}{
		"ownerID": ownerID,
		"count":   len(projects),
	}).Info("Retrieved projects successfully")
	return projects, nil
}

// GetProjectByID retrieves a project by its ID
func (s *ProjectService) GetProjectByID(ctx context.Context, projectID uuid.UUID) (*models.Project, error) {
	s.logger.WithField("projectID", projectID.String()).Info("Getting project by ID")

	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		s.logger.WithError(err).WithField("projectID", projectID.String()).Error("Failed to begin transaction")
		return nil, err
	}
	defer tx.Rollback(ctx)

	projectUUID := pgtype.UUID{Bytes: projectID, Valid: true}
	row, err := s.db.Queries().WithTx(tx).GetProjectByID(ctx, projectUUID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			s.logger.WithField("projectID", projectID.String()).Warn("Project not found")
			return nil, errors.New("project not found")
		}
		s.logger.WithError(err).WithField("projectID", projectID.String()).Error("Failed to query project")
		return nil, err
	}

	p := s.convertSQLCProjectToModel(row)

	if err := tx.Commit(ctx); err != nil {
		s.logger.WithError(err).Error("Failed to commit transaction")
		return nil, err
	}

	s.logger.WithField("projectID", projectID.String()).Info("Retrieved project successfully")
	return &p, nil
}

// CreateProject creates a new project
func (s *ProjectService) CreateProject(ctx context.Context, params CreateProjectParams) (*models.Project, error) {
	s.logger.WithFields(map[string]interface{}{
		"displayName": params.DisplayName,
		"ownerID":     params.OwnerID,
	}).Info("Creating new project")

	// Marshal metadata to JSON
	metadataJSON, err := json.Marshal(params.Metadata)
	if err != nil {
		s.logger.WithError(err).Error("Failed to marshal project metadata")
		return nil, err
	}

	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		s.logger.WithError(err).Error("Failed to begin transaction")
		return nil, err
	}
	defer tx.Rollback(ctx)

	// Set default platform ID if not provided
	platformID := uuid.New()
	if params.PlatformID != nil {
		platformID = *params.PlatformID
	}

	var externalID pgtype.Text
	if params.ExternalID != nil {
		externalID = pgtype.Text{String: *params.ExternalID, Valid: true}
	}

	createParams := sqlc.CreateProjectParams{
		DisplayName:     params.DisplayName,
		OwnerID:         params.OwnerID,
		PlatformID:      pgtype.UUID{Bytes: platformID, Valid: true},
		NotifyStatus:    pgtype.Text{String: params.NotifyStatus, Valid: true},
		ExternalID:      externalID,
		ReleasesEnabled: pgtype.Bool{Bool: params.ReleasesEnabled, Valid: true},
		Metadata:        metadataJSON,
	}

	row, err := s.db.Queries().WithTx(tx).CreateProject(ctx, createParams)
	if err != nil {
		s.logger.WithError(err).WithField("ownerID", params.OwnerID).Error("Failed to create project")
		return nil, err
	}

	p := s.convertSQLCProjectToModel(row)

	if err := tx.Commit(ctx); err != nil {
		s.logger.WithError(err).Error("Failed to commit transaction")
		return nil, err
	}

	s.logger.WithFields(map[string]interface{}{
		"projectID":   p.ID.String(),
		"displayName": p.DisplayName,
		"ownerID":     p.OwnerID,
	}).Info("Project created successfully")

	return &p, nil
}

// UpdateProject updates an existing project
func (s *ProjectService) UpdateProject(ctx context.Context, projectID uuid.UUID, params UpdateProjectParams) (*models.Project, error) {
	s.logger.WithFields(map[string]interface{}{
		"projectID":   projectID.String(),
		"displayName": params.DisplayName,
	}).Info("Updating project")

	// Marshal metadata to JSON
	metadataJSON, err := json.Marshal(params.Metadata)
	if err != nil {
		s.logger.WithError(err).Error("Failed to marshal project metadata")
		return nil, err
	}

	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		s.logger.WithError(err).Error("Failed to begin transaction")
		return nil, err
	}
	defer tx.Rollback(ctx)

	var externalID pgtype.Text
	if params.ExternalID != nil {
		externalID = pgtype.Text{String: *params.ExternalID, Valid: true}
	}

	updateParams := sqlc.UpdateProjectParams{
		ID:              pgtype.UUID{Bytes: projectID, Valid: true},
		DisplayName:     params.DisplayName,
		NotifyStatus:    pgtype.Text{String: params.NotifyStatus, Valid: true},
		ExternalID:      externalID,
		ReleasesEnabled: pgtype.Bool{Bool: params.ReleasesEnabled, Valid: true},
		Metadata:        metadataJSON,
	}

	row, err := s.db.Queries().WithTx(tx).UpdateProject(ctx, updateParams)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			s.logger.WithField("projectID", projectID.String()).Warn("Project not found for update")
			return nil, errors.New("project not found")
		}
		s.logger.WithError(err).WithField("projectID", projectID.String()).Error("Failed to update project")
		return nil, err
	}

	p := s.convertSQLCProjectToModel(row)

	if err := tx.Commit(ctx); err != nil {
		s.logger.WithError(err).Error("Failed to commit transaction")
		return nil, err
	}

	s.logger.WithField("projectID", projectID.String()).Info("Project updated successfully")
	return &p, nil
}

// DeleteProject deletes a project by ID
func (s *ProjectService) DeleteProject(ctx context.Context, projectID uuid.UUID) error {
	s.logger.WithField("projectID", projectID.String()).Info("Deleting project")

	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		s.logger.WithError(err).Error("Failed to begin transaction")
		return err
	}
	defer tx.Rollback(ctx)

	projectUUID := pgtype.UUID{Bytes: projectID, Valid: true}
	err = s.db.Queries().WithTx(tx).DeleteProject(ctx, projectUUID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			s.logger.WithField("projectID", projectID.String()).Warn("Project not found for deletion")
			return errors.New("project not found")
		}
		s.logger.WithError(err).WithField("projectID", projectID.String()).Error("Failed to delete project")
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		s.logger.WithError(err).Error("Failed to commit transaction")
		return err
	}

	s.logger.WithField("projectID", projectID.String()).Info("Project deleted successfully")
	return nil
}

// GetProjectUsage retrieves project usage statistics
func (s *ProjectService) GetProjectUsage(ctx context.Context, projectID uuid.UUID) (*models.ProjectUsage, error) {
	s.logger.WithField("projectID", projectID.String()).Info("Getting project usage statistics")

	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		s.logger.WithError(err).Error("Failed to begin transaction")
		return nil, err
	}
	defer tx.Rollback(ctx)

	projectUUID := pgtype.UUID{Bytes: projectID, Valid: true}
	row, err := s.db.Queries().WithTx(tx).GetProjectUsage(ctx, projectUUID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			s.logger.WithField("projectID", projectID.String()).Warn("Project not found for usage statistics")
			return nil, errors.New("project not found")
		}
		s.logger.WithError(err).WithField("projectID", projectID.String()).Error("Failed to get project usage")
		return nil, err
	}

	usage := &models.ProjectUsage{
		ID:              uuid.UUID(row.ID.Bytes),
		DisplayName:     row.DisplayName,
		FlowCount:       row.FlowCount,
		FlowRunCount:    row.FlowRunCount,
		ConnectionCount: row.ConnectionCount,
	}

	if err := tx.Commit(ctx); err != nil {
		s.logger.WithError(err).Error("Failed to commit transaction")
		return nil, err
	}

	s.logger.WithField("projectID", projectID.String()).Info("Retrieved project usage successfully")
	return usage, nil
}

// convertSQLCProjectToModel converts a SQLC project row to a models.Project
func (s *ProjectService) convertSQLCProjectToModel(row sqlc.Project) models.Project {
	var p models.Project
	p.ID = uuid.UUID(row.ID.Bytes)
	p.DisplayName = row.DisplayName
	p.OwnerID = row.OwnerID
	p.PlatformID = uuid.UUID(row.PlatformID.Bytes)

	if row.NotifyStatus.Valid {
		p.NotifyStatus = row.NotifyStatus.String
	}

	if row.ExternalID.Valid {
		p.ExternalID = &row.ExternalID.String
	}

	p.ReleasesEnabled = row.ReleasesEnabled.Bool
	p.CreatedAt = row.CreatedAt.Time
	p.UpdatedAt = row.UpdatedAt.Time

	// Parse metadata JSON
	if len(row.Metadata) > 0 {
		if err := json.Unmarshal(row.Metadata, &p.Metadata); err != nil {
			s.logger.WithError(err).Error("Failed to unmarshal project metadata")
			p.Metadata = make(map[string]interface{})
		}
	} else {
		p.Metadata = make(map[string]interface{})
	}

	return p
}
