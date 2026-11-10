import Foundation
import ReplayKit
import WebRTC

private let qmeetAppGroup = "group.qiroxstudio.online"

final class SampleHandler: RPBroadcastSampleHandler, RTCPeerConnectionDelegate {
    private var defaults: UserDefaults?
    private var socketSession: URLSession?
    private var socket: URLSessionWebSocketTask?
    private var factory: RTCPeerConnectionFactory?
    private var peerConnection: RTCPeerConnection?
    private var videoSource: RTCVideoSource?
    private var videoTrack: RTCVideoTrack?
    private var capturer: RTCVideoCapturer?
    private var pendingRemoteCandidates: [RTCIceCandidate] = []
    private var pendingLocalCandidates: [[String: Any]] = []
    private var offerStarted = false
    private var ended = false

    override func broadcastStarted(withSetupInfo setupInfo: [String: NSObject]?) {
        super.broadcastStarted(withSetupInfo: setupInfo)
        defaults = UserDefaults(suiteName: qmeetAppGroup)
        defaults?.set("starting", forKey: "qmeet.broadcast.state")

        guard
            let defaults,
            let endpointText = defaults.string(forKey: "qmeet.broadcast.url"),
            let endpoint = URL(string: endpointText),
            endpoint.scheme == "wss",
            let credential = defaults.string(forKey: "qmeet.broadcast.credential"),
            !credential.isEmpty
        else {
            defaults?.set("error", forKey: "qmeet.broadcast.state")
            finishBroadcastWithError(NSError(
                domain: "QMeetBroadcast",
                code: 1,
                userInfo: [NSLocalizedDescriptionKey: "Missing QMeet broadcast credentials"]
            ))
            return
        }

        RTCInitializeSSL()
        factory = RTCPeerConnectionFactory()
        socketSession = URLSession(configuration: .default)
        let task = socketSession!.webSocketTask(with: endpoint)
        socket = task
        task.resume()
        sendMessage(["v": 1, "type": "media.hello", "credential": credential])
        receiveNextMessage()
    }

    override func processSampleBuffer(_ sampleBuffer: CMSampleBuffer, with sampleBufferType: RPSampleBufferType) {
        if defaults?.bool(forKey: "qmeet.broadcast.stopRequested") == true {
            defaults?.set(false, forKey: "qmeet.broadcast.stopRequested")
            stopBroadcastFromQMeet()
            return
        }
        guard sampleBufferType == .video,
              !ended,
              peerConnection != nil,
              let videoSource,
              let capturer,
              let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }

        let rtcBuffer = RTCCVPixelBuffer(pixelBuffer: pixelBuffer)
        let timestamp = CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(sampleBuffer))
        let frame = RTCVideoFrame(
            buffer: rtcBuffer,
            rotation: ._0,
            timeStampNs: Int64(max(0, timestamp) * 1_000_000_000)
        )
        videoSource.capturer(capturer, didCapture: frame)
    }

    override func broadcastFinished() {
        defaults?.set("idle", forKey: "qmeet.broadcast.state")
        clearStoredCredentials()
        tearDownMedia()
        super.broadcastFinished()
    }

    private func startPeerConnection() {
        guard !offerStarted, let factory else { return }
        offerStarted = true

        let configuration = RTCConfiguration()
        configuration.sdpSemantics = .unifiedPlan
        configuration.iceServers = makeIceServers()
        let constraints = RTCMediaConstraints(mandatoryConstraints: nil, optionalConstraints: nil)
        guard let connection = factory.peerConnection(
            with: configuration,
            constraints: constraints,
            delegate: self
        ) else {
            failBroadcast("Unable to create the screen-share media connection")
            return
        }
        peerConnection = connection

        let source = factory.videoSource()
        source.adaptOutputFormat(toWidth: 1280, height: 720, fps: 15)
        let screenCapturer = RTCVideoCapturer(delegate: source)
        videoSource = source
        capturer = screenCapturer
        let track = factory.videoTrack(with: source, trackId: "qmeet-screen-video")
        videoTrack = track
        _ = connection.add(track, streamIds: ["qmeet-screen"])

        connection.offer(for: constraints) { [weak self] description, error in
            guard let self, let connection = self.peerConnection, let description, error == nil else {
                self?.failBroadcast("Could not create the screen-share offer")
                return
            }
            connection.setLocalDescription(description) { [weak self] error in
                guard let self, error == nil else {
                    self?.failBroadcast("Could not set the screen-share offer")
                    return
                }
                self.sendMessage([
                    "v": 1,
                    "type": "media.offer",
                    "sdpType": "offer",
                    "sdp": description.sdp,
                ])
            }
        }
    }

    private func makeIceServers() -> [RTCIceServer] {
        guard let entries = defaults?.array(forKey: "qmeet.broadcast.iceServers") as? [[String: Any]] else {
            return []
        }
        return entries.compactMap { entry in
            let urls = (entry["urls"] as? [String])
                ?? (entry["urls"] as? String).map { [$0] }
                ?? []
            guard !urls.isEmpty else { return nil }
            return RTCIceServer(
                urlStrings: urls,
                username: entry["username"] as? String ?? "",
                credential: entry["credential"] as? String ?? ""
            )
        }
    }

    private func receiveNextMessage() {
        guard let socket, !ended else { return }
        socket.receive { [weak self] result in
            guard let self, !self.ended else { return }
            switch result {
            case .success(.string(let text)):
                self.handleMessage(text)
            case .success(.data(let data)):
                if let text = String(data: data, encoding: .utf8) {
                    self.handleMessage(text)
                }
            case .failure:
                self.failBroadcast("The QMeet media connection was lost")
                return
            @unknown default:
                break
            }
            self.receiveNextMessage()
        }
    }

    private func handleMessage(_ text: String) {
        guard let data = text.data(using: .utf8),
              let message = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = message["type"] as? String else { return }

        switch type {
        case "media.ready":
            startPeerConnection()
        case "media.answer":
            guard let connection = peerConnection,
                  let sdp = message["sdp"] as? String,
                  (message["sdpType"] as? String) == "answer" else { return }
            let answer = RTCSessionDescription(type: .answer, sdp: sdp)
            connection.setRemoteDescription(answer) { [weak self] error in
                guard let self, error == nil else {
                    self?.failBroadcast("The QMeet media answer was rejected")
                    return
                }
                self.flushRemoteCandidates()
                self.flushLocalCandidates()
                self.defaults?.set("starting", forKey: "qmeet.broadcast.state")
            }
        case "media.ice":
            guard let candidate = message["candidate"] as? [String: Any],
                  let sdp = candidate["candidate"] as? String else { return }
            let index = (candidate["sdpMLineIndex"] as? NSNumber)?.int32Value ?? 0
            let mid = candidate["sdpMid"] as? String
            let ice = RTCIceCandidate(sdp: sdp, sdpMLineIndex: index, sdpMid: mid)
            if peerConnection?.remoteDescription != nil {
                peerConnection?.add(ice, completionHandler: { _ in })
            } else {
                pendingRemoteCandidates.append(ice)
            }
        case "media.error":
            failBroadcast(message["error"] as? String ?? "QMeet rejected the broadcast")
        default:
            break
        }
    }

    private func sendMessage(_ payload: [String: Any]) {
        guard let socket,
              JSONSerialization.isValidJSONObject(payload),
              let data = try? JSONSerialization.data(withJSONObject: payload),
              let text = String(data: data, encoding: .utf8) else { return }
        socket.send(.string(text)) { [weak self] error in
            if error != nil {
                self?.failBroadcast("Could not send QMeet media signaling")
            }
        }
    }

    private func sendLocalCandidate(_ candidate: RTCIceCandidate) {
        let mid: Any = candidate.sdpMid.map { $0 as Any } ?? NSNull()
        let payload: [String: Any] = [
            "v": 1,
            "type": "media.ice",
            "candidate": [
                "candidate": candidate.sdp,
                "sdpMid": mid,
                "sdpMLineIndex": candidate.sdpMLineIndex,
            ],
        ]
        if peerConnection?.remoteDescription == nil {
            pendingLocalCandidates.append(payload)
        } else {
            sendMessage(payload)
        }
    }

    private func flushLocalCandidates() {
        let candidates = pendingLocalCandidates
        pendingLocalCandidates.removeAll()
        candidates.forEach(sendMessage)
    }

    private func flushRemoteCandidates() {
        let candidates = pendingRemoteCandidates
        pendingRemoteCandidates.removeAll()
        candidates.forEach { peerConnection?.add($0, completionHandler: { _ in }) }
    }

    private func stopBroadcastFromQMeet() {
        guard !ended else { return }
        ended = true
        defaults?.set("idle", forKey: "qmeet.broadcast.state")
        clearStoredCredentials()
        tearDownMedia()
        finishBroadcastWithError(NSError(
            domain: "QMeetBroadcast",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "Screen sharing stopped from QMeet"]
        ))
    }

    private func failBroadcast(_ message: String) {
        guard !ended else { return }
        ended = true
        defaults?.set("error", forKey: "qmeet.broadcast.state")
        clearStoredCredentials()
        tearDownMedia()
        finishBroadcastWithError(NSError(
            domain: "QMeetBroadcast",
            code: 2,
            userInfo: [NSLocalizedDescriptionKey: message]
        ))
    }

    private func clearStoredCredentials() {
        defaults?.removeObject(forKey: "qmeet.broadcast.url")
        defaults?.removeObject(forKey: "qmeet.broadcast.credential")
        defaults?.removeObject(forKey: "qmeet.broadcast.roomId")
        defaults?.removeObject(forKey: "qmeet.broadcast.participantId")
        defaults?.removeObject(forKey: "qmeet.broadcast.iceServers")
        defaults?.set(false, forKey: "qmeet.broadcast.stopRequested")
    }

    private func tearDownMedia() {
        socket?.cancel(with: .normalClosure, reason: nil)
        socket = nil
        socketSession?.invalidateAndCancel()
        socketSession = nil
        peerConnection?.close()
        peerConnection = nil
        videoTrack = nil
        videoSource = nil
        capturer = nil
        factory = nil
        pendingRemoteCandidates.removeAll()
        pendingLocalCandidates.removeAll()
    }

    func peerConnection(_ peerConnection: RTCPeerConnection, didChange stateChanged: RTCSignalingState) {}
    func peerConnection(_ peerConnection: RTCPeerConnection, didAdd stream: RTCMediaStream) {}
    func peerConnection(_ peerConnection: RTCPeerConnection, didRemove stream: RTCMediaStream) {}
    func peerConnectionShouldNegotiate(_ peerConnection: RTCPeerConnection) {}
    func peerConnection(_ peerConnection: RTCPeerConnection, didChange newState: RTCIceConnectionState) {
        if newState == .failed {
            failBroadcast("The QMeet screen-share connection failed")
        } else if newState == .connected || newState == .completed {
            defaults?.set("broadcasting", forKey: "qmeet.broadcast.state")
        }
    }
    func peerConnection(_ peerConnection: RTCPeerConnection, didChange newState: RTCIceGatheringState) {}
    func peerConnection(_ peerConnection: RTCPeerConnection, didGenerate candidate: RTCIceCandidate) {
        sendLocalCandidate(candidate)
    }
    func peerConnection(_ peerConnection: RTCPeerConnection, didRemove candidates: [RTCIceCandidate]) {}
    func peerConnection(_ peerConnection: RTCPeerConnection, didOpen dataChannel: RTCDataChannel) {}
}