package config

import (
	"errors"
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	DefaultMaxParticipants = 50
	HardMaxParticipants    = 100
)

type Config struct {
	Addr            string
	ControlSecret   string
	ShutdownTimeout time.Duration
	AllowedOrigins  []string
	STUNURL         string
	TURNURL         string
	TURNUsername    string
	TURNCredential  string
	MaxParticipants int
}

func Load() (Config, error) {
	addr := os.Getenv("QMEET_SFU_ADDR")
	if addr == "" {
		addr = ":7880"
	}

	secret := os.Getenv("QMEET_SFU_CONTROL_SECRET")
	if secret == "" {
		return Config{}, errors.New("QMEET_SFU_CONTROL_SECRET is required")
	}

	timeout := 10 * time.Second
	if raw := os.Getenv("QMEET_SFU_SHUTDOWN_TIMEOUT"); raw != "" {
		parsed, err := time.ParseDuration(raw)
		if err != nil || parsed <= 0 {
			return Config{}, errors.New("QMEET_SFU_SHUTDOWN_TIMEOUT must be a positive duration")
		}
		timeout = parsed
	}

	maxParticipants := DefaultMaxParticipants
	if raw := strings.TrimSpace(os.Getenv("QMEET_SFU_MAX_PARTICIPANTS")); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed < 2 || parsed > HardMaxParticipants {
			return Config{}, errors.New("QMEET_SFU_MAX_PARTICIPANTS must be an integer from 2 to 100")
		}
		maxParticipants = parsed
	}

	return Config{
		Addr:            addr,
		ControlSecret:   secret,
		ShutdownTimeout: timeout,
		AllowedOrigins:  splitCSV(os.Getenv("QMEET_SFU_ALLOWED_ORIGINS")),
		STUNURL:         os.Getenv("QMEET_STUN_URL"),
		TURNURL:         os.Getenv("QMEET_TURN_URL"),
		TURNUsername:    os.Getenv("QMEET_TURN_USERNAME"),
		TURNCredential:  os.Getenv("QMEET_TURN_CREDENTIAL"),
		MaxParticipants: maxParticipants,
	}, nil
}

func splitCSV(value string) []string {
	var result []string
	for _, part := range strings.Split(value, ",") {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
