# SiteKick — AI Website Sales Engine

SiteKick is a Next.js application that automates the entire workflow of finding local business leads, grading their websites, generating AI-built replacement sites, and closing deals through automated outreach with Stripe payments.

## Features

- **Lead Scraper**: Search Google Places for businesses by niche + location
- **Website Grader**: Automated scoring of existing sites (mobile, SSL, SEO, content)
- **AI Site Builder**: Claude-powered custom website generation with niche templates
- **Outreach Automation**: Branded HTML email sequences (3-stage follow-up)
- **Deal Pipeline**: Full CRM with Stripe checkout, upsells, and webhook fulfillment
- **Preview System**: Tokenized live preview links for prospects

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite (local dev) / Turso (production)
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS v4
- **Payments**: Stripe
- **AI**: Anthropic Claude
- **Email**: Nodemailer + Gmail SMTP

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- Google Places API key
- Anthropic API key
- Stripe account (test mode for dev)
- Gmail account with App Password

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in all required values:

```bash
cp .env.example .env.local
```

Key variables:
- `ANTHROPIC_API_KEY` — Required for AI site generation
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` — Required for payments
- `ADMIN_PASSWORD` — Dashboard login (min 8 chars)
- `GOOGLE_PLACES_API_KEY` — Required for lead scraping
- `GMAIL_USER` + `GMAIL_APP_PASSWORD` — Required for email sending

### Database

Local development uses `file:./sitekick.db` automatically. For production, set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.

Tables are auto-created on first API call via `initDb()`.

### Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your `ADMIN_PASSWORD`.

### Build for Production

```bash
npm run build
npm start
```

## Architecture

```
src/
  app/           — Next.js App Router pages + API routes
  components/    — Shared React components
  lib/
    auth.ts      — Session signing/verification (Web Crypto)
    db/          — Database client, schema, init
    errors.ts    — Standardized API error responses
    factory/     — AI site builder + template engine
    grader/      — Website scoring engine
    logger.ts    — Structured logging utility
    outreach/    — Email composition + sending
    scraper/     — Google Places integration
    stripe/      — Stripe client + checkout helpers
    validate.ts  — Input validation utilities
    rate-limit.ts— In-memory rate limiting
```

## API Endpoints

See [API.md](./API.md) for full endpoint documentation.

## Testing

```bash
npm test
```

## Deployment

### Docker

```bash
docker build -t sitekick .
docker run -p 3000:3000 --env-file .env.local sitekick
```

### PowerShell Deploy

```powershell
.\scripts\deploy.ps1
```

## Security Notes

- Never commit `.env.local` to git
- Use strong `ADMIN_PASSWORD` (16+ characters recommended)
- Rotate any exposed API keys immediately
- Stripe webhook secret must match your Stripe dashboard
- Gmail App Passwords require 2FA enabled

## License

Proprietary — TGBGlobal Systems LLC
