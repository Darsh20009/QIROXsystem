//go:build pion

package media

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/pion/rtp"
"github.com/pion/rtcp"
	"github.com/pion/webrtc/v4"
	"github.com/qirox/qmeet-sfu/internal/auth"
	"github.com/qirox/qmeet-sfu/internal/metrics"
)

const pionMediaTestTimeout = 20 * time.Second

type receivedRTP struct {
	kind    string
	payload []byte
}

type pionMediaTestClient struct {
	router       RouterAPI
	connectionID string
	pc           *webrtc.PeerConnection
	events       chan Event
	errors       chan error
	received     chan receivedRTP
	ctx          context.Context
	cancel       context.CancelFunc
	remoteReady  chan struct{}
	readyOnce    sync.Once
	iceMu        sync.Mutex
	iceReady     bool
	pendingICE   []ICECandidate
}

func TestPionRouterForwardsAudioAndVideoRTP(t *testing.T) {
	counters := &metrics.Counters{}
	router := NewRouter(RouterConfig{}, counters)
	defer router.Close()

	roomID := fmt.Sprintf("rtp-e2e-%d", time.Now().UnixNano())
	publisher := newPionMediaTestClient(t, router, "publisher", roomID, true, true, true)
	subscriber := newPionMediaTestClient(t, router, "subscriber", roomID, false, true, false)
	defer publisher.close()
	defer subscriber.close()

	audio, err := webrtc.NewTrackLocalStaticRTP(
		webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeOpus, ClockRate: 48000, Channels: 2},
		"audio-test", "publisher",
	)
	if err != nil {
		t.Fatalf("create audio track: %v", err)
	}
	video, err := webrtc.NewTrackLocalStaticRTP(
		webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeVP8, ClockRate: 90000},
		"video-test", "publisher",
	)
	if err != nil {
		t.Fatalf("create video track: %v", err)
	}
keyframes := make(chan uint32, 8)
var videoSender *webrtc.RTPSender
for _, track := range []*webrtc.TrackLocalStaticRTP{audio, video} {
		sender, addErr := publisher.pc.AddTrack(track)
		if addErr != nil {
			t.Fatalf("add publisher track: %v", addErr)
		}
if track == video {
videoSender = sender
go func() {
for {
packets, _, readErr := sender.ReadRTCP()
if readErr != nil {
return
}
for _, packet := range packets {
if pli, ok := packet.(*rtcp.PictureLossIndication); ok {
select {
case keyframes <- pli.MediaSSRC:
default:
}
}
}
}
}()
} else {
go discardTestRTCP(sender)
}
	}

	negotiateInitialPionOffer(t, router, publisher)
	negotiateInitialPionOffer(t, router, subscriber)
	waitForPionConnected(t, publisher.pc)
	waitForPionConnected(t, subscriber.pc)

	audioPayload := []byte{0xF8, 0xFF, 0xFE}             // 20 ms Opus silence frame
	videoPayload := []byte{0x10, 0xDE, 0xAD, 0xBE, 0xEF} // VP8 RTP start-partition payload
	writeErrs := make(chan error, 2)
	go func() { writeErrs <- writeTestRTP(audio, 111, 960, audioPayload, 80) }()
	go func() { writeErrs <- writeTestRTP(video, 96, 1800, videoPayload, 80) }()
	receivedAudio, receivedVideo := 0, 0
	deadline := time.NewTimer(pionMediaTestTimeout)
	defer deadline.Stop()
	for receivedAudio < 10 || receivedVideo < 10 {
		select {
		case packet := <-subscriber.received:
			switch packet.kind {
			case "audio":
				if len(packet.payload) < len(audioPayload) || string(packet.payload[:len(audioPayload)]) != string(audioPayload) {
					t.Fatalf("audio RTP payload was not forwarded intact: %x", packet.payload)
				}
				receivedAudio++
			case "video":
				if len(packet.payload) < len(videoPayload) || string(packet.payload[:len(videoPayload)]) != string(videoPayload) {
					t.Fatalf("video RTP payload was not forwarded intact: %x", packet.payload)
				}
				receivedVideo++
			}
		case err := <-subscriber.errors:
			t.Fatalf("subscriber renegotiation failed: %v", err)
		case err := <-publisher.errors:
			t.Fatalf("publisher signaling failed: %v", err)
		case <-deadline.C:
			t.Fatalf("timed out receiving forwarded RTP (audio=%d, video=%d; published=%d, subscribed=%d, audioTracks=%d, videoTracks=%d)",
				receivedAudio,
				receivedVideo,
				counters.PublishedTracks.Load(),
				counters.SubscribedTracks.Load(),
				counters.AudioTracks.Load(),
				counters.VideoTracks.Load(),
			)
		}
	}
	for i := 0; i < 2; i++ {
		select {
		case err := <-writeErrs:
			if err != nil {
				t.Fatalf("write synthetic RTP: %v", err)
			}
		case <-time.After(pionMediaTestTimeout):
			t.Fatal("synthetic RTP writer did not finish")
		}
	}
select {
case ssrc := <-keyframes:
encodings := videoSender.GetParameters().Encodings
if len(encodings) == 0 || ssrc != uint32(encodings[0].SSRC) {
t.Fatalf("keyframe request did not target publisher SSRC: %d", ssrc)
}
case <-time.After(5 * time.Second):
t.Fatal("SFU did not request a decodable video keyframe from publisher")
}
waitForPionCounters(t, counters, func(c *metrics.Counters) bool {
return c.PublishedTracks.Load() == 2 &&
			c.SubscribedTracks.Load() == 2 &&
			c.AudioTracks.Load() == 1 &&
			c.VideoTracks.Load() == 1
	})

	publisher.close()
	subscriber.close()
	router.Close()
	waitForPionCounters(t, counters, func(c *metrics.Counters) bool {
		return c.ActiveRooms.Load() == 0 &&
			c.ActiveParticipants.Load() == 0 &&
			c.ActivePeerConnections.Load() == 0 &&
			c.PublishedTracks.Load() == 0 &&
			c.SubscribedTracks.Load() == 0 &&
			c.AudioTracks.Load() == 0 &&
			c.VideoTracks.Load() == 0
	})
}

func newPionMediaTestClient(
	t *testing.T,
	router RouterAPI,
	connectionID string,
	roomID string,
	canPublish bool,
	canSubscribe bool,
	addPublisherTracks bool,
) *pionMediaTestClient {
	t.Helper()
	pc, err := webrtc.NewPeerConnection(webrtc.Configuration{})
	if err != nil {
		t.Fatalf("create client peer connection: %v", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	client := &pionMediaTestClient{
		router:       router,
		connectionID: connectionID,
		pc:           pc,
		events:       make(chan Event, 256),
		errors:       make(chan error, 16),
		received:     make(chan receivedRTP, 512),
		ctx:          ctx,
		cancel:       cancel,
		remoteReady:  make(chan struct{}),
	}
	pc.OnTrack(func(track *webrtc.TrackRemote, _ *webrtc.RTPReceiver) {
		go func() {
			for {
				packet, _, readErr := track.ReadRTP()
				if readErr != nil {
					return
				}
				select {
				case client.received <- receivedRTP{kind: track.Kind().String(), payload: append([]byte(nil), packet.Payload...)}:
				case <-client.ctx.Done():
					return
				}
			}
		}()
	})

	claims := auth.Claims{
		RoomID:         roomID,
		ParticipantID:  connectionID,
		IssuedAt:       time.Now().Unix(),
		ExpiresAt:      time.Now().Add(time.Minute).Unix(),
		CanPublish:     canPublish,
		CanSubscribe:   canSubscribe,
		CanScreenShare: false,
	}
	if err := router.Join(SessionConfig{
		Claims:       claims,
		ConnectionID: connectionID,
		Callbacks: Callbacks{Send: func(event Event) {
			select {
			case client.events <- event:
			case <-client.ctx.Done():
			}
		}},
	}); err != nil {
		cancel()
		_ = pc.Close()
		t.Fatalf("join SFU session %s: %v", connectionID, err)
	}

	if !addPublisherTracks {
		for _, kind := range []webrtc.RTPCodecType{webrtc.RTPCodecTypeAudio, webrtc.RTPCodecTypeVideo} {
			if _, err := pc.AddTransceiverFromKind(kind, webrtc.RTPTransceiverInit{
				Direction: webrtc.RTPTransceiverDirectionRecvonly,
			}); err != nil {
				t.Fatalf("add receive-only transceiver: %v", err)
			}
		}
	}

	go client.handleServerEvents()
	return client
}

func (c *pionMediaTestClient) handleServerEvents() {
	for {
		select {
		case <-c.ctx.Done():
			return
		case event := <-c.events:
			switch event.Type {
			case "media.ice":
				c.addRemoteICE(event.Candidate)
			case "media.offer":
				if err := c.acceptServerOffer(event); err != nil {
					select {
					case c.errors <- err:
					default:
					}
				}
			case "media.error":
				select {
				case c.errors <- fmt.Errorf("SFU: %s", event.Error):
				default:
				}
			}
		}
	}
}

func (c *pionMediaTestClient) addRemoteICE(candidate ICECandidate) {
	c.iceMu.Lock()
	if !c.iceReady {
		c.pendingICE = append(c.pendingICE, candidate)
		c.iceMu.Unlock()
		return
	}
	c.iceMu.Unlock()
	c.applyRemoteICE(candidate)
}

func (c *pionMediaTestClient) setRemoteReady() {
	c.iceMu.Lock()
	c.iceReady = true
	pending := append([]ICECandidate(nil), c.pendingICE...)
	c.pendingICE = nil
	c.iceMu.Unlock()
	c.readyOnce.Do(func() { close(c.remoteReady) })
	for _, candidate := range pending {
		c.applyRemoteICE(candidate)
	}
}

func (c *pionMediaTestClient) applyRemoteICE(candidate ICECandidate) {
	err := c.pc.AddICECandidate(webrtc.ICECandidateInit{
		Candidate:        candidate.Candidate,
		SDPMid:           candidate.SDPMid,
		SDPMLineIndex:    candidate.SDPMLineIndex,
		UsernameFragment: candidate.UsernameFragment,
	})
	if err != nil {
		select {
		case c.errors <- fmt.Errorf("apply SFU ICE candidate: %w", err):
		default:
		}
	}
}

func (c *pionMediaTestClient) acceptServerOffer(event Event) error {
	if err := c.pc.SetRemoteDescription(webrtc.SessionDescription{Type: webrtc.SDPTypeOffer, SDP: event.SDP}); err != nil {
		return fmt.Errorf("apply SFU renegotiation offer: %w", err)
	}
	c.setRemoteReady()
	answer, err := c.pc.CreateAnswer(nil)
	if err != nil {
		return fmt.Errorf("create renegotiation answer: %w", err)
	}
	gathered := webrtc.GatheringCompletePromise(c.pc)
	if err := c.pc.SetLocalDescription(answer); err != nil {
		return fmt.Errorf("set renegotiation answer: %w", err)
	}
	select {
	case <-gathered:
	case <-time.After(pionMediaTestTimeout):
		return fmt.Errorf("timed out gathering renegotiation ICE")
	case <-c.ctx.Done():
		return c.ctx.Err()
	}
	local := c.pc.LocalDescription()
	if local == nil {
		return fmt.Errorf("renegotiation has no local answer")
	}
	if err := c.router.HandleAnswer(c.connectionID, "answer", local.SDP); err != nil {
		return fmt.Errorf("send renegotiation answer: %w", err)
	}
	return nil
}

func (c *pionMediaTestClient) close() {
	c.cancel()
	_ = c.pc.Close()
	c.router.Leave(c.connectionID)
}

func negotiateInitialPionOffer(t *testing.T, router RouterAPI, client *pionMediaTestClient) {
	t.Helper()
	offer, err := client.pc.CreateOffer(nil)
	if err != nil {
		t.Fatalf("create initial offer for %s: %v", client.connectionID, err)
	}
	gathered := webrtc.GatheringCompletePromise(client.pc)
	if err := client.pc.SetLocalDescription(offer); err != nil {
		t.Fatalf("set initial offer for %s: %v", client.connectionID, err)
	}
	select {
	case <-gathered:
	case <-time.After(pionMediaTestTimeout):
		t.Fatalf("timed out gathering initial ICE for %s", client.connectionID)
	}
	local := client.pc.LocalDescription()
	if local == nil {
		t.Fatalf("initial offer for %s has no local description", client.connectionID)
	}
	answer, err := router.HandleOffer(client.connectionID, "offer", local.SDP)
	if err != nil {
		t.Fatalf("SFU rejected initial offer for %s: %v", client.connectionID, err)
	}
	if err := client.pc.SetRemoteDescription(webrtc.SessionDescription{Type: webrtc.SDPTypeAnswer, SDP: answer}); err != nil {
		t.Fatalf("apply initial answer for %s: %v", client.connectionID, err)
	}
	client.setRemoteReady()
}

func waitForPionConnected(t *testing.T, pc *webrtc.PeerConnection) {
	t.Helper()
	deadline := time.Now().Add(pionMediaTestTimeout)
	for time.Now().Before(deadline) {
		switch pc.ConnectionState() {
		case webrtc.PeerConnectionStateConnected:
			return
		case webrtc.PeerConnectionStateFailed, webrtc.PeerConnectionStateClosed:
			t.Fatalf("Pion client connection entered state %s", pc.ConnectionState())
		}
		time.Sleep(25 * time.Millisecond)
	}
	t.Fatalf("timed out waiting for Pion client connection; state=%s", pc.ConnectionState())
}

func writeTestRTP(track *webrtc.TrackLocalStaticRTP, payloadType uint8, timestampStep uint32, payload []byte, packets int) error {
	for sequence := 0; sequence < packets; sequence++ {
		packet := &rtp.Packet{
			Header: rtp.Header{
				Version:        2,
				PayloadType:    payloadType,
				SequenceNumber: uint16(sequence),
				Timestamp:      uint32(sequence) * timestampStep,
			},
			Payload: append([]byte(nil), payload...),
		}
		if err := track.WriteRTP(packet); err != nil {
			return err
		}
		time.Sleep(20 * time.Millisecond)
	}
	return nil
}

func discardTestRTCP(sender *webrtc.RTPSender) {
	buffer := make([]byte, 1500)
	for {
		if _, _, err := sender.Read(buffer); err != nil {
			return
		}
	}
}

func waitForPionCounters(t *testing.T, counters *metrics.Counters, ready func(*metrics.Counters) bool) {
	t.Helper()
	deadline := time.Now().Add(pionMediaTestTimeout)
	for time.Now().Before(deadline) {
		if ready(counters) {
			return
		}
		time.Sleep(25 * time.Millisecond)
	}
	t.Fatalf("timed out waiting for SFU counters: rooms=%d participants=%d peers=%d published=%d subscribed=%d audio=%d video=%d",
		counters.ActiveRooms.Load(),
		counters.ActiveParticipants.Load(),
		counters.ActivePeerConnections.Load(),
		counters.PublishedTracks.Load(),
		counters.SubscribedTracks.Load(),
		counters.AudioTracks.Load(),
		counters.VideoTracks.Load(),
	)
}
