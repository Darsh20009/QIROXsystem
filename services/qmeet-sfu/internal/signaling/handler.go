package signaling

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/qirox/qmeet-sfu/internal/auth"
	"github.com/qirox/qmeet-sfu/internal/media"
	"github.com/qirox/qmeet-sfu/internal/metrics"
)

const (
	maxMessageBytes = 1 << 20
	helloTimeout    = 10 * time.Second
)

type Config struct {
	ControlSecret  []byte
	AllowedOrigins []string
}

type Handler struct {
	config   Config
	router   media.RouterAPI
	metrics  *metrics.Counters
	upgrader websocket.Upgrader
}

type wireMessage struct {
	Version       int                `json:"v"`
	Type          string             `json:"type"`
	Credential    string             `json:"credential,omitempty"`
	SDP           string             `json:"sdp,omitempty"`
	SDPType       string             `json:"sdpType,omitempty"`
	SessionID     string             `json:"sessionId,omitempty"`
	Candidate     media.ICECandidate `json:"candidate,omitempty"`
	TrackID       string             `json:"trackId,omitempty"`
	ParticipantID string             `json:"participantId,omitempty"`
	Kind          string             `json:"kind,omitempty"`
	Error         string             `json:"error,omitempty"`
}

func NewHandler(config Config, router media.RouterAPI, counters *metrics.Counters) *Handler {
	handler := &Handler{config: config, router: router, metrics: counters}
	handler.upgrader = websocket.Upgrader{
		ReadBufferSize:  16 * 1024,
		WriteBufferSize: 16 * 1024,
		CheckOrigin:     handler.checkOrigin,
	}
	return handler
}

func (h *Handler) ServeHTTP(writer http.ResponseWriter, request *http.Request) {
	connection, err := h.upgrader.Upgrade(writer, request, nil)
	if err != nil {
		return
	}
	connection.SetReadLimit(maxMessageBytes)
	defer connection.Close()

	_ = connection.SetReadDeadline(time.Now().Add(helloTimeout))
	_, payload, err := connection.ReadMessage()
	if err != nil {
		return
	}
	var hello wireMessage
	if err := json.Unmarshal(payload, &hello); err != nil || !validEnvelope(hello) || hello.Type != "media.hello" || hello.Credential == "" {
		_ = writeMessage(connection, &sync.Mutex{}, wireMessage{Version: 1, Type: "media.error"})
		return
	}
	claims, err := auth.Validate(hello.Credential, h.config.ControlSecret, time.Now())
	h.metrics.CredentialValidations.Add(1)
	if err != nil {
		h.metrics.CredentialRejections.Add(1)
		_ = writeMessage(connection, &sync.Mutex{}, wireMessage{Version: 1, Type: "media.error"})
		return
	}
	connectionID := newConnectionID()
	writerMu := &sync.Mutex{}
	callbacks := media.Callbacks{Send: func(event media.Event) {
		_ = writeEvent(connection, writerMu, event)
	}}
	if err := h.router.Join(media.SessionConfig{
		Claims: claims, ConnectionID: connectionID, Callbacks: callbacks,
	}); err != nil {
		h.metrics.ParticipantRejections.Add(1)
		_ = writeMessage(connection, writerMu, wireMessage{Version: 1, Type: "media.error"})
		return
	}
	defer h.router.Leave(connectionID)
	_ = connection.SetReadDeadline(time.Time{})
	if err := writeMessage(connection, writerMu, wireMessage{
		Version: 1, Type: "media.ready", SessionID: connectionID,
	}); err != nil {
		return
	}

	for {
		_, payload, readErr := connection.ReadMessage()
		if readErr != nil {
			return
		}
		var message wireMessage
		if err := json.Unmarshal(payload, &message); err != nil || !validEnvelope(message) {
			_ = writeEvent(connection, writerMu, media.Event{Type: "media.error", Error: "invalid message"})
			continue
		}
		switch message.Type {
		case "media.offer":
			if len(message.SDP) > maxMessageBytes {
				_ = writeEvent(connection, writerMu, media.Event{Type: "media.error", Error: "SDP is too large"})
				continue
			}
			answer, offerErr := h.router.HandleOffer(connectionID, message.SDPType, message.SDP)
			if offerErr != nil {
				_ = writeEvent(connection, writerMu, media.Event{Type: "media.error", Error: "SDP offer rejected"})
				continue
			}
			_ = writeMessage(connection, writerMu, wireMessage{
				Version: 1, Type: "media.answer", SDPType: "answer", SDP: answer,
			})
		case "media.answer":
			if len(message.SDP) > maxMessageBytes {
				_ = writeEvent(connection, writerMu, media.Event{Type: "media.error", Error: "SDP is too large"})
				continue
			}
			if answerErr := h.router.HandleAnswer(connectionID, message.SDPType, message.SDP); answerErr != nil {
				_ = writeEvent(connection, writerMu, media.Event{Type: "media.error", Error: "SDP answer rejected"})
			}
		case "media.restart":
			if restartErr := h.router.Restart(connectionID); restartErr != nil {
				_ = writeEvent(connection, writerMu, media.Event{Type: "media.error", Error: "ICE restart rejected"})
			}
		case "media.ice":
			if err := validateCandidate(message.Candidate); err != nil {
				_ = writeEvent(connection, writerMu, media.Event{Type: "media.error", Error: "invalid ICE candidate"})
				continue
			}
			if err := h.router.AddICE(connectionID, message.Candidate); err != nil {
				_ = writeEvent(connection, writerMu, media.Event{Type: "media.error", Error: "ICE candidate rejected"})
			}
		case "media.leave":
			return
		default:
			_ = writeEvent(connection, writerMu, media.Event{Type: "media.error", Error: "unsupported media message"})
		}
	}
}

func (h *Handler) checkOrigin(request *http.Request) bool {
	origin := request.Header.Get("Origin")
	if origin == "" {
		return true
	}
	for _, allowed := range h.config.AllowedOrigins {
		if allowed == origin {
			return true
		}
	}
	parsed, err := url.Parse(origin)
	if err != nil || parsed.Host == "" {
		return false
	}
	return strings.EqualFold(parsed.Host, request.Host)
}

func validateCandidate(candidate media.ICECandidate) error {
	if len(candidate.Candidate) == 0 || len(candidate.Candidate) > 8192 {
		return errors.New("candidate length is invalid")
	}
	return nil
}

func validEnvelope(message wireMessage) bool {
	return message.Version == 1 && len(message.Type) > 0 && len(message.Type) <= 64
}

func writeEvent(connection *websocket.Conn, mutex *sync.Mutex, event media.Event) error {
	message := wireMessage{Version: 1, Type: event.Type, SDP: event.SDP, SDPType: event.SDPType, Candidate: event.Candidate}
	if event.Error != "" {
		message.Error = event.Error
	}
	if event.Track.ID != "" {
		message.TrackID = event.Track.ID
		message.ParticipantID = event.Track.ParticipantID
		message.Kind = event.Track.Kind
	}
	return writeMessage(connection, mutex, message)
}

func writeMessage(connection *websocket.Conn, mutex *sync.Mutex, message wireMessage) error {
	payload, err := json.Marshal(message)
	if err != nil {
		return err
	}
	mutex.Lock()
	defer mutex.Unlock()
	return connection.WriteMessage(websocket.TextMessage, payload)
}

func newConnectionID() string {
	var bytes [16]byte
	if _, err := rand.Read(bytes[:]); err != nil {
		return hex.EncodeToString([]byte(time.Now().String()))
	}
	return hex.EncodeToString(bytes[:])
}
