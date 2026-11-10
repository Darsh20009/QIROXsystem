package room

import (
	"errors"
	"sync"
)

const MaxParticipants = 50

var (
	ErrCapacity             = errors.New("room participant capacity reached")
	ErrDuplicateParticipant = errors.New("participant already joined")
	ErrInvalidIdentity      = errors.New("room and participant identity are required")
)

type Registry struct {
	mu    sync.RWMutex
	rooms map[string]map[string]struct{}
}

func NewRegistry() *Registry {
	return &Registry{rooms: make(map[string]map[string]struct{})}
}

func (r *Registry) Join(roomID, participantID string) error {
	if roomID == "" || participantID == "" {
		return ErrInvalidIdentity
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	participants := r.rooms[roomID]
	if participants == nil {
		participants = make(map[string]struct{})
		r.rooms[roomID] = participants
	}
	if _, exists := participants[participantID]; exists {
		return ErrDuplicateParticipant
	}
	if len(participants) >= MaxParticipants {
		return ErrCapacity
	}
	participants[participantID] = struct{}{}
	return nil
}

func (r *Registry) Leave(roomID, participantID string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()

	participants := r.rooms[roomID]
	if participants == nil {
		return false
	}
	if _, exists := participants[participantID]; !exists {
		return false
	}
	delete(participants, participantID)
	if len(participants) == 0 {
		delete(r.rooms, roomID)
	}
	return true
}

func (r *Registry) Has(roomID, participantID string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()

	participants := r.rooms[roomID]
	_, exists := participants[participantID]
	return exists
}

func (r *Registry) Count(roomID string) int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.rooms[roomID])
}

func (r *Registry) Counts() (rooms, participants int) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	rooms = len(r.rooms)
	for _, members := range r.rooms {
		participants += len(members)
	}
	return rooms, participants
}
