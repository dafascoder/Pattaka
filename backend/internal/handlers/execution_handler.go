package handlers

import (
	"backend/internal/logger"
	"backend/internal/models"
	"backend/internal/services"
	"backend/utils"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

type ExecutionHandler struct {
	executionService *services.ExecutionService
	logger           *logger.Logger
}

func NewExecutionHandler(executionService *services.ExecutionService) *ExecutionHandler {
	return &ExecutionHandler{executionService: executionService, logger: logger.Get()}
}

// GetExecutions handles GET /executions
func (h *ExecutionHandler) GetExecutions(w http.ResponseWriter, r *http.Request) {
	// Extract user ID from context (assuming it's set by auth middleware)
	userID := r.Context().Value("userID")
	if userID == nil {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse limit from query parameters
	limitStr := r.URL.Query().Get("limit")
	limit := int32(50) // Default limit
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = int32(parsedLimit)
		}
	}

	executions, err := h.executionService.GetExecutions(r.Context(), userID.(string), limit)
	if err != nil {
		h.logger.WithError(err).Error("Failed to get executions")
		utils.RespondWithError(w, "Failed to retrieve executions", http.StatusInternalServerError)
		return
	}

	utils.RespondWithJSON(w, executions)
}

// GetExecution handles GET /executions/{id}
func (h *ExecutionHandler) GetExecution(w http.ResponseWriter, r *http.Request) {
	// Extract execution ID from URL path
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 || pathParts[2] == "" {
		utils.RespondWithError(w, "Execution ID is required", http.StatusBadRequest)
		return
	}
	executionID := pathParts[2]

	execution, err := h.executionService.GetExecution(r.Context(), executionID)
	if err != nil {
		h.logger.WithField("executionID", executionID).WithError(err).Error("Failed to get execution")
		utils.RespondWithError(w, "Execution not found", http.StatusNotFound)
		return
	}

	utils.RespondWithJSON(w, execution)
}

// CreateExecution handles POST /executions
func (h *ExecutionHandler) CreateExecution(w http.ResponseWriter, r *http.Request) {
	var execution models.Execution
	if err := json.NewDecoder(r.Body).Decode(&execution); err != nil {
		utils.RespondWithError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Generate new UUID for the execution
	execution.ID = uuid.New()

	// Validate required fields
	if execution.WorkflowID == uuid.Nil {
		utils.RespondWithError(w, "Workflow ID is required", http.StatusBadRequest)
		return
	}

	if execution.AgentID == uuid.Nil {
		utils.RespondWithError(w, "Agent ID is required", http.StatusBadRequest)
		return
	}

	// Set default values
	if execution.Status == "" {
		execution.Status = "pending"
	}
	if execution.InputData == nil {
		execution.InputData = make(map[string]interface{})
	}
	if execution.StartedAt.IsZero() {
		execution.StartedAt = time.Now()
	}

	createdExecution, err := h.executionService.CreateExecution(r.Context(), execution)
	if err != nil {
		h.logger.WithError(err).Error("Failed to create execution")
		utils.RespondWithError(w, "Failed to create execution", http.StatusInternalServerError)
		return
	}

	utils.RespondWithJSON(w, createdExecution)
}

// UpdateExecutionStatus handles PUT /executions/{id}/status
func (h *ExecutionHandler) UpdateExecutionStatus(w http.ResponseWriter, r *http.Request) {
	// Extract execution ID from URL path
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 || pathParts[2] == "" {
		utils.RespondWithError(w, "Execution ID is required", http.StatusBadRequest)
		return
	}
	executionID := pathParts[2]

	var updateData struct {
		Status          string                 `json:"status"`
		OutputData      map[string]interface{} `json:"output_data"`
		CompletedAt     *time.Time             `json:"completed_at"`
		ExecutionTimeMs int32                  `json:"execution_time_ms"`
		ErrorMessage    string                 `json:"error_message"`
	}

	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		utils.RespondWithError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if updateData.Status == "" {
		utils.RespondWithError(w, "Status is required", http.StatusBadRequest)
		return
	}

	// Set default values
	if updateData.OutputData == nil {
		updateData.OutputData = make(map[string]interface{})
	}

	updatedExecution, err := h.executionService.UpdateExecutionStatus(
		r.Context(),
		executionID,
		updateData.Status,
		updateData.OutputData,
		updateData.CompletedAt,
		updateData.ExecutionTimeMs,
		updateData.ErrorMessage,
	)
	if err != nil {
		h.logger.WithField("executionID", executionID).WithError(err).Error("Failed to update execution status")
		utils.RespondWithError(w, "Failed to update execution status", http.StatusInternalServerError)
		return
	}

	utils.RespondWithJSON(w, updatedExecution)
}

// GetExecutionsByWorkflow handles GET /workflows/{workflowId}/executions
func (h *ExecutionHandler) GetExecutionsByWorkflow(w http.ResponseWriter, r *http.Request) {
	// Extract workflow ID from URL path
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 4 || pathParts[2] == "" {
		utils.RespondWithError(w, "Workflow ID is required", http.StatusBadRequest)
		return
	}
	workflowID := pathParts[2]

	// Parse limit from query parameters
	limitStr := r.URL.Query().Get("limit")
	limit := int32(50) // Default limit
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = int32(parsedLimit)
		}
	}

	executions, err := h.executionService.GetExecutionsByWorkflowID(r.Context(), workflowID, limit)
	if err != nil {
		h.logger.WithField("workflowID", workflowID).WithError(err).Error("Failed to get executions by workflow")
		utils.RespondWithError(w, "Failed to retrieve executions", http.StatusInternalServerError)
		return
	}

	utils.RespondWithJSON(w, executions)
}

// GetExecutionsByAgent handles GET /agents/{agentId}/executions
func (h *ExecutionHandler) GetExecutionsByAgent(w http.ResponseWriter, r *http.Request) {
	// Extract agent ID from URL path
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 4 || pathParts[2] == "" {
		utils.RespondWithError(w, "Agent ID is required", http.StatusBadRequest)
		return
	}
	agentID := pathParts[2]

	// Parse limit from query parameters
	limitStr := r.URL.Query().Get("limit")
	limit := int32(50) // Default limit
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = int32(parsedLimit)
		}
	}

	executions, err := h.executionService.GetExecutionsByAgentID(r.Context(), agentID, limit)
	if err != nil {
		h.logger.WithField("agentID", agentID).WithError(err).Error("Failed to get executions by agent")
		utils.RespondWithError(w, "Failed to retrieve executions", http.StatusInternalServerError)
		return
	}

	utils.RespondWithJSON(w, executions)
}
