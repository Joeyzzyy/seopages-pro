-- Add brand asset fields to site_contexts table
-- Run this migration in Supabase SQL Editor

-- Add new columns for brand assets
ALTER TABLE site_contexts 
  ADD COLUMN IF NOT EXISTS brand_name TEXT,
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS og_image TEXT,
  ADD COLUMN IF NOT EXISTS favicon TEXT,
  ADD COLUMN IF NOT EXISTS logo_light TEXT,
  ADD COLUMN IF NOT EXISTS logo_dark TEXT,
  ADD COLUMN IF NOT EXISTS icon_light TEXT,
  ADD COLUMN IF NOT EXISTS icon_dark TEXT;

-- Add comments for new columns
COMMENT ON COLUMN site_contexts.brand_name IS 'Brand name';
COMMENT ON COLUMN site_contexts.subtitle IS 'Brand subtitle or tagline';
COMMENT ON COLUMN site_contexts.meta_description IS 'Meta description for SEO';
COMMENT ON COLUMN site_contexts.og_image IS 'Open Graph image URL';
COMMENT ON COLUMN site_contexts.favicon IS 'Favicon URL';
COMMENT ON COLUMN site_contexts.logo_light IS 'Light theme logo URL';
COMMENT ON COLUMN site_contexts.logo_dark IS 'Dark theme logo URL';
COMMENT ON COLUMN site_contexts.icon_light IS 'Light theme icon URL';
COMMENT ON COLUMN site_contexts.icon_dark IS 'Dark theme icon URL';

