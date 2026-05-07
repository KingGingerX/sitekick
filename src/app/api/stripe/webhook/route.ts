import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { stripe } from '@/lib/stripe/client';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const leadId = session.metadata?.leadId;
    if (leadId) {
      await db.update(schema.deals)
        .set({
          stage: 'closed_won',
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent as string,
          totalValue: (session.amount_total ?? 0) / 100,
          closedAt: new Date(),
        })
        .where(eq(schema.deals.leadId, leadId))
        .run();

      await db.update(schema.leads)
        .set({ status: 'sold' })
        .where(eq(schema.leads.id, leadId))
        .run();
    }
  }

  return NextResponse.json({ received: true });
}
