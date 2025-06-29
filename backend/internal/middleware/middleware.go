package middleware

import (
	"context"
	"fmt"
	"net/http"
	"runtime/debug"
	"strings"
	"time"

	"backend/internal/logger"
	"backend/utils"
)

// SessionData represents Better Auth session data
type SessionData struct {
	ID        string    `json:"id"`
	Token     string    `json:"token"`
	UserID    string    `json:"userId"`
	ExpiresAt time.Time `json:"expiresAt"`
	IPAddress string    `json:"ipAddress"`
	UserAgent string    `json:"userAgent"`
}

// UserData represents Better Auth user data
type UserData struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	Email         string    `json:"email"`
	EmailVerified bool      `json:"emailVerified"`
	Image         string    `json:"image"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

// AuthContext represents the authenticated user context
type AuthContext struct {
	User    UserData    `json:"user"`
	Session SessionData `json:"session"`
}

// ContextKey represents context keys for middleware
type ContextKey string

const (
	AuthContextKey ContextKey = "auth_context"
	UserIDKey      ContextKey = "user_id"
	SessionIDKey   ContextKey = "session_id"
)

// RequestID middleware adds a unique request ID to each request
func RequestID(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		requestID := generateRequestID()
		ctx := context.WithValue(r.Context(), "request_id", requestID)
		w.Header().Set("X-Request-ID", requestID)
		next(w, r.WithContext(ctx))
	}
}

// LoggingMiddleware logs HTTP requests and responses
func LoggingMiddleware(logger *logger.Logger) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			// Create a response writer wrapper to capture status code
			wrapper := &responseWriter{
				ResponseWriter: w,
				statusCode:     http.StatusOK,
			}

			// Log the request
			logger.WithFields(map[string]interface{}{
				"method":     r.Method,
				"path":       r.URL.Path,
				"query":      r.URL.RawQuery,
				"user_agent": r.UserAgent(),
				"client_ip":  getClientIP(r),
				"referer":    r.Referer(),
			}).Info("HTTP Request Started")

			// Call the next handler
			next(wrapper, r)

			// Calculate duration
			duration := time.Since(start)

			// Log the response
			logger.LogHTTPRequest(
				r.Method,
				r.URL.Path,
				r.UserAgent(),
				getClientIP(r),
				wrapper.statusCode,
				duration,
			)
		}
	}
}

// RecoveryMiddleware recovers from panics and logs them
func RecoveryMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				// Log the panic with stack trace
				log := logger.Get().WithFields(map[string]interface{}{
					"request_id": getRequestID(r),
					"method":     r.Method,
					"path":       r.URL.Path,
					"panic":      err,
					"stack":      string(debug.Stack()),
				})

				log.Errorf("Panic recovered: %v", err)

				// Return 500 error
				utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
			}
		}()

		next(w, r)
	}
}

// AuthMiddleware validates sessions
func AuthMiddleware(logger *logger.Logger) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			// Skip auth for health check and public endpoints
			if isPublicEndpoint(r.URL.Path) {
				next(w, r)
				return
			}

			// Get session token from cookie or header
			sessionToken := getSessionToken(r)
			if sessionToken == "" {
				logger.Warn("No session token provided")
				utils.RespondWithError(w, "Authentication required", http.StatusUnauthorized)
				return
			}

			// Validate with Voltig's JWT authentication
			authContext, err := validateCustomJWT(sessionToken, logger)
			if err != nil {
				logger.WithError(err).Warn("JWT validation failed")
				utils.RespondWithError(w, "Invalid session", http.StatusUnauthorized)
				return
			}

			// Add auth context to request
			ctx := context.WithValue(r.Context(), AuthContextKey, authContext)
			ctx = context.WithValue(ctx, UserIDKey, authContext.User.ID)
			ctx = context.WithValue(ctx, SessionIDKey, authContext.Session.ID)

			logger.WithFields(map[string]interface{}{
				"user_id":    authContext.User.ID,
				"user_email": authContext.User.Email,
				"session_id": authContext.Session.ID,
			}).Info("User authenticated")

			next(w, r.WithContext(ctx))
		}
	}
}

// ErrorHandlingMiddleware handles panics and errors
func ErrorHandlingMiddleware(logger *logger.Logger) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					logger.WithFields(map[string]interface{}{
						"error":  fmt.Sprintf("%v", err),
						"method": r.Method,
						"path":   r.URL.Path,
					}).Error("Panic recovered")

					utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
				}
			}()

			next(w, r)
		}
	}
}

// CORSMiddleware handles CORS headers
func CORSMiddleware(allowedOrigins []string) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")

			// Check if origin is allowed
			allowed := false
			for _, allowedOrigin := range allowedOrigins {
				if allowedOrigin == "*" || allowedOrigin == origin {
					allowed = true
					break
				}
			}

			if allowed {
				w.Header().Set("Access-Control-Allow-Origin", origin)
			}

			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Max-Age", "86400")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next(w, r)
		}
	}
}

// RateLimitMiddleware implements basic rate limiting
func RateLimitMiddleware(requestsPerMinute int, logger *logger.Logger) func(http.HandlerFunc) http.HandlerFunc {
	// Simple in-memory rate limiter (use Redis in production)
	clients := make(map[string][]time.Time)

	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			clientIP := getClientIP(r)
			now := time.Now()

			// Clean old requests
			if requests, exists := clients[clientIP]; exists {
				var validRequests []time.Time
				for _, reqTime := range requests {
					if now.Sub(reqTime) < time.Minute {
						validRequests = append(validRequests, reqTime)
					}
				}
				clients[clientIP] = validRequests
			}

			// Check rate limit
			if len(clients[clientIP]) >= requestsPerMinute {
				logger.WithField("client_ip", clientIP).Warn("Rate limit exceeded")
				utils.RespondWithError(w, "Rate limit exceeded", http.StatusTooManyRequests)
				return
			}

			// Add current request
			clients[clientIP] = append(clients[clientIP], now)

			next(w, r)
		}
	}
}

// Chain combines multiple middleware functions
func Chain(middlewares ...func(http.HandlerFunc) http.HandlerFunc) func(http.HandlerFunc) http.HandlerFunc {
	return func(final http.HandlerFunc) http.HandlerFunc {
		for i := len(middlewares) - 1; i >= 0; i-- {
			final = middlewares[i](final)
		}
		return final
	}
}

// Helper types and functions

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func generateRequestID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

func getRequestID(r *http.Request) string {
	if id := r.Context().Value("request_id"); id != nil {
		return id.(string)
	}
	return "unknown"
}

func getClientIP(r *http.Request) string {
	// Check X-Forwarded-For header first
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		ips := strings.Split(xff, ",")
		return strings.TrimSpace(ips[0])
	}

	// Check X-Real-IP header
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return strings.TrimSpace(xri)
	}

	// Fall back to RemoteAddr
	ip := r.RemoteAddr
	if colonIndex := strings.LastIndex(ip, ":"); colonIndex != -1 {
		ip = ip[:colonIndex]
	}
	return ip
}

func getSessionToken(r *http.Request) string {
	// Try Authorization header first
	if auth := r.Header.Get("Authorization"); auth != "" {
		if strings.HasPrefix(auth, "Bearer ") {
			return strings.TrimPrefix(auth, "Bearer ")
		}
	}

	// Debug: Log all cookies to understand what Better Auth is sending
	logger := logger.Get()
	logger.WithField("cookies", r.Header.Get("Cookie")).Debug("All cookies received")

	// Primary cookie used by Voltig auth
	if cookie, err := r.Cookie("access_token"); err == nil {
		logger.WithField("cookie_name", "access_token").WithField("token", cookie.Value).Debug("Found access_token cookie")
		return cookie.Value
	}

	// Legacy BetterAuth cookie fallback
	if cookie, err := r.Cookie("session_token"); err == nil {
		logger.WithField("cookie_name", "session_token").WithField("token", cookie.Value).Debug("Found session_token cookie (legacy)")
		return cookie.Value
	}

	// Try custom session header
	if sessionHeader := r.Header.Get("X-Session-Token"); sessionHeader != "" {
		return sessionHeader
	}

	logger.Debug("No session token found in cookies or headers")
	return ""
}

func isPublicEndpoint(path string) bool {
	// Normalise to lower-case so comparison is case-insensitive.
	lowerPath := strings.ToLower(path)

	publicPaths := []string{
		"/api/health",
		"/api/auth/",
	}

	for _, p := range publicPaths {
		if strings.HasPrefix(lowerPath, p) {
			return true
		}
	}

	return false
}

// GetAuthContext retrieves auth context from request context
func GetAuthContext(r *http.Request) (*AuthContext, bool) {
	ctx, ok := r.Context().Value(AuthContextKey).(*AuthContext)
	return ctx, ok
}

// GetUserID retrieves user ID from request context
func GetUserID(r *http.Request) (string, bool) {
	userID, ok := r.Context().Value(UserIDKey).(string)
	return userID, ok
}

// GetSessionID retrieves session ID from request context
func GetSessionID(r *http.Request) (string, bool) {
	sessionID, ok := r.Context().Value(SessionIDKey).(string)
	return sessionID, ok
}

// RequireAuth is a helper to ensure authentication in handlers
func RequireAuth(r *http.Request, w http.ResponseWriter) (*AuthContext, bool) {
	authContext, ok := GetAuthContext(r)
	if !ok {
		utils.RespondWithError(w, "Authentication required", http.StatusUnauthorized)
		return nil, false
	}
	return authContext, true
}

// validateCustomJWT parses a JWT generated by utils.GenerateToken and returns an AuthContext.
func validateCustomJWT(token string, logger *logger.Logger) (*AuthContext, error) {
	logger.WithField("token_prefix", token[:min(20, len(token))]).Debug("Attempting to validate custom JWT")

	claims, err := utils.ParseToken(token)
	if err != nil {
		logger.WithError(err).Debug("Custom JWT validation failed")
		return nil, err
	}

	// Build basic user data from token claims
	userData := UserData{
		ID:            claims.UserID,
		Name:          claims.Name,
		Email:         claims.Email,
		EmailVerified: false,
		Image:         "",
		CreatedAt:     time.Time{},
		UpdatedAt:     time.Time{},
	}

	sessionData := SessionData{
		ID:        "", // Not tracked in custom JWTs
		Token:     token,
		UserID:    claims.UserID,
		ExpiresAt: claims.ExpiresAt.Time,
		IPAddress: "",
		UserAgent: "",
	}

	logger.WithFields(map[string]interface{}{
		"user_id":    userData.ID,
		"user_email": userData.Email,
		"method":     "jwt_custom",
	}).Info("Session validated successfully via custom JWT")

	return &AuthContext{
		User:    userData,
		Session: sessionData,
	}, nil
}
