# Qirox Platform

Qirox is a SaaS "Systems Factory" platform that showcases industry-specific website templates and provides admin management for templates and pricing, targeting Arabic-speaking markets.

## Run & Operate

- **Run Dev Server**: `npm run dev`
- **Build**: `npm run build` (client with Vite, server with esbuild)
- **Typecheck**: `npm run typecheck`
- **Codegen**: `npm run codegen`
- **DB Push**: `npm run db:push` (for Drizzle, if used)
- **Env Vars**:
  - `MONGODB_URI`: MongoDB Atlas connection string (required)
  - `SMTP2GO_API_KEY`, `SMTP2GO_SENDER`, `SMTP2GO_SENDER_NAME`, `EMAIL_LOGO_URL`, `EMAIL_SITE_URL`: For email notifications
  - `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`: For PayPal integration (optional)
  - `SESSION_SECRET`: Long random string for Express sessions
  - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`: For Web Push Notifications
  - `OPENAI_API_KEY`: For AI features
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`: For OAuth (if implemented)
  - `SANDBOX_ENC_KEY`: For sandbox environment variable encryption

## Stack

- **Frontend**: React 18 (TypeScript), Vite, Wouter, TanStack React Query, Shadcn/ui, Tailwind CSS, Framer Motion, React Hook Form (Zod), Lucide React
- **Backend**: Express 5 (Node.js, TypeScript), Mongoose, Passport.js, express-session, scrypt
- **Shared**: TypeScript interfaces & Zod schemas
- **Database**: MongoDB
- **Runtime**: Node.js

## Where things live

- **`client/src/`**: Frontend source code
- **`server/src/`**: Backend source code
- **`shared/src/`**: Shared types and schemas (source of truth for API contracts: `shared/src/schema.ts`, `shared/src/routes.ts`)
- **`server/src/models.ts`**: Mongoose models (server-only DB schema definitions)
- **`client/src/index.css`**: Global styles and Tailwind configuration
- **`client/src/lib/i18n.tsx`**: i18n configuration and translation keys
- **`/public`**: Static assets (e.g., `qirox-loader-logo.png`)
- **`uploads/`**: Uploaded files (e.g., bank transfer proofs)
- **`sandbox-projects/`**: Sandbox IDE project files

## Architecture decisions

- **Monorepo with Shared Types**: Enforces type safety across frontend and backend using a `shared/` directory for interfaces and Zod schemas.
- **Arabic-First UI**: Prioritizes RTL layout, Arabic fonts, and localized content, with full bilingual support.
- **Repository Pattern**: Abstracts database operations via an `IStorage` interface for better maintainability and potential future database changes.
- **Session-Based Authentication**: Leverages server-side session management with `express-session` for user authentication.
- **Modular Architecture**: Core + Modules pattern for templates and features to ensure extensibility.
- **Dynamic Connection Settings**: Allows live switching of primary/secondary databases and email services from the admin panel without redeployment.

## Product

- **Public Pages**: Home (8 sectors showcase), Portfolio, Pricing, About, Contact, Switch Reminder, Qirox AI Wizard, Order Tracking.
- **Admin Features**: Templates/Pricing/Services/Orders/Finance/Employees management, Sales Reports, AI Sessions, Cron Jobs, MongoDB Atlas integration, App Publishing, Modification Quota, Push Notifications, Quotations, Installments, Lead Auto-Assignment.
- **Client Features**: Dashboard, Project tracking, Order flow (5-step), Wallet (Qirox Pay), Loyalty program, Digital Contracts, Client Data Requests, My Tools (50+ utilities), Profile management (avatar builder), Client Group announcements.
- **Employee Features**: QMeet (WebRTC video conferencing), Employee Mail, System Builder (Cloud IDE), Role-specific dashboards, Changelog/Employee Guide.
- **Core Systems**: Full i18n (Arabic/English, RTL/LTR), Dark/Light mode, Comprehensive notification system (in-app, email, push, WS), Device 2FA, Multiple 2FA methods (TOTP, email OTP, passphrase, push approval).
- **E-commerce Store**: Embedded Qirox Store module with product management and API proxies.

## User preferences

Preferred communication style: Simple, everyday language.

## Gotchas

- **DevTools in Production**: DevTools detection and right-click blocking are active only in production environments.
- **QMeet Lobby**: `lobbyEnabled` defaults to `false` for new meetings; hosts can manually enable it.
- **PayPal Integration**: If PayPal secrets are not set, PayPal routes will gracefully degrade to 503 errors.
- **Wallet PIN**: Always required for wallet payments.
- **IMAP Connection Timeout**: Corporate mail IMAP connections have timeouts to prevent hangs.
- **Chat Guest Messages**: Guests' chat messages (`msg.userId`) now correctly use `myIdRef.current` to avoid stale closures.
- **Mobile Screen Sharing**: Screen sharing is restricted to laptop/desktop devices.

## Pointers

- **UI Components**: [Shadcn/ui Documentation](https://ui.shadcn.com/)
- **State Management**: [TanStack Query Documentation](https://tanstack.com/query/latest)
- **Form Handling**: [React Hook Form Documentation](https://react-hook-form.com/)
- **Animations**: [Framer Motion Documentation](https://www.framer.com/motion/)
- **Routing**: [Wouter Documentation](https://www.npmjs.com/package/wouter)
- **Icons**: [Lucide React Icons](https://lucide.dev/icons/)
- **Date Formatting**: [date-fns Documentation](https://date-fns.org/)
- **Backend Framework**: [Express.js Documentation](https://expressjs.com/)
- **Database ODM**: [Mongoose Documentation](https://mongoosejs.com/)
- **Authentication**: [Passport.js Documentation](http://www.passportjs.org/)
- **Email Service**: [SMTP2GO Documentation](https://www.smtp2go.com/)
- **WebSocket Library**: [ws Documentation](https://github.com/websockets/ws)
- **Monaco Editor**: [Monaco React Documentation](https://github.com/suren-atoyan/monaco-react)
- **QR Code Generation**: [qrcode.react Documentation](https://www.npmjs.com/package/qrcode.react)