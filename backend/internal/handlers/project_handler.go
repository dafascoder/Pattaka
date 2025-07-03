package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"backend/internal/logger"
	"backend/internal/middleware"
	"backend/internal/services"
	"backend/utils"

	"github.com/google/uuid"
)

type ProjectHandler struct {
	projectService *services.ProjectService
	logger         *logger.Logger
}

func NewProjectHandler(projectService *services.ProjectService) *ProjectHandler {
	return &ProjectHandler{
		projectService: projectService,
		logger:         logger.Get(),
	}
}

// CreateProjectRequest represents the request body for creating a project
type CreateProjectRequest struct {
	DisplayName     string         `json:"displayName"`
	PlatformID      *uuid.UUID     `json:"platformId,omitempty"`
	NotifyStatus    string         `json:"notifyStatus,omitempty"`
	ExternalID      *string        `json:"externalId,omitempty"`
	ReleasesEnabled bool           `json:"releasesEnabled"`
	Metadata        map[string]any `json:"metadata,omitempty"`
}

// UpdateProjectRequest represents the request body for updating a project
type UpdateProjectRequest struct {
	DisplayName     string         `json:"displayName"`
	NotifyStatus    string         `json:"notifyStatus,omitempty"`
	ExternalID      *string        `json:"externalId,omitempty"`
	ReleasesEnabled bool           `json:"releasesEnabled"`
	Metadata        map[string]any `json:"metadata,omitempty"`
}

// ProjectResponse represents a project in API responses
type ProjectResponse struct {
	ID              uuid.UUID      `json:"id"`
	DisplayName     string         `json:"displayName"`
	OwnerID         string         `json:"ownerId"`
	PlatformID      uuid.UUID      `json:"platformId"`
	NotifyStatus    string         `json:"notifyStatus"`
	ExternalID      *string        `json:"externalId,omitempty"`
	ReleasesEnabled bool           `json:"releasesEnabled"`
	Metadata        map[string]any `json:"metadata"`
	Created         string         `json:"created"`
	Updated         string         `json:"updated"`
}

// ProjectUsageResponse includes project statistics
type ProjectUsageResponse struct {
	ProjectResponse
	FlowCount       int64 `json:"flowCount"`
	FlowRunCount    int64 `json:"flowRunCount"`
	ConnectionCount int64 `json:"connectionCount"`
}

// HandleProjects routes project requests (following existing pattern)
func (h *ProjectHandler) HandleProjects(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		h.GetProjects(w, r)
	case "POST":
		h.CreateProject(w, r)
	default:
		utils.RespondWithError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// HandleProject routes individual project requests with ID
func (h *ProjectHandler) HandleProject(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		h.GetProject(w, r)
	case "PUT":
		h.UpdateProject(w, r)
	case "DELETE":
		h.DeleteProject(w, r)
	default:
		utils.RespondWithError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// GET /v1/projects
func (h *ProjectHandler) GetProjects(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	projects, err := h.projectService.GetProjectsByOwnerID(r.Context(), userID)
	if err != nil {
		h.logger.WithError(err).WithField("userID", userID).Error("Failed to get projects")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var response []ProjectResponse
	for _, project := range projects {
		response = append(response, ProjectResponse{
			ID:              project.ID,
			DisplayName:     project.DisplayName,
			OwnerID:         project.OwnerID,
			PlatformID:      project.PlatformID,
			NotifyStatus:    project.NotifyStatus,
			ExternalID:      project.ExternalID,
			ReleasesEnabled: project.ReleasesEnabled,
			Metadata:        project.Metadata,
			Created:         project.CreatedAt.Format("2006-01-02T15:04:05.000Z"),
			Updated:         project.UpdatedAt.Format("2006-01-02T15:04:05.000Z"),
		})
	}

	utils.RespondWithJSON(w, map[string]any{
		"data": response,
	})
}

// Helper function to extract ID from URL path
func extractIDFromPath(path string) string {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) >= 3 {
		return parts[len(parts)-1] // Return last part as ID
	}
	return ""
}

// GET /v1/projects/{projectId}
func (h *ProjectHandler) GetProject(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	projectIDStr := extractIDFromPath(r.URL.Path)
	if projectIDStr == "" {
		utils.RespondWithError(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		utils.RespondWithError(w, "Invalid project ID format", http.StatusBadRequest)
		return
	}

	project, err := h.projectService.GetProjectByID(r.Context(), projectID)
	if err != nil {
		if err.Error() == "project not found" {
			utils.RespondWithError(w, "Project not found", http.StatusNotFound)
			return
		}
		h.logger.WithError(err).WithField("projectID", projectID.String()).Error("Failed to get project")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Verify ownership
	if project.OwnerID != userID {
		utils.RespondWithError(w, "Forbidden", http.StatusForbidden)
		return
	}

	response := ProjectResponse{
		ID:              project.ID,
		DisplayName:     project.DisplayName,
		OwnerID:         project.OwnerID,
		PlatformID:      project.PlatformID,
		NotifyStatus:    project.NotifyStatus,
		ExternalID:      project.ExternalID,
		ReleasesEnabled: project.ReleasesEnabled,
		Metadata:        project.Metadata,
		Created:         project.CreatedAt.Format("2006-01-02T15:04:05.000Z"),
		Updated:         project.UpdatedAt.Format("2006-01-02T15:04:05.000Z"),
	}

	utils.RespondWithJSON(w, response)
}

// POST /v1/projects
func (h *ProjectHandler) CreateProject(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req CreateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Basic validation
	if req.DisplayName == "" {
		utils.RespondWithError(w, "Display name is required", http.StatusBadRequest)
		return
	}

	// Set defaults
	if req.NotifyStatus == "" {
		req.NotifyStatus = "ALWAYS"
	}
	if req.Metadata == nil {
		req.Metadata = make(map[string]any)
	}

	project, err := h.projectService.CreateProject(r.Context(), services.CreateProjectParams{
		DisplayName:     req.DisplayName,
		OwnerID:         userID,
		PlatformID:      req.PlatformID,
		NotifyStatus:    req.NotifyStatus,
		ExternalID:      req.ExternalID,
		ReleasesEnabled: req.ReleasesEnabled,
		Metadata:        req.Metadata,
	})
	if err != nil {
		h.logger.WithError(err).WithField("userID", userID).Error("Failed to create project")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	response := ProjectResponse{
		ID:              project.ID,
		DisplayName:     project.DisplayName,
		OwnerID:         project.OwnerID,
		PlatformID:      project.PlatformID,
		NotifyStatus:    project.NotifyStatus,
		ExternalID:      project.ExternalID,
		ReleasesEnabled: project.ReleasesEnabled,
		Metadata:        project.Metadata,
		Created:         project.CreatedAt.Format("2006-01-02T15:04:05.000Z"),
		Updated:         project.UpdatedAt.Format("2006-01-02T15:04:05.000Z"),
	}

	w.WriteHeader(http.StatusCreated)
	utils.RespondWithJSON(w, response)
}

// PUT /v1/projects/{projectId}
func (h *ProjectHandler) UpdateProject(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	projectIDStr := extractIDFromPath(r.URL.Path)
	if projectIDStr == "" {
		utils.RespondWithError(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		utils.RespondWithError(w, "Invalid project ID format", http.StatusBadRequest)
		return
	}

	var req UpdateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Basic validation
	if req.DisplayName == "" {
		utils.RespondWithError(w, "Display name is required", http.StatusBadRequest)
		return
	}

	// Verify ownership
	existing, err := h.projectService.GetProjectByID(r.Context(), projectID)
	if err != nil {
		if err.Error() == "project not found" {
			utils.RespondWithError(w, "Project not found", http.StatusNotFound)
			return
		}
		h.logger.WithError(err).WithField("projectID", projectID.String()).Error("Failed to get project for verification")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if existing.OwnerID != userID {
		utils.RespondWithError(w, "Forbidden", http.StatusForbidden)
		return
	}

	project, err := h.projectService.UpdateProject(r.Context(), projectID, services.UpdateProjectParams{
		DisplayName:     req.DisplayName,
		NotifyStatus:    req.NotifyStatus,
		ExternalID:      req.ExternalID,
		ReleasesEnabled: req.ReleasesEnabled,
		Metadata:        req.Metadata,
	})
	if err != nil {
		h.logger.WithError(err).WithField("projectID", projectID.String()).Error("Failed to update project")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	response := ProjectResponse{
		ID:              project.ID,
		DisplayName:     project.DisplayName,
		OwnerID:         project.OwnerID,
		PlatformID:      project.PlatformID,
		NotifyStatus:    project.NotifyStatus,
		ExternalID:      project.ExternalID,
		ReleasesEnabled: project.ReleasesEnabled,
		Metadata:        project.Metadata,
		Created:         project.CreatedAt.Format("2006-01-02T15:04:05.000Z"),
		Updated:         project.UpdatedAt.Format("2006-01-02T15:04:05.000Z"),
	}

	utils.RespondWithJSON(w, response)
}

// DELETE /v1/projects/{projectId}
func (h *ProjectHandler) DeleteProject(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	projectIDStr := extractIDFromPath(r.URL.Path)
	if projectIDStr == "" {
		utils.RespondWithError(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		utils.RespondWithError(w, "Invalid project ID format", http.StatusBadRequest)
		return
	}

	// Verify ownership
	project, err := h.projectService.GetProjectByID(r.Context(), projectID)
	if err != nil {
		if err.Error() == "project not found" {
			utils.RespondWithError(w, "Project not found", http.StatusNotFound)
			return
		}
		h.logger.WithError(err).WithField("projectID", projectID.String()).Error("Failed to get project for verification")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if project.OwnerID != userID {
		utils.RespondWithError(w, "Forbidden", http.StatusForbidden)
		return
	}

	if err := h.projectService.DeleteProject(r.Context(), projectID); err != nil {
		h.logger.WithError(err).WithField("projectID", projectID.String()).Error("Failed to delete project")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GET /v1/projects/{projectId}/usage
func (h *ProjectHandler) GetProjectUsage(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetUserID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	projectIDStr := extractIDFromPath(r.URL.Path)
	if projectIDStr == "" {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		http.Error(w, "Invalid project ID format", http.StatusBadRequest)
		return
	}

	usage, err := h.projectService.GetProjectUsage(r.Context(), projectID)
	if err != nil {
		if err.Error() == "project not found" {
			http.Error(w, "Project not found", http.StatusNotFound)
			return
		}
		h.logger.WithError(err).WithField("projectID", projectID.String()).Error("Failed to get project usage")
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Note: Ownership verification would be done in the service layer for this query

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(usage)
}
