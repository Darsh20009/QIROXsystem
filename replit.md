# Qirox Platform

## Overview

Qirox is a SaaS "Systems Factory" platform (qirox.tech) that showcases 8 industry-specific website templates and provides admin management for templates and pricing. The platform targets Arabic-speaking markets (Saudi Arabia, Egypt) with RTL UI, positioning itself as a "Website Infrastructure Automation Platform" for investors and clients.

The application is a full-stack TypeScript project with a React frontend and Express backend. It includes:
- **Public Pages**: Home (8 sectors showcase), Portfolio (filtering by category), Pricing (3 tiers), About (investor-focused company profile), Contact
- **Admin Pages**: Templates CRUD management, Pricing management, Services, Orders, Finance, Employees
- **Client Pages**: Dashboard, Project tracking, Order flow
- **Authentication**: Session-based with role-based access control

## Recent Changes (Feb 2026)

- **COMPLETE UI/UX REDESIGN**: Converted entire frontend from dark theme (bg-[#0A0A0F], cyan accents) to light theme (white background, black/gray color scheme). Affected: index.css, all components (Navigation, Footer, Sidebar, Splash), and all pages (Home, Services, Portfolio, Prices, Login, About, Contact, OrderFlow, Admin pages).
  - Design tokens: bg-white, text-black, borders: black/[0.06], accents: gray-400, premium buttons: bg-black text-white
  - Navigation: transparent → glass-strong on scroll, active indicator with layoutId animation
  - Splash screen: typewriter effect with black/gray on white, minimal animations
  - Cards: white bg with subtle borders and hover shadows instead of dark glass
  - CTA sections: bg-black with white text (inverted from main)
- Added SectorTemplate and PricingPlan MongoDB models with 8 seeded industry templates
- Built Portfolio page with category filtering and sector cards
- Built Pricing page with 3 plans (Starter 5K, Business 15K, Enterprise 40K SAR)
- Built Admin Templates page with CRUD operations and pricing management tabs
- Enhanced Home page with dynamic 8-sector showcase from database + 4 main service paths section (restaurants, stores, education, institutions)
- Updated Navigation with Portfolio, Prices, About links
- Built AdminServices page with full CRUD (create/edit/delete) using simple state management
- Built AdminOrders page with order management, quick approve/reject, status updates, and detail view
- Integrated PayPal payment (server/paypal.ts with lazy SDK initialization, client/src/components/PayPalButton.tsx)
- PayPal routes: GET /paypal/setup, POST /paypal/order, POST /paypal/order/:orderID/capture
- Replaced splash screen and system icons with actual QIROX logo (attached_assets/QIROX_LOGO_1771674917456.png)
- Updated Sidebar with admin templates management link
- Enhanced About page with investor-focused content (tech stack, business model, sectors)
- **SECURITY**: Removed all GitHub repository URLs from seed data, schema, models, and frontend (8 template references stripped)
- **i18n**: Created full bilingual (Arabic/English) translation system (`client/src/lib/i18n.tsx`) with 100+ keys
- **i18n**: Integrated i18n across Navigation, Services, OrderFlow, Login, Footer, Portfolio, Sidebar pages
- **i18n**: Language toggle button in navigation and admin header with localStorage persistence
- **Fix**: Changed order creation route from Drizzle-validated path to direct `/api/orders` for MongoDB string ObjectID compatibility
- **Fix**: MongoDB migration to strip repoUrl from existing template documents
- **Upload**: Added file upload system (multer) with POST /api/upload and /api/upload/multiple endpoints
- **Upload**: OrderFlow Step 3 now uses real file uploads (logo, brand identity, content, images, video) instead of URL text fields
- **Upload**: Bank transfer receipt (Step 4) also uses file upload; uploaded files stored in `uploads/` directory
- **Upload**: Files payload saved as `files` field in order documents (Mixed type in Mongoose)

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
- **Authentication**: Passport.js with Local Strategy, express-session with memorystore, scrypt password hashing
- **Storage Layer**: Repository pattern via `IStorage` interface in `server/storage.ts`, implemented as `MongoStorage` using Mongoose
- **Build**: Custom build script (`script/build.ts`) that uses Vite for client and esbuild for server, outputting to `dist/`

### Shared Code (`shared/` directory)
- **Schema** (`shared/schema.ts`): TypeScript interfaces for MongoDB types (SectorTemplate, PricingPlan) + Drizzle/Zod schemas for legacy PostgreSQL types. Browser-safe.
- **Routes** (`shared/routes.ts`): Typed API route definitions with paths, methods, input schemas, and response schemas.

### Server-Only Code
- **Models** (`server/models.ts`): Mongoose model definitions. These must NOT be imported by frontend code.

### Database
- **Primary Database**: MongoDB via Mongoose
- **Connection**: Configured via `MONGODB_URI` environment variable
- **Collections**: users, services, orders, projects, tasks, messages, sectortemplates, pricingplans
- **Key Models**:
  - SectorTemplate: 8 industry templates (quran-academy, education-platform, exam-system, fitness-platform, resume-cv, charity-ngo, ecommerce-store, cafe-restaurant)
  - PricingPlan: 3 tiers (starter, business, enterprise)
- **Key Relationships**: Users have orders -> orders create projects -> projects have tasks and messages. Users have roles (client, admin, employee types).

### API Endpoints
- **Templates**: GET `/api/templates`, GET `/api/templates/:id`
- **Pricing**: GET `/api/pricing`
- **Admin Templates**: POST/PATCH/DELETE `/api/admin/templates/:id`
- **Admin Pricing**: POST/PATCH/DELETE `/api/admin/pricing/:id`
- **Auth**: POST `/api/register`, POST `/api/login`, POST `/api/logout`, GET `/api/user`

### Authentication & Authorization
- Session-based auth with express-session and memorystore
- Role-based access: roles defined on the user model (client, admin, various employee types)
- Admin routes require authentication and non-client role

### Development Setup
- **Dev server**: Vite dev server proxied through Express with HMR via WebSocket at `/vite-hmr`
- **Production**: Static files served from `dist/public`, server bundle at `dist/index.cjs`
- **Path aliases**: `@/` -> `client/src/`, `@shared/` -> `shared/`, `@assets/` -> `attached_assets/`
- **Environment variables needed**: `MONGODB_URI` (required for database)

### Key Design Decisions

1. **Monorepo with shared types**: The `shared/` directory contains TypeScript interfaces and Zod schemas, ensuring type safety across the full stack.

2. **Mongoose models separated from shared types**: Mongoose models live in `server/models.ts` (server-only) while types/interfaces live in `shared/schema.ts` (browser-safe).

3. **Repository pattern**: The `IStorage` interface abstracts database operations.

4. **Arabic-first UI**: RTL layout is the default. Fonts, colors, and copy are designed for Arabic-speaking markets. Brand colors: Deep Blue (#0f172a) and Electric Cyan (#06b6d4).

5. **Session-based auth**: Server-side session management with memorystore.

6. **Modular architecture concept**: Each template is built on Core + Modules pattern for extensibility.

## External Dependencies

### Required Services
- **MongoDB**: Primary database. Must be provisioned and `MONGODB_URI` env var set.
- **PayPal**: Optional. Requires `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` secrets. Server gracefully degrades if not set (returns 503 on PayPal routes).

### Key npm Packages
- **mongoose**: ODM for MongoDB
- **express** (v5): HTTP server framework
- **passport** + **passport-local**: Authentication
- **memorystore**: Session store
- **@tanstack/react-query**: Server state management on the client
- **react-hook-form** + **zod**: Form handling and validation
- **framer-motion**: Animations
- **recharts**: Dashboard analytics charts
- **wouter**: Client-side routing
- **shadcn/ui components**: Full suite of Radix-based UI components
- **tailwindcss**: Utility-first CSS framework
- **date-fns**: Date formatting (Arabic locale support)

### Replit-Specific Plugins
- `@replit/vite-plugin-runtime-error-modal`: Error overlay in development
- `@replit/vite-plugin-cartographer`: Dev tooling (dev only)
- `@replit/vite-plugin-dev-banner`: Dev banner (dev only)
