import mongoose from "mongoose";

let _conn: mongoose.Connection | null = null;

function getBootstrapConn(): mongoose.Connection {
  if (_conn) return _conn;
  const uri = process.env.MONGODB_URI!;
  _conn = mongoose.createConnection(uri);
  _conn.on("connected", () => console.log("[SystemSettings] Bootstrap DB connected"));
  _conn.on("error", (e) => console.error("[SystemSettings] Bootstrap DB error:", e.message));
  return _conn;
}

const systemSettingsSchema = new mongoose.Schema({
  key: { type: String, default: "global", unique: true },
  mainDbUri: { type: String, default: "" },
  prevMainDbUri: { type: String, default: "" },
  qmeetDbUri: { type: String, default: "" },
  prevQmeetDbUri: { type: String, default: "" },
  smtp2goApiKey: { type: String, default: "" },
  smtp2goSender: { type: String, default: "" },
  smtp2goSenderName: { type: String, default: "" },
  emailLogoUrl: { type: String, default: "" },
  emailSiteUrl: { type: String, default: "" },
}, { timestamps: true });

function getModel() {
  const conn = getBootstrapConn();
  return (conn.models["SystemSettings"] as mongoose.Model<any>)
    || conn.model("SystemSettings", systemSettingsSchema);
}

export async function loadSystemSettings(): Promise<Record<string, string>> {
  try {
    const conn = getBootstrapConn();
    await new Promise<void>((res, rej) => {
      if (conn.readyState === 1) return res();
      conn.once("connected", res);
      conn.once("error", rej);
    });
    const s = await getModel().findOne({ key: "global" }).lean() as any;
    return s || {};
  } catch (e: any) {
    console.error("[SystemSettings] load error:", e.message);
    return {};
  }
}

export async function saveSystemSettings(updates: Record<string, string>): Promise<void> {
  await getModel().findOneAndUpdate(
    { key: "global" },
    { $set: updates },
    { upsert: true, new: true }
  );
}
