import Stripe from 'stripe';
import { getPriceId, type PriceIdKey } from './prices';

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment');
}

export const stripe = new Stripe(secretKey, {
  apiVersion: '2026-03-25.dahlia',
});

export const PRICES = {
  BASE_SITE: { amount: 49700, label: 'Website — One-Time', priceIdKey: 'BASE_SITE' as PriceIdKey },
  WHITE_GLOVE: { amount: 19700, label: 'White Glove Install', priceIdKey: 'WHITE_GLOVE' as PriceIdKey },
  MONTHLY_SUPPORT: { amount: 4900, label: 'Monthly Support Plan', priceIdKey: 'MONTHLY_SUPPORT' as PriceIdKey },
  CUSTOM_FEATURE: { amount: 29700, label: 'Custom Feature Add-On', priceIdKey: 'CUSTOM_FEATURE' as PriceIdKey },
} as const;

export type UpsellKey = 'WHITE_GLOVE' | 'MONTHLY_SUPPORT' | 'CUSTOM_FEATURE';

export interface CheckoutOptions {
  leadId: string;
  businessName: string;
  upsells: UpsellKey[];
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(opts: CheckoutOptions) {
  const lineItems: Array<{ price: string; quantity: number }> = [
    {
      price: getPriceId('BASE_SITE'),
      quantity: 1,
    },
  ];

  for (const upsell of opts.upsells) {
    const price = PRICES[upsell];
    lineItems.push({
      price: getPriceId(price.priceIdKey),
      quantity: 1,
    });
  }

  const hasSubscription = opts.upsells.includes('MONTHLY_SUPPORT');

  const session = await stripe.checkout.sessions.create({
    mode: hasSubscription ? 'subscription' : 'payment',
    line_items: lineItems,
    success_url: opts.successUrl + `?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: opts.cancelUrl,
    metadata: { leadId: opts.leadId, businessName: opts.businessName },
    // Optional: collect tax, require phone, etc.
    // automatic_tax: { enabled: true },
    // customer_creation: 'always',
  });

  return session;
}
