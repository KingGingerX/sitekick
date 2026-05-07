import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const campaignId = req.nextUrl.searchParams.get('campaignId');
  const rows = campaignId
    ? await db.select().from(schema.leads).where(eq(schema.leads.campaignId, campaignId)).all()
    : await db.select().from(schema.leads).all();
  return NextResponse.json(rows);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const updates: Partial<typeof schema.leads.$inferInsert> = {};
  if (body.status) updates.status = body.status;
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.email !== undefined) updates.email = body.email;
  await db.update(schema.leads).set(updates).where(eq(schema.leads.id, body.id)).run();
  return NextResponse.json({ ok: true });
}
