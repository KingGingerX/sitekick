import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { assertString, assertOptionalString, assertOptionalNumber } from '@/lib/validate';
import { apiError } from '@/lib/errors';

export async function GET() {
  try {
    const deals = await db.select().from(schema.deals).all();
    const leads = await db.select().from(schema.leads).all();
    const leadMap = Object.fromEntries(leads.map((l) => [l.id, l]));
    return NextResponse.json(deals.map((d) => ({ ...d, lead: leadMap[d.leadId] })));
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = randomUUID();
    const leadId = assertString(body.leadId, 'leadId');

    await db.insert(schema.deals).values({
      id,
      leadId,
      stage: assertOptionalString(body.stage) ?? 'interested',
      basePrice: assertOptionalNumber(body.basePrice),
      upsells: JSON.stringify(body.upsells ?? []),
      totalValue: assertOptionalNumber(body.totalValue),
      notes: assertOptionalString(body.notes),
      createdAt: new Date(),
    }).run();

    await db.update(schema.leads).set({ status: 'interested' }).where(eq(schema.leads.id, leadId)).run();
    return NextResponse.json({ id });
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id = assertString(body.id, 'id');
    const updates: Partial<typeof schema.deals.$inferInsert> = {};
    if (body.stage) updates.stage = assertOptionalString(body.stage);
    if (body.notes !== undefined) updates.notes = assertOptionalString(body.notes);
    if (body.basePrice !== undefined) updates.basePrice = assertOptionalNumber(body.basePrice);
    if (body.totalValue !== undefined) updates.totalValue = assertOptionalNumber(body.totalValue);

    await db.update(schema.deals).set(updates).where(eq(schema.deals.id, id)).run();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
