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

type IntegrationService struct {
	db *db.DB
}

func NewIntegrationService(db *db.DB) *IntegrationService {
	return &IntegrationService{db: db}
}

func (s *IntegrationService) GetIntegration(ctx context.Context, integrationID string) (models.Integration, error) {
	id, err := uuid.Parse(integrationID)
	if err != nil {
		return models.Integration{}, err
	}

	integration, err := s.db.Queries().GetIntegrationByID(ctx, pgtype.UUID{Bytes: id, Valid: true})
	if err != nil {
		return models.Integration{}, err
	}

	return s.convertDBIntegrationToModel(integration)
}

func (s *IntegrationService) CreateIntegration(ctx context.Context, integration models.Integration) (models.Integration, error) {
	configJSON, err := json.Marshal(integration.Config)
	if err != nil {
		return models.Integration{}, err
	}

	credentialsJSON, err := json.Marshal(integration.Credentials)
	if err != nil {
		return models.Integration{}, err
	}

	params := sqlcdb.CreateIntegrationParams{
		Name:        integration.Name,
		Type:        integration.Type,
		Config:      configJSON,
		Credentials: credentialsJSON,
		UserID:      integration.UserID,
		IsActive:    pgtype.Bool{Bool: integration.IsActive, Valid: true},
	}

	createdIntegration, err := s.db.Queries().CreateIntegration(ctx, params)
	if err != nil {
		return models.Integration{}, err
	}

	return s.convertDBCreateIntegrationToModel(createdIntegration)
}

func (s *IntegrationService) UpdateIntegration(ctx context.Context, integrationID string, integration models.Integration) (models.Integration, error) {
	id, err := uuid.Parse(integrationID)
	if err != nil {
		return models.Integration{}, err
	}

	configJSON, err := json.Marshal(integration.Config)
	if err != nil {
		return models.Integration{}, err
	}

	credentialsJSON, err := json.Marshal(integration.Credentials)
	if err != nil {
		return models.Integration{}, err
	}

	params := sqlcdb.UpdateIntegrationParams{
		ID:          pgtype.UUID{Bytes: id, Valid: true},
		Name:        integration.Name,
		Type:        integration.Type,
		Config:      configJSON,
		Credentials: credentialsJSON,
		IsActive:    pgtype.Bool{Bool: integration.IsActive, Valid: true},
	}

	updatedIntegration, err := s.db.Queries().UpdateIntegration(ctx, params)
	if err != nil {
		return models.Integration{}, err
	}

	return s.convertDBUpdateIntegrationToModel(updatedIntegration)
}

func (s *IntegrationService) DeleteIntegration(ctx context.Context, integrationID string) error {
	id, err := uuid.Parse(integrationID)
	if err != nil {
		return err
	}

	return s.db.Queries().DeleteIntegration(ctx, pgtype.UUID{Bytes: id, Valid: true})
}

func (s *IntegrationService) GetIntegrations(ctx context.Context, userID string) ([]models.Integration, error) {
	integrations, err := s.db.Queries().GetIntegrationsByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	result := make([]models.Integration, len(integrations))
	for i, integration := range integrations {
		convertedIntegration, err := s.convertDBGetIntegrationToModel(integration)
		if err != nil {
			return nil, err
		}
		result[i] = convertedIntegration
	}
	return result, nil
}

func (s *IntegrationService) convertDBIntegrationToModel(dbIntegration sqlcdb.Integration) (models.Integration, error) {
	var config map[string]interface{}
	if err := json.Unmarshal(dbIntegration.Config, &config); err != nil {
		return models.Integration{}, err
	}

	var credentials map[string]interface{}
	if err := json.Unmarshal(dbIntegration.Credentials, &credentials); err != nil {
		return models.Integration{}, err
	}

	// Convert pgtype.UUID to uuid.UUID
	var id uuid.UUID
	if dbIntegration.ID.Valid {
		id = dbIntegration.ID.Bytes
	}

	// Convert pgtype.Bool to bool
	isActive := false
	if dbIntegration.IsActive.Valid {
		isActive = dbIntegration.IsActive.Bool
	}

	return models.Integration{
		ID:          id,
		Name:        dbIntegration.Name,
		Type:        dbIntegration.Type,
		Config:      config,
		Credentials: credentials,
		UserID:      dbIntegration.UserID,
		IsActive:    isActive,
		CreatedAt:   dbIntegration.CreatedAt.Time,
		UpdatedAt:   dbIntegration.UpdatedAt.Time,
	}, nil
}

func (s *IntegrationService) convertDBCreateIntegrationToModel(dbIntegration sqlcdb.CreateIntegrationRow) (models.Integration, error) {
	var config map[string]interface{}
	if err := json.Unmarshal(dbIntegration.Config, &config); err != nil {
		return models.Integration{}, err
	}

	// Convert pgtype.UUID to uuid.UUID
	var id uuid.UUID
	if dbIntegration.ID.Valid {
		id = dbIntegration.ID.Bytes
	}

	// Convert pgtype.Bool to bool
	isActive := false
	if dbIntegration.IsActive.Valid {
		isActive = dbIntegration.IsActive.Bool
	}

	return models.Integration{
		ID:          id,
		Name:        dbIntegration.Name,
		Type:        dbIntegration.Type,
		Config:      config,
		Credentials: map[string]interface{}{}, // Not returned in create response
		UserID:      dbIntegration.UserID,
		IsActive:    isActive,
		CreatedAt:   dbIntegration.CreatedAt.Time,
		UpdatedAt:   dbIntegration.UpdatedAt.Time,
	}, nil
}

func (s *IntegrationService) convertDBUpdateIntegrationToModel(dbIntegration sqlcdb.UpdateIntegrationRow) (models.Integration, error) {
	var config map[string]interface{}
	if err := json.Unmarshal(dbIntegration.Config, &config); err != nil {
		return models.Integration{}, err
	}

	// Convert pgtype.UUID to uuid.UUID
	var id uuid.UUID
	if dbIntegration.ID.Valid {
		id = dbIntegration.ID.Bytes
	}

	// Convert pgtype.Bool to bool
	isActive := false
	if dbIntegration.IsActive.Valid {
		isActive = dbIntegration.IsActive.Bool
	}

	return models.Integration{
		ID:          id,
		Name:        dbIntegration.Name,
		Type:        dbIntegration.Type,
		Config:      config,
		Credentials: map[string]interface{}{}, // Not returned in update response
		UserID:      dbIntegration.UserID,
		IsActive:    isActive,
		CreatedAt:   dbIntegration.CreatedAt.Time,
		UpdatedAt:   dbIntegration.UpdatedAt.Time,
	}, nil
}

func (s *IntegrationService) convertDBGetIntegrationToModel(dbIntegration sqlcdb.GetIntegrationsByUserIDRow) (models.Integration, error) {
	var config map[string]interface{}
	if err := json.Unmarshal(dbIntegration.Config, &config); err != nil {
		return models.Integration{}, err
	}

	// Convert pgtype.UUID to uuid.UUID
	var id uuid.UUID
	if dbIntegration.ID.Valid {
		id = dbIntegration.ID.Bytes
	}

	// Convert pgtype.Bool to bool
	isActive := false
	if dbIntegration.IsActive.Valid {
		isActive = dbIntegration.IsActive.Bool
	}

	return models.Integration{
		ID:          id,
		Name:        dbIntegration.Name,
		Type:        dbIntegration.Type,
		Config:      config,
		Credentials: map[string]interface{}{}, // Not returned in list response for security
		UserID:      dbIntegration.UserID,
		IsActive:    isActive,
		CreatedAt:   dbIntegration.CreatedAt.Time,
		UpdatedAt:   dbIntegration.UpdatedAt.Time,
	}, nil
}
