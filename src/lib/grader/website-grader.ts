export interface GradeResult {
  score: number; // 0–100 (null if no site)
  hasSite: boolean;
  issues: string[];
}

export async function gradeWebsite(url: string | null): Promise<GradeResult> {
  if (!url) {
    return { score: 0, hasSite: false, issues: ['No website found'] };
  }

  const issues: string[] = [];
  let score = 100;

  try {
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let html = '';
    let finalUrl = normalizedUrl;
    let status = 0;

    try {
      const res = await fetch(normalizedUrl, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; SitekickBot/1.0)',
        },
      });
      clearTimeout(timeout);
      status = res.status;
      html = await res.text();
      finalUrl = res.url;
    } catch (e: unknown) {
      clearTimeout(timeout);
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('abort')) {
        issues.push('Site loads very slowly (>10s timeout)');
        score -= 20;
      } else {
        issues.push('Site is unreachable or broken');
        return { score: 5, hasSite: true, issues };
      }
    }

    if (status >= 400) {
      issues.push(`Site returns error status ${status}`);
      return { score: 5, hasSite: true, issues };
    }

    // SSL check
    if (!finalUrl.startsWith('https://')) {
      issues.push('No SSL (not secure — browsers show warnings)');
      score -= 15;
    }

    // Mobile viewport
    if (!html.includes('viewport')) {
      issues.push('Not mobile-friendly (missing viewport meta tag)');
      score -= 20;
    }

    // Basic content checks
    if (html.length < 3000) {
      issues.push('Very thin content — likely placeholder or template page');
      score -= 15;
    }

    // Old copyright year check
    const yearMatch = html.match(/©\s*(\d{4})|copyright\s+(\d{4})/i);
    if (yearMatch) {
      const year = parseInt(yearMatch[1] || yearMatch[2]);
      const currentYear = new Date().getFullYear();
      if (currentYear - year >= 3) {
        issues.push(`Site not updated since ${year} (${currentYear - year} years old)`);
        score -= 10;
      }
    }

    // Contact info check
    const hasPhone = /(\+?1?\s*[-.]?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4})/.test(html);
    const hasContactForm = /<form/i.test(html);
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(html);
    if (!hasPhone && !hasContactForm && !hasEmail) {
      issues.push('No contact information or form found');
      score -= 10;
    }

    // No CTA check
    const hasCta = /(call now|get a quote|contact us|book now|schedule|free estimate)/i.test(html);
    if (!hasCta) {
      issues.push('Missing clear call-to-action');
      score -= 10;
    }

    // Page title check
    if (!/<title>[^<]{5,}<\/title>/i.test(html)) {
      issues.push('Missing or empty page title (bad for SEO)');
      score -= 5;
    }

    // Meta description
    if (!/<meta[^>]+name=["']description["']/i.test(html)) {
      issues.push('No meta description (bad for search rankings)');
      score -= 5;
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      hasSite: true,
      issues,
    };
  } catch {
    return { score: 5, hasSite: true, issues: ['Could not analyze site'] };
  }
}

export function isWorthContacting(_grade: GradeResult): boolean {
  // All leads are worth contacting; refine logic later based on score thresholds
  void _grade;
  return true;
}
