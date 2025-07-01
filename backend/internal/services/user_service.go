package services

import (
	"backend/internal/db"
	"backend/internal/models"
	"context"
)

type UserService struct {
	db *db.DB
}

func NewUserService(db *db.DB) *UserService {
	return &UserService{db: db}
}

func (s *UserService) GetUser(id string) (*models.User, error) {
	user, err := s.db.Queries().GetUserByID(context.Background(), id)
	if err != nil {
		return nil, err
	}
	return &models.User{
		ID:            user.ID,
		Name:          user.Name,
		Email:         user.Email,
		Image:         user.Image.String,
		EmailVerified: user.EmailVerified,
		CreatedAt:     user.CreatedAt.Time,
		UpdatedAt:     user.UpdatedAt.Time,
	}, nil
}
