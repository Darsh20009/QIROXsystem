package config

import "testing"

func TestLoadParticipantLimitDefaultsTo50(t *testing.T) {
	t.Setenv("QMEET_SFU_CONTROL_SECRET", "test-only")
	t.Setenv("QMEET_SFU_MAX_PARTICIPANTS", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error: %v", err)
	}
	if cfg.MaxParticipants != DefaultMaxParticipants {
		t.Fatalf("MaxParticipants = %d, want %d", cfg.MaxParticipants, DefaultMaxParticipants)
	}
}

func TestLoadParticipantLimitAccepts100(t *testing.T) {
	t.Setenv("QMEET_SFU_CONTROL_SECRET", "test-only")
	t.Setenv("QMEET_SFU_MAX_PARTICIPANTS", "100")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error: %v", err)
	}
	if cfg.MaxParticipants != 100 {
		t.Fatalf("MaxParticipants = %d, want 100", cfg.MaxParticipants)
	}
}

func TestLoadRejectsParticipantLimitAbove100(t *testing.T) {
	t.Setenv("QMEET_SFU_CONTROL_SECRET", "test-only")
	t.Setenv("QMEET_SFU_MAX_PARTICIPANTS", "101")

	if _, err := Load(); err == nil {
		t.Fatal("Load() accepted participant limit above 100")
	}
}
