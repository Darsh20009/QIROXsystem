---
name: HTTP route test isolation
description: Prevent Mongo-backed HTTP route tests from hanging or sending real messages.
---

When an HTTP test registers the full Express routes while using a real Mongoose connection, temporarily clear `MONGODB_URI` only while routes and authentication middleware are registered, then restore it before requests.

Also stub outbound email, WhatsApp, and other notification providers in route tests. Clearing SMTP environment variables is not sufficient when persisted system settings can configure a real provider.

**Why:** `setupAuth` creates a separate `connect-mongo` session client whenever `MONGODB_URI` is present, and HTTP integration tests can trigger external deliveries through database-backed provider settings. Tests have both hung on the session client and sent mail outside the test process.

**How to apply:** Keep the existing Mongoose test connection active, clear its URI around `registerRoutes`, restore it in `finally`, close the server and database during cleanup, and replace real delivery providers with test doubles.