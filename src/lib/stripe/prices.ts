/**
 * Stripe Price IDs managed by StripeBot.
 * Run `npm run stripe:sync` to create these in Stripe and populate .env.local
 */

export const STRIPE_PRICE_IDS = {
  BASE_SITE: process.env.STRIPE_PRICE_ID_BASE_SITE || '',
  WHITE_GLOVE: process.env.STRIPE_PRICE_ID_WHITE_GLOVE || '',
  MONTHLY_SUPPORT: process.env.STRIPE_PRICE_ID_MONTHLY_SUPPORT || '',
  CUSTOM_FEATURE: process.env.STRIPE_PRICE_ID_CUSTOM_FEATURE || '',
} as const;

export type PriceIdKey = keyof typeof STRIPE_PRICE_IDS;

export function getPriceId(key: PriceIdKey): string {
  const id = STRIPE_PRICE_IDS[key];
  if (!id) {
    throw new Error(
      `Stripe Price ID for ${key} is not configured. ` +
      `Run "npm run stripe:sync" to create prices via StripeBot.`
    );
  }
  return id;
}

export function hasStripePrices(): boolean {
  return Object.values(STRIPE_PRICE_IDS).every((id) => id.length > 0 && id.startsWith('price_'));
}
