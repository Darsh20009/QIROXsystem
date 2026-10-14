package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync/atomic"
	"syscall"
	"time"

	"github.com/qirox/qmeet-sfu/internal/config"
	"github.com/qirox/qmeet-sfu/internal/media"
	"github.com/qirox/qmeet-sfu/internal/metrics"
	"github.com/qirox/qmeet-sfu/internal/signaling"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Printf("qmeet-sfu configuration error: %v", err)
		os.Exit(1)
	}
	counters := &metrics.Counters{}
	router := media.NewRouter(media.RouterConfig{
		ControlSecret:  []byte(cfg.ControlSecret),
		STUNURL:        cfg.STUNURL,
		TURNURL:        cfg.TURNURL,
		TURNUsername:   cfg.TURNUsername,
		TURNCredential: cfg.TURNCredential,
	}, counters)
	var ready atomic.Bool

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(writer http.ResponseWriter, _ *http.Request) {
		counters.HealthRequests.Add(1)
		writeJSON(writer, http.StatusOK, map[string]string{
			"status":       "ok",
			"media_engine": media.EngineName(),
		})
	})
	mux.HandleFunc("/readyz", func(writer http.ResponseWriter, _ *http.Request) {
		counters.ReadyRequests.Add(1)
		if !ready.Load() {
			writeJSON(writer, http.StatusServiceUnavailable, map[string]string{
				"status":       "not_ready",
				"media_engine": media.EngineName(),
			})
			return
		}
		writeJSON(writer, http.StatusOK, map[string]string{
			"status":       "ready",
			"media_engine": media.EngineName(),
		})
	})
	mux.HandleFunc("/metrics", func(writer http.ResponseWriter, _ *http.Request) {
		writer.Header().Set("Content-Type", "text/plain; version=0.0.4")
		_, _ = writer.Write([]byte(counters.Prometheus() + fmt.Sprintf(
			"# HELP qmeet_sfu_media_engine_info Active media engine (pion or stub).\n"+
				"# TYPE qmeet_sfu_media_engine_info gauge\n"+
				"qmeet_sfu_media_engine_info{engine=%q} 1\n",
			media.EngineName(),
		)))
	})
	mux.Handle("/ws", signaling.NewHandler(signaling.Config{
		ControlSecret: []byte(cfg.ControlSecret), AllowedOrigins: cfg.AllowedOrigins,
	}, router, counters))

	server := &http.Server{
		Addr:              cfg.Addr,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}
	ready.Store(media.NativeAvailable())

	go func() {
		log.Printf("qmeet-sfu media service listening on %s (max participants per room: %d)", cfg.Addr, config.MaxParticipants)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("qmeet-sfu server error: %v", err)
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	ready.Store(false)
	router.Close()

	ctx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Printf("qmeet-sfu graceful shutdown failed: %v", err)
	}
	log.Printf("qmeet-sfu stopped")
}

func writeJSON(writer http.ResponseWriter, status int, value any) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(status)
	_ = json.NewEncoder(writer).Encode(value)
}
