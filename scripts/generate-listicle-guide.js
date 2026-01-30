const fs = require('fs');
const path = require('path');

const guideDir = path.join(process.cwd(), 'public/pages/best-alternatives-guide');

// 页面配置
const pages = [
  {
    slug: 'what-are-listicle-pages',
    title: 'What Are Listicle Pages? Complete Guide to "Best Of" Content',
    description: 'Discover what listicle pages are, why "Top 10" and "Best Of" content converts so well, and how to create high-ranking listicle pages.',
    keywords: 'what are listicle pages, listicle definition, best of pages, top 10 content, roundup pages',
    tldr: [
      'Listicle pages target users actively comparing products or seeking alternatives',
      'Three main types: "X Alternative", "X vs Y", and Multi-Product Comparison',
      'Convert 3-5x better than generic landing pages due to high purchase intent',
      'Honest comparisons build trust and long-term SEO value'
    ],
    content: `
    <section class="prose prose-invert prose-lg max-w-none mb-12 scroll-mt-24">
      <p class="text-lg text-gray-300 leading-relaxed"><strong>Listicle pages</strong> (also called "Best Of" pages, "Top 10" lists, or roundup pages) are content formats that present multiple products, services, or solutions in a ranked or numbered list format. They're designed to help users quickly compare options and make informed decisions.</p>
      
      <p class="text-gray-400 mt-4">Unlike traditional product pages that focus on a single solution, listicles provide a bird's-eye view of an entire category. This format taps into how people naturally make decisions—by comparing multiple options before choosing.</p>
      
      <div class="my-6 p-6 bg-gradient-to-r from-brand-purple/10 to-brand-blue/10 border-l-4 border-brand-purple rounded-r-xl">
        <p class="text-gray-300"><strong>Example:</strong> Instead of just describing your SEO tool, a listicle page titled "Top 10 SEO Tools for 2026" compares multiple solutions, positioning yours among the best while providing genuine value to readers.</p>
      </div>
    </section>

    <section class="mb-12 scroll-mt-24">
      <h2 class="text-2xl sm:text-3xl font-bold mb-6">Types of Alternative Pages</h2>
      <div class="text-gray-300 leading-relaxed space-y-4">
        <p>There are three main types of alternative pages, each serving different search intents:</p>
        <div class="mt-6 space-y-4">
          <div class="p-4 bg-white/5 rounded-lg border border-white/10">
            <h4 class="font-semibold text-brand-purple mb-2">1. "X Alternative" Pages</h4>
            <p class="text-gray-400 text-sm">Target users searching for alternatives to a specific product. Example: "Slack Alternatives" or "Best Notion Alternatives 2026"</p>
          </div>
          <div class="p-4 bg-white/5 rounded-lg border border-white/10">
            <h4 class="font-semibold text-brand-blue mb-2">2. "X vs Y" Comparison Pages</h4>
            <p class="text-gray-400 text-sm">Direct head-to-head comparisons between two products. Example: "Notion vs Coda" or "Slack vs Discord"</p>
          </div>
          <div class="p-4 bg-white/5 rounded-lg border border-white/10">
            <h4 class="font-semibold text-brand-orange mb-2">3. Multi-Product Comparison Pages</h4>
            <p class="text-gray-400 text-sm">Compare multiple solutions at once. Example: "Top 10 Project Management Tools Compared"</p>
          </div>
        </div>
      </div>
    </section>
    
    <section class="mb-12 scroll-mt-24">
      <h2 class="text-2xl sm:text-3xl font-bold mb-8">Why Alternative Pages Convert Better</h2>
      
      <div class="my-6 p-6 bg-gradient-to-r from-brand-orange/10 to-brand-purple/10 border-l-4 border-brand-orange rounded-r-xl">
        <div class="text-3xl font-bold text-white mb-2">47%</div>
        <p class="text-gray-300">Higher purchase intent compared to informational queries. Users searching comparison terms are actively evaluating options.</p>
        <p class="text-xs text-gray-500 mt-2">Source: <a href="https://www.semrush.com/blog/keyword-intent/" target="_blank" rel="noopener noreferrer" class="text-brand-blue hover:underline">SEMrush Keyword Intent Research</a></p>
      </div>
      
      <div class="grid sm:grid-cols-2 gap-6">
        
        <div class="p-6 bg-white/5 border border-white/10 rounded-xl card-hover">
          <div class="w-12 h-12 rounded-xl bg-brand-purple/20 flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h3 class="text-lg font-semibold mb-2">High Purchase Intent</h3>
          <p class="text-gray-400 text-sm">Users searching comparisons are in the decision stage - they've already identified their need and are choosing a solution.</p>
        </div>
        
        <div class="p-6 bg-white/5 border border-white/10 rounded-xl card-hover">
          <div class="w-12 h-12 rounded-xl bg-brand-purple/20 flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
          </div>
          <h3 class="text-lg font-semibold mb-2">Less Competition</h3>
          <p class="text-gray-400 text-sm">Long-tail comparison keywords have lower competition than broad product terms, making ranking easier.</p>
        </div>
        
        <div class="p-6 bg-white/5 border border-white/10 rounded-xl card-hover">
          <div class="w-12 h-12 rounded-xl bg-brand-purple/20 flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          </div>
          <h3 class="text-lg font-semibold mb-2">Qualified Traffic</h3>
          <p class="text-gray-400 text-sm">Visitors know what they want. They're comparing specific features, not just browsing.</p>
        </div>
        
        <div class="p-6 bg-white/5 border border-white/10 rounded-xl card-hover">
          <div class="w-12 h-12 rounded-xl bg-brand-purple/20 flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          </div>
          <h3 class="text-lg font-semibold mb-2">Trust Building</h3>
          <p class="text-gray-400 text-sm">Transparent comparisons build credibility. Showing competitor strengths makes your advantages more believable.</p>
        </div>
        
      </div>
    </section>
    `
  },
  {
    slug: 'listicle-page-seo-best-practices',
    title: 'Listicle Page SEO: 10 Best Practices for Higher Rankings',
    description: 'Master SEO for listicle pages with these 10 proven best practices. Learn how to rank your "Top 10" and "Best Of" content higher.',
    keywords: 'listicle seo, best of page seo, top 10 seo, roundup page optimization',
    tldr: [
      'Include target keywords in H1 and first paragraph',
      'Use structured data: Article, FAQ, Product, and Comparison schemas',
      'Include authentic comparison tables with pros/cons',
      'Update content regularly to maintain freshness'
    ],
    content: `
    <section class="mb-12">
      <h2 class="text-2xl sm:text-3xl font-bold mb-8">10 SEO Best Practices for Listicle Pages</h2>
      
      <div class="space-y-6">
        <div class="p-6 bg-white/5 border border-white/10 rounded-xl">
          <div class="flex items-center gap-3 mb-3">
            <span class="w-8 h-8 rounded-lg bg-brand-purple/20 flex items-center justify-center text-brand-purple font-bold text-lg">1</span>
            <h3 class="text-xl font-semibold">Target Comparison Keywords</h3>
          </div>
          <p class="text-gray-400">Focus on "best [category]", "top [number] [product]", and "[year] best" keywords. These have high commercial intent and search volume.</p>
        </div>

        <div class="p-6 bg-white/5 border border-white/10 rounded-xl">
          <div class="flex items-center gap-3 mb-3">
            <span class="w-8 h-8 rounded-lg bg-brand-purple/20 flex items-center justify-center text-brand-purple font-bold text-lg">2</span>
            <h3 class="text-xl font-semibold">Optimize Your Title Tag</h3>
          </div>
          <p class="text-gray-400">Include your primary keyword, a number, and the year. Example: "Top 10 SEO Tools for 2026 (Tested & Compared)"</p>
        </div>

        <div class="p-6 bg-white/5 border border-white/10 rounded-xl">
          <div class="flex items-center gap-3 mb-3">
            <span class="w-8 h-8 rounded-lg bg-brand-purple/20 flex items-center justify-center text-brand-purple font-bold text-lg">3</span>
            <h3 class="text-xl font-semibold">Create Comparison Tables</h3>
          </div>
          <p class="text-gray-400">Structured tables increase chances of featured snippets. Include price, rating, key features, and best for columns.</p>
        </div>

        <div class="p-6 bg-white/5 border border-white/10 rounded-xl">
          <div class="flex items-center gap-3 mb-3">
            <span class="w-8 h-8 rounded-lg bg-brand-purple/20 flex items-center justify-center text-brand-purple font-bold text-lg">4</span>
            <h3 class="text-xl font-semibold">Add FAQ Schema Markup</h3>
          </div>
          <p class="text-gray-400">Implement FAQPage schema to capture voice search traffic and expand your SERP real estate.</p>
        </div>

        <div class="p-6 bg-white/5 border border-white/10 rounded-xl">
          <div class="flex items-center gap-3 mb-3">
            <span class="w-8 h-8 rounded-lg bg-brand-purple/20 flex items-center justify-center text-brand-purple font-bold text-lg">5</span>
            <h3 class="text-xl font-semibold">Use Descriptive Anchor Text</h3>
          </div>
          <p class="text-gray-400">Link to individual product reviews with descriptive text like "Read our full Semrush review" instead of "click here".</p>
        </div>
      </div>
    </section>
    `
  },
  {
    slug: 'listicle-page-examples',
    title: 'Listicle Page Examples: 10 High-Converting Designs',
    description: 'See real-world examples of high-converting listicle pages. Learn from the best "Top 10" and "Best Of" designs.',
    keywords: 'listicle examples, best of page examples, top 10 examples, roundup page designs',
    tldr: [
      'Best examples use clear, scannable comparison tables',
      'Authentic pros/cons build trust with readers',
      'Visual hierarchy guides users to key information',
      'Multiple CTAs capture users at different stages'
    ],
    content: `
    <section class="mb-12">
      <h2 class="text-2xl sm:text-3xl font-bold mb-8">10 High-Converting Listicle Page Examples</h2>
      
      <div class="space-y-8">
        <div class="p-6 bg-white/5 border border-white/10 rounded-xl">
          <div class="flex items-center gap-3 mb-4">
            <span class="w-10 h-10 rounded-lg bg-brand-purple/20 flex items-center justify-center text-brand-purple font-bold text-lg">1</span>
            <div>
              <h3 class="text-xl font-semibold">The Wirecutter Style</h3>
              <p class="text-sm text-gray-400">In-depth testing methodology</p>
            </div>
          </div>
          <p class="text-gray-400 mb-4">Wirecutter's listicles are legendary for their thoroughness. Each recommendation includes extensive testing notes, multiple alternatives for different budgets, and clear upgrade picks.</p>
          <div class="flex flex-wrap gap-2">
            <span class="px-3 py-1 bg-brand-purple/20 text-brand-purple text-xs rounded-full">Testing badges</span>
            <span class="px-3 py-1 bg-brand-purple/20 text-brand-purple text-xs rounded-full">Budget tiers</span>
            <span class="px-3 py-1 bg-brand-purple/20 text-brand-purple text-xs rounded-full">Upgrade picks</span>
          </div>
        </div>

        <div class="p-6 bg-white/5 border border-white/10 rounded-xl">
          <div class="flex items-center gap-3 mb-4">
            <span class="w-10 h-10 rounded-lg bg-brand-blue/20 flex items-center justify-center text-brand-blue font-bold text-lg">2</span>
            <div>
              <h3 class="text-xl font-semibold">G2 Grid Approach</h3>
              <p class="text-sm text-gray-400">Visual comparison matrix</p>
            </div>
          </div>
          <p class="text-gray-400 mb-4">G2 uses quadrant grids to show how products compare on key dimensions like "market presence" vs "customer satisfaction."</p>
        </div>
      </div>
    </section>
    `
  },
  {
    slug: 'how-to-write-listicle-copy',
    title: 'How to Write Listicle Copy That Converts',
    description: 'Learn how to write compelling listicle copy that engages readers and drives conversions. Master the art of "Best Of" content.',
    keywords: 'write listicle copy, listicle writing tips, best of copywriting, top 10 writing',
    tldr: [
      'Start with an honest assessment of all solutions',
      'Use specific features, not vague marketing claims',
      'Include real customer testimonials and case studies',
      'End with clear, benefit-focused CTAs'
    ],
    content: `
    <section class="mb-12">
      <h2 class="text-2xl sm:text-3xl font-bold mb-8">5 Steps to Writing Great Listicle Copy</h2>
      
      <div class="space-y-6">
        <div class="p-6 bg-white/5 border border-white/10 rounded-xl">
          <div class="flex items-center gap-3 mb-4">
            <span class="w-10 h-10 rounded-lg bg-brand-purple/20 flex items-center justify-center text-brand-purple font-bold text-lg">1</span>
            <h3 class="text-xl font-semibold">Start with a Hook</h3>
          </div>
          <p class="text-gray-400 mb-4">Your opening paragraph should immediately address the reader's pain point.</p>
          <div class="p-4 bg-white/5 rounded-lg border-l-4 border-brand-purple">
            <p class="text-sm text-gray-300 italic">❌ "In this article, we'll discuss various SEO tools..."</p>
            <p class="text-sm text-brand-purple mt-2">✅ "Choosing the wrong SEO tool can cost you thousands in lost traffic..."</p>
          </div>
        </div>

        <div class="p-6 bg-white/5 border border-white/10 rounded-xl">
          <div class="flex items-center gap-3 mb-4">
            <span class="w-10 h-10 rounded-lg bg-brand-blue/20 flex items-center justify-center text-brand-blue font-bold text-lg">2</span>
            <h3 class="text-xl font-semibold">Focus on Benefits, Not Features</h3>
          </div>
          <p class="text-gray-400 mb-4">Users don't care about technical specifications—they care about outcomes.</p>
        </div>
      </div>
    </section>
    `
  },
  {
    slug: 'listicle-page-vs-alternative-page',
    title: 'Listicle Page vs Alternative Page: When to Use Each',
    description: 'Understand the key differences between listicle pages and alternative pages. Learn when to use "Top 10" lists vs "vs" comparisons.',
    keywords: 'listicle vs alternative, best of vs comparison, top 10 vs vs page, when to use',
    tldr: [
      'Listicle pages capture broad "best of" search intent',
      'Alternative pages work best for paid advertising campaigns',
      'Listicle pages build long-term organic traffic',
      'Both page types can work together in your funnel'
    ],
    content: `
    <section class="mb-12">
      <h2 class="text-2xl sm:text-3xl font-bold mb-6">Key Differences at a Glance</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-white/10">
              <th class="py-4 px-4 text-gray-400 font-medium">Criteria</th>
              <th class="py-4 px-4 text-brand-purple font-medium">Listicle Page</th>
              <th class="py-4 px-4 text-brand-blue font-medium">Alternative Page</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <tr class="border-b border-white/5">
              <td class="py-4 px-4 text-gray-300">Format</td>
              <td class="py-4 px-4 text-gray-400">Ranked list of 5-15 products</td>
              <td class="py-4 px-4 text-gray-400">1v1 or small group comparison</td>
            </tr>
            <tr class="border-b border-white/5">
              <td class="py-4 px-4 text-gray-300">Search Intent</td>
              <td class="py-4 px-4 text-gray-400">"Best of" / exploring options</td>
              <td class="py-4 px-4 text-gray-400">"Alternative to X" / comparing</td>
            </tr>
            <tr class="border-b border-white/5">
              <td class="py-4 px-4 text-gray-300">Conversion Rate</td>
              <td class="py-4 px-4 text-gray-400">2-3x standard pages</td>
              <td class="py-4 px-4 text-gray-400">3-5x standard pages</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    `
  }
];

// HTML 模板
function generateHTML(page) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title} | seopages.pro</title>
  <meta name="description" content="${page.description}">
  <meta name="keywords" content="${page.keywords}">
  <link rel="canonical" href="https://seopages.pro/best-alternatives-guide/${page.slug}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${page.title} | seopages.pro">
  <meta property="og:description" content="${page.description}">
  <meta property="og:url" content="https://seopages.pro/best-alternatives-guide/${page.slug}">
  <meta property="og:site_name" content="seopages.pro">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${page.title} | seopages.pro">
  <meta name="twitter:description" content="${page.description}">
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital@0;1&display=swap" rel="stylesheet">
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              purple: '#9A8FEA',
              blue: '#65B4FF',
              orange: '#FFAF40',
            }
          },
          fontFamily: {
            sans: ['Inter', 'system-ui', 'sans-serif'],
            serif: ['Playfair Display', 'Georgia', 'serif'],
          }
        }
      }
    }
  </script>
  
  <style>
    .gradient-text {
      background: linear-gradient(80deg, #FFAF40, #D194EC, #9A8FEA, #65B4FF);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .gradient-bg {
      background: linear-gradient(80deg, #FFAF40 -21.49%, #D194EC 18.44%, #9A8FEA 61.08%, #65B4FF 107.78%);
    }
    .card-hover {
      transition: all 0.3s ease;
    }
    .card-hover:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px -15px rgba(154, 143, 234, 0.2);
    }
  </style>
  
  <!-- Schema.org Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${page.title}",
    "description": "${page.description}",
    "author": {
      "@type": "Organization",
      "name": "seopages.pro"
    },
    "publisher": {
      "@type": "Organization",
      "name": "seopages.pro",
      "logo": {
        "@type": "ImageObject",
        "url": "https://seopages.pro/new-logo.png"
      }
    },
    "datePublished": "2026-01-21",
    "dateModified": "2026-01-21",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://seopages.pro/best-alternatives-guide/${page.slug}"
    }
  }
  </script>
  
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://seopages.pro" },
      { "@type": "ListItem", "position": 2, "name": "Best Alternatives Guide", "item": "https://seopages.pro/best-alternatives-guide" },
      { "@type": "ListItem", "position": 3, "name": "${page.title.split(':')[0]}" }
    ]
  }
  </script>
  
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SpeakableSpecification",
    "cssSelector": [".ai-summary-content", ".key-takeaways", "h1", "#content h2"]
  }
  </script>
</head>
<body class="bg-[#0A0A0A] text-white min-h-screen">
  <!-- Navigation -->
  <nav class="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2">
        <img src="/new-logo.png" alt="seopages.pro" class="h-8 w-auto">
        <span class="text-white text-lg italic tracking-wide font-serif">seopages<span class="text-brand-purple">.</span>pro</span>
      </a>
      <div class="flex items-center gap-4">
        <a href="/best-alternatives-guide/" class="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">Guide</a>
        <a href="/best-alternatives" class="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">Examples</a>
        <a href="/projects" class="px-4 py-2 gradient-bg text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all">Get Started</a>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <header class="relative pt-24 pb-16 px-4 sm:px-6">
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-brand-purple/20 via-brand-blue/10 to-transparent rounded-full blur-3xl"></div>
    </div>
    
    <div class="relative max-w-4xl mx-auto text-center">
      <nav class="flex items-center justify-center gap-2 text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
        <a href="/" class="hover:text-white transition-colors">Home</a>
        <span>/</span>
        <a href="/best-alternatives-guide/" class="hover:text-white transition-colors">Best Alternatives Guide</a>
        <span>/</span><span class="text-gray-300">${page.title.split(':')[0]}</span>
      </nav>
      
      <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight">
        ${page.title}
      </h1>
      
      <p class="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
        ${page.description}
      </p>
      
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
        <a href="/projects" class="w-full sm:w-auto px-8 py-4 gradient-bg text-white font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
          Generate Listicle Pages
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
          </svg>
        </a>
        <a href="#content" class="w-full sm:w-auto px-8 py-4 border border-white/20 text-white font-medium rounded-xl hover:bg-white/5 transition-all text-center">
          Read Guide
        </a>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main id="content" class="max-w-4xl mx-auto px-4 sm:px-6 py-12">
    
    <!-- Last Updated -->
    <div class="flex items-center gap-2 text-sm text-gray-400 mb-6">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
      <span>Last Updated: <time datetime="2026-01-21">January 21, 2026</time></span>
    </div>
    
    <!-- AI Summary Section - GEO Optimization -->
    <section class="mb-12 p-6 bg-gradient-to-br from-brand-purple/10 to-brand-blue/5 border border-brand-purple/30 rounded-xl ai-summary-content">
      <div class="flex items-center gap-2 mb-4">
        <svg class="w-5 h-5 text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        <h2 class="text-lg font-semibold text-white">Quick Summary for AI & Readers</h2>
      </div>
      <div class="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
        <p class="text-gray-300 leading-relaxed"><strong class="text-brand-purple">Verdict:</strong> ${page.description}</p>
      </div>
      <div class="key-takeaways">
        <h3 class="font-medium text-white text-sm mb-2">Key Takeaways:</h3>
        <ul class="space-y-2">
          ${page.tldr.map((item, idx) => `
          <li class="flex items-start gap-2 text-sm text-gray-300">
            <svg class="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            <span>${item}</span>
          </li>
          `).join('')}
        </ul>
      </div>
    </section>
    
    <!-- Back to Pillar -->
    <div class="mb-8">
      <a href="/best-alternatives-guide" class="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Back to Best Alternatives Guide (Pillar)
      </a>
    </div>
    
    ${page.content}
    
    <!-- Topic Cluster Navigation -->
    <nav class="mb-12 p-6 bg-white/5 border border-white/10 rounded-xl" aria-label="Topic Cluster">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        📚 Best Alternatives Guide Series
      </h3>
      <ul class="space-y-2">
        <li>
          <a href="/best-alternatives-guide" class="text-sm flex items-center gap-2 py-1 text-gray-400 hover:text-white transition-colors">
            <span class="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
            Best Alternatives Guide (Pillar)
          </a>
        </li>
        <li>
          <a href="/best-alternatives-guide/what-are-listicle-pages" class="text-sm flex items-center gap-2 py-1 ${page.slug === 'what-are-listicle-pages' ? 'text-brand-purple font-medium' : 'text-gray-400 hover:text-white'} transition-colors">
            <span class="w-1.5 h-1.5 rounded-full bg-brand-purple"></span>
            What Are Listicle Pages? ${page.slug === 'what-are-listicle-pages' ? '← You are here' : ''}
          </a>
        </li>
        <li>
          <a href="/best-alternatives-guide/listicle-page-seo-best-practices" class="text-sm flex items-center gap-2 py-1 ${page.slug === 'listicle-page-seo-best-practices' ? 'text-brand-purple font-medium' : 'text-gray-400 hover:text-white'} transition-colors">
            <span class="w-1.5 h-1.5 rounded-full bg-brand-purple"></span>
            SEO Best Practices ${page.slug === 'listicle-page-seo-best-practices' ? '← You are here' : ''}
          </a>
        </li>
        <li>
          <a href="/best-alternatives-guide/listicle-page-examples" class="text-sm flex items-center gap-2 py-1 ${page.slug === 'listicle-page-examples' ? 'text-brand-purple font-medium' : 'text-gray-400 hover:text-white'} transition-colors">
            <span class="w-1.5 h-1.5 rounded-full bg-brand-purple"></span>
            Page Examples ${page.slug === 'listicle-page-examples' ? '← You are here' : ''}
          </a>
        </li>
        <li>
          <a href="/best-alternatives-guide/how-to-write-listicle-copy" class="text-sm flex items-center gap-2 py-1 ${page.slug === 'how-to-write-listicle-copy' ? 'text-brand-purple font-medium' : 'text-gray-400 hover:text-white'} transition-colors">
            <span class="w-1.5 h-1.5 rounded-full bg-brand-purple"></span>
            How to Write Copy ${page.slug === 'how-to-write-listicle-copy' ? '← You are here' : ''}
          </a>
        </li>
        <li>
          <a href="/best-alternatives-guide/listicle-page-vs-alternative-page" class="text-sm flex items-center gap-2 py-1 ${page.slug === 'listicle-page-vs-alternative-page' ? 'text-brand-purple font-medium' : 'text-gray-400 hover:text-white'} transition-colors">
            <span class="w-1.5 h-1.5 rounded-full bg-brand-purple"></span>
            vs Alternative Page ${page.slug === 'listicle-page-vs-alternative-page' ? '← You are here' : ''}
          </a>
        </li>
      </ul>
    </nav>
  </main>

  <!-- CTA Section -->
  <section class="py-16 px-4 sm:px-6 bg-gradient-to-b from-transparent to-brand-purple/5">
    <div class="max-w-4xl mx-auto text-center">
      <h2 class="text-2xl sm:text-3xl font-bold mb-4">Ready to Create High-Converting Listicle Pages?</h2>
      <p class="text-gray-400 mb-8">Generate professional "Top 10" and "Best Of" pages with our AI-powered tool.</p>
      <a href="/projects" class="inline-flex items-center gap-2 px-8 py-4 gradient-bg text-white font-semibold rounded-xl hover:opacity-90 transition-all">
        Generate Listicle Pages
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
        </svg>
      </a>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-12 px-4 sm:px-6 border-t border-white/10">
    <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <img src="/new-logo.png" alt="seopages.pro" class="h-6 w-auto">
        <span class="text-white italic font-serif">seopages<span class="text-brand-purple">.</span>pro</span>
      </div>
      <div class="flex items-center gap-6 text-sm text-gray-400">
        <a href="/" class="hover:text-white transition-colors">Home</a>
        <a href="/best-alternatives" class="hover:text-white transition-colors">Examples</a>
        <a href="/alternative-page-guide" class="hover:text-white transition-colors">Guide</a>
      </div>
      <p class="text-sm text-gray-500">© 2026 seopages.pro</p>
    </div>
  </footer>
</body>
</html>`;
}

// 生成所有页面
pages.forEach(page => {
  const html = generateHTML(page);
  fs.writeFileSync(path.join(guideDir, `${page.slug}.html`), html);
  console.log(`✅ Generated ${page.slug}.html`);
});

// 生成 index.html
const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Best Alternatives Guide: Master Listicle Pages | seopages.pro</title>
  <meta name="description" content="The complete guide to creating high-converting "Best Of" and "Top 10" listicle pages. Learn SEO, copywriting, and design best practices.">
  <link rel="canonical" href="https://seopages.pro/best-alternatives-guide/">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: { purple: '#9A8FEA', blue: '#65B4FF', orange: '#FFAF40' }
          },
          fontFamily: {
            sans: ['Inter', 'system-ui', 'sans-serif'],
            serif: ['Playfair Display', 'Georgia', 'serif'],
          }
        }
      }
    }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital@0;1&display=swap" rel="stylesheet">
  <style>
    .gradient-text { background: linear-gradient(80deg, #FFAF40, #D194EC, #9A8FEA, #65B4FF); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .gradient-bg { background: linear-gradient(80deg, #FFAF40 -21.49%, #D194EC 18.44%, #9A8FEA 61.08%, #65B4FF 107.78%); }
  </style>
</head>
<body class="bg-[#0A0A0A] text-white min-h-screen">
  <nav class="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2">
        <img src="/new-logo.png" alt="seopages.pro" class="h-8 w-auto">
        <span class="text-white text-lg italic tracking-wide font-serif">seopages<span class="text-brand-purple">.</span>pro</span>
      </a>
      <div class="flex items-center gap-4">
        <a href="/best-alternatives" class="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">Examples</a>
        <a href="/projects" class="px-4 py-2 gradient-bg text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all">Get Started</a>
      </div>
    </div>
  </nav>

  <header class="relative pt-24 pb-16 px-4 sm:px-6">
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-brand-purple/20 via-brand-blue/10 to-transparent rounded-full blur-3xl"></div>
    </div>
    <div class="relative max-w-4xl mx-auto text-center">
      <nav class="flex items-center justify-center gap-2 text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
        <a href="/" class="hover:text-white transition-colors">Home</a>
        <span>/</span>
        <span class="text-gray-300">Best Alternatives Guide</span>
      </nav>
      <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight">Best Alternatives Guide</h1>
      <p class="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8">Master the art of creating high-converting "Top 10" and "Best Of" listicle pages.</p>
      <a href="/projects" class="inline-flex items-center gap-2 px-8 py-4 gradient-bg text-white font-semibold rounded-xl hover:opacity-90 transition-all">Generate Listicle Pages</a>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4 sm:px-6 py-12">
    <section class="mb-16">
      <h2 class="text-2xl font-bold mb-8 text-center">Complete Guide Series</h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <a href="/best-alternatives-guide/what-are-listicle-pages" class="group p-6 bg-white/5 border border-white/10 rounded-xl hover:border-brand-purple/50 transition-all">
          <div class="w-12 h-12 rounded-xl bg-brand-purple/20 flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h3 class="text-lg font-semibold mb-2 group-hover:text-brand-purple transition-colors">What Are Listicle Pages?</h3>
          <p class="text-sm text-gray-400">Complete definition and fundamentals.</p>
        </a>

        <a href="/best-alternatives-guide/listicle-page-seo-best-practices" class="group p-6 bg-white/5 border border-white/10 rounded-xl hover:border-brand-purple/50 transition-all">
          <div class="w-12 h-12 rounded-xl bg-brand-blue/20 flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
          </div>
          <h3 class="text-lg font-semibold mb-2 group-hover:text-brand-blue transition-colors">SEO Best Practices</h3>
          <p class="text-sm text-gray-400">10 proven techniques to rank higher.</p>
        </a>

        <a href="/best-alternatives-guide/listicle-page-examples" class="group p-6 bg-white/5 border border-white/10 rounded-xl hover:border-brand-purple/50 transition-all">
          <div class="w-12 h-12 rounded-xl bg-brand-orange/20 flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <h3 class="text-lg font-semibold mb-2 group-hover:text-brand-orange transition-colors">Page Examples</h3>
          <p class="text-sm text-gray-400">Real-world high-converting designs.</p>
        </a>

        <a href="/best-alternatives-guide/how-to-write-listicle-copy" class="group p-6 bg-white/5 border border-white/10 rounded-xl hover:border-brand-purple/50 transition-all">
          <div class="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </div>
          <h3 class="text-lg font-semibold mb-2 group-hover:text-green-400 transition-colors">How to Write Copy</h3>
          <p class="text-sm text-gray-400">Craft compelling content.</p>
        </a>

        <a href="/best-alternatives-guide/listicle-page-vs-alternative-page" class="group p-6 bg-white/5 border border-white/10 rounded-xl hover:border-brand-purple/50 transition-all">
          <div class="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
          </div>
          <h3 class="text-lg font-semibold mb-2 group-hover:text-pink-400 transition-colors">vs Alternative Pages</h3>
          <p class="text-sm text-gray-400">When to use each format.</p>
        </a>

        <a href="/best-alternatives" class="group p-6 bg-gradient-to-br from-brand-purple/10 to-brand-blue/10 border border-brand-purple/30 rounded-xl hover:border-brand-purple/50 transition-all">
          <div class="w-12 h-12 rounded-xl bg-brand-purple/20 flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h3 class="text-lg font-semibold mb-2 text-brand-purple">See Live Examples</h3>
          <p class="text-sm text-gray-400">Browse generated listicle pages.</p>
        </a>
      </div>
    </section>

    <section class="text-center py-12 border-t border-white/10">
      <h2 class="text-2xl font-bold mb-4">Ready to Create Your Listicle Pages?</h2>
      <a href="/projects" class="inline-flex items-center gap-2 px-8 py-4 gradient-bg text-white font-semibold rounded-xl hover:opacity-90 transition-all">Start Generating</a>
    </section>
  </main>

  <footer class="py-12 px-4 sm:px-6 border-t border-white/10">
    <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <img src="/new-logo.png" alt="seopages.pro" class="h-6 w-auto">
        <span class="text-white italic font-serif">seopages<span class="text-brand-purple">.</span>pro</span>
      </div>
      <p class="text-sm text-gray-500">© 2026 seopages.pro</p>
    </div>
  </footer>
</body>
</html>`;

fs.writeFileSync(path.join(guideDir, 'index.html'), indexHTML);
console.log('✅ Generated index.html');

console.log('\n🎉 All listicle guide pages generated with dark theme!');
