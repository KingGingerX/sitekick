import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

function injectBanner(html: string): string {
  const senderName = process.env.SENDER_NAME ?? 'Your Web Designer';
  const senderEmail = process.env.GMAIL_USER ?? '';
  const subject = encodeURIComponent('I want a website like this for my business');
  const body = encodeURIComponent(
    `Hi ${senderName},\n\nI came across the website you built and I'm interested in getting one for my business.\n\nBusiness name: \nPhone: \nBest time to reach me: \n\nThanks`
  );
  const ctaHref = senderEmail
    ? `mailto:${senderEmail}?subject=${subject}&body=${body}`
    : '#';

  const banner = `<style>
  #_sk{position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(135deg,#0f2849 0%,#1d4ed8 100%);padding:11px 20px;display:flex;align-items:center;justify-content:space-between;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-shadow:0 2px 14px rgba(0,0,0,.28);gap:12px}
  #_sk .sk-msg{color:#fff;font-size:13.5px;font-weight:500;line-height:1.3}
  #_sk .sk-msg span{color:#93c5fd;font-weight:700}
  #_sk a.sk-btn{flex-shrink:0;background:#fff;color:#1d4ed8;padding:8px 18px;border-radius:7px;text-decoration:none;font-weight:700;font-size:13px;white-space:nowrap;transition:background .15s}
  #_sk a.sk-btn:hover{background:#dbeafe}
  body{padding-top:50px!important}
</style>
<div id="_sk">
  <div class="sk-msg">⚡ This site was built in <span>60 seconds</span> using AI — want one just like it for your business?</div>
  <a href="${ctaHref}" class="sk-btn">Get My Free Preview →</a>
</div>`;

  if (html.includes('<body')) {
    return html.replace(/(<body[^>]*>)/, `$1${banner}`);
  }
  return banner + html;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const site = db.select().from(schema.sites).where(eq(schema.sites.previewToken, token)).get();

  if (!site) {
    return new NextResponse('<h1>Preview not found</h1>', {
      status: 404,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const html = injectBanner(site.htmlContent);

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
