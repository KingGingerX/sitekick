import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export interface OutreachEmailOptions {
  to: string;
  businessName: string;
  previewUrl: string;
  senderName: string;
  stage: 1 | 2 | 3;
  websiteScore?: number | null;
  websiteIssues?: string[];
  googleRating?: number | null;
}

function wrap(senderName: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f3f4f6}
  .wrap{max-width:580px;margin:28px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.09)}
  .hdr{background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:26px 32px}
  .hdr h2{color:#fff;margin:0;font-size:19px;font-weight:700;letter-spacing:-.3px}
  .hdr p{color:rgba(255,255,255,.72);margin:5px 0 0;font-size:12.5px}
  .body{padding:26px 32px;color:#374151;line-height:1.7;font-size:15px}
  .preview-box{background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:10px;padding:18px 20px;margin:22px 0;text-align:center}
  .preview-box p{margin:0 0 12px;font-size:13px;color:#1e40af;font-weight:600}
  .btn{display:inline-block;background:#2563eb;color:#fff!important;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:700;font-size:15px}
  .issues{background:#fffbeb;border:1.5px solid #fde68a;border-radius:9px;padding:14px 18px;margin:18px 0}
  .issues .lbl{font-weight:700;color:#92400e;font-size:13.5px;margin:0 0 8px}
  .issues ul{margin:0;padding-left:17px;color:#78350f;font-size:13px}
  .issues ul li{margin-bottom:4px}
  .stat-row{display:flex;gap:12px;margin:16px 0}
  .stat{flex:1;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;text-align:center}
  .stat .val{font-size:1.4rem;font-weight:800;color:#1d4ed8}
  .stat .lbl2{font-size:11px;color:#6b7280;margin-top:2px}
  ul.bullets{padding-left:18px;margin:12px 0;color:#374151}
  ul.bullets li{margin-bottom:6px;font-size:14.5px}
  .sig{margin-top:26px;padding-top:18px;border-top:1px solid #e5e7eb;font-size:13.5px;color:#6b7280}
  .sig strong{color:#111827;display:block;margin-bottom:2px}
  .ftr{background:#f9fafb;padding:14px 32px;text-align:center;font-size:11.5px;color:#9ca3af}
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    <h2>Professional Web Design</h2>
    <p>Custom websites for local businesses · Built in 60 seconds with AI</p>
  </div>
  <div class="body">
    ${bodyHtml}
    <div class="sig">
      <strong>${senderName}</strong>
      Web Designer &amp; Developer<br>
      ${process.env.GMAIL_USER ?? ''}
    </div>
  </div>
  <div class="ftr">You received this because we built a free demo site for your business. One email, no spam. Reply STOP to opt out.</div>
</div>
</body>
</html>`;
}

function buildStage1(opts: OutreachEmailOptions): { subject: string; html: string; text: string } {
  const hasScore = opts.websiteScore != null;
  const noSite = opts.websiteScore === null && !opts.websiteIssues?.length;

  const subject = hasScore && opts.websiteScore! < 50
    ? `Your website scored ${opts.websiteScore}/100 — I fixed it for free`
    : noSite
    ? `${opts.businessName} has no website — I built one for you (free)`
    : `I built a free website for ${opts.businessName} — take a look`;

  const scoreBlock = hasScore
    ? `<p>I ran a quick audit on <strong>${opts.businessName}</strong>'s online presence. Your current site scores <strong style="color:#dc2626">${opts.websiteScore}/100</strong> — well below the threshold where Google recommends you to local customers searching right now.</p>`
    : `<p>I searched for <strong>${opts.businessName}</strong> online and couldn't find a professional website. That means every customer searching Google for your services right now is going straight to your competitors.</p>`;

  const issuesBlock =
    opts.websiteIssues && opts.websiteIssues.length > 0
      ? `<div class="issues">
          <div class="lbl">Issues I found on your current site:</div>
          <ul>${opts.websiteIssues.slice(0, 5).map((i) => `<li>${i}</li>`).join('')}</ul>
        </div>`
      : '';

  const ratingLine =
    opts.googleRating && opts.googleRating >= 4.0
      ? `<p style="margin-top:14px">You've got a <strong>${opts.googleRating}-star Google rating</strong> — that's real social proof most businesses would kill for. A professional website would turn those stars into paying customers you're currently missing.</p>`
      : '';

  const html = wrap(opts.senderName, `
    <p>Hi there,</p>
    ${scoreBlock}
    ${issuesBlock}
    ${ratingLine}
    <p>So I built you a <strong>free website demo</strong> — no obligation, just to show you what's possible:</p>
    <div class="preview-box">
      <p>Your custom website preview is ready:</p>
      <a href="${opts.previewUrl}" class="btn">View ${opts.businessName} Website →</a>
    </div>
    <p>If you like it, I can have it live on your domain within <strong>24 hours</strong> for a one-time flat fee. Monthly support is optional.</p>
    <p>Just reply to this email or click the link above. No pressure at all.</p>
  `);

  const text = `Hi there,\n\nMy name is ${opts.senderName}. I built a free website demo for ${opts.businessName}: ${opts.previewUrl}\n\nNo strings attached — just reply if you're interested.\n\n${opts.senderName}`;

  return { subject, html, text };
}

function buildStage2(opts: OutreachEmailOptions): { subject: string; html: string; text: string } {
  const subject = `Quick follow-up — your free website for ${opts.businessName}`;

  const html = wrap(opts.senderName, `
    <p>Hi again,</p>
    <p>I'm following up on the free website preview I sent for <strong>${opts.businessName}</strong>.</p>
    <div class="preview-box">
      <p>Your preview site is still live:</p>
      <a href="${opts.previewUrl}" class="btn">View ${opts.businessName} Website →</a>
    </div>
    <p>A few things worth knowing right now:</p>
    <ul class="bullets">
      <li><strong>97% of consumers</strong> research a business online before visiting in person</li>
      <li>Businesses with professional websites get an average of <strong>3× more calls</strong> from Google</li>
      <li>Local competitors in your area are actively investing in SEO — this is the window to get ahead</li>
    </ul>
    <div class="stat-row">
      <div class="stat"><div class="val">$497</div><div class="lbl2">One-time flat fee</div></div>
      <div class="stat"><div class="val">24hr</div><div class="lbl2">To go live</div></div>
      <div class="stat"><div class="val">100%</div><div class="lbl2">Satisfaction guarantee</div></div>
    </div>
    <p>Your site is ready to go live as-is, or I can tweak anything first. Just reply "I'm interested" and I'll send everything over.</p>
  `);

  const text = `Hi again,\n\nJust checking in on the free website I built for ${opts.businessName}: ${opts.previewUrl}\n\nReply "I'm interested" and I'll send the details.\n\n${opts.senderName}`;

  return { subject, html, text };
}

function buildStage3(opts: OutreachEmailOptions): { subject: string; html: string; text: string } {
  const subject = `Last note — ${opts.businessName} website preview (expiring soon)`;

  const html = wrap(opts.senderName, `
    <p>Hi,</p>
    <p>This is my last follow-up about the website I put together for <strong>${opts.businessName}</strong>.</p>
    <div class="preview-box">
      <p>Your preview is available for a limited time:</p>
      <a href="${opts.previewUrl}" class="btn">View Your Website Before It Expires →</a>
    </div>
    <p>I completely understand if the timing isn't right — no hard feelings at all.</p>
    <p>If the <strong>price</strong> has been the hesitation, I'm happy to discuss a payment plan or a lighter package to get you started online.</p>
    <p>Either way, I wish you and ${opts.businessName} a great year. The offer stands whenever you're ready — just save this email.</p>
  `);

  const text = `Hi,\n\nLast note about the website for ${opts.businessName}: ${opts.previewUrl}\n\nThe offer stands whenever you're ready. No hard feelings if not.\n\nBest,\n${opts.senderName}`;

  return { subject, html, text };
}

export async function sendOutreachEmail(
  opts: OutreachEmailOptions
): Promise<{ subject: string; body: string }> {
  const builders = { 1: buildStage1, 2: buildStage2, 3: buildStage3 };
  const { subject, html, text } = builders[opts.stage](opts);

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return { subject, body: html };
  }

  await transporter.sendMail({
    from: `${opts.senderName} <${process.env.GMAIL_USER}>`,
    to: opts.to,
    subject,
    html,
    text,
  });

  return { subject, body: html };
}
