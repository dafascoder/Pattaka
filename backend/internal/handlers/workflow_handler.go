package handlers

import (
	"backend/internal/logger"
	"backend/internal/middleware"
	"backend/internal/models"
	"backend/internal/services"
	"backend/utils"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/google/uuid"
)

type WorkflowHandler struct {
	workflowService *services.WorkflowService
	logger          *logger.Logger
}

func NewWorkflowHandler(workflowService *services.WorkflowService) *WorkflowHandler {
	return &WorkflowHandler{workflowService: workflowService, logger: logger.Get()}
}

// GetWorkflows handles GET /workflows
func (h *WorkflowHandler) GetWorkflows(w http.ResponseWriter, r *http.Request) {
	// Get user ID from auth context using the middleware helper
	authContext, ok := middleware.GetAuthContext(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	workflows, err := h.workflowService.GetWorkflows(r.Context(), authContext.User.ID)
	if err != nil {
		h.logger.WithError(err).Error("Failed to get workflows")
		utils.RespondWithError(w, "Failed to retrieve workflows", http.StatusInternalServerError)
		return
	}

	utils.RespondWithJSON(w, workflows)
}

// GetWorkflow handles GET /workflows/{id}
func (h *WorkflowHandler) GetWorkflow(w http.ResponseWriter, r *http.Request) {
	// Extract workflow ID from URL path
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 || pathParts[2] == "" {
		utils.RespondWithError(w, "Workflow ID is required", http.StatusBadRequest)
		return
	}
	workflowID := pathParts[2]

	workflow, err := h.workflowService.GetWorkflow(r.Context(), workflowID)
	if err != nil {
		h.logger.WithField("workflowID", workflowID).WithError(err).Error("Failed to get workflow")
		utils.RespondWithError(w, "Workflow not found", http.StatusNotFound)
		return
	}

	utils.RespondWithJSON(w, workflow)
}

// CreateWorkflowRequest represents the request body for creating a workflow
type CreateWorkflowRequest struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Definition  map[string]interface{} `json:"definition"`
	IsActive    bool                   `json:"is_active"`
}

// CreateWorkflow handles POST /workflows
func (h *WorkflowHandler) CreateWorkflow(w http.ResponseWriter, r *http.Request) {
	// Get the user id from the auth context
	authContext, ok := middleware.GetAuthContext(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req CreateWorkflowRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.WithError(err).Error("Failed to decode request body")
		utils.RespondWithError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Name == "" {
		utils.RespondWithError(w, "Workflow name is required", http.StatusBadRequest)
		return
	}

	// Create workflow model from request
	workflow := models.Workflow{
		ID:          uuid.New(),
		UserID:      authContext.User.ID,
		Name:        req.Name,
		Description: req.Description,
		Definition:  req.Definition,
		Version:     1, // Initial version
		IsActive:    req.IsActive,
	}

	// Set default values
	if workflow.Definition == nil {
		workflow.Definition = make(map[string]interface{})
	}

	log.Println("workflow", workflow)

	createdWorkflow, err := h.workflowService.CreateWorkflow(r.Context(), workflow)
	if err != nil {
		h.logger.WithError(err).Error("Failed to create workflow")
		utils.RespondWithError(w, "Failed to create workflow", http.StatusInternalServerError)
		return
	}

	utils.RespondWithJSON(w, createdWorkflow)
}

// UpdateWorkflow handles PUT /workflows/{id}
func (h *WorkflowHandler) UpdateWorkflow(w http.ResponseWriter, r *http.Request) {
	// Extract workflow ID from URL path
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 || pathParts[2] == "" {
		utils.RespondWithError(w, "Workflow ID is required", http.StatusBadRequest)
		return
	}
	workflowID := pathParts[2]

	var workflow models.Workflow
	if err := json.NewDecoder(r.Body).Decode(&workflow); err != nil {
		utils.RespondWithError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if workflow.Name == "" {
		utils.RespondWithError(w, "Workflow name is required", http.StatusBadRequest)
		return
	}

	updatedWorkflow, err := h.workflowService.UpdateWorkflow(r.Context(), workflowID, workflow)
	if err != nil {
		h.logger.WithField("workflowID", workflowID).WithError(err).Error("Failed to update workflow")
		utils.RespondWithError(w, "Failed to update workflow", http.StatusInternalServerError)
		return
	}

	utils.RespondWithJSON(w, updatedWorkflow)
}

// DeleteWorkflow handles DELETE /workflows/{id}
func (h *WorkflowHandler) DeleteWorkflow(w http.ResponseWriter, r *http.Request) {
	// Extract workflow ID from URL path
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 || pathParts[2] == "" {
		utils.RespondWithError(w, "Workflow ID is required", http.StatusBadRequest)
		return
	}
	workflowID := pathParts[2]

	err := h.workflowService.DeleteWorkflow(r.Context(), workflowID)
	if err != nil {
		h.logger.WithField("workflowID", workflowID).WithError(err).Error("Failed to delete workflow")
		utils.RespondWithError(w, "Failed to delete workflow", http.StatusInternalServerError)
		return
	}

	utils.RespondWithJSON(w, map[string]string{"message": "Workflow deleted successfully"})
}

// GetWorkflowsByAgent handles GET /agents/{agentId}/workflows
func (h *WorkflowHandler) GetWorkflowsByAgent(w http.ResponseWriter, r *http.Request) {
	// Extract agent ID from URL path
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 4 || pathParts[2] == "" {
		utils.RespondWithError(w, "Agent ID is required", http.StatusBadRequest)
		return
	}
	agentID := pathParts[2]

	workflows, err := h.workflowService.GetWorkflowsByAgentID(r.Context(), agentID)
	if err != nil {
		h.logger.WithField("agentID", agentID).WithError(err).Error("Failed to get workflows by agent")
		utils.RespondWithError(w, "Failed to retrieve workflows", http.StatusInternalServerError)
		return
	}

	utils.RespondWithJSON(w, workflows)
}
