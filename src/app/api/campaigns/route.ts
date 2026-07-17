import { NextRequest, NextResponse } from 'next/server';
import { db, schema, initDb } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { assertString, assertOptionalNumber } from '@/lib/validate';
import { apiError } from '@/lib/errors';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';

export async function GET() {
  try {
    await initDb();
    const rows = await db.select().from(schema.campaigns).all();
    return NextResponse.json(rows);
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(getClientIp(req), { windowMs: 60_000, maxRequests: 10 });
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    await initDb();
    const body = await req.json();
    const id = randomUUID();

    await db.insert(schema.campaigns).values({
      id,
      name: assertString(body.name, 'name'),
      niche: assertString(body.niche, 'niche'),
      nicheTemplate: assertString(body.nicheTemplate, 'nicheTemplate'),
      location: assertString(body.location, 'location'),
      radiusMiles: assertOptionalNumber(body.radiusMiles) ?? 25,
      keywords: JSON.stringify(body.keywords ?? []),
      status: 'active',
      createdAt: new Date(),
    }).run();

    return NextResponse.json({ id });
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id = assertString(body.id, 'id');
    const status = assertString(body.status, 'status');

    await db.update(schema.campaigns)
      .set({ status })
      .where(eq(schema.campaigns.id, id))
      .run();

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
