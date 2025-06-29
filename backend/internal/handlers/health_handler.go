package handlers

import (
	"net/http"
	"time"

	"backend/utils"
)

func HealthHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	healthData := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().Format(time.RFC3339),
		"service":   "Voltig Agent Builder Platform API",
	}

	utils.RespondWithJSON(w, healthData)
}
