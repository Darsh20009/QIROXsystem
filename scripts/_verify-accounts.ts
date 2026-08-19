import mongoose from "mongoose";
import { connectToDatabase } from "../server/db";

async function main() {
  await connectToDatabase();
  const { UserModel } = await import("../server/models");
  const users = await (UserModel as any).find({}).select("username email role fullName").lean();
  const byRole: Record<string, any[]> = {};
  for (const u of users as any[]) {
    byRole[u.role] = byRole[u.role] || [];
    byRole[u.role].push({ username: u.username, email: (u.email || "").substring(0, 25) });
  }
  for (const [role, list] of Object.entries(byRole)) {
    console.log(`${role} (${list.length}): ${JSON.stringify(list.slice(0, 3))}`);
  }
  await mongoose.disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
