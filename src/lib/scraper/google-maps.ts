import { chromium } from 'playwright';

export interface ScrapedBusiness {
  businessName: string;
  address: string | null;
  phone: string | null;
  websiteUrl: string | null;
  googleRating: number | null;
  googlePlaceId: string | null;
}

export async function scrapeGoogleMaps(
  niche: string,
  location: string,
  maxResults = 40
): Promise<ScrapedBusiness[]> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  const results: ScrapedBusiness[] = [];

  try {
    const query = encodeURIComponent(`${niche} near ${location}`);
    await page.goto(`https://www.google.com/maps/search/${query}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Dismiss cookie consent if present
    try {
      const acceptBtn = page.locator('button:has-text("Accept all"), button:has-text("Reject all")').first();
      if (await acceptBtn.isVisible({ timeout: 3000 })) {
        await acceptBtn.click();
        await page.waitForTimeout(1000);
      }
    } catch {}

    // Scroll the results panel to load more
    const resultsPanel = page.locator('[role="feed"]').first();
    for (let i = 0; i < 6 && results.length < maxResults; i++) {
      await resultsPanel.evaluate((el) => el.scrollBy(0, 600));
      await page.waitForTimeout(1200);
    }

    const listings = await page.locator('[role="feed"] > div[jsaction]').all();

    for (const listing of listings.slice(0, maxResults)) {
      try {
        await listing.click();
        await page.waitForTimeout(1500);

        const name = await page
          .locator('h1.DUwDvf, h1[class*="fontHeadlineLarge"]')
          .first()
          .textContent({ timeout: 5000 })
          .catch(() => null);

        if (!name) continue;

        const address = await page
          .locator('[data-item-id="address"] .Io6YTe, button[data-item-id*="address"] .Io6YTe')
          .first()
          .textContent({ timeout: 3000 })
          .catch(() => null);

        const phone = await page
          .locator('[data-item-id*="phone"] .Io6YTe')
          .first()
          .textContent({ timeout: 3000 })
          .catch(() => null);

        const website = await page
          .locator('a[data-item-id="authority"]')
          .first()
          .getAttribute('href', { timeout: 3000 })
          .catch(() => null);

        const ratingText = await page
          .locator('.F7nice span[aria-hidden="true"]')
          .first()
          .textContent({ timeout: 3000 })
          .catch(() => null);

        const rating = ratingText ? parseFloat(ratingText) : null;

        const url = page.url();
        const placeIdMatch = url.match(/place\/([^/]+)\//);
        const placeId = placeIdMatch ? placeIdMatch[1] : null;

        results.push({
          businessName: name.trim(),
          address: address?.trim() ?? null,
          phone: phone?.trim() ?? null,
          websiteUrl: website ?? null,
          googleRating: isNaN(rating as number) ? null : rating,
          googlePlaceId: placeId,
        });
      } catch {
        // skip bad listings
      }
    }
  } finally {
    await browser.close();
  }

  return results;
}
