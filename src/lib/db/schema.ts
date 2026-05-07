import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const campaigns = sqliteTable('campaigns', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  niche: text('niche').notNull(),
  nicheTemplate: text('niche_template').notNull(), // home-services | restaurant | professional
  location: text('location').notNull(),
  radiusMiles: integer('radius_miles').default(25),
  keywords: text('keywords').notNull(), // JSON array
  status: text('status').default('active'), // active | paused | archived
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const leads = sqliteTable('leads', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').notNull(),
  businessName: text('business_name').notNull(),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  websiteUrl: text('website_url'),
  websiteScore: integer('website_score'), // 0-100, null = no site
  websiteIssues: text('website_issues'), // JSON array of issue strings
  googlePlaceId: text('google_place_id'),
  googleRating: real('google_rating'),
  status: text('status').default('new'), // new | site_built | contacted | interested | negotiating | sold | lost
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const sites = sqliteTable('sites', {
  id: text('id').primaryKey(),
  leadId: text('lead_id').notNull(),
  previewToken: text('preview_token').notNull().unique(),
  htmlContent: text('html_content').notNull(),
  template: text('template').notNull(),
  businessData: text('business_data').notNull(), // JSON — name, tagline, services, etc.
  generatedAt: integer('generated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const outreachMessages = sqliteTable('outreach_messages', {
  id: text('id').primaryKey(),
  leadId: text('lead_id').notNull(),
  stage: integer('stage').notNull(), // 1, 2, 3 (follow-ups)
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  sentAt: integer('sent_at', { mode: 'timestamp' }),
  openedAt: integer('opened_at', { mode: 'timestamp' }),
  repliedAt: integer('replied_at', { mode: 'timestamp' }),
  status: text('status').default('draft'), // draft | sent | opened | replied | bounced
});

export const deals = sqliteTable('deals', {
  id: text('id').primaryKey(),
  leadId: text('lead_id').notNull(),
  stage: text('stage').default('interested'), // interested | negotiating | closed_won | closed_lost
  basePrice: real('base_price'),
  upsells: text('upsells'), // JSON: { whiteGlove: bool, support: bool, customFeatures: string[] }
  totalValue: real('total_value'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeSessionId: text('stripe_session_id'),
  notes: text('notes'),
  closedAt: integer('closed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
