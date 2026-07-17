# StripeBot Integration Guide

SiteKick uses [StripeBot](https://github.com/kinggingerx/stripebot) to manage all Stripe resources — products, prices, payment links, and webhooks.

## Why StripeBot?

Instead of manually clicking through the Stripe dashboard every time you want to change pricing or add a webhook, StripeBot:
- Reads `stripebot.config.json` (committed to repo)
- Creates/updates products and prices in Stripe
- Writes Price IDs back to `.env.local`
- Creates webhook endpoints with the correct signing secrets

## One-Time Setup

### 1. Install StripeBot (global)

```bash
npm install -g stripebot
```

### 2. Configure StripeBot with your account

```bash
stripebot setup
```

It will ask for:
- Your Stripe secret key (`sk_test_...` for dev, `sk_live_...` for production)
- Auto-generates an encryption key for the local registry

Your key is stored in `~/.stripebot/.env` — never inside the project repo.

### 3. Sync SiteKick products to Stripe

```powershell
# Interactive (recommended first time)
npm run stripe:setup

# Or non-interactive (after first setup)
npm run stripe:sync
```

This creates 4 products in Stripe:
| Product | Price | Type |
|---|---|---|
| Website — One-Time | $497 | One-time |
| White Glove Install | $197 | One-time |
| Monthly Support Plan | $49/mo | Subscription |
| Custom Feature Add-On | $297 | One-time |

After syncing, check `.env.local` — StripeBot populated:
```env
STRIPE_PRICE_ID_BASE_SITE=price_...
STRIPE_PRICE_ID_WHITE_GLOVE=price_...
STRIPE_PRICE_ID_MONTHLY_SUPPORT=price_...
STRIPE_PRICE_ID_CUSTOM_FEATURE=price_...
```

### 4. Create the webhook

**If deployed:**
```powershell
npm run stripe:webhook -- --url https://yourdomain.com/api/stripe/webhook
```

**If testing locally with ngrok:**
```powershell
npx ngrok http 3000
# Then:
npm run stripe:webhook -- --url https://YOUR_NGROK_URL/api/stripe/webhook
```

StripeBot outputs the `STRIPE_WEBHOOK_SECRET` — paste it into `.env.local`.

### 5. PowerShell All-in-One Script

```powershell
.\scripts\stripe-setup.ps1 -WebhookUrl "https://yourdomain.com/api/stripe/webhook"
```

## Daily Commands

| Command | What it does |
|---|---|
| `npm run stripe:setup` | Full interactive connect (analyze + sync + write .env) |
| `npm run stripe:sync` | Re-sync config to Stripe (non-interactive if keys stored) |
| `npm run stripe:webhook -- --url <url>` | Add/update webhook endpoint |
| `npm run stripe:dashboard` | View SiteKick products, prices, and webhook secrets |

## Changing Prices

1. Edit `stripebot.config.json`
2. Change the `amount` field
3. Run `npm run stripe:sync`
4. Restart SiteKick to pick up new Price IDs

## Troubleshooting

**"Stripe Price ID for X is not configured"**
→ Run `npm run stripe:sync` to create missing prices.

**"Webhook signature invalid"**
→ Your `STRIPE_WEBHOOK_SECRET` doesn't match the webhook in Stripe. Run `stripebot dashboard SiteKick` to see the correct secret, or delete and recreate the webhook.

**"No STRIPE_SECRET_KEY found"**
→ Run `stripebot setup` first.
