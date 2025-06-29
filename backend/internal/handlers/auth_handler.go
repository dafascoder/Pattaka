package handlers

import (
	"encoding/json"
	"net/http"

	"backend/internal/logger"
	"backend/internal/services"
	"backend/utils"
)

type AuthHandler struct {
	service *services.AuthService
	logger  *logger.Logger
}

func NewAuthHandler(service *services.AuthService) *AuthHandler {
	return &AuthHandler{
		service: service,
		logger:  logger.Get(),
	}
}

// registerRequest models incoming JSON for registration.
type registerRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// loginRequest models incoming JSON for login.
type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Register handles POST /api/auth/register
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.RespondWithError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	token, err := h.service.Register(r.Context(), req.Name, req.Email, req.Password)
	if err != nil {
		utils.RespondWithError(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Set token as httpOnly cookie as convenience.
	h.setAuthCookie(w, token)

	utils.RespondWithJSON(w, map[string]string{"token": token})
}

// Login handles POST /api/auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.RespondWithError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	token, err := h.service.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		utils.RespondWithError(w, err.Error(), http.StatusUnauthorized)
		return
	}

	h.setAuthCookie(w, token)

	utils.RespondWithJSON(w, map[string]string{"token": token})
}

// Logout handles POST /api/auth/logout – clears the auth cookie
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.RespondWithError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Clear cookie by setting Max-Age to -1
	expired := &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	}
	w.Header().Add("Set-Cookie", expired.String())

	utils.RespondWithJSON(w, map[string]string{"message": "logged out"})
}

func (h *AuthHandler) setAuthCookie(w http.ResponseWriter, token string) {
	cookie := &http.Cookie{
		Name:     "access_token",
		Value:    token,
		HttpOnly: true,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	}
	w.Header().Add("Set-Cookie", cookie.String())
}
