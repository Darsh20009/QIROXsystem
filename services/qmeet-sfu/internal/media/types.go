package media

import "github.com/qirox/qmeet-sfu/internal/auth"

const ScreenShareParticipantSuffix = ":qmeet-screen"

type ICECandidate struct {
	Candidate        string  `json:"candidate"`
	SDPMid           *string `json:"sdpMid,omitempty"`
	SDPMLineIndex    *uint16 `json:"sdpMLineIndex,omitempty"`
	UsernameFragment *string `json:"usernameFragment,omitempty"`
}

type TrackInfo struct {
	ID            string `json:"trackId"`
	ParticipantID string `json:"participantId"`
	Kind          string `json:"kind"`
}

type Event struct {
	Type      string
	SDP       string
	SDPType   string
	Candidate ICECandidate
	Track     TrackInfo
	Error     string
}

type Callbacks struct {
	Send  func(Event)
	Close func()
}

type RouterConfig struct {
	ControlSecret  []byte
	STUNURL        string
	TURNURL        string
	TURNUsername   string
	TURNCredential string
}

type SessionConfig struct {
	Claims       auth.Claims
	ConnectionID string
	Callbacks    Callbacks
}

type RouterAPI interface {
	Join(SessionConfig) error
	HandleOffer(connectionID, sdpType, sdp string) (string, error)
	HandleAnswer(connectionID, sdpType, sdp string) error
	AddICE(connectionID string, candidate ICECandidate) error
	Restart(connectionID string) error
	Leave(connectionID string)
	Close()
}
