import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createCheckoutSession } from '@/lib/stripe/client';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const { leadId, upsells } = await req.json();

  const lead = await db.select().from(schema.leads).where(eq(schema.leads.id, leadId)).get();
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  const session = await createCheckoutSession({
    leadId,
    businessName: lead.businessName,
    upsells: upsells ?? [],
    successUrl: `${baseUrl}/deals?success=1`,
    cancelUrl: `${baseUrl}/deals`,
  });

  const dealId = randomUUID();
  await db.insert(schema.deals).values({
    id: dealId,
    leadId,
    stage: 'negotiating',
    upsells: JSON.stringify(upsells ?? []),
    stripeSessionId: session.id,
    createdAt: new Date(),
  }).run();

  return NextResponse.json({ url: session.url, dealId });
}
