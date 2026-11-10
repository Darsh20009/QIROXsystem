/** Express-session does not populate req.cookies; read the scoped grant explicitly. */
export function sandboxPreviewCookie(cookieHeader: unknown, projectId: string): string {
  const prefix = `qirox_preview_${projectId}=`;
  const cookie = String(cookieHeader || "").split(";").map(value => value.trim()).find(value => value.startsWith(prefix));
  if (!cookie) return "";
  try { return decodeURIComponent(cookie.slice(prefix.length)); } catch { return ""; }
}