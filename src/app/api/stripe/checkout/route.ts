import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createCheckoutSession } from '@/lib/stripe/client';
import { randomUUID } from 'crypto';
import { assertUuid, assertArray, ValidationError } from '@/lib/validate';
import type { UpsellKey } from '@/lib/stripe/client';
import { apiError } from '@/lib/errors';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(getClientIp(req), { windowMs: 60_000, maxRequests: 10 });
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json();
    const leadId = assertUuid(body.leadId, 'leadId');
    const rawUpsells = assertArray<string>(body.upsells ?? [], 'upsells');
    const validUpsells: UpsellKey[] = ['WHITE_GLOVE', 'MONTHLY_SUPPORT', 'CUSTOM_FEATURE'];
    const upsells: UpsellKey[] = rawUpsells.filter((u): u is UpsellKey => {
      if (!validUpsells.includes(u as UpsellKey)) {
        throw new ValidationError(`Invalid upsell key: ${u}. Must be one of ${validUpsells.join(', ')}`);
      }
      return true;
    });

    const lead = await db.select().from(schema.leads).where(eq(schema.leads.id, leadId)).get();
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

    const session = await createCheckoutSession({
      leadId,
      businessName: lead.businessName,
      upsells,
      successUrl: `${baseUrl}/deals?success=1`,
      cancelUrl: `${baseUrl}/deals`,
    });

    const dealId = randomUUID();
    await db.insert(schema.deals).values({
      id: dealId,
      leadId,
      stage: 'negotiating',
      upsells: JSON.stringify(upsells),
      stripeSessionId: session.id,
      createdAt: new Date(),
    }).run();

    logger.info('Checkout session created', { leadId, dealId, sessionId: session.id });
    return NextResponse.json({ url: session.url, dealId });
  } catch (err) {
    return apiError(err);
  }
}
