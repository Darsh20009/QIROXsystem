package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

var (
	ErrMalformedCredential = errors.New("malformed media credential")
	ErrInvalidSignature    = errors.New("invalid media credential signature")
	ErrExpiredCredential   = errors.New("expired media credential")
	ErrInvalidClaims       = errors.New("invalid media credential claims")
)

type Claims struct {
	RoomID         string `json:"roomId"`
	ParticipantID  string `json:"participantId"`
	WorkspaceID    string `json:"workspaceId,omitempty"`
	IssuedAt       int64  `json:"iat"`
	ExpiresAt      int64  `json:"exp"`
	CanPublish     bool   `json:"canPublish"`
	CanSubscribe   bool   `json:"canSubscribe"`
	CanScreenShare bool   `json:"canScreenShare"`
}

func Sign(claims Claims, secret []byte) (string, error) {
	if err := validateClaims(claims, time.Now()); err != nil {
		return "", err
	}
	if len(secret) == 0 {
		return "", errors.New("credential signing secret is required")
	}

	payload, err := json.Marshal(claims)
	if err != nil {
		return "", fmt.Errorf("marshal claims: %w", err)
	}
	encodedPayload := base64.RawURLEncoding.EncodeToString(payload)
	signature := signPayload(encodedPayload, secret)
	return encodedPayload + "." + base64.RawURLEncoding.EncodeToString(signature), nil
}

func Validate(token string, secret []byte, now time.Time) (Claims, error) {
	if token == "" || len(secret) == 0 {
		return Claims{}, ErrMalformedCredential
	}
	parts := strings.Split(token, ".")
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return Claims{}, ErrMalformedCredential
	}

	expected := signPayload(parts[0], secret)
	actual, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil || !hmac.Equal(expected, actual) {
		return Claims{}, ErrInvalidSignature
	}

	payload, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return Claims{}, ErrMalformedCredential
	}
	var claims Claims
	if err := json.Unmarshal(payload, &claims); err != nil {
		return Claims{}, ErrMalformedCredential
	}
	if err := validateClaims(claims, now); err != nil {
		return Claims{}, err
	}
	return claims, nil
}

func signPayload(payload string, secret []byte) []byte {
	mac := hmac.New(sha256.New, secret)
	_, _ = mac.Write([]byte(payload))
	return mac.Sum(nil)
}

func validateClaims(claims Claims, now time.Time) error {
	if claims.RoomID == "" || claims.ParticipantID == "" ||
		claims.IssuedAt <= 0 || claims.ExpiresAt <= claims.IssuedAt {
		return ErrInvalidClaims
	}
	if now.Unix() >= claims.ExpiresAt {
		return ErrExpiredCredential
	}
	return nil
}
