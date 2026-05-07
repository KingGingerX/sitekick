import { NextRequest, NextResponse } from 'next/server';
import { db, schema, initDb } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET() {
  await initDb();
  const rows = await db.select().from(schema.campaigns).all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  await initDb();
  const body = await req.json();
  const id = randomUUID();
  await db.insert(schema.campaigns).values({
    id,
    name: body.name,
    niche: body.niche,
    nicheTemplate: body.nicheTemplate,
    location: body.location,
    radiusMiles: body.radiusMiles ?? 25,
    keywords: JSON.stringify(body.keywords ?? []),
    status: 'active',
    createdAt: new Date(),
  }).run();
  return NextResponse.json({ id });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  await db.update(schema.campaigns)
    .set({ status: body.status })
    .where(eq(schema.campaigns.id, body.id))
    .run();
  return NextResponse.json({ ok: true });
}
