//go:build !pion

package media

import "errors"

var ErrPionBuildRequired = errors.New("native media forwarding requires the pion build tag")

type routerStub struct{}

func NewRouter(_ RouterConfig, _ any) RouterAPI {
	return &routerStub{}
}

func NativeAvailable() bool { return false }

func EngineName() string { return "stub" }

func (r *routerStub) Join(_ SessionConfig) error { return ErrPionBuildRequired }

func (r *routerStub) HandleOffer(_, _, _ string) (string, error) {
	return "", ErrPionBuildRequired
}

func (r *routerStub) HandleAnswer(_, _, _ string) error {
	return ErrPionBuildRequired
}

func (r *routerStub) AddICE(_ string, _ ICECandidate) error {
	return ErrPionBuildRequired
}

func (r *routerStub) Restart(_ string) error {
	return ErrPionBuildRequired
}

func (r *routerStub) Leave(_ string) {}

func (r *routerStub) Close() {}
