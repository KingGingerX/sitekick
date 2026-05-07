import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { scrapeGoogleMaps } from '@/lib/scraper/google-maps';
import { gradeWebsite, isWorthContacting } from '@/lib/grader/website-grader';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const { campaignId, niche, location, maxResults } = await req.json();

  const scraped = await scrapeGoogleMaps(niche, location, maxResults ?? 40);
  const added: string[] = [];

  for (const biz of scraped) {
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
  }

  return NextResponse.json({ added: added.length, total: scraped.length });
}
