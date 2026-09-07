// ── Mail Domain — Public API ───────────────────────────────────────────────────
// Barrel export — the only symbol the rest of the application needs.
//
// Usage (server/routes.ts):
//   import { registerMailRoutes } from "./domains/mail";
//
// Rollback:
//   Revert the import in server/routes.ts to "./routes-mail".
//   The legacy server/routes-mail.ts is preserved on disk.

export { registerMailRoutes } from "./routes";
