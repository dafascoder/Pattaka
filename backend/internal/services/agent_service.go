package services

import (
	"context"
	"encoding/json"

	"backend/internal/db"
	sqlcdb "backend/internal/db/sqlc"
	"backend/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type AgentService struct {
	db *db.DB
}

func NewAgentService(database *db.DB) *AgentService {
	return &AgentService{
		db: database,
	}
}

func (s *AgentService) GetAgentsByUserID(ctx context.Context, userID string) ([]models.Agent, error) {
	dbAgents, err := s.db.Queries().GetAgentsByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	agents := make([]models.Agent, len(dbAgents))
	for i, dbAgent := range dbAgents {
		agent, err := s.convertDBAgentToModel(dbAgent)
		if err != nil {
			return nil, err
		}
		agents[i] = agent
	}

	return agents, nil
}

func (s *AgentService) GetAgentByID(ctx context.Context, id uuid.UUID) (models.Agent, error) {
	pgUUID := pgtype.UUID{Bytes: id, Valid: true}
	dbAgent, err := s.db.Queries().GetAgentByID(ctx, pgUUID)
	if err != nil {
		return models.Agent{}, err
	}

	return s.convertDBAgentToModel(dbAgent)
}

func (s *AgentService) CreateAgent(ctx context.Context, agent models.Agent) (models.Agent, error) {
	configJSON, err := json.Marshal(agent.Config)
	if err != nil {
		return models.Agent{}, err
	}

	params := sqlcdb.CreateAgentParams{
		Name:        agent.Name,
		Description: pgtype.Text{String: agent.Description, Valid: agent.Description != ""},
		Config:      configJSON,
		Status:      pgtype.Text{String: agent.Status, Valid: agent.Status != ""},
		UserID:      agent.UserID,
	}

	dbAgent, err := s.db.Queries().CreateAgent(ctx, params)
	if err != nil {
		return models.Agent{}, err
	}

	return s.convertDBAgentToModel(dbAgent)
}

func (s *AgentService) UpdateAgent(ctx context.Context, id uuid.UUID, agent models.Agent) (models.Agent, error) {
	configJSON, err := json.Marshal(agent.Config)
	if err != nil {
		return models.Agent{}, err
	}

	pgUUID := pgtype.UUID{Bytes: id, Valid: true}
	params := sqlcdb.UpdateAgentParams{
		ID:          pgUUID,
		Name:        agent.Name,
		Description: pgtype.Text{String: agent.Description, Valid: agent.Description != ""},
		Config:      configJSON,
		Status:      pgtype.Text{String: agent.Status, Valid: agent.Status != ""},
	}

	dbAgent, err := s.db.Queries().UpdateAgent(ctx, params)
	if err != nil {
		return models.Agent{}, err
	}

	return s.convertDBAgentToModel(dbAgent)
}

func (s *AgentService) DeleteAgent(ctx context.Context, id uuid.UUID) error {
	pgUUID := pgtype.UUID{Bytes: id, Valid: true}
	return s.db.Queries().DeleteAgent(ctx, pgUUID)
}

func (s *AgentService) convertDBAgentToModel(dbAgent sqlcdb.Agent) (models.Agent, error) {
	var config map[string]interface{}
	if err := json.Unmarshal(dbAgent.Config, &config); err != nil {
		return models.Agent{}, err
	}

	// Convert pgtype.UUID to uuid.UUID
	var id uuid.UUID
	if dbAgent.ID.Valid {
		id = dbAgent.ID.Bytes
	}

	// Convert pgtype.Text to string
	description := ""
	if dbAgent.Description.Valid {
		description = dbAgent.Description.String
	}

	status := ""
	if dbAgent.Status.Valid {
		status = dbAgent.Status.String
	}

	return models.Agent{
		ID:          id,
		Name:        dbAgent.Name,
		Description: description,
		Config:      config,
		Status:      status,
		UserID:      dbAgent.UserID,
		CreatedAt:   dbAgent.CreatedAt.Time,
		UpdatedAt:   dbAgent.UpdatedAt.Time,
	}, nil
}
