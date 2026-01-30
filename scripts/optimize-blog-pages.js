const fs = require('fs');
const path = require('path');

const blogDir = path.join(process.cwd(), 'public/pages/alternative-page-guide');
const blogFiles = [
  'what-are-alternative-pages.html',
  'alternative-page-seo-best-practices.html',
  'alternative-page-vs-landing-page.html',
  'how-to-write-alternative-page-copy.html',
  'alternative-page-examples.html'
];

// AI Summary HTML template
function getAISummaryHTML(title, keyPoints) {
  return `
    <!-- AI Summary Section - GEO Optimization -->
    <section class="mb-12 p-6 bg-gradient-to-br from-brand-purple/10 to-brand-blue/5 border border-brand-purple/30 rounded-xl ai-summary-content">
      <div class="flex items-center gap-2 mb-4">
        <svg class="w-5 h-5 text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        <h2 class="text-lg font-semibold text-white">Quick Summary for AI & Readers</h2>
      </div>
      <div class="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
        <p class="text-gray-300 leading-relaxed"><strong class="text-brand-purple">Verdict:</strong> ${keyPoints.verdict}</p>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        ${keyPoints.stats.map(stat => `
          <div class="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
            <div class="text-lg font-bold text-brand-purple">${stat.value}</div>
            <div class="text-xs text-gray-400">${stat.label}</div>
          </div>
        `).join('')}
      </div>
      <div class="key-takeaways">
        <h3 class="font-medium text-white text-sm mb-2">Key Takeaways:</h3>
        <ul class="space-y-2">
          ${keyPoints.takeaways.map((point, idx) => `
            <li class="flex items-start gap-2 text-sm text-gray-300">
              <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-purple/20 text-brand-purple text-xs font-bold flex-shrink-0 mt-0.5">${idx + 1}</span>
              <span>${point}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    </section>
  `;
}

// SpeakableSpecification Schema
function getSpeakableSchema() {
  return `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SpeakableSpecification",
      "cssSelector": [".ai-summary-content", ".key-takeaways", "h1", "#content h2"]
    }
    </script>
  `;
}

// BreadcrumbList Schema
function getBreadcrumbSchema(slug, title) {
  const pages = {
    'what-are-alternative-pages': 'What Are Alternative Pages',
    'alternative-page-seo-best-practices': 'SEO Best Practices',
    'alternative-page-vs-landing-page': 'Alternative vs Landing Page',
    'how-to-write-alternative-page-copy': 'How to Write Copy',
    'alternative-page-examples': 'Page Examples'
  };
  
  return `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://seopages.pro" },
        { "@type": "ListItem", "position": 2, "name": "Alternative Page Guide", "item": "https://seopages.pro/alternative-page-guide" },
        { "@type": "ListItem", "position": 3, "name": "${pages[slug] || title}" }
      ]
    }
    </script>
  `;
}

// Related Comparisons Section
function getRelatedComparisonsHTML(currentSlug) {
  const allPages = [
    { slug: 'what-are-alternative-pages', title: 'What Are Alternative Pages', desc: 'Complete definition guide' },
    { slug: 'alternative-page-seo-best-practices', title: 'SEO Best Practices', desc: 'Rank higher in search' },
    { slug: 'alternative-page-vs-landing-page', title: 'Alternative vs Landing Page', desc: 'Key differences explained' },
    { slug: 'how-to-write-alternative-page-copy', title: 'How to Write Copy', desc: 'Conversion-focused writing' },
    { slug: 'alternative-page-examples', title: 'Page Examples', desc: 'Real-world examples' }
  ];
  
  const relatedPages = allPages.filter(p => p.slug !== currentSlug).slice(0, 4);
  
  return `
    <!-- Related Comparisons - Internal Linking -->
    <section class="mt-16 pt-12 border-t border-white/10 related-comparisons">
      <h2 class="text-2xl font-bold mb-8">Explore More Guide Articles</h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        ${relatedPages.map(page => `
          <a href="/alternative-page-guide/${page.slug}" class="group p-5 bg-white/5 border border-white/10 rounded-xl hover:border-brand-purple/50 transition-all">
            <h3 class="font-semibold text-white group-hover:text-brand-purple transition-colors mb-2">${page.title}</h3>
            <p class="text-sm text-gray-400">${page.desc}</p>
            <div class="mt-4 flex items-center text-sm text-brand-purple">
              <span>Read article</span>
              <svg class="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </a>
        `).join('')}
      </div>
    </section>
  `;
}

// Key points for each blog
const blogKeyPoints = {
  'what-are-alternative-pages': {
    verdict: 'Alternative pages are specialized landing pages that target users comparing products or seeking alternatives. They convert 3-5x better than generic landing pages due to high purchase intent.',
    stats: [
      { value: '3-5x', label: 'Higher Conversion' },
      { value: '47%', label: 'More Engagement' },
      { value: '3', label: 'Main Types' },
      { value: '10-20', label: 'Pages to Start' }
    ],
    takeaways: [
      'Alternative pages target users actively comparing products or seeking alternatives',
      'Three main types: "X Alternative", "X vs Y", and Multi-Product Comparison',
      'Convert 3-5x better than generic landing pages due to high purchase intent',
      'Honest comparisons build trust and long-term SEO value'
    ]
  },
  'alternative-page-seo-best-practices': {
    verdict: 'SEO-optimized alternative pages require strategic keyword targeting, structured data markup, comparison tables, and authentic content that provides genuine value to users comparing solutions.',
    stats: [
      { value: '10', label: 'Best Practices' },
      { value: '3-5x', label: 'Traffic Increase' },
      { value: '5', label: 'Schema Types' },
      { value: '60+', label: 'Days to Rank' }
    ],
    takeaways: [
      'Target comparison keywords like "X alternatives" and "X vs Y"',
      'Use structured data: Article, FAQ, Product, and Comparison schemas',
      'Include authentic comparison tables with pros/cons',
      'Update content regularly to maintain freshness'
    ]
  },
  'alternative-page-vs-landing-page': {
    verdict: 'Alternative pages target comparison-intent users with competitive analysis, while landing pages target solution-aware users with product-focused messaging. Use alternative pages for SEO, landing pages for paid campaigns.',
    stats: [
      { value: '3-5x', label: 'Conversion Rate' },
      { value: '2', label: 'Page Types' },
      { value: 'SEO', label: 'Best For Alternative' },
      { value: 'PPC', label: 'Best For Landing' }
    ],
    takeaways: [
      'Alternative pages capture comparison search intent',
      'Landing pages work best for paid advertising campaigns',
      'Alternative pages build long-term organic traffic',
      'Both page types can work together in your funnel'
    ]
  },
  'how-to-write-alternative-page-copy': {
    verdict: 'Effective alternative page copy balances honesty with strategic positioning. Acknowledge competitor strengths, then clearly differentiate your solution with specific benefits and social proof.',
    stats: [
      { value: '5', label: 'Key Sections' },
      { value: '1500+', label: 'Words Ideal' },
      { value: '3x', label: 'Trust Factor' },
      { value: '10+', label: 'CTA Best Practices' }
    ],
    takeaways: [
      'Start with an honest assessment of all solutions',
      'Use specific features, not vague marketing claims',
      'Include real customer testimonials and case studies',
      'End with clear, benefit-focused CTAs'
    ]
  },
  'alternative-page-examples': {
    verdict: 'High-converting alternative pages share common elements: clear comparison tables, authentic pros/cons, specific feature comparisons, and strategic CTAs that guide users toward the next step.',
    stats: [
      { value: '10+', label: 'Examples' },
      { value: '47%', label: 'Avg Conversion' },
      { value: '5', label: 'Key Elements' },
      { value: '3', label: 'Page Formats' }
    ],
    takeaways: [
      'Best examples use clear, scannable comparison tables',
      'Authentic pros/cons build trust with readers',
      'Visual hierarchy guides users to key information',
      'Multiple CTAs capture users at different stages'
    ]
  }
};

// Process each blog file
blogFiles.forEach(file => {
  const filePath = path.join(blogDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} - not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const slug = file.replace('.html', '');
  const keyPoints = blogKeyPoints[slug];
  
  if (!keyPoints) {
    console.log(`Skipping ${file} - no key points defined`);
    return;
  }
  
  // 1. Add SpeakableSpecification Schema before </head>
  const speakableSchema = getSpeakableSchema();
  if (!content.includes('SpeakableSpecification')) {
    content = content.replace('</head>', `${speakableSchema}\n</head>`);
    console.log(`✓ Added SpeakableSpecification to ${file}`);
  }
  
  // 2. Add BreadcrumbList Schema before </head>
  const breadcrumbSchema = getBreadcrumbSchema(slug);
  if (!content.includes('BreadcrumbList')) {
    content = content.replace('</head>', `${breadcrumbSchema}\n</head>`);
    console.log(`✓ Added BreadcrumbList to ${file}`);
  }
  
  // 3. Add AI Summary section after <!-- Key Takeaways --> or before first section
  const aiSummaryHTML = getAISummaryHTML(keyPoints.title || slug, keyPoints);
  if (!content.includes('ai-summary-content')) {
    // Insert after TL;DR section or before #definition section
    if (content.includes('id="definition"')) {
      content = content.replace('<section id="definition"', `${aiSummaryHTML}\n    <section id="definition"`);
    } else {
      // Insert after main content start
      content = content.replace('<main id="content"', `<main id="content"${aiSummaryHTML}`);
    }
    console.log(`✓ Added AI Summary to ${file}`);
  }
  
  // 4. Replace Related Pages section with enhanced version
  const relatedHTML = getRelatedComparisonsHTML(slug);
  if (content.includes('Related Articles') || content.includes('Related Pages')) {
    // Replace existing related section
    content = content.replace(/<section class="mt-16[^>]*>[\s\S]*?<\/section>\s*$/, relatedHTML);
    console.log(`✓ Updated Related Comparisons in ${file}`);
  } else {
    // Add before closing main or before footer
    content = content.replace('</main>', `${relatedHTML}\n    </main>`);
    console.log(`✓ Added Related Comparisons to ${file}`);
  }
  
  // Write updated content
  fs.writeFileSync(filePath, content);
  console.log(`✅ Optimized ${file}\n`);
});

console.log('🎉 All blog pages optimized!');
