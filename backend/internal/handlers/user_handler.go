package handlers

import (
	"backend/internal/middleware"
	"backend/internal/services"
	"backend/utils"
	"net/http"
)

type UserHandler struct {
	service *services.UserService
}

func NewUserHandler(service *services.UserService) *UserHandler {
	return &UserHandler{service: service}
}

func (h *UserHandler) AuthenticatedUser(w http.ResponseWriter, r *http.Request) {

	if authContext, ok := middleware.GetAuthContext(r); ok {
		userID := authContext.User.ID
		user, err := h.service.GetUser(userID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		utils.RespondWithJSON(w, user)
	} else {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
	}
}
