package handlers

import (
	"backend/internal/logger"
	"backend/internal/middleware"
	"backend/internal/models"
	"backend/internal/services"
	"backend/utils"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/google/uuid"
)

type IntegrationHandler struct {
	integrationService *services.IntegrationService
	logger             *logger.Logger
}

func NewIntegrationHandler(integrationService *services.IntegrationService) *IntegrationHandler {
	return &IntegrationHandler{integrationService: integrationService, logger: logger.Get()}
}

// GetIntegrations handles GET /integrations
func (h *IntegrationHandler) GetIntegrations(w http.ResponseWriter, r *http.Request) {
	// Get user ID from auth context using the middleware helper
	authContext, ok := middleware.GetAuthContext(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	integrations, err := h.integrationService.GetIntegrations(r.Context(), authContext.User.ID)
	if err != nil {
		h.logger.WithError(err).Error("Failed to get integrations")
		utils.RespondWithError(w, "Failed to retrieve integrations", http.StatusInternalServerError)
		return
	}

	utils.RespondWithJSON(w, integrations)
}

// GetIntegration handles GET /integrations/{id}
func (h *IntegrationHandler) GetIntegration(w http.ResponseWriter, r *http.Request) {
	// Extract integration ID from URL path
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 || pathParts[2] == "" {
		utils.RespondWithError(w, "Integration ID is required", http.StatusBadRequest)
		return
	}
	integrationID := pathParts[2]

	integration, err := h.integrationService.GetIntegration(r.Context(), integrationID)
	if err != nil {
		h.logger.WithField("integrationID", integrationID).WithError(err).Error("Failed to get integration")
		utils.RespondWithError(w, "Integration not found", http.StatusNotFound)
		return
	}

	utils.RespondWithJSON(w, integration)
}

// CreateIntegration handles POST /integrations
func (h *IntegrationHandler) CreateIntegration(w http.ResponseWriter, r *http.Request) {
	// Get user ID from auth context using the middleware helper
	authContext, ok := middleware.GetAuthContext(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var integration models.Integration
	if err := json.NewDecoder(r.Body).Decode(&integration); err != nil {
		utils.RespondWithError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Generate new UUID for the integration
	integration.ID = uuid.New()
	integration.UserID = authContext.User.ID

	// Validate required fields
	if integration.Name == "" {
		utils.RespondWithError(w, "Integration name is required", http.StatusBadRequest)
		return
	}

	if integration.Type == "" {
		utils.RespondWithError(w, "Integration type is required", http.StatusBadRequest)
		return
	}

	// Set default values
	if integration.Config == nil {
		integration.Config = make(map[string]interface{})
	}
	if integration.Credentials == nil {
		integration.Credentials = make(map[string]interface{})
	}

	createdIntegration, err := h.integrationService.CreateIntegration(r.Context(), integration)
	if err != nil {
		h.logger.WithError(err).Error("Failed to create integration")
		utils.RespondWithError(w, "Failed to create integration", http.StatusInternalServerError)
		return
	}

	utils.RespondWithJSON(w, createdIntegration)
}

// UpdateIntegration handles PUT /integrations/{id}
func (h *IntegrationHandler) UpdateIntegration(w http.ResponseWriter, r *http.Request) {
	// Extract integration ID from URL path
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 || pathParts[2] == "" {
		utils.RespondWithError(w, "Integration ID is required", http.StatusBadRequest)
		return
	}
	integrationID := pathParts[2]

	var integration models.Integration
	if err := json.NewDecoder(r.Body).Decode(&integration); err != nil {
		utils.RespondWithError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if integration.Name == "" {
		utils.RespondWithError(w, "Integration name is required", http.StatusBadRequest)
		return
	}

	if integration.Type == "" {
		utils.RespondWithError(w, "Integration type is required", http.StatusBadRequest)
		return
	}

	// Set default values
	if integration.Config == nil {
		integration.Config = make(map[string]interface{})
	}
	if integration.Credentials == nil {
		integration.Credentials = make(map[string]interface{})
	}

	updatedIntegration, err := h.integrationService.UpdateIntegration(r.Context(), integrationID, integration)
	if err != nil {
		h.logger.WithField("integrationID", integrationID).WithError(err).Error("Failed to update integration")
		utils.RespondWithError(w, "Failed to update integration", http.StatusInternalServerError)
		return
	}

	utils.RespondWithJSON(w, updatedIntegration)
}

// DeleteIntegration handles DELETE /integrations/{id}
func (h *IntegrationHandler) DeleteIntegration(w http.ResponseWriter, r *http.Request) {
	// Extract integration ID from URL path
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 || pathParts[2] == "" {
		utils.RespondWithError(w, "Integration ID is required", http.StatusBadRequest)
		return
	}
	integrationID := pathParts[2]

	err := h.integrationService.DeleteIntegration(r.Context(), integrationID)
	if err != nil {
		h.logger.WithField("integrationID", integrationID).WithError(err).Error("Failed to delete integration")
		utils.RespondWithError(w, "Failed to delete integration", http.StatusInternalServerError)
		return
	}

	utils.RespondWithJSON(w, map[string]string{"message": "Integration deleted successfully"})
}
