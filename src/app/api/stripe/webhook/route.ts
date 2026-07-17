import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { stripe } from '@/lib/stripe/client';
import Stripe from 'stripe';
import { apiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');
    if (!sig) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error('STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      logger.warn('Invalid webhook signature', { error: String(err) });
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

        logger.info('Deal closed via webhook', { leadId, sessionId: session.id, amount: session.amount_total });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return apiError(err);
  }
}
