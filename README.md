# RSVP Application

A modern RSVP management application built with React, Express, PostgreSQL, and TypeScript.

## Starting Project

### Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- npm

### Quick Start

1. **Start the Database**

   ```bash
   docker-compose up database -d
   ```

2. **Start the Development Server**
   ```bash
   npm run dev
   ```

That's it! 🎉

### Application URLs

- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api
- **Database**: localhost:5432

### Environment Configuration

The application uses a `.env` file for configuration. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Key environment variables:

- `PGUSER` - Database user
- `PGPASSWORD` - Database password
- `PGDATABASE` - Database name
- `SESSION_SECRET` - Session secret key
- `TELEGRAM_BOT_TOKEN` - Telegram bot token (optional)

### Alternative Manual Start (if needed)

If you need to run without the `.env` file:

```bash
PGUSER=rsvp_user PGPASSWORD=rsvp_password PGDATABASE=rsvp_db SESSION_SECRET=your-super-secret-key npm run dev
```

### Stopping the Application

- **Stop dev server**: Press `Ctrl+C` in terminal
- **Stop database**: `docker-compose down`

### Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push database schema changes
- `npm run check` - Type check with TypeScript

## Project Structure

- `/client` - React frontend application
- `/server` - Express backend API
- `/shared` - Shared types and schemas
- `/deploy` - Deployment configuration
