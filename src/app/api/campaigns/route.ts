import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET() {
  const rows = db.select().from(schema.campaigns).all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = randomUUID();
  db.insert(schema.campaigns).values({
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
  db.update(schema.campaigns)
    .set({ status: body.status })
    .where(eq(schema.campaigns.id, body.id))
    .run();
  return NextResponse.json({ ok: true });
}
