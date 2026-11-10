package room

import (
	"errors"
	"strconv"
	"testing"
)

func TestRegistryRejectsParticipant51(t *testing.T) {
	registry := NewRegistry()
	for i := 1; i <= MaxParticipants; i++ {
		if err := registry.Join("room-a", participantID(i)); err != nil {
			t.Fatalf("join participant %d: %v", i, err)
		}
	}
	if err := registry.Join("room-a", participantID(MaxParticipants+1)); !errors.Is(err, ErrCapacity) {
		t.Fatalf("expected capacity error for participant 51, got %v", err)
	}
	if got := registry.Count("room-a"); got != MaxParticipants {
		t.Fatalf("room count changed after rejected join: %d", got)
	}
}

func TestRegistryIsolatesRooms(t *testing.T) {
	registry := NewRegistry()
	if err := registry.Join("room-a", "same-user"); err != nil {
		t.Fatalf("join room a: %v", err)
	}
	if err := registry.Join("room-b", "same-user"); err != nil {
		t.Fatalf("same participant should be valid in another room: %v", err)
	}
	if !registry.Has("room-a", "same-user") || !registry.Has("room-b", "same-user") {
		t.Fatal("participant was not isolated per room")
	}
	registry.Leave("room-a", "same-user")
	if registry.Has("room-a", "same-user") {
		t.Fatal("participant remained in room a")
	}
	if !registry.Has("room-b", "same-user") {
		t.Fatal("room b was affected by room a leave")
	}
}

func participantID(number int) string {
	return "participant-" + strconv.Itoa(number)
}
