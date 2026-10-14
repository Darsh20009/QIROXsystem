//go:build pion

package media

import (
	"github.com/pion/interceptor"
	"github.com/pion/webrtc/v4"
)

// NewAPI initializes the Pion WebRTC media engine for the native forwarding
// router. The router adds peer connections and TrackLocalStaticRTP publishers
// on top of this low-level API.
func NewAPI() (*webrtc.API, error) {
	mediaEngine := &webrtc.MediaEngine{}
	if err := mediaEngine.RegisterDefaultCodecs(); err != nil {
		return nil, err
	}

	interceptorRegistry := &interceptor.Registry{}
	if err := webrtc.RegisterDefaultInterceptors(mediaEngine, interceptorRegistry); err != nil {
		return nil, err
	}
	return webrtc.NewAPI(
		webrtc.WithMediaEngine(mediaEngine),
		webrtc.WithInterceptorRegistry(interceptorRegistry),
	), nil
}
