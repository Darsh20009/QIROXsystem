# Performance & Resilience Optimization

## What & Why
The application currently reads sessions from MongoDB on every request (via connect-mongo), has no server-side caching layer, lacks reconnection middleware, and has no graceful shutdown. These issues cause slow response times (~43s under load) and application freezes when MongoDB is temporarily unavailable. This task implements a comprehensive performance and resilience upgrade.

## Done looks like
- Session reads are fast (~95ms) using in-memory session store instead of MongoDB
- A new caching layer (cache.ts) with TTL and stale-data fallback is in place
- All important API endpoints use the cache — including inbox routes (5-min cache with smart invalidation)
- When MongoDB disconnects, the app returns stale cached data immediately instead of freezing
- MongoDB connection uses optimized timeouts: socketTimeout 10s, maxIdleTimeMS 50s, with automatic reconnection
- auth.ts bypasses session/DB lookup for public routes and caches deserialized users in memory
- index.ts includes middleware that detects MongoDB disconnection and triggers immediate reconnection
- Server shuts down gracefully on SIGTERM/SIGINT, releasing the port and closing connections properly

## Out of scope
- VAT/tax changes (separate task)
- New pages (separate task)
- Redis or external cache systems — this uses in-memory caching only

## Tasks
1. Create `server/cache.ts` — a generic in-memory cache utility with configurable TTL per key, automatic expiry, and stale-data fallback (return expired data when the DB is unreachable).
2. Switch session store from `connect-mongo` to `memorystore` in auth.ts. Add a public-route bypass list so unauthenticated routes skip session/DB lookups entirely. Add in-memory user cache for passport deserialization.
3. Update MongoDB connection options in connection-manager.ts: set socketTimeoutMS to 10000, maxIdleTimeMS to 50000, and ensure robust auto-reconnect behavior.
4. Add MongoDB reconnection middleware to index.ts that detects disconnected state and attempts immediate reconnection. Add SIGTERM/SIGINT handlers for graceful shutdown (close HTTP server, close MongoDB connections, release port).
5. Integrate caching into routes.ts for all important endpoints — particularly inbox routes (5-minute TTL with invalidation on write operations), admin dashboard aggregations, and other frequently-hit read endpoints. Ensure cache is invalidated on relevant POST/PUT/DELETE mutations.

## Relevant files
- `server/auth.ts`
- `server/index.ts`
- `server/connection-manager.ts`
- `server/routes.ts:4675-4770`
- `server/routes.ts:1081-1090`
- `server/db.ts`
- `server/storage.ts`
