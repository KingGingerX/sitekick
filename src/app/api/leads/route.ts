import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { assertString, assertOptionalString } from '@/lib/validate';
import { apiError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const campaignId = req.nextUrl.searchParams.get('campaignId');
    const rows = campaignId
      ? await db.select().from(schema.leads).where(eq(schema.leads.campaignId, campaignId)).all()
      : await db.select().from(schema.leads).all();
    return NextResponse.json(rows);
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id = assertString(body.id, 'id');
    const updates: Partial<typeof schema.leads.$inferInsert> = {};
    if (body.status) updates.status = assertOptionalString(body.status);
    if (body.notes !== undefined) updates.notes = assertOptionalString(body.notes);
    if (body.email !== undefined) updates.email = assertOptionalString(body.email);

    await db.update(schema.leads).set(updates).where(eq(schema.leads.id, id)).run();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
