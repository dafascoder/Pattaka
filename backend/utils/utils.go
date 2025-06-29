package utils

import (
	"backend/internal/models"
	"encoding/json"
	"net/http"
	"strings"
)

func RespondWithError(w http.ResponseWriter, message string, code int) {
	response := models.APIResponse{
		Success: false,
		Error:   message,
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(response)
}

func RespondWithJSON(w http.ResponseWriter, data interface{}) {
	response := models.APIResponse{
		Success: true,
		Data:    data,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func CorsHandler(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

// ExtractSessionToken extracts the better-auth session token from cookies
func ExtractSessionToken(r *http.Request) string {
	// Try to get the session token from cookies
	cookie, err := r.Cookie("better-auth.session-token")
	if err == nil {
		return cookie.Value
	}

	// Fallback to Authorization header
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}

	return ""
}

// ValidateSessionWithFrontend validates session by making a request to the frontend auth endpoint
func ValidateSessionWithFrontend(sessionToken string) (*SessionData, error) {
	// This would typically make a request to your frontend's auth API
	// For now, we'll return a placeholder - you'd implement the actual validation
	// by calling the better-auth session validation endpoint
	return nil, nil
}

// SessionData represents the session information from better-auth
type SessionData struct {
	User struct {
		ID    string `json:"id"`
		Email string `json:"email"`
		Name  string `json:"name"`
		Image string `json:"image"`
	} `json:"user"`
	Session struct {
		ID        string `json:"id"`
		ExpiresAt string `json:"expiresAt"`
	} `json:"session"`
}
