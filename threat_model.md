# QIROX Studio Threat Model

**Last reviewed:** 2026-09-16  
**Scope:** the QIROX Studio web application, its Express/MongoDB API, browser client, WebSocket signaling, file uploads, OAuth/OTP flows, and the embedded proxy/demo surfaces.

## Security objectives

1. Only an authenticated user may access their own account, client records, projects, documents, notifications, and WebSocket presence.
2. Role checks are enforced on the server, not only by React route guards.
3. Passwords, device tokens, OAuth credentials, API keys, payment data, and database credentials do not appear in logs, browser storage, URLs, or client responses unless explicitly required.
4. Uploaded content cannot become executable application content and upload endpoints cannot be used for unbounded memory/disk denial of service.
5. Authentication, OTP, password reset, and public forms are rate limited and resistant to replay.
6. A browser visitor may inspect shipped frontend code; confidentiality must therefore come from server-side authorization, not from anti-copy JavaScript.

## System and trust boundaries

- **Browser/mobile WebView:** untrusted. It can modify JavaScript, request bodies, local storage, headers supported by the platform, and WebSocket messages.
- **Reverse proxy / Replit or hosting edge:** terminates TLS and forwards requests. Forwarded headers must not be treated as user identity without the trusted proxy configuration.
- **Express API:** authentication, authorization, validation, rate limiting, uploads, PDF generation, proxying, and WebSocket upgrade boundary.
- **MongoDB:** trusted data store containing users, sessions, tokens, financial records, documents, and audit data. Database credentials are configuration secrets.
- **External providers:** Google/Apple/GitHub OAuth, PayPal, email/SMS/push providers, AI providers, LiveKit/meeting services, and proxied demo sites. Responses and availability are not trusted.
- **Public upload URLs and embedded proxy routes:** intentionally shareable surfaces with a larger exposure than authenticated API routes.

## High-value assets

- Session cookies, device tokens, pending 2FA/OTP records, OAuth state and callback data.
- User identity, phone/email, employee roles, client projects, contracts, invoices, IBAN/bank details, payment records, and private messages.
- GitHub deployment tokens, AI keys, WhatsApp credentials, SMTP credentials, MongoDB URI, and signing secrets.
- Uploaded files, generated PDFs, QR login artifacts, WebSocket notifications, and meeting signaling.

## Main threats and controls

### T1 — Browser impersonates another user

**Attack:** send another `userId` in the WebSocket authentication message or call an API with another record ID.  
**Controls:** the WebSocket upgrade now authenticates the existing session or hashed device token before accepting a connection; the server-derived user ID is used for all socket actions. API authorization remains required per route.  
**Residual risk:** every route with an object ID still needs periodic IDOR review; frontend guards are not security controls.

### T2 — Credential or token leakage

**Attack:** secrets appear in console output, response logging, URLs, source maps, or browser storage.  
**Controls:** production requires `SESSION_SECRET`; session cookies are `httpOnly`, `secure` in production, and `sameSite=lax`; device tokens are hashed server-side; response bodies are no longer logged; external AI logs only the provider hostname; production bundles do not request source maps.  
**Residual risk:** third-party provider dashboards and hosting logs must still be governed separately.

### T3 — Cross-site request forgery and clickjacking

**Attack:** a hostile page submits state-changing requests or frames the application to trick a logged-in user.  
**Controls:** same-site session cookies, explicit CSP with `frame-ancestors`, restricted Permissions Policy, `nosniff`, HSTS in production, and a narrow exception for the intentional embedded proxy routes.  
**Residual risk:** OAuth and payment callbacks must retain their provider-specific flow; any future cross-origin mutation endpoint needs an explicit Origin/CSRF design.

### T4 — NoSQL/operator injection

**Attack:** place MongoDB operators or query objects in request data.  
**Controls:** request schemas and allowlisted query fields are required for production routes; query values should be converted to strings/ObjectIds before use. Static-analysis findings in `cafe-demo` are treated separately from the production API and must not be copied into production code.  
**Residual risk:** the large route file requires ongoing targeted IDOR/injection review.

### T5 — Upload abuse and stored content execution

**Attack:** upload executable HTML/SVG/script content, spoof an extension, or exhaust disk/memory with multipart requests.  
**Controls:** randomized filenames, extension plus MIME allowlists, explicit file/part/field limits, authenticated upload routes, role restrictions for large uploads, `nosniff`, and no HTML/SVG in the general upload contract.  
**Residual risk:** MIME checks are not full magic-byte inspection; production should add a file-signature scanner or isolated object-storage processing for higher assurance.

### T6 — API and OTP abuse

**Attack:** brute-force credentials/OTP, enumerate users, flood public endpoints, or create expensive AI/PDF/upload work.  
**Controls:** global API limiter plus stricter login/OTP/register/contact/QR limiters, bounded JSON bodies, and authenticated upload endpoints.  
**Residual risk:** in-memory rate limiting is per process; multi-instance production should use a shared limiter store.

### T7 — WebSocket signaling abuse

**Attack:** unauthenticated presence spoofing, cross-user notifications, oversized messages, or unauthorized room actions.  
**Controls:** authenticated upgrade, server-derived identity, room membership/ban checks already present, and no trust in client `userId`.  
**Residual risk:** message size/rate limits and a shared connection quota should be added if public meeting traffic grows.

### T8 — Dependency and supply-chain vulnerabilities

**Attack:** exploit vulnerable transitive packages or compromise build artifacts.  
**Controls:** dependency audit is part of the security review; production build bundles the server and keeps only required native/ESM modules external; dependency upgrades should be tested in a separate change.  
**Residual risk:** current audit output contains many transitive findings, including findings in the mockup sandbox. They should be triaged by reachable production path rather than mass-upgraded blindly.

## Security testing plan

- Run dependency audit, SAST, and privacy scan after each security batch.
- Exercise unauthenticated and wrong-role requests for representative client, employee, manager, and admin resources.
- Verify WebSocket upgrades fail without a session/device token and that a mismatched client `userId` closes the socket.
- Test upload MIME/size/part limits and confirm uploaded names cannot select a server path.
- Inspect production response headers and confirm no source maps or credential-like response logging.
- Re-test OAuth, OTP, PDF download/email, uploads, QMeet, and embedded demo/proxy routes after header changes.

## Initial scan triage

The initial automated scan reported **3 critical, 120 high, 111 moderate, and
32 low dependency findings**. These are primarily transitive packages and
must be upgraded by reachable production path, not by an untested blanket
upgrade. The most urgent direct-looking items included `fast-xml-parser`,
`vite`, `postcss`, `browserslist`, `brace-expansion`, `fflate`, and
`form-data`.

SAST reported **2 critical findings** in the separate `cafe-demo` sample's
Mongoose auth middleware. HoundDog reported **8 critical findings**, including
credential-like values in console messages and customer/payment data in the
demo's local storage. The production response logger and external-provider
logging were hardened in this pass; the demo findings remain isolated and
should be remediated before that demo is treated as a production system.

## Known non-security guarantees

JavaScript cannot reliably prevent a visitor from opening developer tools, copying visible text, taking screenshots, or downloading assets already delivered to the browser. `AntiDevTools` only discourages casual copying; authorization, data minimization, server-side secrets, and rate limits are the real protections.