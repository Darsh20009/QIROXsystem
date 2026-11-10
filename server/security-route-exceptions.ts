/** Bypass only the probe filter; normal route authentication still applies. */
export function isBuilderDatabaseSetupRoute(method: string, path: string): boolean {
  return method === "POST" && /^\/api\/admin\/orders\/[a-f0-9]{24}\/saas-builder\/database\/?$/i.test(path);
}