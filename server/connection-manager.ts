import mongoose from "mongoose";

export interface ConnectionSettings {
  mainDbUri?: string;
  prevMainDbUri?: string;
  qmeetDbUri?: string;
  prevQmeetDbUri?: string;
  smtp2goApiKey?: string;
  smtp2goSender?: string;
  smtp2goSenderName?: string;
  emailLogoUrl?: string;
  emailSiteUrl?: string;
}

class ConnectionManager {
  private _primaryUri: string = "";
  private _secondaryUri: string = "";
  private _secondaryConn: mongoose.Connection | null = null;

  private _qmeetUri: string = "";
  private _prevQmeetUri: string = "";
  private _qmeetConn: mongoose.Connection | null = null;
  private _prevQmeetConn: mongoose.Connection | null = null;

  private _emailSettings: {
    apiKey: string;
    sender: string;
    senderName: string;
    logoUrl: string;
    siteUrl: string;
  } = {
    apiKey: "",
    sender: "",
    senderName: "",
    logoUrl: "",
    siteUrl: "",
  };

  async initFromEnv() {
    const uri = process.env.MONGODB_URI!;
    this._primaryUri = uri;
    await mongoose.connect(uri);
    console.log("[ConnManager] Primary DB connected (env)");

    const qmeetUri = process.env.QMEET_MONGODB_URI || uri.replace(/\/([^/?]+)(\?|$)/, "/qmeet_db$2");
    this._qmeetUri = qmeetUri;
    this._qmeetConn = mongoose.createConnection(qmeetUri);
    this._qmeetConn.on("connected", () => console.log("[ConnManager] QMeet DB connected (env)"));
    this._qmeetConn.on("error", (e) => console.error("[ConnManager] QMeet error:", e.message));

    this._emailSettings = {
      apiKey: process.env.SMTP2GO_API_KEY || "",
      sender: process.env.SMTP2GO_SENDER || "noreply@qiroxstudio.online",
      senderName: process.env.SMTP2GO_SENDER_NAME || "Qirox",
      logoUrl: process.env.EMAIL_LOGO_URL || "https://raw.githubusercontent.com/Darsh20009/QIROXsystem/main/client/public/logo.png",
      siteUrl: process.env.EMAIL_SITE_URL || "https://qiroxstudio.online",
    };
  }

  async applySettings(settings: ConnectionSettings) {
    if (settings.mainDbUri && settings.mainDbUri !== this._primaryUri) {
      await this.switchMain(settings.mainDbUri, settings.prevMainDbUri);
    }
    if (settings.qmeetDbUri && settings.qmeetDbUri !== this._qmeetUri) {
      await this.switchQMeet(settings.qmeetDbUri, settings.prevQmeetDbUri);
    }
    if (settings.smtp2goApiKey !== undefined) this._emailSettings.apiKey = settings.smtp2goApiKey;
    if (settings.smtp2goSender !== undefined) this._emailSettings.sender = settings.smtp2goSender;
    if (settings.smtp2goSenderName !== undefined) this._emailSettings.senderName = settings.smtp2goSenderName;
    if (settings.emailLogoUrl !== undefined) this._emailSettings.logoUrl = settings.emailLogoUrl;
    if (settings.emailSiteUrl !== undefined) this._emailSettings.siteUrl = settings.emailSiteUrl;
  }

  async switchMain(newUri: string, prevUri?: string) {
    const oldUri = prevUri || this._primaryUri;

    if (this._secondaryConn) {
      try { await this._secondaryConn.close(); } catch {}
      this._secondaryConn = null;
    }

    if (oldUri && oldUri !== newUri) {
      this._secondaryUri = oldUri;
      this._secondaryConn = mongoose.createConnection(oldUri);
      this._secondaryConn.on("connected", () => console.log("[ConnManager] Secondary (archive) DB connected:", maskUri(oldUri)));
      this._secondaryConn.on("error", (e) => console.error("[ConnManager] Secondary DB error:", e.message));
    }

    try {
      await mongoose.disconnect();
    } catch {}

    await mongoose.connect(newUri);
    this._primaryUri = newUri;
    console.log("[ConnManager] Primary DB switched to:", maskUri(newUri));
  }

  async switchQMeet(newUri: string, prevUri?: string) {
    const oldUri = prevUri || this._qmeetUri;

    if (this._prevQmeetConn) {
      try { await this._prevQmeetConn.close(); } catch {}
      this._prevQmeetConn = null;
    }

    if (oldUri && oldUri !== newUri) {
      this._prevQmeetUri = oldUri;
      this._prevQmeetConn = mongoose.createConnection(oldUri);
      this._prevQmeetConn.on("connected", () => console.log("[ConnManager] QMeet Archive connected:", maskUri(oldUri)));
    }

    if (this._qmeetConn) {
      try { await this._qmeetConn.close(); } catch {}
    }

    this._qmeetConn = mongoose.createConnection(newUri);
    this._qmeetUri = newUri;
    this._qmeetConn.on("connected", () => console.log("[ConnManager] QMeet DB switched to:", maskUri(newUri)));
    this._qmeetConn.on("error", (e) => console.error("[ConnManager] QMeet error:", e.message));
  }

  get primaryUri() { return this._primaryUri; }
  get secondaryUri() { return this._secondaryUri; }
  get secondaryConn() { return this._secondaryConn; }
  get qmeetConn() { return this._qmeetConn; }
  get prevQmeetConn() { return this._prevQmeetConn; }
  get qmeetUri() { return this._qmeetUri; }
  get prevQmeetUri() { return this._prevQmeetUri; }
  get emailSettings() { return { ...this._emailSettings }; }

  setEmailSettings(s: Partial<typeof this._emailSettings>) {
    Object.assign(this._emailSettings, s);
  }

  getStatus() {
    return {
      primary: {
        uri: maskUri(this._primaryUri),
        state: readyStateLabel(mongoose.connection.readyState),
      },
      secondary: this._secondaryUri
        ? {
            uri: maskUri(this._secondaryUri),
            state: this._secondaryConn ? readyStateLabel(this._secondaryConn.readyState) : "none",
          }
        : null,
      qmeet: {
        uri: maskUri(this._qmeetUri),
        state: this._qmeetConn ? readyStateLabel(this._qmeetConn.readyState) : "none",
      },
      prevQmeet: this._prevQmeetUri
        ? {
            uri: maskUri(this._prevQmeetUri),
            state: this._prevQmeetConn ? readyStateLabel(this._prevQmeetConn.readyState) : "none",
          }
        : null,
    };
  }
}

function maskUri(uri: string): string {
  if (!uri) return "";
  try {
    const u = new URL(uri);
    if (u.password) u.password = "****";
    return u.toString();
  } catch {
    return uri.replace(/:\/\/[^@]*@/, "://*:****@");
  }
}

function readyStateLabel(state: number): string {
  return ["disconnected", "connected", "connecting", "disconnecting"][state] ?? "unknown";
}

export const connManager = new ConnectionManager();
export { maskUri };
