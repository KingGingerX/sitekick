import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { generateBusinessContent, buildSiteHtml } from '@/lib/factory/site-builder';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const { leadId, template } = await req.json();

  const lead = await db.select().from(schema.leads).where(eq(schema.leads.id, leadId)).get();
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  const campaign = await db.select().from(schema.campaigns).where(eq(schema.campaigns.id, lead.campaignId)).get();
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

  const selectedTemplate = template ?? campaign.nicheTemplate;

  const websiteIssues: string[] = lead.websiteIssues ? JSON.parse(lead.websiteIssues) : [];

  const businessData = await generateBusinessContent(
    lead.businessName,
    campaign.niche,
    lead.address,
    lead.phone,
    lead.websiteScore,
    websiteIssues
  );

  const html = buildSiteHtml(selectedTemplate, businessData);
  const previewToken = randomUUID();
  const siteId = randomUUID();

  // Delete old site for this lead if any
  await db.delete(schema.sites).where(eq(schema.sites.leadId, leadId)).run();

  await db.insert(schema.sites).values({
    id: siteId,
    leadId,
    previewToken,
    htmlContent: html,
    template: selectedTemplate,
    businessData: JSON.stringify(businessData),
    generatedAt: new Date(),
  }).run();

  // Update lead status
  await db.update(schema.leads).set({ status: 'site_built' }).where(eq(schema.leads.id, leadId)).run();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  return NextResponse.json({
    siteId,
    previewUrl: `${baseUrl}/preview/${previewToken}`,
    businessData,
  });
}
