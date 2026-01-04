-- Fix site_contexts type constraint to allow all new content types
-- Run this migration in Supabase SQL Editor

-- Drop the old CHECK constraint if it exists
ALTER TABLE site_contexts 
  DROP CONSTRAINT IF EXISTS site_contexts_type_check;

-- Add new CHECK constraint with all valid types
ALTER TABLE site_contexts
  ADD CONSTRAINT site_contexts_type_check 
  CHECK (type IN (
    'logo', 'header', 'footer', 'meta', 'sitemap',
    'key-website-pages', 'landing-pages', 'blog-resources',
    'hero-section', 'problem-statement', 'who-we-serve',
    'use-cases', 'industries', 'products-services',
    'social-proof-trust', 'leadership-team', 'about-us',
    'faq', 'contact-information'
  ));

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'site_contexts'::regclass 
  AND conname = 'site_contexts_type_check';

COMMENT ON CONSTRAINT site_contexts_type_check ON site_contexts 
  IS 'Validates that type is one of the allowed context types';

