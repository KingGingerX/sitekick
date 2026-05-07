import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import path from 'path';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface BusinessData {
  name: string;
  tagline: string;
  description: string;
  services: { title: string; description: string }[];
  phone: string;
  address: string;
  email: string;
  primaryColor: string;
  accentColor: string;
  heroHeadline: string;
  ctaText: string;
  testimonials: { author: string; text: string }[];
}

export async function generateBusinessContent(
  businessName: string,
  niche: string,
  address: string | null,
  phone: string | null,
  websiteScore?: number | null,
  websiteIssues?: string[]
): Promise<BusinessData> {
  const city = address ? address.split(',').slice(-2).join(',').trim() : 'the local area';
  const hasIssues = websiteIssues && websiteIssues.length > 0;
  const noSite = websiteScore === null;

  const issueContext = noSite
    ? `This business currently has NO website — they are completely invisible online.`
    : hasIssues
    ? `Their current website scored ${websiteScore}/100. Known issues: ${websiteIssues!.join(', ')}.`
    : websiteScore != null
    ? `Their current website scored ${websiteScore}/100.`
    : '';

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: `You generate high-converting, professional website content for local businesses.
Write in a confident, direct tone that speaks to local customers.
Mention the city/area naturally in copy — it helps with local SEO.
Return ONLY valid JSON, no markdown, no explanation.`,
    messages: [
      {
        role: 'user',
        content: `Generate compelling website content for a ${niche} business called "${businessName}" located in ${city}. Phone: ${phone ?? 'TBD'}.
${issueContext}

Write copy that:
- Opens with a strong local hook mentioning ${city}
- Highlights reliability, quality, and trustworthiness
- Speaks directly to the ideal customer's pain points for a ${niche} business
- Uses specific, credible language (not generic filler)

Return JSON matching this EXACT shape:
{
  "name": "${businessName}",
  "tagline": "short punchy tagline that mentions ${city} or the service",
  "description": "2–3 sentences that position them as the #1 choice in ${city} for ${niche}. Mention the city naturally.",
  "services": [
    { "title": "Core Service Name", "description": "one sentence with a customer benefit" },
    { "title": "Core Service Name", "description": "one sentence with a customer benefit" },
    { "title": "Core Service Name", "description": "one sentence with a customer benefit" },
    { "title": "Core Service Name", "description": "one sentence with a customer benefit" },
    { "title": "Core Service Name", "description": "one sentence with a customer benefit" },
    { "title": "Core Service Name", "description": "one sentence with a customer benefit" }
  ],
  "phone": "${phone ?? '(555) 000-0000'}",
  "address": "${address ?? city}",
  "email": "info@${businessName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}.com",
  "primaryColor": "#hex (professional, suits ${niche})",
  "accentColor": "#hex (contrasting, high-energy CTA color)",
  "heroHeadline": "Powerful 6–10 word headline. Mention ${city} or a specific outcome.",
  "ctaText": "Action-oriented CTA (4–6 words, creates urgency)",
  "testimonials": [
    { "author": "Realistic First Name L., ${city}", "text": "specific, believable 2-sentence review mentioning the service and outcome" },
    { "author": "Realistic First Name L., nearby city", "text": "specific, believable 2-sentence review" },
    { "author": "Realistic First Name L., ${city}", "text": "specific, believable 2-sentence review" }
  ]
}`,
      },
    ],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(cleaned) as BusinessData;
}

export function buildSiteHtml(template: string, data: BusinessData): string {
  const templatePath = path.join(process.cwd(), 'templates', template, 'index.html');
  let html = readFileSync(templatePath, 'utf-8');

  const replacements: Record<string, string> = {
    '{{BUSINESS_NAME}}': data.name,
    '{{TAGLINE}}': data.tagline,
    '{{DESCRIPTION}}': data.description,
    '{{PHONE}}': data.phone,
    '{{ADDRESS}}': data.address,
    '{{EMAIL}}': data.email,
    '{{PRIMARY_COLOR}}': data.primaryColor,
    '{{ACCENT_COLOR}}': data.accentColor,
    '{{HERO_HEADLINE}}': data.heroHeadline,
    '{{CTA_TEXT}}': data.ctaText,
    '{{SERVICE_1_TITLE}}': data.services[0]?.title ?? '',
    '{{SERVICE_1_DESC}}': data.services[0]?.description ?? '',
    '{{SERVICE_2_TITLE}}': data.services[1]?.title ?? '',
    '{{SERVICE_2_DESC}}': data.services[1]?.description ?? '',
    '{{SERVICE_3_TITLE}}': data.services[2]?.title ?? '',
    '{{SERVICE_3_DESC}}': data.services[2]?.description ?? '',
    '{{SERVICE_4_TITLE}}': data.services[3]?.title ?? '',
    '{{SERVICE_4_DESC}}': data.services[3]?.description ?? '',
    '{{SERVICE_5_TITLE}}': data.services[4]?.title ?? '',
    '{{SERVICE_5_DESC}}': data.services[4]?.description ?? '',
    '{{SERVICE_6_TITLE}}': data.services[5]?.title ?? '',
    '{{SERVICE_6_DESC}}': data.services[5]?.description ?? '',
    '{{TESTIMONIAL_1_AUTHOR}}': data.testimonials[0]?.author ?? '',
    '{{TESTIMONIAL_1_TEXT}}': data.testimonials[0]?.text ?? '',
    '{{TESTIMONIAL_2_AUTHOR}}': data.testimonials[1]?.author ?? '',
    '{{TESTIMONIAL_2_TEXT}}': data.testimonials[1]?.text ?? '',
    '{{TESTIMONIAL_3_AUTHOR}}': data.testimonials[2]?.author ?? '',
    '{{TESTIMONIAL_3_TEXT}}': data.testimonials[2]?.text ?? '',
    '{{YEAR}}': new Date().getFullYear().toString(),
  };

  for (const [token, value] of Object.entries(replacements)) {
    html = html.replaceAll(token, value);
  }

  return html;
}
