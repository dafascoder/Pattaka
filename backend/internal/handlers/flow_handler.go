package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	sqlc "backend/internal/db/sqlc"
	"backend/internal/logger"
	"backend/internal/middleware"
	"backend/internal/services"
	"backend/utils"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type FlowHandler struct {
	flowService *services.FlowService
	logger      *logger.Logger
}

func NewFlowHandler(flowService *services.FlowService) *FlowHandler {
	return &FlowHandler{
		flowService: flowService,
		logger:      logger.Get(),
	}
}

// Flow request/response types
type CreateFlowRequest struct {
	FolderID *uuid.UUID `json:"folderId,omitempty"`
	Status   string     `json:"status,omitempty"`
	Schedule *string    `json:"schedule,omitempty"`
}

type UpdateFlowRequest struct {
	FolderID *uuid.UUID `json:"folderId,omitempty"`
	Status   string     `json:"status,omitempty"`
	Schedule *string    `json:"schedule,omitempty"`
}

type FlowResponse struct {
	ID         uuid.UUID  `json:"id"`
	ProjectID  uuid.UUID  `json:"projectId"`
	FolderID   *uuid.UUID `json:"folderId,omitempty"`
	FolderName *string    `json:"folderName,omitempty"`
	Status     string     `json:"status"`
	Schedule   *string    `json:"schedule,omitempty"`
	Created    string     `json:"created"`
	Updated    string     `json:"updated"`
}

// Flow Version request/response types
type CreateFlowVersionRequest struct {
	DisplayName string                 `json:"displayName"`
	Trigger     map[string]interface{} `json:"trigger"`
	Steps       map[string]interface{} `json:"steps"`
	Status      string                 `json:"status,omitempty"`
}

type UpdateFlowVersionRequest struct {
	DisplayName string                 `json:"displayName"`
	Trigger     map[string]interface{} `json:"trigger"`
	Steps       map[string]interface{} `json:"steps"`
	Status      string                 `json:"status,omitempty"`
}

type FlowVersionResponse struct {
	ID          uuid.UUID              `json:"id"`
	FlowID      uuid.UUID              `json:"flowId"`
	Version     int32                  `json:"version"`
	DisplayName string                 `json:"displayName"`
	Trigger     map[string]interface{} `json:"trigger"`
	Steps       map[string]interface{} `json:"steps"`
	Status      string                 `json:"status"`
	Created     string                 `json:"created"`
	Updated     string                 `json:"updated"`
}

// Flow Run request/response types
type ExecuteFlowRequest struct {
	Environment string                 `json:"environment,omitempty"`
	Payload     map[string]interface{} `json:"payload,omitempty"`
}

type FlowRunResponse struct {
	ID                uuid.UUID              `json:"id"`
	FlowVersionID     uuid.UUID              `json:"flowVersionId"`
	ProjectID         uuid.UUID              `json:"projectId"`
	Status            string                 `json:"status"`
	StartTime         string                 `json:"startTime"`
	FinishTime        *string                `json:"finishTime,omitempty"`
	Environment       string                 `json:"environment"`
	FlowDisplayName   *string                `json:"flowDisplayName,omitempty"`
	FlowVersionName   *string                `json:"flowVersionName,omitempty"`
	FlowVersionNumber *int32                 `json:"flowVersionNumber,omitempty"`
	Tags              []string               `json:"tags"`
	PauseMetadata     map[string]interface{} `json:"pauseMetadata"`
	Created           string                 `json:"created"`
	Updated           string                 `json:"updated"`
}

// Step Run response types
type StepRunResponse struct {
	ID           uuid.UUID              `json:"id"`
	FlowRunID    uuid.UUID              `json:"flowRunId"`
	StepName     string                 `json:"stepName"`
	Status       string                 `json:"status"`
	Input        map[string]interface{} `json:"input"`
	Output       map[string]interface{} `json:"output"`
	ErrorMessage *string                `json:"errorMessage,omitempty"`
	Duration     *int32                 `json:"duration,omitempty"`
	StartTime    string                 `json:"startTime"`
	FinishTime   *string                `json:"finishTime,omitempty"`
	Created      string                 `json:"created"`
}

// Helper function to convert schedule map to JSON string
func scheduleToString(schedule map[string]interface{}) *string {
	if schedule == nil || len(schedule) == 0 {
		return nil
	}
	bytes, err := json.Marshal(schedule)
	if err != nil {
		return nil
	}
	str := string(bytes)
	return &str
}

// Helper function to convert JSON string to schedule map
func stringToSchedule(scheduleStr *string) map[string]interface{} {
	if scheduleStr == nil || *scheduleStr == "" {
		return nil
	}
	var schedule map[string]interface{}
	if err := json.Unmarshal([]byte(*scheduleStr), &schedule); err != nil {
		return nil
	}
	return schedule
}

// Helper function to convert JSON bytes to map
func bytesToMap(jsonBytes []byte) map[string]interface{} {
	if jsonBytes == nil || len(jsonBytes) == 0 {
		return make(map[string]interface{})
	}
	var result map[string]interface{}
	if err := json.Unmarshal(jsonBytes, &result); err != nil {
		return make(map[string]interface{})
	}
	return result
}

// GET /api/v1/projects/{projectId}/flows
func (h *FlowHandler) GetFlows(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetUserID(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	projectIDStr := extractIDFromURL(r.URL.Path, "projects")
	if projectIDStr == "" {
		utils.RespondWithError(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		utils.RespondWithError(w, "Invalid project ID format", http.StatusBadRequest)
		return
	}

	flows, err := h.flowService.GetFlowsByProjectID(r.Context(), projectID)
	if err != nil {
		h.logger.WithError(err).WithField("projectID", projectID.String()).Error("Failed to get flows")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var response []FlowResponse
	for _, flow := range flows {
		var scheduleStr *string
		if flow.Schedule != nil && len(flow.Schedule) > 0 {
			scheduleStr = scheduleToString(flow.Schedule)
		}

		response = append(response, FlowResponse{
			ID:         flow.ID,
			ProjectID:  flow.ProjectID,
			FolderID:   flow.FolderID,
			FolderName: flow.FolderName,
			Status:     flow.Status,
			Schedule:   scheduleStr,
			Created:    flow.CreatedAt.Format("2006-01-02T15:04:05.000Z"),
			Updated:    flow.UpdatedAt.Format("2006-01-02T15:04:05.000Z"),
		})
	}

	utils.RespondWithJSON(w, map[string]interface{}{
		"data": response,
	})
}

// POST /api/v1/projects/{projectId}/flows
func (h *FlowHandler) CreateFlow(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetUserID(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	projectIDStr := extractIDFromURL(r.URL.Path, "projects")
	if projectIDStr == "" {
		utils.RespondWithError(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		utils.RespondWithError(w, "Invalid project ID format", http.StatusBadRequest)
		return
	}

	var req CreateFlowRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Set defaults
	if req.Status == "" {
		req.Status = "ENABLED"
	}

	// Convert schedule string to map
	var scheduleMap map[string]interface{}
	if req.Schedule != nil {
		scheduleMap = stringToSchedule(req.Schedule)
	}

	flow, err := h.flowService.CreateFlow(r.Context(), projectID, req.FolderID, req.Status, scheduleMap)
	if err != nil {
		h.logger.WithError(err).WithField("projectID", projectID.String()).Error("Failed to create flow")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var scheduleStr *string
	if flow.Schedule != nil && len(flow.Schedule) > 0 {
		scheduleStr = scheduleToString(flow.Schedule)
	}

	response := FlowResponse{
		ID:        flow.ID,
		ProjectID: flow.ProjectID,
		FolderID:  flow.FolderID,
		Status:    flow.Status,
		Schedule:  scheduleStr,
		Created:   flow.CreatedAt.Format("2006-01-02T15:04:05.000Z"),
		Updated:   flow.UpdatedAt.Format("2006-01-02T15:04:05.000Z"),
	}

	utils.RespondWithJSON(w, response)
}

// GET /api/v1/projects/{projectId}/flows/{flowId}
func (h *FlowHandler) GetFlow(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetUserID(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	flowIDStr := extractIDFromURL(r.URL.Path, "flows")
	if flowIDStr == "" {
		utils.RespondWithError(w, "Invalid flow ID", http.StatusBadRequest)
		return
	}

	flowID, err := uuid.Parse(flowIDStr)
	if err != nil {
		utils.RespondWithError(w, "Invalid flow ID format", http.StatusBadRequest)
		return
	}

	flow, err := h.flowService.GetFlowByID(r.Context(), flowID)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.RespondWithError(w, "Flow not found", http.StatusNotFound)
			return
		}
		h.logger.WithError(err).WithField("flowID", flowID.String()).Error("Failed to get flow")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var scheduleStr *string
	if flow.Schedule != nil && len(flow.Schedule) > 0 {
		scheduleStr = scheduleToString(flow.Schedule)
	}

	response := FlowResponse{
		ID:         flow.ID,
		ProjectID:  flow.ProjectID,
		FolderID:   flow.FolderID,
		FolderName: flow.FolderName,
		Status:     flow.Status,
		Schedule:   scheduleStr,
		Created:    flow.CreatedAt.Format("2006-01-02T15:04:05.000Z"),
		Updated:    flow.UpdatedAt.Format("2006-01-02T15:04:05.000Z"),
	}

	utils.RespondWithJSON(w, response)
}

// PUT /api/v1/projects/{projectId}/flows/{flowId}
func (h *FlowHandler) UpdateFlow(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetUserID(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	flowIDStr := extractIDFromURL(r.URL.Path, "flows")
	if flowIDStr == "" {
		utils.RespondWithError(w, "Invalid flow ID", http.StatusBadRequest)
		return
	}

	flowID, err := uuid.Parse(flowIDStr)
	if err != nil {
		utils.RespondWithError(w, "Invalid flow ID format", http.StatusBadRequest)
		return
	}

	var req UpdateFlowRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Convert schedule string to map
	var scheduleMap map[string]interface{}
	if req.Schedule != nil {
		scheduleMap = stringToSchedule(req.Schedule)
	}

	flow, err := h.flowService.UpdateFlow(r.Context(), flowID, req.FolderID, req.Status, scheduleMap)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.RespondWithError(w, "Flow not found", http.StatusNotFound)
			return
		}
		h.logger.WithError(err).WithField("flowID", flowID.String()).Error("Failed to update flow")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var scheduleStr *string
	if flow.Schedule != nil && len(flow.Schedule) > 0 {
		scheduleStr = scheduleToString(flow.Schedule)
	}

	response := FlowResponse{
		ID:        flow.ID,
		ProjectID: flow.ProjectID,
		FolderID:  flow.FolderID,
		Status:    flow.Status,
		Schedule:  scheduleStr,
		Created:   flow.CreatedAt.Format("2006-01-02T15:04:05.000Z"),
		Updated:   flow.UpdatedAt.Format("2006-01-02T15:04:05.000Z"),
	}

	utils.RespondWithJSON(w, response)
}

// DELETE /api/v1/projects/{projectId}/flows/{flowId}
func (h *FlowHandler) DeleteFlow(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetUserID(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	flowIDStr := extractIDFromURL(r.URL.Path, "flows")
	if flowIDStr == "" {
		utils.RespondWithError(w, "Invalid flow ID", http.StatusBadRequest)
		return
	}

	flowID, err := uuid.Parse(flowIDStr)
	if err != nil {
		utils.RespondWithError(w, "Invalid flow ID format", http.StatusBadRequest)
		return
	}

	err = h.flowService.DeleteFlow(r.Context(), flowID)
	if err != nil {
		h.logger.WithError(err).WithField("flowID", flowID.String()).Error("Failed to delete flow")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Flow Version handlers
func (h *FlowHandler) HandleFlowVersions(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		h.GetFlowVersions(w, r)
	case "POST":
		h.CreateFlowVersion(w, r)
	default:
		utils.RespondWithError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *FlowHandler) HandleFlowVersion(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		h.GetFlowVersion(w, r)
	case "PUT":
		h.UpdateFlowVersion(w, r)
	case "DELETE":
		h.DeleteFlowVersion(w, r)
	default:
		utils.RespondWithError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// GET /api/v1/flows/{flowId}/versions
func (h *FlowHandler) GetFlowVersions(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetUserID(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	flowIDStr := extractIDFromURL(r.URL.Path, "flows")
	if flowIDStr == "" {
		utils.RespondWithError(w, "Invalid flow ID", http.StatusBadRequest)
		return
	}

	flowID, err := uuid.Parse(flowIDStr)
	if err != nil {
		utils.RespondWithError(w, "Invalid flow ID format", http.StatusBadRequest)
		return
	}

	versions, err := h.flowService.GetFlowVersionsByFlowID(r.Context(), flowID)
	if err != nil {
		h.logger.WithError(err).WithField("flowID", flowID.String()).Error("Failed to get flow versions")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var response []FlowVersionResponse
	for _, version := range versions {
		response = append(response, FlowVersionResponse{
			ID:          uuid.UUID(version.ID.Bytes),
			FlowID:      uuid.UUID(version.FlowID.Bytes),
			Version:     version.Version,
			DisplayName: version.DisplayName,
			Trigger:     bytesToMap(version.Trigger),
			Steps:       bytesToMap(version.Steps),
			Status:      version.Status.String,
			Created:     version.CreatedAt.Time.Format("2006-01-02T15:04:05.000Z"),
			Updated:     version.UpdatedAt.Time.Format("2006-01-02T15:04:05.000Z"),
		})
	}

	utils.RespondWithJSON(w, map[string]interface{}{
		"data": response,
	})
}

// POST /api/v1/flows/{flowId}/versions
func (h *FlowHandler) CreateFlowVersion(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetUserID(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	flowIDStr := extractIDFromURL(r.URL.Path, "flows")
	if flowIDStr == "" {
		utils.RespondWithError(w, "Invalid flow ID", http.StatusBadRequest)
		return
	}

	flowID, err := uuid.Parse(flowIDStr)
	if err != nil {
		utils.RespondWithError(w, "Invalid flow ID format", http.StatusBadRequest)
		return
	}

	var req CreateFlowVersionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.DisplayName == "" {
		utils.RespondWithError(w, "Display name is required", http.StatusBadRequest)
		return
	}

	// Set defaults
	if req.Status == "" {
		req.Status = "DRAFT"
	}

	// Get next version number
	nextVersion, err := h.flowService.GetNextVersionNumber(r.Context(), flowID)
	if err != nil {
		h.logger.WithError(err).WithField("flowID", flowID.String()).Error("Failed to get next version number")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Convert to JSON bytes for database storage
	triggerBytes, err := json.Marshal(req.Trigger)
	if err != nil {
		utils.RespondWithError(w, "Invalid trigger format", http.StatusBadRequest)
		return
	}

	stepsBytes, err := json.Marshal(req.Steps)
	if err != nil {
		utils.RespondWithError(w, "Invalid steps format", http.StatusBadRequest)
		return
	}

	params := sqlc.CreateFlowVersionParams{
		FlowID:      pgtype.UUID{Bytes: flowID, Valid: true},
		Version:     nextVersion,
		DisplayName: req.DisplayName,
		Trigger:     triggerBytes,
		Steps:       stepsBytes,
		Status:      pgtype.Text{String: req.Status, Valid: true},
	}

	version, err := h.flowService.CreateFlowVersion(r.Context(), params)
	if err != nil {
		h.logger.WithError(err).WithField("flowID", flowID.String()).Error("Failed to create flow version")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	response := FlowVersionResponse{
		ID:          uuid.UUID(version.ID.Bytes),
		FlowID:      uuid.UUID(version.FlowID.Bytes),
		Version:     version.Version,
		DisplayName: version.DisplayName,
		Trigger:     bytesToMap(version.Trigger),
		Steps:       bytesToMap(version.Steps),
		Status:      version.Status.String,
		Created:     version.CreatedAt.Time.Format("2006-01-02T15:04:05.000Z"),
		Updated:     version.UpdatedAt.Time.Format("2006-01-02T15:04:05.000Z"),
	}

	utils.RespondWithJSON(w, response)
}

// GET /api/v1/flows/{flowId}/versions/{versionId}
func (h *FlowHandler) GetFlowVersion(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetUserID(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	versionIDStr := extractIDFromURL(r.URL.Path, "versions")
	if versionIDStr == "" {
		utils.RespondWithError(w, "Invalid version ID", http.StatusBadRequest)
		return
	}

	versionID, err := uuid.Parse(versionIDStr)
	if err != nil {
		utils.RespondWithError(w, "Invalid version ID format", http.StatusBadRequest)
		return
	}

	version, err := h.flowService.GetFlowVersionByID(r.Context(), versionID)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.RespondWithError(w, "Flow version not found", http.StatusNotFound)
			return
		}
		h.logger.WithError(err).WithField("versionID", versionID.String()).Error("Failed to get flow version")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	response := FlowVersionResponse{
		ID:          uuid.UUID(version.ID.Bytes),
		FlowID:      uuid.UUID(version.FlowID.Bytes),
		Version:     version.Version,
		DisplayName: version.DisplayName,
		Trigger:     bytesToMap(version.Trigger),
		Steps:       bytesToMap(version.Steps),
		Status:      version.Status.String,
		Created:     version.CreatedAt.Time.Format("2006-01-02T15:04:05.000Z"),
		Updated:     version.UpdatedAt.Time.Format("2006-01-02T15:04:05.000Z"),
	}

	utils.RespondWithJSON(w, response)
}

// PUT /api/v1/flows/{flowId}/versions/{versionId}
func (h *FlowHandler) UpdateFlowVersion(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetUserID(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	versionIDStr := extractIDFromURL(r.URL.Path, "versions")
	if versionIDStr == "" {
		utils.RespondWithError(w, "Invalid version ID", http.StatusBadRequest)
		return
	}

	versionID, err := uuid.Parse(versionIDStr)
	if err != nil {
		utils.RespondWithError(w, "Invalid version ID format", http.StatusBadRequest)
		return
	}

	var req UpdateFlowVersionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.DisplayName == "" {
		utils.RespondWithError(w, "Display name is required", http.StatusBadRequest)
		return
	}

	// Convert to JSON bytes for database storage
	triggerBytes, err := json.Marshal(req.Trigger)
	if err != nil {
		utils.RespondWithError(w, "Invalid trigger format", http.StatusBadRequest)
		return
	}

	stepsBytes, err := json.Marshal(req.Steps)
	if err != nil {
		utils.RespondWithError(w, "Invalid steps format", http.StatusBadRequest)
		return
	}

	params := sqlc.UpdateFlowVersionParams{
		ID:          pgtype.UUID{Bytes: versionID, Valid: true},
		DisplayName: req.DisplayName,
		Trigger:     triggerBytes,
		Steps:       stepsBytes,
		Status:      pgtype.Text{String: req.Status, Valid: true},
	}

	version, err := h.flowService.UpdateFlowVersion(r.Context(), params)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.RespondWithError(w, "Flow version not found", http.StatusNotFound)
			return
		}
		h.logger.WithError(err).WithField("versionID", versionID.String()).Error("Failed to update flow version")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	response := FlowVersionResponse{
		ID:          uuid.UUID(version.ID.Bytes),
		FlowID:      uuid.UUID(version.FlowID.Bytes),
		Version:     version.Version,
		DisplayName: version.DisplayName,
		Trigger:     bytesToMap(version.Trigger),
		Steps:       bytesToMap(version.Steps),
		Status:      version.Status.String,
		Created:     version.CreatedAt.Time.Format("2006-01-02T15:04:05.000Z"),
		Updated:     version.UpdatedAt.Time.Format("2006-01-02T15:04:05.000Z"),
	}

	utils.RespondWithJSON(w, response)
}

// DELETE /api/v1/flows/{flowId}/versions/{versionId}
func (h *FlowHandler) DeleteFlowVersion(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetUserID(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	versionIDStr := extractIDFromURL(r.URL.Path, "versions")
	if versionIDStr == "" {
		utils.RespondWithError(w, "Invalid version ID", http.StatusBadRequest)
		return
	}

	versionID, err := uuid.Parse(versionIDStr)
	if err != nil {
		utils.RespondWithError(w, "Invalid version ID format", http.StatusBadRequest)
		return
	}

	err = h.flowService.DeleteFlowVersion(r.Context(), versionID)
	if err != nil {
		h.logger.WithError(err).WithField("versionID", versionID.String()).Error("Failed to delete flow version")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Flow Run handlers
func (h *FlowHandler) HandleFlowRuns(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		h.GetFlowRuns(w, r)
	default:
		utils.RespondWithError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *FlowHandler) HandleFlowRun(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		h.GetFlowRun(w, r)
	default:
		utils.RespondWithError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// GET /api/v1/projects/{projectId}/flow-runs
func (h *FlowHandler) GetFlowRuns(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetUserID(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	projectIDStr := extractIDFromURL(r.URL.Path, "projects")
	if projectIDStr == "" {
		utils.RespondWithError(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		utils.RespondWithError(w, "Invalid project ID format", http.StatusBadRequest)
		return
	}

	// Default pagination
	limit := int32(50)
	offset := int32(0)

	runs, err := h.flowService.GetFlowRunsByProjectID(r.Context(), projectID, limit, offset)
	if err != nil {
		h.logger.WithError(err).WithField("projectID", projectID.String()).Error("Failed to get flow runs")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var response []FlowRunResponse
	for _, run := range runs {
		var finishTime *string
		if run.FinishTime.Valid {
			ft := run.FinishTime.Time.Format("2006-01-02T15:04:05.000Z")
			finishTime = &ft
		}

		var flowDisplayName *string
		if run.FlowDisplayName.Valid {
			flowDisplayName = &run.FlowDisplayName.String
		}

		var flowVersionName *string
		if run.FlowVersionName.Valid {
			flowVersionName = &run.FlowVersionName.String
		}

		var flowVersionNumber *int32
		if run.FlowVersionNumber.Valid {
			flowVersionNumber = &run.FlowVersionNumber.Int32
		}

		response = append(response, FlowRunResponse{
			ID:                uuid.UUID(run.ID.Bytes),
			FlowVersionID:     uuid.UUID(run.FlowVersionID.Bytes),
			ProjectID:         uuid.UUID(run.ProjectID.Bytes),
			Status:            run.Status.String,
			StartTime:         run.StartTime.Time.Format("2006-01-02T15:04:05.000Z"),
			FinishTime:        finishTime,
			Environment:       run.Environment.String,
			FlowDisplayName:   flowDisplayName,
			FlowVersionName:   flowVersionName,
			FlowVersionNumber: flowVersionNumber,
			Tags:              run.Tags,
			PauseMetadata:     bytesToMap(run.PauseMetadata),
			Created:           run.CreatedAt.Time.Format("2006-01-02T15:04:05.000Z"),
			Updated:           run.UpdatedAt.Time.Format("2006-01-02T15:04:05.000Z"),
		})
	}

	utils.RespondWithJSON(w, map[string]interface{}{
		"data": response,
	})
}

// GET /api/v1/flow-runs/{runId}
func (h *FlowHandler) GetFlowRun(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetUserID(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	runIDStr := extractIDFromURL(r.URL.Path, "flow-runs")
	if runIDStr == "" {
		utils.RespondWithError(w, "Invalid run ID", http.StatusBadRequest)
		return
	}

	runID, err := uuid.Parse(runIDStr)
	if err != nil {
		utils.RespondWithError(w, "Invalid run ID format", http.StatusBadRequest)
		return
	}

	run, err := h.flowService.GetFlowRunByID(r.Context(), runID)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.RespondWithError(w, "Flow run not found", http.StatusNotFound)
			return
		}
		h.logger.WithError(err).WithField("runID", runID.String()).Error("Failed to get flow run")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var finishTime *string
	if run.FinishTime.Valid {
		ft := run.FinishTime.Time.Format("2006-01-02T15:04:05.000Z")
		finishTime = &ft
	}

	var flowDisplayName *string
	if run.FlowDisplayName.Valid {
		flowDisplayName = &run.FlowDisplayName.String
	}

	var flowVersionName *string
	if run.FlowVersionName.Valid {
		flowVersionName = &run.FlowVersionName.String
	}

	var flowVersionNumber *int32
	if run.FlowVersionNumber.Valid {
		flowVersionNumber = &run.FlowVersionNumber.Int32
	}

	response := FlowRunResponse{
		ID:                uuid.UUID(run.ID.Bytes),
		FlowVersionID:     uuid.UUID(run.FlowVersionID.Bytes),
		ProjectID:         uuid.UUID(run.ProjectID.Bytes),
		Status:            run.Status.String,
		StartTime:         run.StartTime.Time.Format("2006-01-02T15:04:05.000Z"),
		FinishTime:        finishTime,
		Environment:       run.Environment.String,
		FlowDisplayName:   flowDisplayName,
		FlowVersionName:   flowVersionName,
		FlowVersionNumber: flowVersionNumber,
		Tags:              run.Tags,
		PauseMetadata:     bytesToMap(run.PauseMetadata),
		Created:           run.CreatedAt.Time.Format("2006-01-02T15:04:05.000Z"),
		Updated:           run.UpdatedAt.Time.Format("2006-01-02T15:04:05.000Z"),
	}

	utils.RespondWithJSON(w, response)
}

// Flow Execution handlers
// POST /api/v1/flows/{flowId}/execute
func (h *FlowHandler) ExecuteFlow(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r)
	if !ok {
		h.logger.Warn("Unauthorized flow execution attempt")
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	flowIDStr := extractIDFromURL(r.URL.Path, "flows")
	if flowIDStr == "" {
		h.logger.WithField("path", r.URL.Path).Warn("Invalid flow ID in request path")
		utils.RespondWithError(w, "Invalid flow ID", http.StatusBadRequest)
		return
	}

	flowID, err := uuid.Parse(flowIDStr)
	if err != nil {
		h.logger.WithError(err).WithField("flowIDStr", flowIDStr).Warn("Invalid flow ID format")
		utils.RespondWithError(w, "Invalid flow ID format", http.StatusBadRequest)
		return
	}

	h.logger.WithFields(map[string]interface{}{
		"user_id":  userID,
		"flow_id":  flowID.String(),
		"method":   r.Method,
		"endpoint": r.URL.Path,
	}).Info("Flow execution request received")

	var req ExecuteFlowRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.WithError(err).WithField("flowID", flowID.String()).Warn("Invalid JSON in execute flow request")
		utils.RespondWithError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Set default environment
	if req.Environment == "" {
		req.Environment = "PRODUCTION"
	}

	// Validate environment value
	if req.Environment != "PRODUCTION" && req.Environment != "TESTING" {
		h.logger.WithFields(map[string]interface{}{
			"flowID":      flowID.String(),
			"environment": req.Environment,
		}).Warn("Invalid environment specified")
		utils.RespondWithError(w, "Invalid environment. Must be 'PRODUCTION' or 'TESTING'", http.StatusBadRequest)
		return
	}

	h.logger.WithFields(map[string]interface{}{
		"flow_id":      flowID.String(),
		"environment":  req.Environment,
		"payload_size": len(req.Payload),
	}).Info("Validated flow execution request")

	// Get flow to determine project ID
	flow, err := h.flowService.GetFlowByID(r.Context(), flowID)
	if err != nil {
		if err == sql.ErrNoRows {
			h.logger.WithField("flowID", flowID.String()).Warn("Flow not found for execution")
			utils.RespondWithError(w, "Flow not found", http.StatusNotFound)
			return
		}
		h.logger.WithError(err).WithField("flowID", flowID.String()).Error("Failed to get flow for execution")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	h.logger.WithFields(map[string]interface{}{
		"flow_id":     flowID.String(),
		"project_id":  flow.ProjectID.String(),
		"flow_status": flow.Status,
	}).Info("Retrieved flow for execution")

	// Check if flow is enabled
	if flow.Status != "ENABLED" {
		h.logger.WithFields(map[string]interface{}{
			"flow_id":     flowID.String(),
			"flow_status": flow.Status,
		}).Warn("Attempted to execute disabled flow")
		utils.RespondWithError(w, "Flow is not enabled", http.StatusBadRequest)
		return
	}

	h.logger.WithFields(map[string]interface{}{
		"flow_id":     flowID.String(),
		"project_id":  flow.ProjectID.String(),
		"environment": req.Environment,
	}).Info("Starting flow execution")

	run, err := h.flowService.ExecuteFlow(r.Context(), flowID, flow.ProjectID, req.Environment, req.Payload)
	if err != nil {
		h.logger.WithError(err).WithFields(map[string]interface{}{
			"flow_id":     flowID.String(),
			"project_id":  flow.ProjectID.String(),
			"environment": req.Environment,
		}).Error("Flow execution failed")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var finishTime *string
	if run.FinishTime.Valid {
		ft := run.FinishTime.Time.Format("2006-01-02T15:04:05.000Z")
		finishTime = &ft
	}

	var flowDisplayName *string
	if run.FlowDisplayName.Valid {
		flowDisplayName = &run.FlowDisplayName.String
	}

	response := FlowRunResponse{
		ID:              uuid.UUID(run.ID.Bytes),
		FlowVersionID:   uuid.UUID(run.FlowVersionID.Bytes),
		ProjectID:       uuid.UUID(run.ProjectID.Bytes),
		Status:          run.Status.String,
		StartTime:       run.StartTime.Time.Format("2006-01-02T15:04:05.000Z"),
		FinishTime:      finishTime,
		Environment:     run.Environment.String,
		FlowDisplayName: flowDisplayName,
		Tags:            run.Tags,
		PauseMetadata:   bytesToMap(run.PauseMetadata),
		Created:         run.CreatedAt.Time.Format("2006-01-02T15:04:05.000Z"),
		Updated:         run.UpdatedAt.Time.Format("2006-01-02T15:04:05.000Z"),
	}

	utils.RespondWithJSON(w, response)
}

// POST /api/v1/flow-runs/{runId}/pause
func (h *FlowHandler) PauseFlowRun(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetUserID(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	runIDStr := extractIDFromURL(r.URL.Path, "flow-runs")
	if runIDStr == "" {
		utils.RespondWithError(w, "Invalid run ID", http.StatusBadRequest)
		return
	}

	runID, err := uuid.Parse(runIDStr)
	if err != nil {
		utils.RespondWithError(w, "Invalid run ID format", http.StatusBadRequest)
		return
	}

	err = h.flowService.UpdateFlowRunStatus(r.Context(), runID, "PAUSED")
	if err != nil {
		h.logger.WithError(err).WithField("runID", runID.String()).Error("Failed to pause flow run")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	utils.RespondWithJSON(w, map[string]interface{}{
		"message": "Flow run paused successfully",
	})
}

// POST /api/v1/flow-runs/{runId}/resume
func (h *FlowHandler) ResumeFlowRun(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetUserID(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	runIDStr := extractIDFromURL(r.URL.Path, "flow-runs")
	if runIDStr == "" {
		utils.RespondWithError(w, "Invalid run ID", http.StatusBadRequest)
		return
	}

	runID, err := uuid.Parse(runIDStr)
	if err != nil {
		utils.RespondWithError(w, "Invalid run ID format", http.StatusBadRequest)
		return
	}

	err = h.flowService.UpdateFlowRunStatus(r.Context(), runID, "RUNNING")
	if err != nil {
		h.logger.WithError(err).WithField("runID", runID.String()).Error("Failed to resume flow run")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	utils.RespondWithJSON(w, map[string]interface{}{
		"message": "Flow run resumed successfully",
	})
}

// POST /api/v1/flow-runs/{runId}/cancel
func (h *FlowHandler) CancelFlowRun(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetUserID(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	runIDStr := extractIDFromURL(r.URL.Path, "flow-runs")
	if runIDStr == "" {
		utils.RespondWithError(w, "Invalid run ID", http.StatusBadRequest)
		return
	}

	runID, err := uuid.Parse(runIDStr)
	if err != nil {
		utils.RespondWithError(w, "Invalid run ID format", http.StatusBadRequest)
		return
	}

	err = h.flowService.UpdateFlowRunStatus(r.Context(), runID, "CANCELLED")
	if err != nil {
		h.logger.WithError(err).WithField("runID", runID.String()).Error("Failed to cancel flow run")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	utils.RespondWithJSON(w, map[string]interface{}{
		"message": "Flow run cancelled successfully",
	})
}

// GET /api/v1/flow-runs/{runId}/steps
func (h *FlowHandler) GetStepRuns(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetUserID(r)
	if !ok {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	runIDStr := extractIDFromURL(r.URL.Path, "flow-runs")
	if runIDStr == "" {
		utils.RespondWithError(w, "Invalid run ID", http.StatusBadRequest)
		return
	}

	runID, err := uuid.Parse(runIDStr)
	if err != nil {
		utils.RespondWithError(w, "Invalid run ID format", http.StatusBadRequest)
		return
	}

	h.logger.WithFields(map[string]interface{}{
		"run_id":   runID.String(),
		"endpoint": r.URL.Path,
	}).Info("Getting step runs for flow run")

	stepRuns, err := h.flowService.GetStepRunsByFlowRunID(r.Context(), runID)
	if err != nil {
		h.logger.WithError(err).WithField("runID", runID.String()).Error("Failed to get step runs")
		utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var response []StepRunResponse
	for _, stepRun := range stepRuns {
		var finishTime *string
		if stepRun.FinishTime.Valid {
			ft := stepRun.FinishTime.Time.Format("2006-01-02T15:04:05.000Z")
			finishTime = &ft
		}

		var errorMessage *string
		if stepRun.ErrorMessage.Valid {
			errorMessage = &stepRun.ErrorMessage.String
		}

		var duration *int32
		if stepRun.Duration.Valid {
			duration = &stepRun.Duration.Int32
		}

		response = append(response, StepRunResponse{
			ID:           uuid.UUID(stepRun.ID.Bytes),
			FlowRunID:    uuid.UUID(stepRun.FlowRunID.Bytes),
			StepName:     stepRun.StepName,
			Status:       stepRun.Status.String,
			Input:        bytesToMap(stepRun.Input),
			Output:       bytesToMap(stepRun.Output),
			ErrorMessage: errorMessage,
			Duration:     duration,
			StartTime:    stepRun.StartTime.Time.Format("2006-01-02T15:04:05.000Z"),
			FinishTime:   finishTime,
			Created:      stepRun.CreatedAt.Time.Format("2006-01-02T15:04:05.000Z"),
		})
	}

	h.logger.WithFields(map[string]interface{}{
		"run_id":     runID.String(),
		"step_count": len(response),
	}).Info("Retrieved step runs successfully")

	utils.RespondWithJSON(w, map[string]interface{}{
		"data": response,
	})
}

// Helper function to extract ID from URL path
func extractIDFromURL(path string, resource string) string {
	parts := strings.Split(strings.Trim(path, "/"), "/")

	// Find the resource in the path and get the ID after it
	for i, part := range parts {
		if part == resource && i+1 < len(parts) {
			return parts[i+1]
		}
	}

	return ""
}
