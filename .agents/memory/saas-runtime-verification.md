---
name: SaaS runtime verification
description: Operational preview requirements and test-environment side effects
---
Generated-system completion requires the actual application, database connection, editor persistence, and code synchronization; design HTML is not functional proof.

**Why:** The user rejected design-only previews while the operational path remained broken.

**How to apply:** Verify runtime modules and native API responses, and source edits after reload; label GitHub verification honestly when only a local remote was exercised.

Avoid authentication-route calls for synthetic admin browser checks when outgoing mail is prohibited.

**Why:** Synthetic administrator sign-in triggered a real admin-login SMTP notification, even though the account was a test fixture.

**How to apply:** Inject isolated test sessions directly through the session store instead, and revoke them during cleanup.

SaaS preview proxy requests must retain the workspace's configured base path after Express strips the mounted `/sandbox/:id/preview` prefix.

**Why:** Generated Vite apps use that base path; forwarding `/` or `/src/...` makes Vite redirect back to the prefixed URL, which Express strips again and loops.

**How to apply:** Preserve the scoped prefix for SaaS HTTP and HMR proxy traffic, while keeping ordinary sandbox projects rooted at `/`.

Watch memory use after repeated browser-test follow-ups.

**Why:** Completed test runs left X11 ffmpeg recorders consuming roughly 1.8 GB each; three accumulated processes exhausted the container and killed both native preview and the parent server.

**How to apply:** Check recorder ownership and completion before terminating only orphaned test recorders with SIGINT. Do not restart a server repeatedly while the container is out of memory.