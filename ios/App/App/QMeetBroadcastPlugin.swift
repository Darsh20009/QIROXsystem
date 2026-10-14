import Capacitor
import ReplayKit
import UIKit

private enum QMeetBroadcastConfiguration {
    static let appGroup = "group.qiroxstudio.online"
    static let extensionBundleIdentifier = "qiroxstudio.online.QMeetBroadcast"
}

@objc(QMeetBroadcastPlugin)
public final class QMeetBroadcastPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "QMeetBroadcastPlugin"
    public let jsName = "QMeetBroadcast"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "prepareBroadcast", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showBroadcastPicker", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getBroadcastState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestStop", returnType: CAPPluginReturnPromise),
    ]

    @objc public func prepareBroadcast(_ call: CAPPluginCall) {
        guard let defaults = UserDefaults(suiteName: QMeetBroadcastConfiguration.appGroup),
              let url = call.getString("url"),
              let credential = call.getString("credential"),
              let roomId = call.getString("roomId"),
              let participantId = call.getString("participantId"),
              let iceServers = call.getArray("iceServers"),
              let parsedUrl = URL(string: url),
              parsedUrl.scheme == "wss",
              !credential.isEmpty,
              !roomId.isEmpty,
              participantId.hasSuffix(":qmeet-screen") else {
            call.reject("Missing or invalid native screen-share configuration")
            return
        }

        defaults.set(url, forKey: "qmeet.broadcast.url")
        defaults.set(credential, forKey: "qmeet.broadcast.credential")
        defaults.set(roomId, forKey: "qmeet.broadcast.roomId")
        defaults.set(participantId, forKey: "qmeet.broadcast.participantId")
        defaults.set(iceServers, forKey: "qmeet.broadcast.iceServers")
        defaults.set(false, forKey: "qmeet.broadcast.stopRequested")
        defaults.set("prepared", forKey: "qmeet.broadcast.state")
        call.resolve()
    }

    @objc public func showBroadcastPicker(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let presenter = self.bridge?.viewController else {
                call.reject("QIROX could not open the iOS broadcast picker")
                return
            }
            let picker = QMeetBroadcastPickerViewController()
            picker.modalPresentationStyle = .pageSheet
            if let sheet = picker.sheetPresentationController {
                sheet.detents = [.medium()]
                sheet.prefersGrabberVisible = true
            }
            presenter.present(picker, animated: true) {
                call.resolve()
            }
        }
    }

    @objc public func getBroadcastState(_ call: CAPPluginCall) {
        let state = UserDefaults(suiteName: QMeetBroadcastConfiguration.appGroup)?
            .string(forKey: "qmeet.broadcast.state") ?? "idle"
        call.resolve(["state": state])
    }

    @objc public func requestStop(_ call: CAPPluginCall) {
        guard let defaults = UserDefaults(suiteName: QMeetBroadcastConfiguration.appGroup) else {
            call.reject("QIROX broadcast sharing is not configured")
            return
        }
        let currentState = defaults.string(forKey: "qmeet.broadcast.state") ?? "idle"
        if currentState == "idle" || currentState == "prepared" || currentState == "error" {
            defaults.removeObject(forKey: "qmeet.broadcast.url")
            defaults.removeObject(forKey: "qmeet.broadcast.credential")
            defaults.removeObject(forKey: "qmeet.broadcast.roomId")
            defaults.removeObject(forKey: "qmeet.broadcast.participantId")
            defaults.removeObject(forKey: "qmeet.broadcast.iceServers")
            defaults.set(false, forKey: "qmeet.broadcast.stopRequested")
            defaults.set("idle", forKey: "qmeet.broadcast.state")
            call.resolve()
            return
        }
        defaults.set(true, forKey: "qmeet.broadcast.stopRequested")
        defaults.set("stopping", forKey: "qmeet.broadcast.state")
        call.resolve()
    }
}

private final class QMeetBroadcastPickerViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground

        let titleLabel = UILabel()
        titleLabel.text = "مشاركة شاشة الآيفون"
        titleLabel.font = .preferredFont(forTextStyle: .headline)
        titleLabel.textAlignment = .center

        let instructionLabel = UILabel()
        instructionLabel.text = "اضغط زر البث، ثم اختر QIROX Broadcast وابدأ البث."
        instructionLabel.font = .preferredFont(forTextStyle: .subheadline)
        instructionLabel.textAlignment = .center
        instructionLabel.numberOfLines = 0

        let broadcastPicker = RPSystemBroadcastPickerView(frame: .zero)
        broadcastPicker.preferredExtension = QMeetBroadcastConfiguration.extensionBundleIdentifier
        broadcastPicker.showsMicrophoneButton = false
        broadcastPicker.translatesAutoresizingMaskIntoConstraints = false

        let closeButton = UIButton(type: .system)
        closeButton.setTitle("إغلاق", for: .normal)
        closeButton.addTarget(self, action: #selector(closeSheet), for: .touchUpInside)

        let stack = UIStackView(arrangedSubviews: [titleLabel, instructionLabel, broadcastPicker, closeButton])
        stack.axis = .vertical
        stack.alignment = .center
        stack.spacing = 18
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)

        NSLayoutConstraint.activate([
            stack.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 24),
            stack.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -24),
            stack.centerYAnchor.constraint(equalTo: view.safeAreaLayoutGuide.centerYAnchor),
            broadcastPicker.widthAnchor.constraint(equalToConstant: 56),
            broadcastPicker.heightAnchor.constraint(equalToConstant: 56),
        ])
    }

    @objc private func closeSheet() {
        dismiss(animated: true)
    }
}