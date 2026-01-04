# Playbook Auto-Fill Enhancement

## Overview

Enhanced the `PlaybookTrigger` component to automatically populate required fields from Site Context and Google Search Console (GSC) data, reducing manual input and improving user experience.

## Changes Made

### 1. Auto-Fill from Site Context

**Source**: Site Context (meta type)
- Extracts `og:site_name` or `<title>` → fills product/site name fields
- Extracts `og:url` or `canonical` link → fills URL fields

**Field Mapping**:

**URL Fields** (auto-filled with site URL):
- `my_domain`
- `siteUrl`
- `url`
- `site_url`
- `target`
- `site_root`
- `page_url`
- `domain`
- `your_website`

**Name Fields** (auto-filled with site name):
- `site_name`
- `sitename`
- `product_name`
- `productname`
- `brand_name`
- `brandname`
- `your_product_name`

### 2. Auto-Select GSC Site

When GSC is connected:
1. **Default Selection**: Automatically selects the first GSC site for URL fields
2. **Smart Matching**: If Site Context URL matches a GSC site, prioritizes that site
3. **Visual Feedback**: Shows "GSC Connected" badge and site quick-select buttons

### 3. Priority Order

Fields are populated in this order:
1. **Field's `defaultValue`** (if defined in skill config)
2. **Site Context data** (meta tags)
3. **GSC auto-selection** (for URL fields, after GSC data loads)

### 4. Modified Components

#### `PlaybookTrigger.tsx`
- Added `siteContexts` prop
- Added `extractSiteInfo()` function to parse meta context
- Enhanced `useState` initialization with auto-fill logic
- Updated `useEffect` for GSC to auto-select matching site

#### `app/chat/page.tsx`
- Passed `siteContexts` to `PlaybookTrigger` component

## Skills Affected

### ✅ Fully Auto-Filled (URL + Name)
- **Competitor Analysis**: `your_product_name`, `your_website`
- **Content Gap Analysis**: `my_domain`
- **Keyword Research**: `site_url`

### ✅ Partially Auto-Filled (URL only)
- **Tech Checker**: `url`
- **SEO Auditor**: `url`
- **Schema Generator**: `url`
- **Meta Tags**: `url`
- **Link Optimizer**: `page_url`, `site_root`
- **GEO Auditor**: `url`

### ⚠️ No Auto-Fill (User Input Required)
- **Topic Brainstorm**: `site_goal` (requires user's strategic input)
- **Page Planner**: `cluster_topic` (requires topic selection)
- **SERP Analysis**: `keyword` (requires specific keyword)

### ✅ Already Have Defaults
- **SERP Analysis**: `results_count` (default: '3')
- **Content Gap Analysis**: `database` (default: 'us')

## User Experience Improvements

### Before
- User had to manually copy-paste site URL for every skill
- User had to manually type product name repeatedly
- GSC sites shown but not pre-selected

### After
- ✅ Site URL auto-populated for all URL fields
- ✅ Product name auto-populated from meta tags
- ✅ GSC site auto-selected (smart matching with context URL)
- ✅ Quick-select buttons remain for manual override
- ✅ Fields only auto-filled if empty (preserves user edits)

## Technical Implementation

### Site Info Extraction
```typescript
const extractSiteInfo = () => {
  const metaContext = siteContexts.find(ctx => ctx.type === 'meta');
  const parser = new DOMParser();
  const doc = parser.parseFromString(metaContext.content, 'text/html');
  
  const siteName = 
    doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
    doc.querySelector('title')?.textContent || '';
  
  const siteUrl = 
    doc.querySelector('meta[property="og:url"]')?.getAttribute('content') ||
    doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
  
  return { siteName, siteUrl };
};
```

### GSC Auto-Selection
```typescript
// Auto-fill domain fields with GSC site
if (gscSites.length > 0 && trigger?.fields) {
  trigger.fields.forEach(field => {
    const isDomainField = /* URL field check */;
    
    if (isDomainField && !values[field.id]) {
      let matchedSite = gscSites[0]; // Default to first
      
      // Try to match with siteUrl from context
      if (siteUrl) {
        const normalized = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const matched = gscSites.find(site => 
          site.includes(normalized) || normalized.includes(site)
        );
        if (matched) matchedSite = matched;
      }
      
      setValues(prev => ({ ...prev, [field.id]: cleanSite(matchedSite) }));
    }
  });
}
```

## Testing Checklist

- [ ] Keyword Research - `site_url` auto-filled ✅
- [ ] Competitor Analysis - `your_product_name` and `your_website` auto-filled ✅
- [ ] Content Gap Analysis - `my_domain` auto-filled + GSC auto-selected ✅
- [ ] Tech Checker - `url` auto-filled ✅
- [ ] SEO Auditor - `url` auto-filled ✅
- [ ] Link Optimizer - `page_url` and `site_root` auto-filled ✅
- [ ] GSC site auto-selection matches context URL ✅
- [ ] Manual override still works (quick-select buttons) ✅
- [ ] Fields with `defaultValue` not overridden ✅

## Future Enhancements

1. **More Context Fields**: Extract additional metadata (language, author, etc.)
2. **History-Based Defaults**: Remember user's recent inputs for topic/keyword fields
3. **Smart Suggestions**: Use AI to suggest topics based on site content
4. **Multi-Site Support**: Allow users to manage multiple site contexts and switch between them

