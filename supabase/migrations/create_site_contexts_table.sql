-- Create site_contexts table if not exists
-- This table stores all site context information including brand assets and content sections
-- Run this migration in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS site_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  -- Brand Assets fields
  brand_name TEXT,
  subtitle TEXT,
  meta_description TEXT,
  og_image TEXT,
  favicon TEXT,
  logo_light TEXT,
  logo_dark TEXT,
  icon_light TEXT,
  icon_dark TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  heading_font TEXT,
  body_font TEXT,
  tone TEXT,
  languages TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- Enable RLS
ALTER TABLE site_contexts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can access own site contexts" ON site_contexts
  FOR ALL USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_contexts_user_type ON site_contexts(user_id, type);

-- Add comment
COMMENT ON TABLE site_contexts IS 'Stores site-wide context including brand assets, content sections, and site elements';
COMMENT ON COLUMN site_contexts.type IS 'Context type: logo, header, footer, meta, sitemap, key-website-pages, landing-pages, blog-resources, hero-section, problem-statement, who-we-serve, use-cases, industries, products-services, social-proof-trust, leadership-team, about-us, faq, contact-information';
COMMENT ON COLUMN site_contexts.content IS 'Text or JSON content for the context type';
COMMENT ON COLUMN site_contexts.file_url IS 'URL for uploaded files (e.g., logo)';
COMMENT ON COLUMN site_contexts.brand_name IS 'Brand name';
COMMENT ON COLUMN site_contexts.subtitle IS 'Brand subtitle or tagline';
COMMENT ON COLUMN site_contexts.meta_description IS 'Meta description for SEO';
COMMENT ON COLUMN site_contexts.og_image IS 'Open Graph image URL';
COMMENT ON COLUMN site_contexts.favicon IS 'Favicon URL';
COMMENT ON COLUMN site_contexts.logo_light IS 'Light theme logo URL';
COMMENT ON COLUMN site_contexts.logo_dark IS 'Dark theme logo URL';
COMMENT ON COLUMN site_contexts.icon_light IS 'Light theme icon URL';
COMMENT ON COLUMN site_contexts.icon_dark IS 'Dark theme icon URL';
COMMENT ON COLUMN site_contexts.primary_color IS 'Brand primary color (hex)';
COMMENT ON COLUMN site_contexts.secondary_color IS 'Brand secondary color (hex)';
COMMENT ON COLUMN site_contexts.heading_font IS 'Font family for headings';
COMMENT ON COLUMN site_contexts.body_font IS 'Font family for body text';
COMMENT ON COLUMN site_contexts.tone IS 'Brand tone and voice guidelines';
COMMENT ON COLUMN site_contexts.languages IS 'Supported languages';

