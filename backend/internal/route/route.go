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
	workflowHandler    *handlers.WorkflowHandler
	integrationHandler *handlers.IntegrationHandler
	executionHandler   *handlers.ExecutionHandler
	authHandler        *handlers.AuthHandler
	userHandler        *handlers.UserHandler
	logger             *logger.Logger
}

func NewRouter(agentService *services.AgentService, userService *services.UserService, workflowService *services.WorkflowService, integrationService *services.IntegrationService, executionService *services.ExecutionService, authService *services.AuthService) *Router {
	return &Router{
		agentHandler:       handlers.NewAgentHandler(agentService),
		workflowHandler:    handlers.NewWorkflowHandler(workflowService),
		integrationHandler: handlers.NewIntegrationHandler(integrationService),
		executionHandler:   handlers.NewExecutionHandler(executionService),
		authHandler:        handlers.NewAuthHandler(authService),
		userHandler:        handlers.NewUserHandler(userService),
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

// executionsHandler routes execution requests to appropriate handlers
func (r *Router) executionsHandler(w http.ResponseWriter, req *http.Request) {
	switch req.Method {
	case "GET":
		r.executionHandler.GetExecutions(w, req)
	case "POST":
		r.executionHandler.CreateExecution(w, req)
	default:
		utils.RespondWithError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (r *Router) executionByIDHandler(w http.ResponseWriter, req *http.Request) {
	switch req.Method {
	case "GET":
		r.executionHandler.GetExecution(w, req)
	default:
		utils.RespondWithError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// workflowsHandler routes workflow requests to appropriate handlers
func (r *Router) workflowsHandler(w http.ResponseWriter, req *http.Request) {
	switch req.Method {
	case "GET":
		r.workflowHandler.GetWorkflows(w, req)
	case "POST":
		r.workflowHandler.CreateWorkflow(w, req)
	default:
		utils.RespondWithError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// workflowByIDHandler routes individual workflow requests
func (r *Router) workflowByIDHandler(w http.ResponseWriter, req *http.Request) {
	switch req.Method {
	case "GET":
		r.workflowHandler.GetWorkflow(w, req)
	case "PUT":
		r.workflowHandler.UpdateWorkflow(w, req)
	case "DELETE":
		r.workflowHandler.DeleteWorkflow(w, req)
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

	// Executions endpoints
	mux.HandleFunc("/api/executions", applyMiddleware(router.executionsHandler))
	mux.HandleFunc("/api/executions/", applyMiddleware(router.executionByIDHandler))

	// Workflows endpoints
	mux.HandleFunc("/api/workflows", applyMiddleware(router.workflowsHandler))
	mux.HandleFunc("/api/workflows/", applyMiddleware(router.workflowByIDHandler))

	return mux
}
