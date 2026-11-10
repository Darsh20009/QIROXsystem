package metrics

import (
	"fmt"
	"sync/atomic"
)

type Counters struct {
	HealthRequests         atomic.Uint64
	ReadyRequests          atomic.Uint64
	CredentialValidations  atomic.Uint64
	CredentialRejections   atomic.Uint64
	RoomJoins              atomic.Uint64
	RoomLeaves             atomic.Uint64
	ParticipantRejections  atomic.Uint64
	ActiveRooms            atomic.Int64
	ActiveParticipants     atomic.Int64
	ActivePeerConnections  atomic.Int64
	PublishedTracks        atomic.Int64
	SubscribedTracks       atomic.Int64
	AudioTracks            atomic.Int64
	VideoTracks            atomic.Int64
	PeerConnectionFailures atomic.Uint64
	ICEFailures            atomic.Uint64
	Reconnects             atomic.Uint64
}

func (c *Counters) Prometheus() string {
	return fmt.Sprintf(
		"# HELP qmeet_sfu_health_requests_total Health endpoint requests.\n"+
			"# TYPE qmeet_sfu_health_requests_total counter\nqmeet_sfu_health_requests_total %d\n"+
			"# HELP qmeet_sfu_ready_requests_total Ready endpoint requests.\n"+
			"# TYPE qmeet_sfu_ready_requests_total counter\nqmeet_sfu_ready_requests_total %d\n"+
			"# HELP qmeet_sfu_credential_validations_total Credential validation attempts.\n"+
			"# TYPE qmeet_sfu_credential_validations_total counter\nqmeet_sfu_credential_validations_total %d\n"+
			"# HELP qmeet_sfu_credential_rejections_total Rejected credential validations.\n"+
			"# TYPE qmeet_sfu_credential_rejections_total counter\nqmeet_sfu_credential_rejections_total %d\n"+
			"# HELP qmeet_sfu_room_joins_total Accepted room joins.\n"+
			"# TYPE qmeet_sfu_room_joins_total counter\nqmeet_sfu_room_joins_total %d\n"+
			"# HELP qmeet_sfu_room_leaves_total Room leaves.\n"+
			"# TYPE qmeet_sfu_room_leaves_total counter\nqmeet_sfu_room_leaves_total %d\n"+
			"# HELP qmeet_sfu_participant_rejections_total Rejected participant joins.\n"+
			"# TYPE qmeet_sfu_participant_rejections_total counter\nqmeet_sfu_participant_rejections_total %d\n"+
			"# HELP qmeet_sfu_active_rooms Current active rooms.\n"+
			"# TYPE qmeet_sfu_active_rooms gauge\nqmeet_sfu_active_rooms %d\n"+
			"# HELP qmeet_sfu_active_participants Current active participants.\n"+
			"# TYPE qmeet_sfu_active_participants gauge\nqmeet_sfu_active_participants %d\n"+
			"# HELP qmeet_sfu_active_peer_connections Current active peer connections.\n"+
			"# TYPE qmeet_sfu_active_peer_connections gauge\nqmeet_sfu_active_peer_connections %d\n"+
			"# HELP qmeet_sfu_published_tracks Current published tracks.\n"+
			"# TYPE qmeet_sfu_published_tracks gauge\nqmeet_sfu_published_tracks %d\n"+
			"# HELP qmeet_sfu_subscribed_tracks Current subscribed tracks.\n"+
			"# TYPE qmeet_sfu_subscribed_tracks gauge\nqmeet_sfu_subscribed_tracks %d\n"+
			"# HELP qmeet_sfu_audio_tracks Current published audio tracks.\n"+
			"# TYPE qmeet_sfu_audio_tracks gauge\nqmeet_sfu_audio_tracks %d\n"+
			"# HELP qmeet_sfu_video_tracks Current published video tracks.\n"+
			"# TYPE qmeet_sfu_video_tracks gauge\nqmeet_sfu_video_tracks %d\n"+
			"# HELP qmeet_sfu_peer_connection_failures_total Peer connection failures.\n"+
			"# TYPE qmeet_sfu_peer_connection_failures_total counter\nqmeet_sfu_peer_connection_failures_total %d\n"+
			"# HELP qmeet_sfu_ice_failures_total ICE failures.\n"+
			"# TYPE qmeet_sfu_ice_failures_total counter\nqmeet_sfu_ice_failures_total %d\n"+
			"# HELP qmeet_sfu_reconnects_total Participant reconnects.\n"+
			"# TYPE qmeet_sfu_reconnects_total counter\nqmeet_sfu_reconnects_total %d\n",
		c.HealthRequests.Load(),
		c.ReadyRequests.Load(),
		c.CredentialValidations.Load(),
		c.CredentialRejections.Load(),
		c.RoomJoins.Load(),
		c.RoomLeaves.Load(),
		c.ParticipantRejections.Load(),
		c.ActiveRooms.Load(),
		c.ActiveParticipants.Load(),
		c.ActivePeerConnections.Load(),
		c.PublishedTracks.Load(),
		c.SubscribedTracks.Load(),
		c.AudioTracks.Load(),
		c.VideoTracks.Load(),
		c.PeerConnectionFailures.Load(),
		c.ICEFailures.Load(),
		c.Reconnects.Load(),
	)
}
