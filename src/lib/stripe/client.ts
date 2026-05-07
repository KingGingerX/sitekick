import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

export const PRICES = {
  BASE_SITE: { amount: 49700, label: 'Website — One-Time' },           // $497
  WHITE_GLOVE: { amount: 19700, label: 'White Glove Install' },         // $197
  MONTHLY_SUPPORT: { amount: 4900, label: 'Monthly Support Plan' },     // $49/mo
  CUSTOM_FEATURE: { amount: 29700, label: 'Custom Feature Add-On' },    // $297
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineItems: any[] = [
    {
      price_data: {
        currency: 'usd',
        product_data: { name: `${PRICES.BASE_SITE.label} — ${opts.businessName}` },
        unit_amount: PRICES.BASE_SITE.amount,
      },
      quantity: 1,
    },
  ];

  for (const upsell of opts.upsells) {
    const price = PRICES[upsell];
    if (upsell === 'MONTHLY_SUPPORT') {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: price.label },
          recurring: { interval: 'month' },
          unit_amount: price.amount,
        },
        quantity: 1,
      });
    } else {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: price.label },
          unit_amount: price.amount,
        },
        quantity: 1,
      });
    }
  }

  const mode = opts.upsells.includes('MONTHLY_SUPPORT') ? 'subscription' : 'payment';

  const session = await stripe.checkout.sessions.create({
    mode: mode as 'payment' | 'subscription',
    line_items: lineItems,
    success_url: opts.successUrl + `?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: opts.cancelUrl,
    metadata: { leadId: opts.leadId },
  });

  return session;
}
