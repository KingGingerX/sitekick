import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, inArray } from 'drizzle-orm';
import { sendOutreachEmail } from '@/lib/outreach/mailer';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { leadId, stage, overrideEmail } = await req.json();

    const lead = await db.select().from(schema.leads).where(eq(schema.leads.id, leadId)).get();
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const site = await db.select().from(schema.sites).where(eq(schema.sites.leadId, leadId)).get();
    if (!site) return NextResponse.json({ error: 'No site generated for this lead yet' }, { status: 400 });

    const toEmail = overrideEmail ?? lead.email;
    if (!toEmail) return NextResponse.json({ error: 'No email address — add one to the lead first' }, { status: 400 });

    const previewUrl = `${req.nextUrl.origin}/preview/${site.previewToken}`;

    const websiteIssues: string[] = lead.websiteIssues ? JSON.parse(lead.websiteIssues) : [];

    const { subject, body } = await sendOutreachEmail({
      to: toEmail,
      businessName: lead.businessName,
      previewUrl,
      senderName: process.env.SENDER_NAME ?? 'Your Name',
      stage: stage as 1 | 2 | 3,
      websiteScore: lead.websiteScore,
      websiteIssues,
      googleRating: lead.googleRating,
    });

    const messageId = randomUUID();
    await db.insert(schema.outreachMessages).values({
      id: messageId,
      leadId,
      stage,
      subject,
      body,
      sentAt: toEmail && process.env.GMAIL_USER ? new Date() : null,
      status: process.env.GMAIL_USER ? 'sent' : 'draft',
    }).run();

    await db.update(schema.leads).set({ status: 'contacted' }).where(eq(schema.leads.id, leadId)).run();

    return NextResponse.json({ id: messageId, subject, body, previewUrl });
  } catch (err) {
    console.error('Outreach POST error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get('leadId');
  const rows = leadId
    ? await db.select().from(schema.outreachMessages).where(eq(schema.outreachMessages.leadId, leadId)).all()
    : await db.select().from(schema.outreachMessages).all();
  return NextResponse.json(rows);
}

// Bulk: POST /api/outreach/bulk — send stage 1 to all leads with status site_built
export async function PUT(req: NextRequest) {
  const { stage = 1 } = await req.json().catch(() => ({}));

  const eligibleLeads = (await db
    .select()
    .from(schema.leads)
    .where(eq(schema.leads.status, 'site_built'))
    .all())
    .filter((l) => l.email);

  if (eligibleLeads.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0, message: 'No site_built leads with email addresses found' });
  }

  const leadIds = eligibleLeads.map((l) => l.id);
  const sites = await db
    .select()
    .from(schema.sites)
    .where(inArray(schema.sites.leadId, leadIds))
    .all();

  const siteMap = new Map(sites.map((s) => [s.leadId, s]));
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  let sent = 0;
  let skipped = 0;

  for (const lead of eligibleLeads) {
    const site = siteMap.get(lead.id);
    if (!site || !lead.email) { skipped++; continue; }

    const previewUrl = `${baseUrl}/preview/${site.previewToken}`;
    const websiteIssues: string[] = lead.websiteIssues ? JSON.parse(lead.websiteIssues) : [];

    try {
      const { subject, body } = await sendOutreachEmail({
        to: lead.email,
        businessName: lead.businessName,
        previewUrl,
        senderName: process.env.SENDER_NAME ?? 'Your Name',
        stage: stage as 1 | 2 | 3,
        websiteScore: lead.websiteScore,
        websiteIssues,
        googleRating: lead.googleRating,
      });

      await db.insert(schema.outreachMessages).values({
        id: randomUUID(),
        leadId: lead.id,
        stage,
        subject,
        body,
        sentAt: process.env.GMAIL_USER ? new Date() : null,
        status: process.env.GMAIL_USER ? 'sent' : 'draft',
      }).run();

      await db.update(schema.leads).set({ status: 'contacted' }).where(eq(schema.leads.id, lead.id)).run();
      sent++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped });
}
