import { COMPETITORS } from '../app/seopages-pro-alternatives/data';
import { LISTICLE_PAGES } from '../app/best-alternatives/data';

const BASE_URL = 'https://seopages.pro';

interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

function generateSitemapXML(entries: SitemapEntry[]): string {
  const xmlEntries = entries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
}

function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${BASE_URL}/sitemap.xml

# Crawl rate
Crawl-delay: 1

# Disallow admin and API routes
Disallow: /api/
Disallow: /admin/
Disallow: /project/
Disallow: /projects/
Disallow: /payment/

# Allow important pages
Allow: /best-alternatives/
Allow: /seopages-pro-alternatives/
Allow: /alternative-page-guide/
`;
}

function generateSitemapIndex(): string {
  const today = new Date().toISOString().split('T')[0];
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap-pages.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-alternatives.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-listicles.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;
}

function getAllEntries(): SitemapEntry[] {
  const today = new Date().toISOString().split('T')[0];
  const entries: SitemapEntry[] = [];

  // Main pages
  entries.push(
    { url: BASE_URL, lastmod: today, changefreq: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/best-alternatives`, lastmod: today, changefreq: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/seopages-pro-alternatives`, lastmod: today, changefreq: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/alternative-page-guide`, lastmod: today, changefreq: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/terms`, lastmod: today, changefreq: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastmod: today, changefreq: 'yearly', priority: 0.3 },
  );

  // Alternative pages
  COMPETITORS.forEach(competitor => {
    entries.push({
      url: `${BASE_URL}/seopages-pro-alternatives/${competitor.slug}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.8,
    });
  });

  // Listicle pages
  LISTICLE_PAGES.forEach(page => {
    entries.push({
      url: `${BASE_URL}/best-alternatives/${page.slug}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.8,
    });
  });

  // Guide pages
  const guidePages = [
    'what-are-alternative-pages',
    'alternative-page-seo-best-practices',
    'alternative-page-vs-landing-page',
    'how-to-write-alternative-page-copy',
    'alternative-page-examples',
  ];
  
  guidePages.forEach(slug => {
    entries.push({
      url: `${BASE_URL}/alternative-page-guide/${slug}`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.7,
    });
  });

  return entries;
}

// Export for use in build process
export {
  generateSitemapXML,
  generateRobotsTxt,
  generateSitemapIndex,
  getAllEntries,
  BASE_URL,
};

// CLI execution
if (require.main === module) {
  const fs = require('fs');
  const path = require('path');

  const publicDir = path.join(process.cwd(), 'public');
  
  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Generate main sitemap
  const entries = getAllEntries();
  const sitemapXML = generateSitemapXML(entries);
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXML);

  // Generate robots.txt
  const robotsTxt = generateRobotsTxt();
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt);

  console.log(`✅ Generated sitemap.xml with ${entries.length} URLs`);
  console.log(`✅ Generated robots.txt`);
}
