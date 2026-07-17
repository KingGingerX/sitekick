# SiteKick + StripeBot Integration Setup
# Usage: .\scripts\stripe-setup.ps1 [-WebhookUrl "https://yourdomain.com/api/stripe/webhook"]

param(
    [string]$WebhookUrl = "",
    [switch]$Yes
)

$ErrorActionPreference = "Stop"

Write-Host "=== SiteKick StripeBot Integration ===" -ForegroundColor Cyan

# Verify stripebot is installed
$stripebot = Get-Command stripebot -ErrorAction SilentlyContinue
if (-not $stripebot) {
    Write-Error "stripebot is not installed or not in PATH. Run: npm install -g stripebot"
    exit 1
}

Write-Host "StripeBot found: $($stripebot.Source)" -ForegroundColor Green

# Verify stripebot is configured (has a stored key)
$stripebotEnv = Join-Path $env:USERPROFILE ".stripebot\.env"
if (-not (Test-Path $stripebotEnv)) {
    Write-Host "StripeBot not configured yet. Running setup wizard..." -ForegroundColor Yellow
    stripebot setup
}

# Change to project directory
$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location $projectDir

Write-Host "Syncing SiteKick products with Stripe..." -ForegroundColor Green

# Run stripebot sync
if ($Yes) {
    stripebot sync --dir . --yes
} else {
    stripebot sync --dir .
}

# Create webhook if URL provided
if ($WebhookUrl) {
    Write-Host "Creating Stripe webhook endpoint..." -ForegroundColor Green
    stripebot add-webhook --project SiteKick --url $WebhookUrl --events "checkout.session.completed,payment_intent.succeeded,customer.subscription.created,customer.subscription.deleted,invoice.paid"
}

# Show current dashboard
Write-Host "`n=== SiteKick Stripe Dashboard ===" -ForegroundColor Cyan
stripebot dashboard SiteKick

Write-Host "`nDone. Check your .env.local for the new STRIPE_PRICE_ID_* values." -ForegroundColor Green
Write-Host "Next: restart SiteKick so it picks up the new Price IDs." -ForegroundColor Yellow
