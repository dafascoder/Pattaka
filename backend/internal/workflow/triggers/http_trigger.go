package triggers

import (
	"backend/internal/workflow/interfaces"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/google/uuid"
)

// HTTPTrigger implements HTTP webhook trigger
type HTTPTrigger struct {
	port       int
	path       string
	method     string
	server     *http.Server
	handler    interfaces.TriggerHandler
	workflowID uuid.UUID
}

// NewHTTPTrigger creates a new HTTP trigger
func NewHTTPTrigger() *HTTPTrigger {
	return &HTTPTrigger{}
}

// GetType returns the trigger type
func (t *HTTPTrigger) GetType() string {
	return "http"
}

// Initialize sets up the HTTP trigger
func (t *HTTPTrigger) Initialize(config map[string]interface{}) error {
	// Parse configuration
	port, ok := config["port"].(float64)
	if !ok {
		port = 8081 // Default port
	}
	t.port = int(port)

	path, ok := config["path"].(string)
	if !ok {
		return fmt.Errorf("path is required for HTTP trigger")
	}
	t.path = path

	method, ok := config["method"].(string)
	if !ok {
		method = "POST" // Default method
	}
	t.method = strings.ToUpper(method)

	workflowIDStr, ok := config["workflow_id"].(string)
	if !ok {
		return fmt.Errorf("workflow_id is required for HTTP trigger")
	}

	workflowID, err := uuid.Parse(workflowIDStr)
	if err != nil {
		return fmt.Errorf("invalid workflow_id: %w", err)
	}
	t.workflowID = workflowID

	return nil
}

// Start begins listening for HTTP requests
func (t *HTTPTrigger) Start(ctx context.Context, handler interfaces.TriggerHandler) error {
	t.handler = handler

	mux := http.NewServeMux()
	mux.HandleFunc(t.path, t.handleRequest)

	t.server = &http.Server{
		Addr:    fmt.Sprintf(":%d", t.port),
		Handler: mux,
	}

	go func() {
		log.Printf("HTTP trigger listening on port %d, path %s", t.port, t.path)
		if err := t.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("HTTP trigger server error: %v", err)
		}
	}()

	// Wait for shutdown signal
	<-ctx.Done()
	return t.Stop(context.Background())
}

// Stop stops the HTTP server
func (t *HTTPTrigger) Stop(ctx context.Context) error {
	if t.server != nil {
		log.Printf("Stopping HTTP trigger on port %d", t.port)
		return t.server.Shutdown(ctx)
	}
	return nil
}

// Validate checks the trigger configuration
func (t *HTTPTrigger) Validate(config map[string]interface{}) error {
	if _, ok := config["path"]; !ok {
		return fmt.Errorf("path is required for HTTP trigger")
	}

	if _, ok := config["workflow_id"]; !ok {
		return fmt.Errorf("workflow_id is required for HTTP trigger")
	}

	if method, ok := config["method"]; ok {
		methodStr, ok := method.(string)
		if !ok {
			return fmt.Errorf("method must be a string")
		}
		validMethods := []string{"GET", "POST", "PUT", "DELETE", "PATCH"}
		methodUpper := strings.ToUpper(methodStr)
		valid := false
		for _, m := range validMethods {
			if m == methodUpper {
				valid = true
				break
			}
		}
		if !valid {
			return fmt.Errorf("invalid HTTP method: %s", methodStr)
		}
	}

	return nil
}

// handleRequest handles incoming HTTP requests
func (t *HTTPTrigger) handleRequest(w http.ResponseWriter, r *http.Request) {
	// Check method
	if r.Method != t.method {
		http.Error(w, fmt.Sprintf("Method not allowed. Expected %s", t.method), http.StatusMethodNotAllowed)
		return
	}

	// Parse request data
	triggerData := make(map[string]interface{})

	// Add request metadata
	triggerData["method"] = r.Method
	triggerData["url"] = r.URL.String()
	triggerData["headers"] = r.Header
	triggerData["remote_addr"] = r.RemoteAddr

	// Parse query parameters
	if len(r.URL.Query()) > 0 {
		queryParams := make(map[string]interface{})
		for k, v := range r.URL.Query() {
			if len(v) == 1 {
				queryParams[k] = v[0]
			} else {
				queryParams[k] = v
			}
		}
		triggerData["query"] = queryParams
	}

	// Parse request body for POST/PUT/PATCH
	if r.Method == "POST" || r.Method == "PUT" || r.Method == "PATCH" {
		contentType := r.Header.Get("Content-Type")

		if strings.Contains(contentType, "application/json") {
			var body map[string]interface{}
			if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
				log.Printf("Failed to parse JSON body: %v", err)
				http.Error(w, "Invalid JSON body", http.StatusBadRequest)
				return
			}
			triggerData["body"] = body
		} else if strings.Contains(contentType, "application/x-www-form-urlencoded") {
			if err := r.ParseForm(); err != nil {
				log.Printf("Failed to parse form data: %v", err)
				http.Error(w, "Invalid form data", http.StatusBadRequest)
				return
			}
			formData := make(map[string]interface{})
			for k, v := range r.PostForm {
				if len(v) == 1 {
					formData[k] = v[0]
				} else {
					formData[k] = v
				}
			}
			triggerData["form"] = formData
		}
	}

	// Execute workflow
	ctx := context.Background()
	fmt.Println("ctx", ctx)
	fmt.Println("t.workflowID", t.workflowID)
	fmt.Println("triggerData", triggerData)
	if err := t.handler(ctx, t.workflowID, triggerData); err != nil {
		log.Printf("Workflow execution failed: %v", err)
		http.Error(w, "Workflow execution failed", http.StatusInternalServerError)
		return
	}

	// Send success response
	w.Header().Set("Content-Type", "application/json")
	response := map[string]interface{}{
		"success": true,
		"message": "Workflow triggered successfully",
	}
	json.NewEncoder(w).Encode(response)
}
