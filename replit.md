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
- **Authentication**: Custom email/password authentication with bcrypt password hashing
- **Session Management**: PostgreSQL-backed sessions via connect-pg-simple

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` defines all database tables
- **Tables**: 
  - `sessions` - User session storage (required for auth)
  - `users` - User profiles with email, passwordHash, and profile info
  - `subscriptions` - Free/premium tier status and WPM limits
  - `user_preferences` - Reading settings (WPM, font size, gradual start, pause on punctuation)
- **Client-side Storage**: IndexedDB stores all reading content locally, including text content, word count, reading progress, and per-text settings

### Authentication System
- **Password Security**: bcrypt with 12 salt rounds for secure password hashing
- **Session Handling**: express-session with PostgreSQL store, session regeneration on login
- **Endpoints**:
  - `POST /api/auth/register` - Create new account
  - `POST /api/auth/login` - Authenticate existing user
  - `POST /api/auth/logout` - End session
  - `GET /api/auth/me` - Get current user
  - `PATCH /api/account/email` - Update email (requires password confirmation)
  - `PATCH /api/account/password` - Change password (requires current password)
- **Shared Types**: `shared/types/auth.ts` contains AuthUser interface and validation schemas

### Key Design Decisions
- **Local-first content**: Books and texts are stored in IndexedDB to enable offline reading and reduce server load. The server only manages auth and subscription status.
- **Subscription tiers**: Free tier limits WPM to 350, premium unlocks higher speeds and advanced features
- **ORP (Optimal Recognition Point)**: Words are centered at a calculated focal point to minimize eye movement during RSVP reading
- **Gradual speed adaptation**: Reading starts at 60% target speed and ramps up to help the brain adapt
- **Telegram Stars payments**: Premium subscriptions are purchased via Telegram Stars for easy payment in CIS countries

### Telegram Payment Integration
The app uses Telegram Stars for premium subscription payments with secure token-based account linking:
1. User clicks "Buy Premium via Telegram" on settings page
2. Frontend requests a time-limited token from the server (expires in 1 minute)
3. Opens Telegram bot with deep link containing the secure token
4. Token is verified and deleted after use (one-time use)
5. Bot creates a pending payment record and sends payment invoice (expires in 1 minute)
6. Pre-checkout validates: user match, price match, payment exists, not expired, not already paid
7. After payment, webhook marks payment as paid and activates premium subscription
8. User returns to app with premium active

**Multi-account support**: One Telegram account can pay for multiple app accounts.

**Bot commands**:
- `/history` - View payment history and linked accounts

**Security measures**:
- Token-based linking with 1-minute expiration
- Payment records track each invoice with unique chargeId to prevent double payments
- Expired invoices are rejected at pre-checkout
- Already-processed payments are rejected

**Database tables**:
- `telegram_link_tokens` - Short-lived tokens for deep links
- `telegram_payments` - Payment history with status (pending/paid/expired)

**Webhook endpoint**: `POST /api/telegram-webhook`
**Setup script**: `npx tsx scripts/setup-telegram-webhook.ts`

## External Dependencies

### Database
- PostgreSQL database (required, connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database queries
- Schema migrations in `/migrations` directory, run with `npm run db:push`

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required)
- `SESSION_SECRET` - Secret key for session encryption (required)
- `TELEGRAM_BOT_TOKEN` - Telegram Bot API token (required for payments)
- `TELEGRAM_WEBHOOK_SECRET` - Secret for webhook request verification (auto-generated by setup script, required for security)
- `TELEGRAM_TOKEN_SECRET` - Dedicated secret for Telegram token signing (optional, falls back to SESSION_SECRET)
- `TELEGRAM_STARS_PRICE` - Price in Telegram Stars (default: 100)
- `VITE_TELEGRAM_BOT_USERNAME` - Bot username without @ (for deep links)
- `VITE_APP_URL` - Public app URL (for webhook setup)

### Third-Party Libraries
- bcrypt for password hashing
- Radix UI primitives for accessible components
- TanStack Query for data fetching
- date-fns for date formatting
- Google Fonts (Inter, JetBrains Mono) for typography
