package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"testing"
	"time"
)

func TestValidateRejectsExpiredCredential(t *testing.T) {
	now := time.Now()
	claims := Claims{
		RoomID:        "room-a",
		ParticipantID: "participant-a",
		IssuedAt:      now.Add(-time.Minute).Unix(),
		ExpiresAt:     now.Add(time.Minute).Unix(),
		CanPublish:    true,
		CanSubscribe:  true,
	}
	token, err := Sign(claims, []byte("test-secret"))
	if err != nil {
		t.Fatalf("sign credential: %v", err)
	}

	_, err = Validate(token, []byte("test-secret"), now.Add(2*time.Minute))
	if !errors.Is(err, ErrExpiredCredential) {
		t.Fatalf("expected expired credential, got %v", err)
	}
}

func TestValidateAcceptsRoomScopedCredential(t *testing.T) {
	now := time.Now()
	claims := Claims{
		RoomID:        "room-a",
		ParticipantID: "participant-a",
		IssuedAt:      now.Add(-time.Second).Unix(),
		ExpiresAt:     now.Add(time.Minute).Unix(),
		CanSubscribe:  true,
	}
	token, err := Sign(claims, []byte("test-secret"))
	if err != nil {
		t.Fatalf("sign credential: %v", err)
	}

	got, err := Validate(token, []byte("test-secret"), now)
	if err != nil {
		t.Fatalf("validate credential: %v", err)
	}
	if got.RoomID != "room-a" || got.ParticipantID != "participant-a" {
		t.Fatalf("unexpected scope: %+v", got)
	}
}

func TestSignUsesStandardJWTTimeClaimNames(t *testing.T) {
	now := time.Now()
	claims := Claims{
		RoomID:        "room-a",
		ParticipantID: "participant-a",
		IssuedAt:      now.Add(-time.Second).Unix(),
		ExpiresAt:     now.Add(time.Minute).Unix(),
		CanSubscribe:  true,
	}
	token, err := Sign(claims, []byte("test-secret"))
	if err != nil {
		t.Fatalf("sign credential: %v", err)
	}

	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		t.Fatalf("expected payload and signature, got %d parts", len(parts))
	}
	var payload map[string]json.RawMessage
	decoded, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		t.Fatalf("decode payload: %v", err)
	}
	if err := json.Unmarshal(decoded, &payload); err != nil {
		t.Fatalf("decode claims: %v", err)
	}
	for _, key := range []string{"iat", "exp"} {
		if _, ok := payload[key]; !ok {
			t.Fatalf("expected standard claim %q", key)
		}
	}
	for _, legacyKey := range []string{"issuedAt", "expiresAt"} {
		if _, ok := payload[legacyKey]; ok {
			t.Fatalf("legacy claim %q must not be emitted", legacyKey)
		}
	}
}

func TestValidateRejectsLegacyTimeClaimNames(t *testing.T) {
	now := time.Now()
	legacyPayload := map[string]any{
		"roomId":        "room-a",
		"participantId": "participant-a",
		"issuedAt":      now.Add(-time.Second).Unix(),
		"expiresAt":     now.Add(time.Minute).Unix(),
		"canSubscribe":  true,
	}
	raw, err := json.Marshal(legacyPayload)
	if err != nil {
		t.Fatalf("marshal legacy claims: %v", err)
	}
	encoded := base64.RawURLEncoding.EncodeToString(raw)
	mac := hmac.New(sha256.New, []byte("test-secret"))
	_, _ = mac.Write([]byte(encoded))
	token := encoded + "." + base64.RawURLEncoding.EncodeToString(mac.Sum(nil))

	_, err = Validate(token, []byte("test-secret"), now)
	if !errors.Is(err, ErrInvalidClaims) {
		t.Fatalf("expected legacy claims to be rejected, got %v", err)
	}
}

func TestValidateRejectsInvalidSignature(t *testing.T) {
	now := time.Now()
	claims := Claims{
		RoomID:        "room-a",
		ParticipantID: "participant-a",
		IssuedAt:      now.Add(-time.Second).Unix(),
		ExpiresAt:     now.Add(time.Minute).Unix(),
		CanSubscribe:  true,
	}
	token, err := Sign(claims, []byte("test-secret"))
	if err != nil {
		t.Fatalf("sign credential: %v", err)
	}

	_, err = Validate(token, []byte("wrong-secret"), now)
	if !errors.Is(err, ErrInvalidSignature) {
		t.Fatalf("expected invalid signature, got %v", err)
	}
}
