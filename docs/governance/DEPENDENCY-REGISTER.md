# Dependency Register — QIROX Platform

**Version:** 1.0  
**Last updated:** Enterprise Governance migration  
**Owner:** Engineering  
**Review cycle:** Every major release cycle

---

## Format

| Field | Description |
|---|---|
| **Package** | npm package name and pinned version range |
| **Purpose** | What the platform uses it for |
| **Owner** | Team responsible for keeping it updated |
| **Used By** | Server modules / client modules that import it |
| **Security Risk** | LOW / MEDIUM / HIGH — based on attack surface and privilege |
| **Replacement Strategy** | What would replace it if it needs to be swapped |
| **Last Review** | Date of last security + compatibility review |

---

## Tier 1 — Core Runtime (highest risk; any failure is a platform outage)

---

### express `^5.2.1`

| Field | Value |
|---|---|
| **Purpose** | HTTP server framework; all API routing |
| **Owner** | Engineering |
| **Used By** | `server/index.ts`, all route files |
| **Security Risk** | HIGH — primary ingress; all requests flow through it |
| **Replacement Strategy** | Fastify (API-compatible adapter layer required) |
| **Last Review** | Enterprise Governance migration |

---

### mongoose `^9.7.2`

| Field | Value |
|---|---|
| **Purpose** | MongoDB ODM; all database models and queries |
| **Owner** | Engineering |
| **Used By** | `server/models.ts`, all domains, all route files |
| **Security Risk** | HIGH — NoSQL injection if input not sanitised before queries |
| **Replacement Strategy** | Native MongoDB driver (already installed); migration complex |
| **Last Review** | Enterprise Governance migration |

---

### mongodb `^7.3.0`

| Field | Value |
|---|---|
| **Purpose** | Native MongoDB driver (used directly by connection-manager) |
| **Owner** | Engineering |
| **Used By** | `server/connection-manager.ts`, `server/qmeet-db.ts` |
| **Security Risk** | HIGH — direct database access |
| **Replacement Strategy** | N/A — base driver |
| **Last Review** | Enterprise Governance migration |

---

### express-session `^1.19.0`

| Field | Value |
|---|---|
| **Purpose** | HTTP session management; user auth state |
| **Owner** | Engineering |
| **Used By** | `server/index.ts`, `server/auth.ts` |
| **Security Risk** | HIGH — session fixation, hijacking risk if misconfigured |
| **Replacement Strategy** | JWT-based stateless auth (significant migration) |
| **Last Review** | Enterprise Governance migration |

---

### connect-mongo `^6.0.0`

| Field | Value |
|---|---|
| **Purpose** | Persists express-session data to MongoDB |
| **Owner** | Engineering |
| **Used By** | `server/index.ts` |
| **Security Risk** | MEDIUM — stores session tokens in DB; must use secure settings |
| **Replacement Strategy** | Redis + connect-redis |
| **Last Review** | Enterprise Governance migration |

---

### memorystore `^1.6.7`

| Field | Value |
|---|---|
| **Purpose** | In-memory session store (development fallback) |
| **Owner** | Engineering |
| **Used By** | `server/index.ts` (dev only) |
| **Security Risk** | LOW — dev only; not used in production |
| **Replacement Strategy** | N/A — dev tool |
| **Last Review** | Enterprise Governance migration |

---

## Tier 2 — Authentication & Security

---

### passport `^0.7.0`

| Field | Value |
|---|---|
| **Purpose** | Authentication middleware framework |
| **Owner** | Engineering |
| **Used By** | `server/auth.ts`, `server/index.ts` |
| **Security Risk** | HIGH — authentication backbone; misconfiguration = auth bypass |
| **Replacement Strategy** | Custom middleware + OAuth libraries directly |
| **Last Review** | Enterprise Governance migration |

---

### passport-local `^1.0.0`

| Field | Value |
|---|---|
| **Purpose** | Username/password auth strategy |
| **Owner** | Engineering |
| **Used By** | `server/auth.ts` |
| **Security Risk** | HIGH — primary login mechanism |
| **Replacement Strategy** | Custom bcrypt compare middleware |
| **Last Review** | Enterprise Governance migration |

---

### passport-google-oauth20 `^2.0.0`

| Field | Value |
|---|---|
| **Purpose** | Google OAuth 2.0 login |
| **Owner** | Engineering |
| **Used By** | `server/auth.ts` |
| **Security Risk** | MEDIUM — OAuth callback must validate state parameter |
| **Replacement Strategy** | `googleapis` OAuth2Client directly |
| **Last Review** | Enterprise Governance migration |

---

### passport-github2 `^0.1.12`

| Field | Value |
|---|---|
| **Purpose** | GitHub OAuth login (also used for DeploymentCloud) |
| **Owner** | Engineering |
| **Used By** | `server/auth.ts`, `server/deployment-cloud.ts` |
| **Security Risk** | MEDIUM — OAuth callback validation |
| **Replacement Strategy** | GitHub REST API OAuth flow directly |
| **Last Review** | Enterprise Governance migration |

---

### passport-apple `^2.0.2`

| Field | Value |
|---|---|
| **Purpose** | Sign in with Apple |
| **Owner** | Engineering |
| **Used By** | `server/auth.ts` |
| **Security Risk** | MEDIUM — JWT verification of Apple ID token |
| **Replacement Strategy** | Apple auth JWT verification directly |
| **Last Review** | Enterprise Governance migration |

---

### bcrypt `^6.0.0` / bcryptjs `^3.0.3`

| Field | Value |
|---|---|
| **Purpose** | Password hashing (bcrypt = native C binding; bcryptjs = JS fallback) |
| **Owner** | Engineering |
| **Used By** | `server/auth.ts`, `server/models.ts` |
| **Security Risk** | LOW — industry-standard; risk is in cost factor configuration |
| **Replacement Strategy** | Argon2 (stronger; available via `argon2` package) |
| **Last Review** | Enterprise Governance migration |

---

### speakeasy `^2.0.0`

| Field | Value |
|---|---|
| **Purpose** | TOTP / 2FA code generation and verification |
| **Owner** | Engineering |
| **Used By** | `server/auth.ts` |
| **Security Risk** | LOW — well-understood; risk is in secret storage |
| **Replacement Strategy** | `otpauth` package (more actively maintained) |
| **Last Review** | Enterprise Governance migration |

---

### @simplewebauthn/server `^13.2.3`

| Field | Value |
|---|---|
| **Purpose** | WebAuthn / Passkey server-side verification |
| **Owner** | Engineering |
| **Used By** | `server/auth.ts` |
| **Security Risk** | LOW — FIDO2 standard; library is well-maintained |
| **Replacement Strategy** | No viable drop-in; significant reimplementation |
| **Last Review** | Enterprise Governance migration |

---

### express-rate-limit `^8.2.1`

| Field | Value |
|---|---|
| **Purpose** | Rate limiting to prevent brute force and DoS |
| **Owner** | Engineering |
| **Used By** | `server/index.ts` |
| **Security Risk** | LOW — protective layer; failure means no limiting (not a breach) |
| **Replacement Strategy** | `@fastify/rate-limit`, or nginx-level rate limiting |
| **Last Review** | Enterprise Governance migration |

---

## Tier 3 — Email & Communications

---

### nodemailer `^8.0.11`

| Field | Value |
|---|---|
| **Purpose** | SMTP email transport for all transactional emails |
| **Owner** | Engineering |
| **Used By** | `server/domains/email/service.ts`, `server/email.ts` |
| **Security Risk** | MEDIUM — credential exposure risk; SMTP relay abuse if misconfigured |
| **Replacement Strategy** | SendGrid / Resend / AWS SES SDK |
| **Last Review** | Enterprise Governance migration |

---

### web-push `^3.6.7`

| Field | Value |
|---|---|
| **Purpose** | Web Push Notifications via VAPID |
| **Owner** | Engineering |
| **Used By** | `server/push.ts` |
| **Security Risk** | LOW — push subscription tokens are non-privileged |
| **Replacement Strategy** | Firebase Cloud Messaging (FCM) |
| **Last Review** | Enterprise Governance migration |

---

### imapflow `^1.3.2`

| Field | Value |
|---|---|
| **Purpose** | IMAP client for reading inbound email |
| **Owner** | Engineering |
| **Used By** | `server/mail-imap.ts` |
| **Security Risk** | MEDIUM — stores IMAP credentials in DB; plaintext password risk |
| **Replacement Strategy** | `node-imap` or hosted inbox API (Nylas, Gmail API) |
| **Last Review** | Enterprise Governance migration |

---

### mailparser `^3.9.8`

| Field | Value |
|---|---|
| **Purpose** | Parse raw IMAP email messages |
| **Owner** | Engineering |
| **Used By** | `server/mail-imap.ts` |
| **Security Risk** | LOW — parsing only; no I/O |
| **Replacement Strategy** | `email-parser` or custom mime parser |
| **Last Review** | Enterprise Governance migration |

---

### node-cron `^4.5.0`

| Field | Value |
|---|---|
| **Purpose** | Scheduled background jobs (27 cron tasks) |
| **Owner** | Engineering |
| **Used By** | `server/cron.ts`, `server/email-marketing.ts` |
| **Security Risk** | LOW — no network exposure; internal scheduler |
| **Replacement Strategy** | `agenda` (MongoDB-backed), or BullMQ |
| **Last Review** | Enterprise Governance migration |

---

## Tier 4 — AI & External APIs

---

### openai `^6.44.0`

| Field | Value |
|---|---|
| **Purpose** | GPT-4o text + vision; image generation proxy |
| **Owner** | Engineering |
| **Used By** | `server/ai.ts` |
| **Security Risk** | MEDIUM — API key exposure; prompt injection risk |
| **Replacement Strategy** | Anthropic Claude, Google Gemini |
| **Last Review** | Enterprise Governance migration |

---

### @paypal/paypal-server-sdk `^2.2.0`

| Field | Value |
|---|---|
| **Purpose** | PayPal payment order creation and capture |
| **Owner** | Engineering |
| **Used By** | `server/paypal.ts` |
| **Security Risk** | HIGH — payment processing; credential exposure = financial loss |
| **Replacement Strategy** | Stripe, Moyasar (for Saudi market) |
| **Last Review** | Enterprise Governance migration |

---

### googleapis `^148.0.0`

| Field | Value |
|---|---|
| **Purpose** | Google Sheets read/write integration |
| **Owner** | Engineering |
| **Used By** | `server/googleSheets.ts` |
| **Security Risk** | MEDIUM — service account key exposure |
| **Replacement Strategy** | Direct Google Sheets REST API |
| **Last Review** | Enterprise Governance migration |

---

### simple-git `^3.33.0`

| Field | Value |
|---|---|
| **Purpose** | Git operations for DeploymentCloud and sandbox projects |
| **Owner** | Engineering |
| **Used By** | `server/deployment-cloud.ts`, `server/sandbox-*.ts` |
| **Security Risk** | HIGH — executes git on server; path traversal risk if unsanitised |
| **Replacement Strategy** | `isomorphic-git` (pure JS; no shell execution) |
| **Last Review** | Enterprise Governance migration |

---

### digest-fetch `^3.1.1`

| Field | Value |
|---|---|
| **Purpose** | HTTP Digest authentication for cPanel API calls |
| **Owner** | Engineering |
| **Used By** | `server/cpanel.ts` |
| **Security Risk** | MEDIUM — cPanel credentials in server memory |
| **Replacement Strategy** | cPanel API token auth (token-based; no password needed) |
| **Last Review** | Enterprise Governance migration |

---

### http-proxy-middleware `^3.0.5`

| Field | Value |
|---|---|
| **Purpose** | Reverse proxy for external site demos (cafe demo) and deployment cloud |
| **Owner** | Engineering |
| **Used By** | `server/index.ts`, `server/deployment-cloud.ts` |
| **Security Risk** | MEDIUM — SSRF risk if target URLs are user-controlled |
| **Replacement Strategy** | `node-http-proxy`, or nginx |
| **Last Review** | Enterprise Governance migration |

---

## Tier 5 — Document Generation

---

### pdf-lib `^1.17.1`

| Field | Value |
|---|---|
| **Purpose** | PDF generation (invoices, quotations, receipts) |
| **Owner** | Engineering |
| **Used By** | `server/pdf.ts` |
| **Security Risk** | LOW — file generation; no network I/O |
| **Replacement Strategy** | Puppeteer (HTML→PDF), pdfkit |
| **Last Review** | Enterprise Governance migration |

---

### arabic-reshaper `^1.1.0`

| Field | Value |
|---|---|
| **Purpose** | Correct Arabic text rendering inside PDF-lib (RTL shaping) |
| **Owner** | Engineering |
| **Used By** | `server/pdf.ts` |
| **Security Risk** | LOW |
| **Replacement Strategy** | No drop-in; custom shaping algorithm |
| **Last Review** | Enterprise Governance migration |

---

### exceljs `^4.4.0`

| Field | Value |
|---|---|
| **Purpose** | Generate Excel spreadsheets for export features |
| **Owner** | Engineering |
| **Used By** | `server/routes.ts` (export handlers) |
| **Security Risk** | LOW — file generation only |
| **Replacement Strategy** | `xlsx` (already installed, lower fidelity) |
| **Last Review** | Enterprise Governance migration |

---

### xlsx `^0.18.5`

| Field | Value |
|---|---|
| **Purpose** | Parse and generate Excel/CSV files for import features |
| **Owner** | Engineering |
| **Used By** | `server/routes.ts` (import handlers) |
| **Security Risk** | LOW — note: `xlsx` has known past CVEs; keep updated |
| **Replacement Strategy** | `exceljs` (already installed) |
| **Last Review** | Enterprise Governance migration |

---

### archiver `^7.0.1` / unzipper `^0.12.3`

| Field | Value |
|---|---|
| **Purpose** | ZIP creation (archiver) and extraction (unzipper) for sandbox and exports |
| **Owner** | Engineering |
| **Used By** | `server/sandbox-*.ts`, export routes |
| **Security Risk** | MEDIUM — zip-slip vulnerability risk in unzipper if paths not validated |
| **Replacement Strategy** | `adm-zip`, or native `zlib` for simple cases |
| **Last Review** | Enterprise Governance migration |

---

### mammoth `^1.11.0`

| Field | Value |
|---|---|
| **Purpose** | Convert DOCX files to HTML for document import |
| **Owner** | Engineering |
| **Used By** | `server/routes.ts` (document upload handlers) |
| **Security Risk** | LOW — parsing only |
| **Replacement Strategy** | `docx2html`, or LibreOffice CLI |
| **Last Review** | Enterprise Governance migration |

---

### multer `^2.2.0`

| Field | Value |
|---|---|
| **Purpose** | Multipart file upload handling |
| **Owner** | Engineering |
| **Used By** | `server/routes.ts`, upload endpoints |
| **Security Risk** | MEDIUM — file type validation must be enforced in application code |
| **Replacement Strategy** | `busboy` (lower-level; more control), `formidable` |
| **Last Review** | Enterprise Governance migration |

---

## Tier 6 — Frontend Core

---

### react `^18.3.1` / react-dom `^18.3.1`

| Field | Value |
|---|---|
| **Purpose** | Frontend UI framework |
| **Owner** | Engineering |
| **Used By** | All `client/` files |
| **Security Risk** | LOW — XSS protection built in; risk is in `dangerouslySetInnerHTML` usage |
| **Replacement Strategy** | Vue, Svelte (full rewrite required) |
| **Last Review** | Enterprise Governance migration |

---

### wouter `^3.3.5`

| Field | Value |
|---|---|
| **Purpose** | Client-side routing |
| **Owner** | Engineering |
| **Used By** | `client/App.tsx` |
| **Security Risk** | LOW |
| **Replacement Strategy** | React Router v7, TanStack Router |
| **Last Review** | Enterprise Governance migration |

---

### @tanstack/react-query `^5.60.5`

| Field | Value |
|---|---|
| **Purpose** | Server state management, caching, background refresh |
| **Owner** | Engineering |
| **Used By** | All `client/` query hooks |
| **Security Risk** | LOW |
| **Replacement Strategy** | SWR, Zustand + fetch |
| **Last Review** | Enterprise Governance migration |

---

### zod `^3.25.76`

| Field | Value |
|---|---|
| **Purpose** | Schema validation (client-side forms + server-side — stub) |
| **Owner** | Engineering |
| **Used By** | Client forms; `server/domains/*/validation.ts` (stubs — TECH-004) |
| **Security Risk** | LOW |
| **Replacement Strategy** | Yup, Valibot |
| **Last Review** | Enterprise Governance migration |

---

### @radix-ui/* (21 packages)

| Field | Value |
|---|---|
| **Purpose** | Accessible, unstyled UI primitives (dialogs, menus, tooltips, etc.) |
| **Owner** | Engineering |
| **Used By** | `client/components/ui/` |
| **Security Risk** | LOW |
| **Replacement Strategy** | shadcn/ui alternatives, Headless UI |
| **Last Review** | Enterprise Governance migration |

---

### tailwindcss `^3.4.17`

| Field | Value |
|---|---|
| **Purpose** | Utility-first CSS framework |
| **Owner** | Engineering |
| **Used By** | All client components |
| **Security Risk** | LOW |
| **Replacement Strategy** | CSS Modules, UnoCSS |
| **Last Review** | Enterprise Governance migration |

---

### framer-motion `^11.13.1`

| Field | Value |
|---|---|
| **Purpose** | Animation library for UI transitions |
| **Owner** | Engineering |
| **Used By** | Client components |
| **Security Risk** | LOW |
| **Replacement Strategy** | CSS transitions, GSAP |
| **Last Review** | Enterprise Governance migration |

---

### recharts `^2.15.2`

| Field | Value |
|---|---|
| **Purpose** | Data visualisation charts (dashboards) |
| **Owner** | Engineering |
| **Used By** | Dashboard client pages |
| **Security Risk** | LOW |
| **Replacement Strategy** | Chart.js, Victory, D3 |
| **Last Review** | Enterprise Governance migration |

---

### ws `^8.21.0`

| Field | Value |
|---|---|
| **Purpose** | WebSocket server (real-time notifications, QMeet signaling) |
| **Owner** | Engineering |
| **Used By** | `server/ws.ts` |
| **Security Risk** | MEDIUM — origin validation must be enforced; DoS risk |
| **Replacement Strategy** | Socket.io, uWebSockets.js |
| **Last Review** | Enterprise Governance migration |

---

### face-api.js `^0.22.2`

| Field | Value |
|---|---|
| **Purpose** | Browser-side face detection (client feature) |
| **Owner** | Engineering |
| **Used By** | Client — face recognition features |
| **Security Risk** | LOW — runs in browser; no server-side biometric data stored |
| **Replacement Strategy** | MediaPipe FaceDetection, TensorFlow.js |
| **Last Review** | Enterprise Governance migration |

---

### fabric `^7.2.0`

| Field | Value |
|---|---|
| **Purpose** | Canvas-based image/graphic editing |
| **Owner** | Engineering |
| **Used By** | Client — design editor features |
| **Security Risk** | LOW |
| **Replacement Strategy** | Konva.js |
| **Last Review** | Enterprise Governance migration |

---

## Security Review Schedule

| Risk Level | Review Frequency |
|---|---|
| HIGH | Every release cycle |
| MEDIUM | Every two release cycles |
| LOW | Annually or when major version change |

## Dependency Update Policy

1. Security patches: apply within 5 business days of disclosure.
2. Minor versions: review and apply at each release cycle.
3. Major versions: require an RFC before upgrading (API breakage risk).
4. `npm audit` output must be clean (0 high/critical) before any production release.
