---
name: HTTP route test sessions
description: Prevent real Mongo-backed Express route tests from hanging because of the session store.
---

When an HTTP test registers the full Express routes while using a real Mongoose connection, temporarily clear `MONGODB_URI` only while routes and authentication middleware are registered, then restore it before requests.

**Why:** `setupAuth` creates a separate `connect-mongo` session client whenever `MONGODB_URI` is present. Closing the HTTP server and disconnecting Mongoose does not close that independent client, so Node's test runner can time out after every assertion has passed.

**How to apply:** Keep the existing Mongoose test connection active, save the URI, clear it around `registerRoutes`, restore it in `finally`, and close the HTTP server plus Mongoose connection during test cleanup.