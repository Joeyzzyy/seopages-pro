# Brand Assets Fields Migration

## Overview
This document explains the new brand asset fields added to the `site_contexts` table.

## New Fields Added

### Brand Identity
- `brand_name` (TEXT): The official brand name (e.g., "Pollo AI")
- `subtitle` (TEXT): Brand subtitle or tagline (e.g., "All-in-One AI Video & Image Generator")
- `meta_description` (TEXT): SEO meta description for the website

### Visual Assets
- `og_image` (TEXT): Open Graph image URL for social media sharing
- `favicon` (TEXT): Favicon URL
- `logo_light` (TEXT): Light theme logo URL
- `logo_dark` (TEXT): Dark theme logo URL  
- `icon_light` (TEXT): Light theme icon URL
- `icon_dark` (TEXT): Dark theme icon URL

### Design System (Existing, Enhanced)
- `primary_color` (TEXT): Brand primary color (hex)
- `secondary_color` (TEXT): Brand secondary color (hex)
- `heading_font` (TEXT): Font family for headings
- `body_font` (TEXT): Font family for body text
- `tone` (TEXT): Brand tone and voice guidelines
- `languages` (TEXT): Supported languages

## Migration Steps

### 1. Run the Migration SQL

In your Supabase SQL Editor, execute the migration script:

```sql
-- File: supabase/migrations/add_brand_assets_fields.sql

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

COMMENT ON COLUMN site_contexts.brand_name IS 'Brand name';
COMMENT ON COLUMN site_contexts.subtitle IS 'Brand subtitle or tagline';
COMMENT ON COLUMN site_contexts.meta_description IS 'Meta description for SEO';
COMMENT ON COLUMN site_contexts.og_image IS 'Open Graph image URL';
COMMENT ON COLUMN site_contexts.favicon IS 'Favicon URL';
COMMENT ON COLUMN site_contexts.logo_light IS 'Light theme logo URL';
COMMENT ON COLUMN site_contexts.logo_dark IS 'Dark theme logo URL';
COMMENT ON COLUMN site_contexts.icon_light IS 'Light theme icon URL';
COMMENT ON COLUMN site_contexts.icon_dark IS 'Dark theme icon URL';
```

### 2. Verify Migration

Check that the columns were added successfully:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'site_contexts'
  AND column_name IN (
    'brand_name', 'subtitle', 'meta_description', 
    'og_image', 'favicon', 
    'logo_light', 'logo_dark', 'icon_light', 'icon_dark'
  );
```

### 3. Test the Feature

1. Open the Site Context modal in your application
2. Navigate to "Brand Assets" section
3. Fill in the new fields:
   - Brand Name: "Pollo AI"
   - Subtitle: "All-in-One AI Video & Image Generator"
   - Meta Description: "Create stunning AI videos..."
   - Open Graph Image: "https://pollo.ai/og-image.jpg"
   - Favicon: "https://pollo.ai/favicon.ico"
   - Logo URLs (light/dark versions)
   - Icon URLs (light/dark versions)
4. Save and verify data is stored correctly

## Example Data

```json
{
  "type": "logo",
  "brand_name": "Pollo AI",
  "subtitle": "All-in-One AI Video & Image Generator",
  "meta_description": "Create stunning AI videos and images with Pollo AI - integrating Sora 2, Veo 3.1, Midjourney, and 10+ leading AI models into one powerful platform.",
  "og_image": "https://pollo.ai/og-image.jpg",
  "favicon": "https://pollo.ai/favicon.ico",
  "logo_light": "https://pollo.ai/logo-light.svg",
  "logo_dark": "https://pollo.ai/logo-dark.svg",
  "icon_light": "https://pollo.ai/icon-light.svg",
  "icon_dark": "https://pollo.ai/icon-dark.svg",
  "primary_color": "#9A8FEA",
  "secondary_color": "#FF5733",
  "heading_font": "Inter",
  "body_font": "Roboto",
  "tone": "Professional, friendly, and innovative",
  "languages": "English, Chinese"
}
```

## API Usage

### Saving Brand Assets

```javascript
const response = await fetch('/api/site-contexts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    type: 'logo',
    brandName: 'Pollo AI',
    subtitle: 'All-in-One AI Video & Image Generator',
    metaDescription: 'Create stunning AI videos...',
    ogImage: 'https://pollo.ai/og-image.jpg',
    favicon: 'https://pollo.ai/favicon.ico',
    logoLight: 'https://pollo.ai/logo-light.svg',
    logoDark: 'https://pollo.ai/logo-dark.svg',
    iconLight: 'https://pollo.ai/icon-light.svg',
    iconDark: 'https://pollo.ai/icon-dark.svg',
    primaryColor: '#9A8FEA',
    secondaryColor: '#FF5733',
    headingFont: 'Inter',
    bodyFont: 'Roboto',
    tone: 'Professional, friendly',
    languages: 'English, Chinese'
  })
});
```

## Rollback (if needed)

If you need to remove these columns:

```sql
ALTER TABLE site_contexts 
  DROP COLUMN IF EXISTS brand_name,
  DROP COLUMN IF EXISTS subtitle,
  DROP COLUMN IF EXISTS meta_description,
  DROP COLUMN IF EXISTS og_image,
  DROP COLUMN IF EXISTS favicon,
  DROP COLUMN IF EXISTS logo_light,
  DROP COLUMN IF EXISTS logo_dark,
  DROP COLUMN IF EXISTS icon_light,
  DROP COLUMN IF EXISTS icon_dark;
```

## Related Files

- `/lib/supabase.ts` - TypeScript interface updated
- `/components/ContextModalNew.tsx` - UI form updated
- `/app/api/site-contexts/route.ts` - API endpoint updated
- `/supabase/migrations/add_brand_assets_fields.sql` - Migration SQL
- `/supabase/migrations/create_site_contexts_table.sql` - Base table definition updated

## Notes

- All new fields are optional (nullable)
- Fields are stored in the same `site_contexts` row with `type = 'logo'`
- The UI groups these fields under "Brand Assets" section
- Fields are automatically saved when the form is submitted

