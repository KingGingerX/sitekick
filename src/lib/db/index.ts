import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

export async function initDb() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS campaigns (id TEXT PRIMARY KEY, name TEXT NOT NULL, niche TEXT NOT NULL, niche_template TEXT NOT NULL, location TEXT NOT NULL, radius_miles INTEGER DEFAULT 25, keywords TEXT NOT NULL, status TEXT DEFAULT 'active', created_at INTEGER)`,
    `CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, campaign_id TEXT NOT NULL, business_name TEXT NOT NULL, address TEXT, phone TEXT, email TEXT, website_url TEXT, website_score INTEGER, website_issues TEXT, google_place_id TEXT, google_rating REAL, status TEXT DEFAULT 'new', notes TEXT, created_at INTEGER)`,
    `CREATE TABLE IF NOT EXISTS sites (id TEXT PRIMARY KEY, lead_id TEXT NOT NULL, preview_token TEXT NOT NULL UNIQUE, html_content TEXT NOT NULL, template TEXT NOT NULL, business_data TEXT NOT NULL, generated_at INTEGER)`,
    `CREATE TABLE IF NOT EXISTS outreach_messages (id TEXT PRIMARY KEY, lead_id TEXT NOT NULL, stage INTEGER NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, sent_at INTEGER, opened_at INTEGER, replied_at INTEGER, status TEXT DEFAULT 'draft')`,
    `CREATE TABLE IF NOT EXISTS deals (id TEXT PRIMARY KEY, lead_id TEXT NOT NULL, stage TEXT DEFAULT 'interested', base_price REAL, upsells TEXT, total_value REAL, stripe_payment_intent_id TEXT, stripe_session_id TEXT, notes TEXT, closed_at INTEGER, created_at INTEGER)`,
  ];
  for (const sql of statements) {
    await client.execute(sql);
  }
}

export { schema };
