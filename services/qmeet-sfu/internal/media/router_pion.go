//go:build pion

package media

import (
	"errors"
	"fmt"
	"strings"
	"sync"
"sync/atomic"
"time"

	"github.com/pion/interceptor"
"github.com/pion/rtcp"
	"github.com/pion/webrtc/v4"
	"github.com/qirox/qmeet-sfu/internal/metrics"
)

var (
ErrSessionExists         = errors.New("media connection already exists")
ErrSessionNotFound       = errors.New("media connection not found")
ErrCannotPublish         = errors.New("participant cannot publish media")
ErrCannotSubscribe       = errors.New("participant cannot subscribe to media")
	ErrScreenShareNotAllowed = errors.New("participant cannot publish screen share")
)

type Router struct {
	mu       sync.RWMutex
	api      *webrtc.API
	config   RouterConfig
	counters *metrics.Counters
	rooms    map[string]*mediaRoom
	sessions map[string]*peerSession
}

type mediaRoom struct {
	id           string
	workspaceID  string
	participants map[string]*peerSession
	tracks       map[string]*publishedTrack
}

type publishedTrack struct {
	info        TrackInfo
	local       *webrtc.TrackLocalStaticRTP
	publisher   *peerSession
	subscribers map[string]*webrtc.RTPSender
sourceSSRC  uint32
lastPLI     atomic.Int64
}

type peerSession struct {
	router               *Router
	config               SessionConfig
	pc                   *webrtc.PeerConnection
	negotiationMu        sync.Mutex
	renegotiationPending bool
	pendingICERestart    bool
	closeOnce            sync.Once
}

func NativeAvailable() bool { return true }

func EngineName() string { return "pion" }

func NewRouter(config RouterConfig, counters *metrics.Counters) RouterAPI {
	mediaEngine := &webrtc.MediaEngine{}
	_ = mediaEngine.RegisterDefaultCodecs()
	interceptors := &interceptor.Registry{}
	_ = webrtc.RegisterDefaultInterceptors(mediaEngine, interceptors)
	api := webrtc.NewAPI(
		webrtc.WithMediaEngine(mediaEngine),
		webrtc.WithInterceptorRegistry(interceptors),
	)
	return &Router{
		api:      api,
		config:   config,
		counters: counters,
		rooms:    make(map[string]*mediaRoom),
		sessions: make(map[string]*peerSession),
	}
}

func (r *Router) Join(config SessionConfig) error {
	if config.ConnectionID == "" || config.Claims.RoomID == "" || config.Claims.ParticipantID == "" {
		return ErrSessionNotFound
	}
	isScreenPublisher := strings.HasSuffix(config.Claims.ParticipantID, ScreenShareParticipantSuffix)
	if isScreenPublisher != config.Claims.CanScreenShare {
		return ErrScreenShareNotAllowed
	}

	r.mu.Lock()
	if _, exists := r.sessions[config.ConnectionID]; exists {
		r.mu.Unlock()
		return ErrSessionExists
	}
	for _, existing := range r.sessions {
		if existing.config.Claims.RoomID == config.Claims.RoomID &&
			existing.config.Claims.ParticipantID == config.Claims.ParticipantID {
			r.mu.Unlock()
			return ErrSessionExists
		}
	}
	room := r.rooms[config.Claims.RoomID]
	if room == nil {
		room = &mediaRoom{
			id:           config.Claims.RoomID,
			workspaceID:  config.Claims.WorkspaceID,
			participants: make(map[string]*peerSession),
			tracks:       make(map[string]*publishedTrack),
		}
		r.rooms[config.Claims.RoomID] = room
	} else if room.workspaceID != "" && config.Claims.WorkspaceID != "" && room.workspaceID != config.Claims.WorkspaceID {
		r.mu.Unlock()
		return errors.New("room workspace mismatch")
	}
	if len(room.participants) >= 50 {
		r.mu.Unlock()
		return errors.New("room participant capacity reached")
	}
	r.mu.Unlock()

	pc, err := r.api.NewPeerConnection(r.iceConfiguration())
	if err != nil {
		return fmt.Errorf("create peer connection: %w", err)
	}
	session := &peerSession{router: r, config: config, pc: pc}
	pc.OnICECandidate(func(candidate *webrtc.ICECandidate) {
		if candidate != nil && config.Callbacks.Send != nil {
			init := candidate.ToJSON()
			config.Callbacks.Send(Event{Type: "media.ice", Candidate: ICECandidate{
				Candidate:        init.Candidate,
				SDPMid:           init.SDPMid,
				SDPMLineIndex:    init.SDPMLineIndex,
				UsernameFragment: init.UsernameFragment,
			}})
		}
	})
	pc.OnICEConnectionStateChange(func(state webrtc.ICEConnectionState) {
		if state == webrtc.ICEConnectionStateFailed {
			r.counters.ICEFailures.Add(1)
		}
		if state == webrtc.ICEConnectionStateDisconnected {
			go func() {
				if err := r.Restart(config.ConnectionID); err != nil {
					session.sendError("ICE disconnected; reconnect required")
				}
			}()
		}
	})
	pc.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
		if state == webrtc.PeerConnectionStateFailed {
			r.counters.PeerConnectionFailures.Add(1)
			session.sendError("peer connection failed")
		}
		if state == webrtc.PeerConnectionStateClosed || state == webrtc.PeerConnectionStateFailed {
			go r.Leave(config.ConnectionID)
		}
	})
	pc.OnTrack(func(remote *webrtc.TrackRemote, _ *webrtc.RTPReceiver) {
		go r.publishRemoteTrack(session, remote)
	})

	r.mu.Lock()
	room = r.rooms[config.Claims.RoomID]
	if len(room.participants) >= 50 {
		r.mu.Unlock()
		_ = pc.Close()
		return errors.New("room participant capacity reached")
	}
	room.participants[config.Claims.ParticipantID] = session
	r.sessions[config.ConnectionID] = session
	existingTracks := make([]TrackInfo, 0, len(room.tracks))
	for _, track := range room.tracks {
		if config.Claims.CanSubscribe {
			if sender, addErr := pc.AddTrack(track.local); addErr == nil {
				track.subscribers[config.ConnectionID] = sender
go forwardSubscriberFeedback(sender, track)
go track.requestKeyframe()
				r.counters.SubscribedTracks.Add(1)
				existingTracks = append(existingTracks, track.info)
			}
		}
	}
	r.counters.ActivePeerConnections.Add(1)
	r.counters.ActiveParticipants.Add(1)
	r.counters.ActiveRooms.Store(int64(len(r.rooms)))
	r.mu.Unlock()
	if config.Callbacks.Send != nil {
		for _, track := range existingTracks {
			config.Callbacks.Send(Event{Type: "media.track-published", Track: track})
		}
	}
	return nil
}

func (r *Router) iceConfiguration() webrtc.Configuration {
	var servers []webrtc.ICEServer
	if r.config.STUNURL != "" {
		servers = append(servers, webrtc.ICEServer{URLs: []string{r.config.STUNURL}})
	}
	if r.config.TURNURL != "" {
		servers = append(servers, webrtc.ICEServer{
			URLs:       []string{r.config.TURNURL},
			Username:   r.config.TURNUsername,
			Credential: r.config.TURNCredential,
		})
	}
	return webrtc.Configuration{ICEServers: servers}
}

func (r *Router) HandleOffer(connectionID, sdpType, sdp string) (string, error) {
	r.mu.RLock()
	session := r.sessions[connectionID]
	r.mu.RUnlock()
	if session == nil {
		return "", ErrSessionNotFound
	}
	if sdpType != "offer" || sdp == "" {
		return "", errors.New("only non-empty SDP offers are accepted")
	}
	if err := session.pc.SetRemoteDescription(webrtc.SessionDescription{Type: webrtc.SDPTypeOffer, SDP: sdp}); err != nil {
		return "", fmt.Errorf("set remote description: %w", err)
	}
	answer, err := session.pc.CreateAnswer(nil)
	if err != nil {
		return "", fmt.Errorf("create answer: %w", err)
	}
	if err := session.pc.SetLocalDescription(answer); err != nil {
		return "", fmt.Errorf("set local description: %w", err)
	}
	return answer.SDP, nil
}

func (r *Router) HandleAnswer(connectionID, sdpType, sdp string) error {
	r.mu.RLock()
	session := r.sessions[connectionID]
	r.mu.RUnlock()
	if session == nil {
		return ErrSessionNotFound
	}
	if sdpType != "answer" || sdp == "" {
		return errors.New("only non-empty SDP answers are accepted")
	}
	session.negotiationMu.Lock()
	defer session.negotiationMu.Unlock()
	if err := session.pc.SetRemoteDescription(webrtc.SessionDescription{Type: webrtc.SDPTypeAnswer, SDP: sdp}); err != nil {
		return err
	}
	if session.renegotiationPending {
		iceRestart := session.pendingICERestart
		session.renegotiationPending = false
		session.pendingICERestart = false
		session.renegotiateLocked(iceRestart)
	}
	return nil
}

func (r *Router) AddICE(connectionID string, candidate ICECandidate) error {
	r.mu.RLock()
	session := r.sessions[connectionID]
	r.mu.RUnlock()
	if session == nil {
		return ErrSessionNotFound
	}
	return session.pc.AddICECandidate(webrtc.ICECandidateInit{
		Candidate:        candidate.Candidate,
		SDPMid:           candidate.SDPMid,
		SDPMLineIndex:    candidate.SDPMLineIndex,
		UsernameFragment: candidate.UsernameFragment,
	})
}

func (r *Router) Restart(connectionID string) error {
	r.mu.RLock()
	session := r.sessions[connectionID]
	r.mu.RUnlock()
	if session == nil {
		return ErrSessionNotFound
	}
	r.counters.Reconnects.Add(1)
	session.renegotiateWithOptions(true)
	return nil
}

func (r *Router) publishRemoteTrack(session *peerSession, remote *webrtc.TrackRemote) {
	if !session.config.Claims.CanPublish {
		session.sendError("participant cannot publish media")
		return
	}
	if session.config.Claims.CanScreenShare && remote.Kind() != webrtc.RTPCodecTypeVideo {
		session.sendError("screen share participant can only publish video")
		return
	}
	kind := "video"
	if remote.Kind() == webrtc.RTPCodecTypeAudio {
		kind = "audio"
	}
	trackID := session.config.ConnectionID + ":" + remote.ID()
	local, err := webrtc.NewTrackLocalStaticRTP(remote.Codec().RTPCodecCapability, trackID, session.config.Claims.ParticipantID)
	if err != nil {
		session.sendError("media track could not be created")
		return
	}
	published := &publishedTrack{
		info:  TrackInfo{ID: trackID, ParticipantID: session.config.Claims.ParticipantID, Kind: kind},
		local: local, publisher: session, subscribers: make(map[string]*webrtc.RTPSender),
sourceSSRC: uint32(remote.SSRC()),
	}

	r.mu.Lock()
	room := r.rooms[session.config.Claims.RoomID]
	if room == nil || room.participants[session.config.Claims.ParticipantID] != session {
		r.mu.Unlock()
		return
	}
	room.tracks[trackID] = published
	subscribers := make([]*peerSession, 0, len(room.participants))
	for id, subscriber := range room.participants {
		if subscriber != session && subscriber.config.Claims.CanSubscribe {
			subscribers = append(subscribers, subscriber)
		}
		_ = id
	}
	r.counters.PublishedTracks.Add(1)
	if kind == "audio" {
		r.counters.AudioTracks.Add(1)
	} else {
		r.counters.VideoTracks.Add(1)
	}
	r.mu.Unlock()

	for _, subscriber := range subscribers {
		if sender, addErr := subscriber.addTrackAndRenegotiate(local); addErr == nil {
			r.mu.Lock()
			published.subscribers[subscriber.config.ConnectionID] = sender
			r.counters.SubscribedTracks.Add(1)
			r.mu.Unlock()
go forwardSubscriberFeedback(sender, published)
		}
	}
	r.broadcastTrack(session.config.Claims.RoomID, Event{Type: "media.track-published", Track: published.info})
// A late subscriber often misses the initial encoded keyframe. Keep asking
// until decoding is possible, including across renegotiation/ICE recovery.
done := make(chan struct{})
defer close(done)
if kind == "video" {
go func() {
ticker := time.NewTicker(2 * time.Second)
defer ticker.Stop()
for {
select {
case <-done:
return
case <-ticker.C:
r.mu.RLock()
subscribed := len(published.subscribers) > 0
r.mu.RUnlock()
if subscribed {
published.requestKeyframe()
}
}
}
}()
published.requestKeyframe()
}

	for {
		packet, _, readErr := remote.ReadRTP()
		if readErr != nil {
			break
		}
// One departing subscriber must not terminate the publisher's forwarding
// loop for every healthy subscriber. WriteRTP already attempts all bindings.
_ = local.WriteRTP(packet)
	}
	r.removeTrack(session.config.Claims.RoomID, published)
}

func (track *publishedTrack) requestKeyframe() {
if track.info.Kind != "video" || track.publisher == nil || track.sourceSSRC == 0 {
return
}
now := time.Now().UnixNano()
previous := track.lastPLI.Load()
if now-previous < int64(500*time.Millisecond) || !track.lastPLI.CompareAndSwap(previous, now) {
return
}
_ = track.publisher.pc.WriteRTCP([]rtcp.Packet{
&rtcp.PictureLossIndication{MediaSSRC: track.sourceSSRC},
})
}

func forwardSubscriberFeedback(sender *webrtc.RTPSender, track *publishedTrack) {
// Reading RTCP also drives the default retransmission interceptors. PLI/FIR
// must target the publisher's original SSRC, not the rewritten subscriber SSRC.
for {
packets, _, err := sender.ReadRTCP()
if err != nil {
return
}
for _, packet := range packets {
switch packet.(type) {
case *rtcp.PictureLossIndication, *rtcp.FullIntraRequest:
track.requestKeyframe()
}
}
}
}

func (r *Router) removeTrack(roomID string, track *publishedTrack) {
	r.mu.Lock()
	room := r.rooms[roomID]
	if room == nil || room.tracks[track.info.ID] != track {
		r.mu.Unlock()
		return
	}
	delete(room.tracks, track.info.ID)
	type subscription struct {
		session *peerSession
		sender  *webrtc.RTPSender
	}
	subscribers := make([]subscription, 0, len(track.subscribers))
	for id := range track.subscribers {
		if subscriber := r.sessions[id]; subscriber != nil {
			subscribers = append(subscribers, subscription{session: subscriber, sender: track.subscribers[id]})
		}
		r.counters.SubscribedTracks.Add(-1)
	}
	if track.info.Kind == "audio" {
		r.counters.AudioTracks.Add(-1)
	} else {
		r.counters.VideoTracks.Add(-1)
	}
	r.counters.PublishedTracks.Add(-1)
	r.mu.Unlock()
	for _, subscriber := range subscribers {
		subscriber.session.removeTrackAndRenegotiate(subscriber.sender)
	}
	r.broadcastTrack(roomID, Event{Type: "media.track-removed", Track: track.info})
}

func (r *Router) broadcastTrack(roomID string, event Event) {
	r.mu.RLock()
	var sessions []*peerSession
	if room := r.rooms[roomID]; room != nil {
		sessions = make([]*peerSession, 0, len(room.participants))
		for _, session := range room.participants {
			if session.config.Claims.CanSubscribe {
				sessions = append(sessions, session)
			}
		}
	}
	r.mu.RUnlock()
	for _, session := range sessions {
		if session.config.Callbacks.Send != nil {
			session.config.Callbacks.Send(event)
		}
	}
}

func (r *Router) Leave(connectionID string) {
	r.mu.Lock()
	session := r.sessions[connectionID]
	if session == nil {
		r.mu.Unlock()
		return
	}
	delete(r.sessions, connectionID)
	room := r.rooms[session.config.Claims.RoomID]
	if room != nil {
		delete(room.participants, session.config.Claims.ParticipantID)
		for id, track := range room.tracks {
			if sender, subscribed := track.subscribers[connectionID]; subscribed {
				delete(track.subscribers, connectionID)
				r.counters.SubscribedTracks.Add(-1)
				_ = session.pc.RemoveTrack(sender)
			}
			if track.publisher == session {
				delete(room.tracks, id)
				for subscriberID := range track.subscribers {
					r.counters.SubscribedTracks.Add(-1)
					if subscriber := r.sessions[subscriberID]; subscriber != nil {
						go subscriber.removeTrackAndRenegotiate(track.subscribers[subscriberID])
					}
				}
				track.subscribers = make(map[string]*webrtc.RTPSender)
				r.counters.PublishedTracks.Add(-1)
				if track.info.Kind == "audio" {
					r.counters.AudioTracks.Add(-1)
				} else {
					r.counters.VideoTracks.Add(-1)
				}
				go r.broadcastTrack(session.config.Claims.RoomID, Event{Type: "media.track-removed", Track: track.info})
			}
		}
		if len(room.participants) == 0 {
			delete(r.rooms, session.config.Claims.RoomID)
		}
	}
	r.counters.ActivePeerConnections.Add(-1)
	r.counters.ActiveParticipants.Add(-1)
	r.counters.ActiveRooms.Store(int64(len(r.rooms)))
	r.mu.Unlock()
	session.closeOnce.Do(func() {
		_ = session.pc.Close()
		if session.config.Callbacks.Close != nil {
			session.config.Callbacks.Close()
		}
	})
}

func (r *Router) Close() {
	r.mu.RLock()
	ids := make([]string, 0, len(r.sessions))
	for id := range r.sessions {
		ids = append(ids, id)
	}
	r.mu.RUnlock()
	for _, id := range ids {
		r.Leave(id)
	}
}

func (s *peerSession) sendError(message string) {
	if s.config.Callbacks.Send != nil {
		s.config.Callbacks.Send(Event{Type: "media.error", Error: message})
	}
}

func (s *peerSession) renegotiate() {
	s.renegotiateWithOptions(false)
}

func (s *peerSession) renegotiateWithOptions(iceRestart bool) {
	s.negotiationMu.Lock()
	defer s.negotiationMu.Unlock()
	s.renegotiateLocked(iceRestart)
}

func (s *peerSession) addTrackAndRenegotiate(track *webrtc.TrackLocalStaticRTP) (*webrtc.RTPSender, error) {
	s.negotiationMu.Lock()
	defer s.negotiationMu.Unlock()
	sender, err := s.pc.AddTrack(track)
	if err != nil {
		return nil, err
	}
	s.renegotiateLocked(false)
	return sender, nil
}

func (s *peerSession) removeTrackAndRenegotiate(sender *webrtc.RTPSender) {
	s.negotiationMu.Lock()
	defer s.negotiationMu.Unlock()
	_ = s.pc.RemoveTrack(sender)
	s.renegotiateLocked(false)
}

func (s *peerSession) renegotiateLocked(iceRestart bool) {
	if s.pc.SignalingState() != webrtc.SignalingStateStable {
		s.renegotiationPending = true
		s.pendingICERestart = s.pendingICERestart || iceRestart
		return
	}
	var options *webrtc.OfferOptions
	if iceRestart {
		options = &webrtc.OfferOptions{ICERestart: true}
	}
	offer, err := s.pc.CreateOffer(options)
	if err != nil {
		return
	}
	if err := s.pc.SetLocalDescription(offer); err != nil {
		return
	}
	if local := s.pc.LocalDescription(); local != nil && s.config.Callbacks.Send != nil {
		s.config.Callbacks.Send(Event{Type: "media.offer", SDPType: "offer", SDP: local.SDP})
	}
}
