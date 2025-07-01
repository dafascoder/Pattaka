package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"backend/internal/logger"
	"backend/internal/middleware"
	"backend/internal/models"
	"backend/internal/services"
	"backend/utils"

	"github.com/google/uuid"
)

type AgentHandler struct {
	agentService *services.AgentService
	logger       *logger.Logger
}

func NewAgentHandler(agentService *services.AgentService) *AgentHandler {
	return &AgentHandler{
		agentService: agentService,
		logger:       logger.Get(),
	}
}

func (h *AgentHandler) HandleAgents(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	switch r.Method {
	case "GET":
		h.getAgents(w, r)
	case "POST":
		h.createAgent(w, r)
	default:
		h.logger.WithFields(map[string]interface{}{
			"method": r.Method,
			"path":   r.URL.Path,
		}).Warn("Method not allowed")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}

	h.logger.LogServiceOperation("agent_handler", "handle_agents", time.Since(start), nil)
}

func (h *AgentHandler) HandleAgent(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	// Extract agent ID from URL path
	path := strings.TrimPrefix(r.URL.Path, "/api/agents/")
	agentIDStr := strings.Split(path, "/")[0]

	if agentIDStr == "" {
		h.logger.Error("Agent ID missing from request path")
		http.Error(w, "Agent ID required", http.StatusBadRequest)
		return
	}

	agentID, err := uuid.Parse(agentIDStr)
	if err != nil {
		h.logger.WithError(err).WithField("agent_id_str", agentIDStr).Error("Invalid agent ID format")
		utils.RespondWithError(w, "Invalid agent ID", http.StatusBadRequest)
		return
	}

	h.logger.WithField("agent_id", agentID).Debug("Processing agent request")

	switch r.Method {
	case "GET":
		h.getAgent(w, r, agentID)
	case "PUT":
		h.updateAgent(w, r, agentID)
	case "DELETE":
		h.deleteAgent(w, r, agentID)
	default:
		h.logger.WithFields(map[string]interface{}{
			"method":   r.Method,
			"path":     r.URL.Path,
			"agent_id": agentID,
		}).Warn("Method not allowed")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}

	h.logger.LogServiceOperation("agent_handler", "handle_agent", time.Since(start), nil)
}

func (h *AgentHandler) getAgents(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	// Get user ID from authentication context
	userID := ""
	if authContext, ok := middleware.GetAuthContext(r); ok {
		userID = authContext.User.ID
		h.logger.WithFields(map[string]interface{}{
			"user_id":    userID,
			"user_email": authContext.User.Email,
		}).Info("Authenticated user fetching agents")
	} else {
		h.logger.Warn("Using demo user for agents request")
	}

	agents, err := h.agentService.GetAgentsByUserID(r.Context(), userID)
	if err != nil {
		h.logger.WithError(err).WithField("user_id", userID).Error("Failed to fetch agents")
		h.logger.LogServiceOperation("agent_service", "get_agents_by_user_id", time.Since(start), err)
		utils.RespondWithError(w, "Failed to fetch agents", http.StatusInternalServerError)
		return
	}

	h.logger.WithFields(map[string]interface{}{
		"user_id":     userID,
		"agent_count": len(agents),
	}).Info("Agents fetched successfully")

	h.logger.LogServiceOperation("agent_service", "get_agents_by_user_id", time.Since(start), nil)
	utils.RespondWithJSON(w, agents)
}

func (h *AgentHandler) createAgent(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	var agent models.Agent
	if err := json.NewDecoder(r.Body).Decode(&agent); err != nil {
		h.logger.WithError(err).Error("Failed to decode agent JSON payload")
		utils.RespondWithError(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	// Get user ID from authentication context
	userID := ""
	if authContext, ok := middleware.GetAuthContext(r); ok {
		userID = authContext.User.ID
		h.logger.WithFields(map[string]interface{}{
			"user_id":    userID,
			"user_email": authContext.User.Email,
			"agent_name": agent.Name,
		}).Info("Authenticated user creating agent")
	} else {
		h.logger.WithField("agent_name", agent.Name).Warn("Using demo user for agent creation")
	}
	
	agent.UserID = userID

	// Basic validation
	if agent.Name == "" {
		h.logger.WithField("user_id", userID).Error("Agent name is required")
		utils.RespondWithError(w, "Agent name is required", http.StatusBadRequest)
		return
	}

	// Set default status if not provided
	if agent.Status == "" {
		agent.Status = "draft"
	}

	// Initialize config if nil
	if agent.Config == nil {
		agent.Config = make(map[string]interface{})
	}

	createdAgent, err := h.agentService.CreateAgent(r.Context(), agent)
	if err != nil {
		h.logger.WithError(err).WithFields(map[string]interface{}{
			"user_id":    userID,
			"agent_name": agent.Name,
		}).Error("Failed to create agent")
		h.logger.LogServiceOperation("agent_service", "create_agent", time.Since(start), err)
		utils.RespondWithError(w, "Failed to create agent", http.StatusInternalServerError)
		return
	}

	h.logger.WithFields(map[string]interface{}{
		"user_id":    userID,
		"agent_id":   createdAgent.ID,
		"agent_name": createdAgent.Name,
	}).Info("Agent created successfully")

	h.logger.LogServiceOperation("agent_service", "create_agent", time.Since(start), nil)
	utils.RespondWithJSON(w, createdAgent)
}

func (h *AgentHandler) getAgent(w http.ResponseWriter, r *http.Request, agentID uuid.UUID) {
	start := time.Now()

	// Get user ID for logging
	userID := ""
	if authContext, ok := middleware.GetAuthContext(r); ok {
		userID = authContext.User.ID
	} else {
		h.logger.Warn("No auth context found for agent creation")
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	agent, err := h.agentService.GetAgentByID(r.Context(), agentID)
	if err != nil {
		h.logger.WithError(err).WithFields(map[string]interface{}{
			"user_id":  userID,
			"agent_id": agentID,
		}).Error("Failed to fetch agent")
		h.logger.LogServiceOperation("agent_service", "get_agent_by_id", time.Since(start), err)
		utils.RespondWithError(w, "Agent not found", http.StatusNotFound)
		return
	}

	h.logger.WithFields(map[string]interface{}{
		"user_id":    userID,
		"agent_id":   agentID,
		"agent_name": agent.Name,
	}).Info("Agent fetched successfully")

	h.logger.LogServiceOperation("agent_service", "get_agent_by_id", time.Since(start), nil)
	utils.RespondWithJSON(w, agent)
}

func (h *AgentHandler) updateAgent(w http.ResponseWriter, r *http.Request, agentID uuid.UUID) {
	start := time.Now()

	var agent models.Agent
	if err := json.NewDecoder(r.Body).Decode(&agent); err != nil {
		h.logger.WithError(err).WithField("agent_id", agentID).Error("Failed to decode agent update payload")
		utils.RespondWithError(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	// Get user ID for logging
	userID := ""
	if authContext, ok := middleware.GetAuthContext(r); ok {
		userID = authContext.User.ID
	} else {
		h.logger.Warn("No auth context found for agent update")
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	updatedAgent, err := h.agentService.UpdateAgent(r.Context(), agentID, agent)
	if err != nil {
		h.logger.WithError(err).WithFields(map[string]interface{}{
			"user_id":  userID,
			"agent_id": agentID,
		}).Error("Failed to update agent")
		h.logger.LogServiceOperation("agent_service", "update_agent", time.Since(start), err)
		utils.RespondWithError(w, "Failed to update agent", http.StatusInternalServerError)
		return
	}

	h.logger.WithFields(map[string]interface{}{
		"user_id":    userID,
		"agent_id":   agentID,
		"agent_name": updatedAgent.Name,
	}).Info("Agent updated successfully")

	h.logger.LogServiceOperation("agent_service", "update_agent", time.Since(start), nil)
	utils.RespondWithJSON(w, updatedAgent)
}

func (h *AgentHandler) deleteAgent(w http.ResponseWriter, r *http.Request, agentID uuid.UUID) {
	start := time.Now()

	// Get user ID for logging
	userID := ""
	if authContext, ok := middleware.GetAuthContext(r); ok {
		userID = authContext.User.ID
	} else {
		h.logger.Warn("No auth context found for agent deletion")
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	err := h.agentService.DeleteAgent(r.Context(), agentID)
	if err != nil {
		h.logger.WithError(err).WithFields(map[string]interface{}{
			"user_id":  userID,
			"agent_id": agentID,
		}).Error("Failed to delete agent")
		h.logger.LogServiceOperation("agent_service", "delete_agent", time.Since(start), err)
		utils.RespondWithError(w, "Failed to delete agent", http.StatusInternalServerError)
		return
	}

	h.logger.WithFields(map[string]interface{}{
		"user_id":  userID,
		"agent_id": agentID,
	}).Info("Agent deleted successfully")

	h.logger.LogServiceOperation("agent_service", "delete_agent", time.Since(start), nil)
	utils.RespondWithJSON(w, map[string]string{"message": "Agent deleted successfully"})
}
