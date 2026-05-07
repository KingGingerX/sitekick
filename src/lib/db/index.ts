import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'sitekick.db');

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// Run migrations inline on first connect
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    niche TEXT NOT NULL,
    niche_template TEXT NOT NULL,
    location TEXT NOT NULL,
    radius_miles INTEGER DEFAULT 25,
    keywords TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    business_name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    website_url TEXT,
    website_score INTEGER,
    website_issues TEXT,
    google_place_id TEXT,
    google_rating REAL,
    status TEXT DEFAULT 'new',
    notes TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS sites (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL,
    preview_token TEXT NOT NULL UNIQUE,
    html_content TEXT NOT NULL,
    template TEXT NOT NULL,
    business_data TEXT NOT NULL,
    generated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS outreach_messages (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL,
    stage INTEGER NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at INTEGER,
    opened_at INTEGER,
    replied_at INTEGER,
    status TEXT DEFAULT 'draft'
  );

  CREATE TABLE IF NOT EXISTS deals (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL,
    stage TEXT DEFAULT 'interested',
    base_price REAL,
    upsells TEXT,
    total_value REAL,
    stripe_payment_intent_id TEXT,
    stripe_session_id TEXT,
    notes TEXT,
    closed_at INTEGER,
    created_at INTEGER
  );
`);

export { schema };
