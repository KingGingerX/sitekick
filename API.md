# SiteKick API Documentation

Base URL: `http://localhost:3000/api`

All endpoints return JSON. Errors follow the format:
```json
{ "error": "human-readable message" }
```

## Authentication

Dashboard routes are protected by middleware. Log in via `POST /api/auth/login` with:
```json
{ "password": "your_admin_password" }
```

A signed session cookie (`sk_auth`) is set on success.

---

## Health

### `GET /api/health`
Returns service and database status.

**Response:**
```json
{
  "status": "ok",
  "db": "connected",
  "timestamp": "2026-05-24T12:00:00.000Z"
}
```

---

## Campaigns

### `GET /api/campaigns`
List all campaigns.

### `POST /api/campaigns`
Create a campaign.

**Body:**
```json
{
  "name": "Dallas Plumbers Q2",
  "niche": "plumbers",
  "nicheTemplate": "home-services",
  "location": "Dallas, TX",
  "radiusMiles": 25,
  "keywords": ["emergency plumbing", "water heater"]
}
```

### `PATCH /api/campaigns`
Update campaign status.

**Body:**
```json
{ "id": "...", "status": "paused" }
```

---

## Leads

### `GET /api/leads?campaignId=optional`
List all leads or filter by campaign.

### `PATCH /api/leads`
Update lead fields.

**Body:**
```json
{
  "id": "...",
  "status": "contacted",
  "email": "owner@business.com",
  "notes": "Called on Monday"
}
```

### `POST /api/leads/scrape`
Run Google Places scraper for a campaign.

**Body:**
```json
{
  "campaignId": "...",
  "niche": "plumbers",
  "location": "Dallas, TX",
  "maxResults": 40
}
```

**Response:**
```json
{ "added": 12, "total": 40 }
```

### `POST /api/leads/find-email`
Scrape a lead's website for contact emails.

**Body:**
```json
{ "leadId": "..." }
```

---

## Sites

### `POST /api/sites/generate`
Generate an AI website for a lead.

**Body:**
```json
{
  "leadId": "...",
  "template": "home-services"
}
```

**Response:**
```json
{
  "siteId": "...",
  "previewToken": "...",
  "previewUrl": "http://localhost:3000/preview/...",
  "businessData": { ... }
}
```

---

## Outreach

### `GET /api/outreach?leadId=optional`
List outreach messages.

### `POST /api/outreach`
Send a single outreach email.

**Body:**
```json
{
  "leadId": "...",
  "stage": 1,
  "overrideEmail": "optional@override.com"
}
```

### `PUT /api/outreach`
Bulk send stage 1 to all `site_built` leads with emails.

**Body:**
```json
{ "stage": 1 }
```

---

## Deals

### `GET /api/deals`
List all deals with enriched lead data.

### `POST /api/deals`
Create a deal.

**Body:**
```json
{
  "leadId": "...",
  "stage": "interested",
  "basePrice": 497,
  "upsells": ["WHITE_GLOVE"],
  "totalValue": 694,
  "notes": "Wants SEO package too"
}
```

### `PATCH /api/deals`
Update deal fields.

**Body:**
```json
{
  "id": "...",
  "stage": "negotiating",
  "basePrice": 497
}
```

---

## Stripe

### `POST /api/stripe/checkout`
Create a Stripe Checkout session.

**Body:**
```json
{
  "leadId": "...",
  "upsells": ["WHITE_GLOVE", "MONTHLY_SUPPORT"]
}
```

**Response:**
```json
{ "url": "https://checkout.stripe.com/...", "dealId": "..." }

### `POST /api/stripe/webhook`
Stripe webhook endpoint. Configure in Stripe dashboard to send `checkout.session.completed` events.

---

## Preview

### `GET /preview/:token`
Public route. Returns the generated HTML site with an optional preview banner injected.
