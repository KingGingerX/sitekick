import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { generateBusinessContent, buildSiteHtml } from '@/lib/factory/site-builder';
import { randomUUID } from 'crypto';
import { assertOptionalString, assertUuid } from '@/lib/validate';
import { apiError } from '@/lib/errors';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(getClientIp(req), { windowMs: 60_000, maxRequests: 10 });
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json();
    const leadId = assertUuid(body.leadId, 'leadId');

    const lead = await db.select().from(schema.leads).where(eq(schema.leads.id, leadId)).get();
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const campaign = await db.select().from(schema.campaigns).where(eq(schema.campaigns.id, lead.campaignId)).get();
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const selectedTemplate = assertOptionalString(body.template) ?? campaign.nicheTemplate;
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

    const saved = await db.select().from(schema.sites).where(eq(schema.sites.previewToken, previewToken)).get();
    if (!saved) {
      return NextResponse.json({ error: 'Site was generated but failed to save to database' }, { status: 500 });
    }

    await db.update(schema.leads).set({ status: 'site_built' }).where(eq(schema.leads.id, leadId)).run();
    logger.info('Site generated', { leadId, siteId, previewToken });

    const origin = req.nextUrl.origin;
    return NextResponse.json({
      siteId,
      previewToken,
      previewUrl: `${origin}/preview/${previewToken}`,
      businessData,
    });
  } catch (err) {
    return apiError(err);
  }
}
