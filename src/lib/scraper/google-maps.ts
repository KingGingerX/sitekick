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
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY is not set');

  const query = encodeURIComponent(`${niche} near ${location}`);
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}`;

  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();

  if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places API error: ${searchData.status} — ${searchData.error_message ?? ''}`);
  }

  const places = (searchData.results ?? []).slice(0, maxResults);
  const results: ScrapedBusiness[] = [];

  for (const place of places) {
    try {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating&key=${apiKey}`;
      const detailsRes = await fetch(detailsUrl);
      const detailsData = await detailsRes.json();
      const d = detailsData.result ?? {};

      results.push({
        businessName: d.name ?? place.name,
        address: d.formatted_address ?? place.formatted_address ?? null,
        phone: d.formatted_phone_number ?? null,
        websiteUrl: d.website ?? null,
        googleRating: d.rating ?? place.rating ?? null,
        googlePlaceId: place.place_id ?? null,
      });
    } catch {
      // skip bad entries
    }
  }

  return results;
}
