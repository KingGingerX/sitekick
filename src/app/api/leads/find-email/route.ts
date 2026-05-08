import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

function extractEmails(html: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const found = html.match(emailRegex) ?? [];
  const blocked = ['example.com', 'sentry.io', 'wixpress.com', 'squarespace.com',
    'wordpress.com', 'googleapis.com', 'schema.org', 'w3.org', 'jquery.com'];
  return [...new Set(found.filter((e) =>
    !blocked.some((b) => e.includes(b)) && !e.startsWith('no-reply') && !e.startsWith('noreply')
  ))];
}

async function fetchPage(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SitekickBot/1.0)' },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    return await res.text();
  } catch {
    clearTimeout(timeout);
    return '';
  }
}

export async function POST(req: NextRequest) {
  const { leadId } = await req.json();

  const lead = await db.select().from(schema.leads).where(eq(schema.leads.id, leadId)).get();
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  if (!lead.websiteUrl) return NextResponse.json({ error: 'No website URL for this lead' }, { status: 400 });

  const base = lead.websiteUrl.startsWith('http') ? lead.websiteUrl : `https://${lead.websiteUrl}`;

  // Check homepage first
  let html = await fetchPage(base);
  let emails = extractEmails(html);

  // If nothing found, try /contact page
  if (emails.length === 0) {
    const contactUrl = base.replace(/\/$/, '') + '/contact';
    html = await fetchPage(contactUrl);
    emails = extractEmails(html);
  }

  // Try /about page
  if (emails.length === 0) {
    const aboutUrl = base.replace(/\/$/, '') + '/about';
    html = await fetchPage(aboutUrl);
    emails = extractEmails(html);
  }

  if (emails.length === 0) {
    return NextResponse.json({ email: null, message: 'No email found on their website' });
  }

  const email = emails[0];

  // Auto-save to lead
  await db.update(schema.leads).set({ email }).where(eq(schema.leads.id, leadId)).run();

  return NextResponse.json({ email, all: emails });
}
