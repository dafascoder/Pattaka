package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"backend/internal/config"
	"backend/internal/db"
	"backend/internal/logger"
	"backend/internal/middleware"
	"backend/internal/route"
	"backend/internal/services"
)

func main() {
	// Initialize logger
	logConfig := &logger.Config{
		Level:      logger.LogLevel(getEnv("LOG_LEVEL", "info")),
		Format:     getEnv("LOG_FORMAT", "console"),
		TimeFormat: getEnv("LOG_TIME_FORMAT", "2006-01-02T15:04:05Z07:00"),
	}
	logger.Initialize(logConfig)
	log := logger.Get()

	log.Info("Starting Voltig Agent Builder Platform API")

	// Load configuration
	cfg := config.Load()
	log.WithFields(map[string]interface{}{
		"port":    cfg.Port,
		"db_host": getEnv("DB_HOST", "localhost"),
		"db_port": getEnv("DB_PORT", "5432"),
		"db_name": getEnv("DB_NAME", "voltig"),
	}).Info("Configuration loaded")

	// Initialize database connection
	ctx := context.Background()
	database, err := db.NewDB(ctx)
	if err != nil {
		log.WithError(err).Fatal("Failed to connect to database")
	}
	defer database.Close()

	log.Info("Successfully connected to database")

	// Initialize services
	agentService := services.NewAgentService(database)
	workflowService := services.NewWorkflowService(database)
	integrationService := services.NewIntegrationService(database)
	executionService := services.NewExecutionService(database)
	authService := services.NewAuthService(database)
	userService := services.NewUserService(database)
	log.Info("Services initialized")

	// Initialize router
	router := route.NewRouter(agentService, userService, workflowService, integrationService, executionService, authService)

	// Setup middleware chain
	allowedOrigins := []string{
		cfg.FrontendURL,
	}

	// Create middleware chain
	middlewareChain := func(handler http.HandlerFunc) http.HandlerFunc {
		// Apply middleware in reverse order (last applied = first executed)
		handler = middleware.ErrorHandlingMiddleware(log)(handler)
		handler = middleware.LoggingMiddleware(log)(handler)
		handler = middleware.RateLimitMiddleware(100, log)(handler) // 100 requests per minute
		handler = middleware.AuthMiddleware(log)(handler)
		handler = middleware.CORSMiddleware(allowedOrigins)(handler)
		return handler
	}

	// Setup routes with middleware
	mux := router.SetupRoutesWithMiddleware(middlewareChain)

	// Start server
	port := ":" + cfg.Port
	log.WithFields(map[string]interface{}{
		"port":            cfg.Port,
		"allowed_origins": allowedOrigins,
		"log_level":       logConfig.Level,
	}).Info("Server starting")

	server := &http.Server{
		Addr:    port,
		Handler: mux,
	}

	// Start server in a goroutine
	go func() {
		log.Info("Server is starting...")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.WithError(err).Fatal("Server failed to start")
		}
	}()

	log.Info("Server started successfully")

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Info("Shutting down server...")

	// Create a deadline to wait for graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Attempt graceful shutdown
	if err := server.Shutdown(ctx); err != nil {
		log.WithError(err).Error("Server forced to shutdown")
	} else {
		log.Info("Server exited gracefully")
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
