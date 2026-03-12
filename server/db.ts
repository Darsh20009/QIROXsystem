import { connManager } from "./connection-manager";
import { loadSystemSettings } from "./system-settings";

export async function connectToDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI must be set. MongoDB is now the primary database.");
  }

  process.env.MONGODB_URI = process.env.MONGODB_URI.replace(/\s+/g, "");

  await connManager.initFromEnv();

  const saved = await loadSystemSettings();

  if (saved.mainDbUri && saved.mainDbUri !== process.env.MONGODB_URI) {
    console.log("[DB] Applying saved mainDbUri from SystemSettings...");
    await connManager.switchMain(saved.mainDbUri, saved.prevMainDbUri || process.env.MONGODB_URI);
  }

  if (saved.qmeetDbUri) {
    await connManager.switchQMeet(saved.qmeetDbUri, saved.prevQmeetDbUri);
  }

  const emailOverrides: Record<string, string> = {};
  if (saved.smtp2goApiKey) emailOverrides.apiKey = saved.smtp2goApiKey;
  if (saved.smtp2goSender) emailOverrides.sender = saved.smtp2goSender;
  if (saved.smtp2goSenderName) emailOverrides.senderName = saved.smtp2goSenderName;
  if (saved.emailLogoUrl) emailOverrides.logoUrl = saved.emailLogoUrl;
  if (saved.emailSiteUrl) emailOverrides.siteUrl = saved.emailSiteUrl;
  if (Object.keys(emailOverrides).length) {
    connManager.setEmailSettings(emailOverrides as any);
    console.log("[DB] Email settings applied from SystemSettings");
  }
}
