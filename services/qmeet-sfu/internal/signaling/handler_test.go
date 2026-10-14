package signaling

import (
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/qirox/qmeet-sfu/internal/media"
)

func TestValidateCandidateRejectsEmptyAndOversizedValues(t *testing.T) {
	if err := validateCandidate(media.ICECandidate{}); err == nil {
		t.Fatal("expected empty ICE candidate to be rejected")
	}
	if err := validateCandidate(media.ICECandidate{Candidate: strings.Repeat("x", 8193)}); err == nil {
		t.Fatal("expected oversized ICE candidate to be rejected")
	}
	if err := validateCandidate(media.ICECandidate{Candidate: "candidate:1 1 UDP 1 127.0.0.1 9 typ host"}); err != nil {
		t.Fatalf("expected valid ICE candidate, got %v", err)
	}
}

func TestValidEnvelopeRejectsUnknownVersionAndOversizedType(t *testing.T) {
	if validEnvelope(wireMessage{Version: 2, Type: "media.hello"}) {
		t.Fatal("expected unsupported protocol version to be rejected")
	}
	if validEnvelope(wireMessage{Version: 1, Type: strings.Repeat("x", 65)}) {
		t.Fatal("expected oversized message type to be rejected")
	}
	if !validEnvelope(wireMessage{Version: 1, Type: "media.leave"}) {
		t.Fatal("expected known-sized envelope to be accepted")
	}
}

func TestOriginSameHostAndAllowlist(t *testing.T) {
	handler := &Handler{config: Config{AllowedOrigins: []string{"https://trusted.example"}}}
	request := httptest.NewRequest("GET", "https://media.example/ws", nil)
	request.Host = "media.example"
	request.Header.Set("Origin", "https://trusted.example")
	if !handler.checkOrigin(request) {
		t.Fatal("expected configured origin to be allowed")
	}
	request.Header.Set("Origin", "https://attacker.example")
	if handler.checkOrigin(request) {
		t.Fatal("expected untrusted origin to be rejected")
	}
}
