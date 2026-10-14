import Capacitor
import WebKit

final class BridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(QMeetBroadcastPlugin())
    }

    override func webView(with frame: CGRect, configuration: WKWebViewConfiguration) -> WKWebView {
        configuration.allowsPictureInPictureMediaPlayback = true
        return super.webView(with: frame, configuration: configuration)
    }
}