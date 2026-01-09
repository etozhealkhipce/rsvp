# RSVP Reader

## Overview

RSVP Reader is a speed reading web application that uses Rapid Serial Visual Presentation (RSVP) technology to help users read faster. The app displays words one at a time at a focal point, eliminating eye movement and enabling faster reading comprehension. Content is stored locally in the browser using IndexedDB, while the server handles authentication and subscription management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled using Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, local React state for UI
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration supporting light/dark modes
- **Local Storage**: IndexedDB for storing books, reading progress, and user content locally in the browser

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript compiled with tsx
- **API Design**: RESTful endpoints under `/api/*` prefix
- **Authentication**: Replit Auth integration using OpenID Connect with Passport.js
- **Session Management**: PostgreSQL-backed sessions via connect-pg-simple

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` defines all database tables
- **Tables**: 
  - `sessions` - User session storage (required for auth)
  - `users` - User profiles from Replit Auth
  - `subscriptions` - Free/premium tier status and WPM limits
  - `user_preferences` - Reading settings (WPM, font size, gradual start, pause on punctuation)
- **Client-side Storage**: IndexedDB stores all reading content locally, including text content, word count, reading progress, and per-text settings

### Key Design Decisions
- **Local-first content**: Books and texts are stored in IndexedDB to enable offline reading and reduce server load. The server only manages auth and subscription status.
- **Subscription tiers**: Free tier limits WPM to 350, premium unlocks higher speeds and advanced features
- **ORP (Optimal Recognition Point)**: Words are centered at a calculated focal point to minimize eye movement during RSVP reading
- **Gradual speed adaptation**: Reading starts at 60% target speed and ramps up to help the brain adapt

## External Dependencies

### Database
- PostgreSQL database (required, connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database queries
- Schema migrations in `/migrations` directory, run with `npm run db:push`

### Authentication
- Replit Auth (OpenID Connect provider)
- Required environment variables: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`

### Third-Party Libraries
- Radix UI primitives for accessible components
- TanStack Query for data fetching
- date-fns for date formatting
- Google Fonts (Inter, JetBrains Mono) for typography