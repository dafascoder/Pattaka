package services

import (
	"context"
	"errors"
	"time"

	"backend/internal/db"
	sqlcdb "backend/internal/db/sqlc"
	"backend/internal/logger"
	"backend/utils"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// AuthService handles authentication related operations (register, login).
// It relies on the sqlc-generated Queries API for database access to ensure type-safety
// and maintainability. For operations that don't yet have generated queries
// (e.g., inserting the credential password into the account table or updating
// the last_login column) it temporarily falls back to raw SQL execution.
type AuthService struct {
	db     *db.DB
	logger *logger.Logger
}

func NewAuthService(database *db.DB) *AuthService {
	return &AuthService{
		db:     database,
		logger: logger.Get(),
	}
}

// Register creates a new user and credentials account, returning a signed JWT.
func (s *AuthService) Register(ctx context.Context, name, email, password string) (string, error) {
	s.logger.WithFields(map[string]interface{}{
		"email": email,
		"name":  name,
	}).Info("Registration attempt")

	// Check if the user already exists
	_, err := s.db.Queries().GetUserByEmail(ctx, email)
	if err == nil {
		s.logger.WithField("email", email).Warn("Registration failed - user already exists")
		return "", errors.New("user already exists")
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		s.logger.WithError(err).WithField("email", email).Error("Registration failed - database error")
		return "", err
	}

	// Begin a transaction
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		s.logger.WithError(err).Error("Registration failed - transaction start error")
		return "", err
	}
	defer tx.Rollback(ctx)

	// Use sqlc queries within the transaction
	qtx := s.db.Queries().WithTx(tx)

	uid := uuid.New().String()
	now := time.Now()

	// Create user
	userParams := sqlcdb.CreateUserParams{
		ID:            uid,
		Name:          name,
		Email:         email,
		EmailVerified: false,
		Image:         pgtype.Text{Valid: false},
		CreatedAt:     pgtype.Timestamp{Time: now, Valid: true},
		UpdatedAt:     pgtype.Timestamp{Time: now, Valid: true},
	}

	if _, err := qtx.CreateUser(ctx, userParams); err != nil {
		s.logger.WithError(err).WithFields(map[string]interface{}{
			"email":   email,
			"user_id": uid,
		}).Error("Registration failed - user creation error")
		return "", err
	}

	// Hash password
	hash, err := utils.HashPassword(password)
	if err != nil {
		s.logger.WithError(err).WithField("user_id", uid).Error("Registration failed - password hashing error")
		return "", err
	}

	// Insert account (raw exec until sqlc supports password field)
	if _, err := tx.Exec(ctx, `INSERT INTO account(id, account_id, provider, provider_id, user_id, password, created_at, updated_at) VALUES ($1,$2,'credentials','credentials',$3,$4,now(),now())`, uuid.New().String(), uid, uid, hash); err != nil {
		s.logger.WithError(err).WithField("user_id", uid).Error("Registration failed - account creation error")
		return "", err
	}

	if err := tx.Commit(ctx); err != nil {
		s.logger.WithError(err).WithField("user_id", uid).Error("Registration failed - transaction commit error")
		return "", err
	}

	s.logger.WithFields(map[string]interface{}{
		"user_id": uid,
		"email":   email,
		"name":    name,
	}).Info("User registered successfully")

	return utils.GenerateToken(uid, email, name)
}

// Login validates credentials and returns a signed JWT.
func (s *AuthService) Login(ctx context.Context, email, password string) (string, error) {
	s.logger.WithField("email", email).Info("Login attempt")

	// Fetch user by email
	user, err := s.db.Queries().GetUserByEmail(ctx, email)
	if err != nil {
		s.logger.WithField("email", email).Warn("Login failed - user not found")
		return "", errors.New("invalid credentials")
	}

	// Fetch associated account
	account, err := s.db.Queries().GetAccountByUserID(ctx, user.ID)
	if err != nil {
		s.logger.WithFields(map[string]interface{}{
			"user_id": user.ID,
			"email":   email,
		}).Warn("Login failed - account not found")
		return "", errors.New("invalid credentials")
	}

	if account.Provider != "credentials" {
		s.logger.WithFields(map[string]interface{}{
			"user_id":  user.ID,
			"email":    email,
			"provider": account.Provider,
		}).Warn("Login failed - unsupported authentication provider")
		return "", errors.New("invalid credentials")
	}

	if !account.Password.Valid {
		s.logger.WithFields(map[string]interface{}{
			"user_id":    user.ID,
			"email":      email,
			"account_id": account.ID,
		}).Warn("Login failed - no password configured")
		return "", errors.New("invalid credentials")
	}

	if !utils.CheckPassword(account.Password.String, password) {
		s.logger.WithFields(map[string]interface{}{
			"user_id": user.ID,
			"email":   email,
		}).Warn("Login failed - invalid password")
		return "", errors.New("invalid credentials")
	}

	// Update last_login asynchronously
	go func(id string) {
		_, _ = s.db.Pool().Exec(context.Background(), `UPDATE "user" SET "last_login"=now(), "updatedAt"=now() WHERE id=$1`, id)
	}(user.ID)

	s.logger.WithFields(map[string]interface{}{
		"user_id": user.ID,
		"email":   email,
		"name":    user.Name,
	}).Info("User logged in successfully")

	return utils.GenerateToken(user.ID, email, user.Name)
}

func (s *AuthService) Logout(ctx context.Context, id string) error {
	s.logger.WithField("user_id", id).Info("User logout")
	_, err := s.db.Pool().Exec(ctx, `UPDATE "user" SET "last_login"=now(), "updatedAt"=now() WHERE id=$1`, id)
	if err != nil {
		s.logger.WithError(err).WithField("user_id", id).Error("Logout update failed")
	}
	return err
}
