import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET() {
  const deals = db.select().from(schema.deals).all();
  const leads = db.select().from(schema.leads).all();
  const leadMap = Object.fromEntries(leads.map((l) => [l.id, l]));
  return NextResponse.json(deals.map((d) => ({ ...d, lead: leadMap[d.leadId] })));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = randomUUID();
  db.insert(schema.deals).values({
    id,
    leadId: body.leadId,
    stage: body.stage ?? 'interested',
    basePrice: body.basePrice,
    upsells: JSON.stringify(body.upsells ?? []),
    totalValue: body.totalValue,
    notes: body.notes,
    createdAt: new Date(),
  }).run();
  db.update(schema.leads).set({ status: 'interested' }).where(eq(schema.leads.id, body.leadId)).run();
  return NextResponse.json({ id });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const updates: Partial<typeof schema.deals.$inferInsert> = {};
  if (body.stage) updates.stage = body.stage;
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.basePrice !== undefined) updates.basePrice = body.basePrice;
  if (body.totalValue !== undefined) updates.totalValue = body.totalValue;
  db.update(schema.deals).set(updates).where(eq(schema.deals.id, body.id)).run();
  return NextResponse.json({ ok: true });
}
