package utils

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// CustomClaims stores the data we embed in JWTs.
type CustomClaims struct {
	UserID string `json:"sub"`
	Email  string `json:"email"`
	Name   string `json:"name"`
	jwt.RegisteredClaims
}

var (
	jwtSecretEnv     = "JWT_SECRET"
	defaultTokenLife = 15 * time.Minute
)

func getSigningKey() ([]byte, error) {
	secret := os.Getenv(jwtSecretEnv)
	if secret == "" {
		return nil, errors.New("JWT_SECRET env var not set")
	}
	return []byte(secret), nil
}

// GenerateToken signs and returns a JWT.
func GenerateToken(userID, email, name string, ttl ...time.Duration) (string, error) {
	life := defaultTokenLife
	if len(ttl) > 0 {
		life = ttl[0]
	}

	claims := &CustomClaims{
		UserID: userID,
		Email:  email,
		Name:   name,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(life)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	key, err := getSigningKey()
	if err != nil {
		return "", err
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(key)
}

// ParseToken verifies a JWT and returns its claims.
func ParseToken(tokenStr string) (*CustomClaims, error) {
	key, err := getSigningKey()
	if err != nil {
		return nil, err
	}

	parsed, err := jwt.ParseWithClaims(tokenStr, &CustomClaims{}, func(t *jwt.Token) (interface{}, error) {
		return key, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := parsed.Claims.(*CustomClaims)
	if !ok || !parsed.Valid {
		return nil, errors.New("invalid token claims")
	}

	return claims, nil
}
