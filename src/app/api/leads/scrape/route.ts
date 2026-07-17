import { NextRequest, NextResponse } from 'next/server';
import { db, schema, initDb } from '@/lib/db';
import { scrapeGoogleMaps } from '@/lib/scraper/google-maps';
import { gradeWebsite, isWorthContacting } from '@/lib/grader/website-grader';
import { randomUUID } from 'crypto';
import { assertString, assertOptionalNumber } from '@/lib/validate';
import { apiError } from '@/lib/errors';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-ip';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(getClientIp(req), { windowMs: 60_000, maxRequests: 5 });
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    await initDb();
    const body = await req.json();
    const campaignId = assertString(body.campaignId, 'campaignId');
    const niche = assertString(body.niche, 'niche');
    const location = assertString(body.location, 'location');
    const maxResults = assertOptionalNumber(body.maxResults) ?? 40;

    const scraped = await scrapeGoogleMaps(niche, location, maxResults);
    const added: string[] = [];

    for (const biz of scraped) {
      try {
        const grade = await gradeWebsite(biz.websiteUrl);
        if (!isWorthContacting(grade)) continue;

        const id = randomUUID();
        await db.insert(schema.leads).values({
          id,
          campaignId,
          businessName: biz.businessName,
          address: biz.address,
          phone: biz.phone,
          email: null,
          websiteUrl: biz.websiteUrl,
          websiteScore: grade.score,
          websiteIssues: JSON.stringify(grade.issues),
          googlePlaceId: biz.googlePlaceId,
          googleRating: biz.googleRating,
          status: 'new',
          createdAt: new Date(),
        }).run();

        added.push(id);
      } catch (err) {
        logger.warn('Failed to process scraped business', { error: String(err), business: biz.businessName });
      }
    }

    logger.info('Scrape complete', { campaignId, added: added.length, total: scraped.length });
    return NextResponse.json({ added: added.length, total: scraped.length });
  } catch (err) {
    return apiError(err);
  }
}
