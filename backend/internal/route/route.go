package route

import (
	"net/http"

	"backend/internal/handlers"
	"backend/internal/logger"
	"backend/internal/middleware"
	"backend/internal/services"
	"backend/utils"
)

type Router struct {
	agentHandler       *handlers.AgentHandler
	integrationHandler *handlers.IntegrationHandler
	authHandler        *handlers.AuthHandler
	userHandler        *handlers.UserHandler
	projectHandler     *handlers.ProjectHandler
	flowHandler        *handlers.FlowHandler
	websocketHandler   *handlers.WebSocketHandler
	logger             *logger.Logger
}

func NewRouter(agentService *services.AgentService, userService *services.UserService, integrationService *services.IntegrationService, authService *services.AuthService, projectService *services.ProjectService, flowService *services.FlowService) *Router {
	return &Router{
		agentHandler:       handlers.NewAgentHandler(agentService),
		integrationHandler: handlers.NewIntegrationHandler(integrationService),
		authHandler:        handlers.NewAuthHandler(authService),
		userHandler:        handlers.NewUserHandler(userService),
		projectHandler:     handlers.NewProjectHandler(projectService),
		flowHandler:        handlers.NewFlowHandler(flowService),
		websocketHandler:   handlers.NewWebSocketHandler(),
		logger:             logger.Get(),
	}
}

// MiddlewareFunc represents a middleware function
type MiddlewareFunc func(http.HandlerFunc) http.HandlerFunc

// integrationsHandler routes integration requests to appropriate handlers
func (r *Router) integrationsHandler(w http.ResponseWriter, req *http.Request) {
	switch req.Method {
	case "GET":
		r.integrationHandler.GetIntegrations(w, req)
	case "POST":
		r.integrationHandler.CreateIntegration(w, req)
	default:
		utils.RespondWithError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// integrationByIDHandler routes individual integration requests
func (r *Router) integrationByIDHandler(w http.ResponseWriter, req *http.Request) {
	switch req.Method {
	case "GET":
		r.integrationHandler.GetIntegration(w, req)
	case "PUT":
		r.integrationHandler.UpdateIntegration(w, req)
	case "DELETE":
		r.integrationHandler.DeleteIntegration(w, req)
	default:
		utils.RespondWithError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// projectsHandler routes project requests to appropriate handlers
func (r *Router) projectsHandler(w http.ResponseWriter, req *http.Request) {
	switch req.Method {
	case "GET":
		r.projectHandler.GetProjects(w, req)
	case "POST":
		r.projectHandler.CreateProject(w, req)
	default:
		utils.RespondWithError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// projectByIDHandler routes individual project requests
func (r *Router) projectByIDHandler(w http.ResponseWriter, req *http.Request) {
	switch req.Method {
	case "GET":
		r.projectHandler.GetProject(w, req)
	case "PUT":
		r.projectHandler.UpdateProject(w, req)
	case "DELETE":
		r.projectHandler.DeleteProject(w, req)
	default:
		utils.RespondWithError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// flowsHandler routes flow requests to appropriate handlers
func (r *Router) flowsHandler(w http.ResponseWriter, req *http.Request) {
	switch req.Method {
	case "GET":
		r.flowHandler.GetFlows(w, req)
	case "POST":
		r.flowHandler.CreateFlow(w, req)
	default:
		utils.RespondWithError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// flowByIDHandler routes individual flow requests
func (r *Router) flowByIDHandler(w http.ResponseWriter, req *http.Request) {
	switch req.Method {
	case "GET":
		r.flowHandler.GetFlow(w, req)
	case "PUT":
		r.flowHandler.UpdateFlow(w, req)
	case "DELETE":
		r.flowHandler.DeleteFlow(w, req)
	default:
		utils.RespondWithError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// SetupRoutes creates routes without middleware (legacy)
func (router *Router) SetupRoutes() *http.ServeMux {
	return router.SetupRoutesWithMiddleware(nil)
}

// SetupRoutesWithMiddleware creates routes with middleware
func (router *Router) SetupRoutesWithMiddleware(middlewareChain MiddlewareFunc) *http.ServeMux {
	mux := http.NewServeMux()

	// Helper function to apply middleware if provided
	applyMiddleware := func(handler http.HandlerFunc) http.HandlerFunc {
		if middlewareChain != nil {
			return middlewareChain(handler)
		}
		// Apply basic CORS for legacy support
		return middleware.CORSMiddleware([]string{"*"})(handler)
	}

	// Auth endpoints (no JWT required for login/register)
	mux.HandleFunc("/api/auth/register", applyMiddleware(router.authHandler.Register))
	mux.HandleFunc("/api/auth/login", applyMiddleware(router.authHandler.Login))
	mux.HandleFunc("/api/auth/logout", applyMiddleware(router.authHandler.Logout))

	// Health check (no auth required)
	mux.HandleFunc("/api/health", applyMiddleware(handlers.HealthHandler))

	// Test endpoint to show current user (for debugging)
	mux.HandleFunc("/api/me", applyMiddleware(router.userHandler.AuthenticatedUser))

	// Agent endpoints
	mux.HandleFunc("/api/agents", applyMiddleware(router.agentHandler.HandleAgents))
	mux.HandleFunc("/api/agents/", applyMiddleware(router.agentHandler.HandleAgent))

	// Integrations endpoints
	mux.HandleFunc("/api/integrations", applyMiddleware(router.integrationsHandler))
	mux.HandleFunc("/api/integrations/", applyMiddleware(router.integrationByIDHandler))

	// Project endpoints
	mux.HandleFunc("/api/v1/projects", applyMiddleware(router.projectsHandler))
	mux.HandleFunc("/api/v1/projects/", applyMiddleware(router.projectByIDHandler))

	// Flow endpoints (project-scoped)
	mux.HandleFunc("/api/v1/projects/{projectId}/flows", applyMiddleware(router.flowsHandler))
	mux.HandleFunc("/api/v1/projects/{projectId}/flows/", applyMiddleware(router.flowByIDHandler))

	// Flow version endpoints
	mux.HandleFunc("/api/v1/flows/{flowId}/versions", applyMiddleware(router.flowHandler.HandleFlowVersions))
	mux.HandleFunc("/api/v1/flows/{flowId}/versions/", applyMiddleware(router.flowHandler.HandleFlowVersion))

	// Flow run endpoints
	mux.HandleFunc("/api/v1/projects/{projectId}/flow-runs", applyMiddleware(router.flowHandler.HandleFlowRuns))
	mux.HandleFunc("/api/v1/flow-runs/", applyMiddleware(router.flowHandler.HandleFlowRun))

	// Flow execution endpoints
	mux.HandleFunc("/api/v1/flows/{flowId}/execute", applyMiddleware(router.flowHandler.ExecuteFlow))
	mux.HandleFunc("/api/v1/flow-runs/{runId}/pause", applyMiddleware(router.flowHandler.PauseFlowRun))
	mux.HandleFunc("/api/v1/flow-runs/{runId}/resume", applyMiddleware(router.flowHandler.ResumeFlowRun))
	mux.HandleFunc("/api/v1/flow-runs/{runId}/cancel", applyMiddleware(router.flowHandler.CancelFlowRun))

	// Step run endpoints
	mux.HandleFunc("/api/v1/flow-runs/{runId}/steps", applyMiddleware(router.flowHandler.GetStepRuns))

	// WebSocket endpoints (apply auth middleware but not CORS to avoid interfering with WebSocket upgrade)
	authOnlyMiddleware := func(handler http.HandlerFunc) http.HandlerFunc {
		return middleware.AuthMiddleware(router.logger)(handler)
	}
	mux.HandleFunc("/ws/execution", authOnlyMiddleware(router.websocketHandler.HandleExecutionWebSocket))

	return mux
}
