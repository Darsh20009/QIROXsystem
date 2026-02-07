# Qirox Platform

## Overview

Qirox is a SaaS platform for a digital services company (qirox.tech) that builds professional websites and digital systems for businesses. The platform targets four market segments: restaurants/cafes, stores/brands, education platforms, and institutional/internal systems. It operates primarily in Saudi Arabia and Egypt.

The application is a full-stack TypeScript project with a React frontend and Express backend. It includes client-facing pages (home, services catalog, order flow), user authentication, a client dashboard for tracking orders and projects, and project management with tasks and messaging. The UI is Arabic-first with RTL layout support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state; no global client state library
- **UI Components**: Shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with CSS custom properties for theming, PostCSS with autoprefixer
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Icons**: Lucide React
- **Fonts**: Cairo (headings) and IBM Plex Sans Arabic (body text) — Arabic-first typography
- **RTL Support**: HTML dir="rtl", CSS direction: rtl on body, space-x-reverse utilities
- **PWA**: Basic manifest.json and install prompt component for add-to-homescreen

### Backend Architecture
- **Framework**: Express 5 on Node.js with TypeScript (run via tsx in dev, esbuild bundle for production)
- **API Pattern**: REST API under `/api/*` prefix, with typed route definitions in `shared/routes.ts`
- **Authentication**: Passport.js with Local Strategy, express-session with PostgreSQL session store (connect-pg-simple), scrypt password hashing
- **Storage Layer**: Repository pattern via `IStorage` interface in `server/storage.ts`, currently implemented as `DatabaseStorage` using Drizzle ORM
- **Build**: Custom build script (`script/build.ts`) that uses Vite for client and esbuild for server, outputting to `dist/`

### Shared Code (`shared/` directory)
- **Schema** (`shared/schema.ts`): Drizzle ORM table definitions and Zod insert schemas (via drizzle-zod). This is the single source of truth for data models.
- **Routes** (`shared/routes.ts`): Typed API route definitions with paths, methods, input schemas, and response schemas. Used by both client hooks and server route handlers.

### Database
- **Primary Database**: PostgreSQL via Drizzle ORM (node-postgres driver)
- **Schema Management**: `drizzle-kit push` for migrations (push-based, no migration files checked in by default)
- **MongoDB**: Optional secondary database connection via Mongoose (configured in `server/db.ts` but only connects if `MONGODB_URI` env var is present)
- **Tables**: `users`, `services`, `orders`, `projects`, `tasks`, `messages` — all defined in `shared/schema.ts`
- **Key Relationships**: Users have orders → orders create projects → projects have tasks and messages. Users have roles (client, admin, employee_manager, employee_sales, employee_dev, employee_design, employee_support).

### Authentication & Authorization
- Session-based auth with 30-day cookie expiry
- PostgreSQL-backed session store
- Role-based access: roles defined on the user model (client, admin, various employee types)
- Auth endpoints: POST `/api/register`, POST `/api/login`, POST `/api/logout`, GET `/api/user`

### Development Setup
- **Dev server**: Vite dev server proxied through Express with HMR via WebSocket at `/vite-hmr`
- **Production**: Static files served from `dist/public`, server bundle at `dist/index.cjs`
- **Path aliases**: `@/` → `client/src/`, `@shared/` → `shared/`, `@assets/` → `attached_assets/`
- **Environment variables needed**: `DATABASE_URL` (required), `MONGODB_URI` (optional), `SESSION_SECRET` (defaults to hardcoded value)

### Key Design Decisions

1. **Monorepo with shared types**: The `shared/` directory contains both database schema and API route definitions, ensuring type safety across the full stack without code generation.

2. **Drizzle ORM over Prisma**: Chosen for its lightweight SQL-like API and tight Zod integration via drizzle-zod, enabling schema-to-validation pipeline.

3. **Repository pattern**: The `IStorage` interface abstracts database operations, making it possible to swap implementations (e.g., in-memory for testing).

4. **Arabic-first UI**: RTL layout is the default. Fonts, colors, and copy are designed for Arabic-speaking markets. The brand colors are Deep Blue (#0f172a) and Electric Cyan (#06b6d4).

5. **Session-based auth over JWT**: Simpler server-side session management with PostgreSQL persistence, appropriate for a server-rendered SPA pattern.

## External Dependencies

### Required Services
- **PostgreSQL**: Primary database, also used for session storage. Must be provisioned and `DATABASE_URL` env var set.

### Optional Services
- **MongoDB**: Secondary database for future features. Connected only if `MONGODB_URI` is set.

### Key npm Packages
- **drizzle-orm** + **drizzle-kit**: ORM and migration tooling for PostgreSQL
- **express** (v5): HTTP server framework
- **passport** + **passport-local**: Authentication
- **connect-pg-simple**: PostgreSQL session store
- **@tanstack/react-query**: Server state management on the client
- **react-hook-form** + **zod**: Form handling and validation
- **framer-motion**: Animations
- **recharts**: Dashboard analytics charts
- **wouter**: Client-side routing
- **shadcn/ui components**: Full suite of Radix-based UI components (accordion, dialog, dropdown, form, toast, etc.)
- **tailwindcss**: Utility-first CSS framework
- **date-fns**: Date formatting (Arabic locale support)

### Replit-Specific Plugins
- `@replit/vite-plugin-runtime-error-modal`: Error overlay in development
- `@replit/vite-plugin-cartographer`: Dev tooling (dev only)
- `@replit/vite-plugin-dev-banner`: Dev banner (dev only)