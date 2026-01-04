# Content Sections Architecture

## Overview

This document describes the extended Site Context architecture that includes comprehensive content sections for better content generation and brand consistency.

## Context Structure

The site context system now includes three main categories:

### 1. Brand Assets

Core branding elements stored with the `logo` type:

- **Logo**: Visual brand identity (file_url)
- **Primary Color**: Brand primary color (hex code)
- **Secondary Color**: Brand secondary color (hex code)
- **Heading Font**: Typography for headings
- **Body Font**: Typography for body text
- **Tone & Voice**: Brand communication guidelines
- **Languages**: Supported languages

### 2. Site Elements

Technical site components:

- **Header** (`header`): Navigation and header HTML
- **Footer** (`footer`): Footer HTML
- **Meta Tags** (`meta`): Complete `<head>` content
- **Sitemap** (`sitemap`): Website structure and URLs

### 3. Content Sections

New structured content types for richer context:

#### Page Categories
- **Key Website Pages** (`key-website-pages`): List of main website pages
- **Landing Pages** (`landing-pages`): Landing page descriptions and purposes
- **Blog & Resources** (`blog-resources`): Content themes and categories

#### Hero & Messaging
- **Hero Section** (`hero-section`): 
  - Headline
  - Subheadline
  - Call to Action
  - Media (image/video URL)
  - Metrics

#### Value Proposition
- **Problem Statement** (`problem-statement`): Problems/pain points addressed
- **Who We Serve** (`who-we-serve`): Target audience and personas
- **Use Cases** (`use-cases`): Common use cases and scenarios
- **Industries** (`industries`): Industries served

#### Offerings
- **Products & Services** (`products-services`): Product/service descriptions

#### Trust & Credibility
- **Social Proof & Trust** (`social-proof-trust`):
  - Testimonials
  - Case Studies
  - Badges & Certifications
  - Awards
  - Guarantees
  - Integrations

#### Company Information
- **Leadership Team** (`leadership-team`): Team members and executives
- **About Us** (`about-us`):
  - Company Story
  - Mission & Vision
  - Core Values
- **FAQ** (`faq`): Common questions and answers
- **Contact Information** (`contact-information`):
  - Primary Contact
  - Location & Hours
  - Support Channels
  - Additional Information

## Data Structure

### TypeScript Interfaces

```typescript
export interface SiteContext {
  id: string;
  user_id: string;
  type: 'logo' | 'header' | 'footer' | 'meta' | 'sitemap' | 
        'key-website-pages' | 'landing-pages' | 'blog-resources' | 
        'hero-section' | 'problem-statement' | 'who-we-serve' | 
        'use-cases' | 'industries' | 'products-services' | 
        'social-proof-trust' | 'leadership-team' | 'about-us' | 
        'faq' | 'contact-information';
  content: string | null;
  file_url: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  heading_font?: string | null;
  body_font?: string | null;
  tone?: string | null;
  languages?: string | null;
  created_at: string;
  updated_at: string;
}

// Structured content for specific types
export interface HeroSectionContent {
  headline?: string;
  subheadline?: string;
  callToAction?: string;
  media?: string;
  metrics?: string;
}

export interface SocialProofContent {
  testimonials?: string;
  caseStudies?: string;
  badges?: string;
  awards?: string;
  guarantees?: string;
  integrations?: string;
}

export interface AboutUsContent {
  companyStory?: string;
  missionVision?: string;
  coreValues?: string;
}

export interface ContactInformationContent {
  primaryContact?: string;
  locationHours?: string;
  supportChannels?: string;
  additional?: string;
}
```

## Storage Format

### Simple Text Content
Types like `key-website-pages`, `landing-pages`, `problem-statement`, etc. store plain text in the `content` field.

### Structured JSON Content
Complex types store JSON-stringified objects:

```json
// hero-section
{
  "headline": "Transform Your Business",
  "subheadline": "Powerful tools for modern teams",
  "callToAction": "Get Started Free",
  "media": "https://example.com/hero.jpg",
  "metrics": "10,000+ customers, 99.9% uptime"
}

// social-proof-trust
{
  "testimonials": "Customer reviews and feedback...",
  "caseStudies": "Success stories...",
  "badges": "SOC 2, ISO 27001",
  "awards": "Best SaaS 2024",
  "guarantees": "30-day money-back guarantee",
  "integrations": "Slack, Salesforce, HubSpot"
}

// about-us
{
  "companyStory": "Founded in 2020...",
  "missionVision": "Our mission is to...",
  "coreValues": "Innovation, Integrity, Impact"
}

// contact-information
{
  "primaryContact": "support@example.com, +1-555-0100",
  "locationHours": "123 Main St, San Francisco, CA\nMon-Fri 9am-6pm PST",
  "supportChannels": "Live chat, email support, phone",
  "additional": "Media inquiries: press@example.com"
}
```

## UI Components

### Editors

Each content type has a dedicated editor component:

- `LogoEditor`: File upload for logo
- `HeaderEditor`: Visual header configuration
- `FooterEditor`: Visual footer configuration
- `MetaEditor`: Code editor for meta tags
- `SitemapViewer`: Read-only sitemap display
- `HeroSectionEditor`: Structured form for hero content
- `SocialProofEditor`: Multi-field form for trust signals
- `AboutUsEditor`: Multi-field form for company info
- `ContactInformationEditor`: Multi-field form for contact details
- `TextContentEditor`: Generic text area for simple content

### Modal Navigation

The Context Wizard (`ContextModalNew`) provides:
- Left sidebar navigation with scroll-to-section
- Three main sections: Brand Assets, Site Elements, Content Sections
- Save all changes at once
- Real-time preview of changes

### Sidebar Display

The `ConversationSidebar` shows:
- Expandable sections for each category
- Visual indicators for filled vs empty contexts
- Click to open and edit any section
- Organized hierarchy for easy navigation

## Usage in Skills

### Retrieving Context

Use the `get_site_contexts` tool to fetch context data:

```typescript
const result = await get_site_contexts({
  user_id: 'user-id',
  types: ['hero-section', 'problem-statement', 'social-proof-trust']
});
```

### Using Context in Content Generation

When generating pages:

1. **Always call `get_site_contexts` first** to retrieve relevant context
2. **Parse structured JSON** for complex types:
   ```typescript
   const heroData = JSON.parse(result.contexts['hero-section'].content);
   ```
3. **Incorporate context** into generated content for consistency
4. **Apply brand assets** (colors, fonts, tone) throughout the page

### Example Workflow

```typescript
// 1. Fetch context
const context = await get_site_contexts({ user_id });

// 2. Extract relevant data
const hero = JSON.parse(context.contexts['hero-section']?.content || '{}');
const socialProof = JSON.parse(context.contexts['social-proof-trust']?.content || '{}');
const aboutUs = JSON.parse(context.contexts['about-us']?.content || '{}');

// 3. Generate content using context
const pageContent = `
  <section class="hero">
    <h1>${hero.headline}</h1>
    <p>${hero.subheadline}</p>
    <a href="#">${hero.callToAction}</a>
  </section>
  
  <section class="testimonials">
    ${socialProof.testimonials}
  </section>
  
  <section class="about">
    <h2>Our Story</h2>
    ${aboutUs.companyStory}
  </section>
`;
```

## Benefits

1. **Richer Context**: More detailed information for AI to generate better content
2. **Consistency**: Ensures all generated pages align with brand and messaging
3. **Organization**: Structured content is easier to manage and update
4. **Flexibility**: Can add more content types as needed
5. **Reusability**: Context can be used across multiple pages and skills

## Migration Notes

- Existing contexts (logo, header, footer, meta, sitemap) remain unchanged
- New types are optional - system works with or without them
- Gradual adoption - users can fill in sections over time
- No database migrations required - uses existing `site_contexts` table

## Future Enhancements

Potential additions:
- **Pricing**: Pricing tiers and features
- **Features**: Product feature lists
- **Comparisons**: Comparison with competitors
- **Resources**: Knowledge base, documentation, tutorials
- **Legal**: Terms of service, privacy policy links
- **Careers**: Job openings and company culture
- **Partners**: Partner logos and information
- **Press**: Press mentions and media coverage

