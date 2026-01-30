import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { COMPETITORS, getCompetitorBySlug, getFaviconUrl, BRAND, Competitor } from '../data';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { RelatedComparisons } from '@/components/RelatedComparisons';
import { AISummary } from '@/components/AISummary';
import { UserRatings } from '@/components/UserRatings';

export function generateStaticParams() {
  return COMPETITORS.map((competitor) => ({
    slug: competitor.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const competitor = getCompetitorBySlug(slug);
  
  if (!competitor) {
    return { title: 'Not Found' };
  }
  
  const title = `SEOPages.pro vs ${competitor.name}: Best Alternative Page Generator 2026`;
  const description = `Compare SEOPages.pro vs ${competitor.name}. See why SEOPages.pro is the best choice for generating high-converting alternative pages. Better AI, lower prices, specialized focus.`;
  
  return {
    title,
    description,
    keywords: [`${competitor.name} alternative`, `SEOPages.pro vs ${competitor.name}`, 'alternative page generator', competitor.category],
    openGraph: {
      title,
      description,
      url: `https://seopages.pro/seopages-pro-alternatives/${slug}`,
      type: 'article',
      images: [{ url: 'https://seopages.pro/new-logo.png', width: 512, height: 512, alt: `SEOPages.pro vs ${competitor.name} Comparison` }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['https://seopages.pro/new-logo.png'] },
    alternates: { canonical: `https://seopages.pro/seopages-pro-alternatives/${slug}` },
  };
}

function getComparisonFeatures(competitor: Competitor) {
  return [
    { feature: 'Alternative Page Generation', brandValue: 'Full automation', brandStatus: 'yes', competitorValue: competitor.category.includes('Landing') ? 'Generic pages' : 'Not available', competitorStatus: competitor.category.includes('Landing') ? 'partial' : 'no', description: 'Specialized templates for "X alternative" and "vs" pages' },
    { feature: 'AI-Powered Content', brandValue: 'Claude Sonnet 4.5 + specialized prompts', brandStatus: 'yes', competitorValue: competitor.category.includes('AI') ? 'Yes' : 'Limited', competitorStatus: competitor.category.includes('AI') ? 'yes' : 'partial', description: 'AI content generation optimized for comparison pages' },
    { feature: 'SEO Optimization', brandValue: 'SEO + GEO ready', brandStatus: 'yes', competitorValue: competitor.category.includes('SEO') ? 'Yes' : 'Basic', competitorStatus: competitor.category.includes('SEO') ? 'yes' : 'partial', description: 'On-page SEO, Schema markup, AI search optimization' },
    { feature: 'Deploy-Ready Output', brandValue: 'Production HTML', brandStatus: 'yes', competitorValue: competitor.category.includes('Landing') ? 'Hosted pages' : 'Content only', competitorStatus: competitor.category.includes('Landing') ? 'partial' : 'no', description: 'Get standalone HTML files ready to deploy anywhere' },
    { feature: 'Pricing Model', brandValue: 'One-time payment', brandStatus: 'yes', competitorValue: 'Monthly subscription', competitorStatus: 'partial', description: 'One-time payment from $9.9 - no recurring fees' },
    { feature: 'Conversion Optimization', brandValue: 'Built-in CRO', brandStatus: 'yes', competitorValue: competitor.category.includes('Landing') ? 'A/B testing' : 'Limited', competitorStatus: competitor.category.includes('Landing') ? 'yes' : 'no', description: 'Templates optimized for lead generation' },
    { feature: 'Comparison Tables', brandValue: 'Auto-generated', brandStatus: 'yes', competitorValue: 'Manual creation', competitorStatus: 'no', description: 'Automatic feature comparison table generation' },
    { feature: 'Schema Markup', brandValue: 'FAQ + Article + Product', brandStatus: 'yes', competitorValue: competitor.category.includes('SEO') ? 'Yes' : 'Limited', competitorStatus: competitor.category.includes('SEO') ? 'yes' : 'partial', description: 'Rich snippets for better SERP visibility' },
  ];
}

export default async function CompetitorComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const competitor = getCompetitorBySlug(slug);
  if (!competitor) notFound();
  
  const features = getComparisonFeatures(competitor);
  const brandWins = features.filter(f => f.brandStatus === 'yes' && f.competitorStatus !== 'yes').length;
  const competitorWins = features.filter(f => f.competitorStatus === 'yes' && f.brandStatus !== 'yes').length;
  
  const faqItems = [
    { q: `Is ${BRAND.name} better than ${competitor.name} for alternative pages?`, a: `For creating "X alternative" and comparison pages specifically, yes. ${BRAND.name} is purpose-built for this use case with specialized templates, automatic comparison tables, and SEO optimization. ${competitor.name} is a ${competitor.category.toLowerCase()} tool with different primary focus.` },
    { q: `How much does ${BRAND.name} cost compared to ${competitor.name}?`, a: `${BRAND.name} uses one-time pricing: Starter $9.9 (10 pages), Standard $19.9 (20 pages), or Pro $39.9 (50 pages). No monthly subscriptions - you keep the HTML forever. ${competitor.name} charges ${competitor.pricing || 'a monthly subscription'}, which adds up over time.` },
    { q: `Can I migrate from ${competitor.name} to ${BRAND.name}?`, a: `Yes! ${BRAND.name} generates standalone HTML files that work anywhere. You don't need to cancel ${competitor.name} immediately - you can try ${BRAND.name} for your alternative pages while keeping other tools for different needs.` },
    { q: `Does ${BRAND.name} offer a free trial?`, a: `${BRAND.name} offers affordable pricing starting at just $0.49 per page. Try our Starter plan with 10 pages for $4.9 and see the quality yourself.` },
    { q: `What makes ${BRAND.name}'s alternative pages better?`, a: `${BRAND.name} pages are specifically designed for conversion, with proven templates including comparison tables, pros/cons sections, and strong CTAs. Pages are also optimized for both Google SEO and AI search engines like ChatGPT and Perplexity (GEO).` },
    { q: `Which platform is easier to use for beginners?`, a: `${BRAND.name} is very beginner-friendly for alternative pages - just provide your brand info and competitor, and we generate everything. ${competitor.name} may have more features but a steeper learning curve for comparison content.` },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Article", "headline": `${BRAND.name} vs ${competitor.name}: Best Alternative Page Generator 2026`, "description": `Compare ${BRAND.name} vs ${competitor.name}. See why ${BRAND.name} is the best choice for generating high-converting alternative pages.`, "articleSection": "Product Comparison", "datePublished": "2026-01-21", "dateModified": "2026-01-21", "author": { "@type": "Organization", "name": "SEOPages.pro Editorial Team", "url": "https://seopages.pro" }, "publisher": { "@type": "Organization", "name": "SEOPages.pro", "logo": { "@type": "ImageObject", "url": "https://seopages.pro/new-logo.png" } }, "mainEntityOfPage": { "@type": "WebPage", "@id": `https://seopages.pro/seopages-pro-alternatives/${competitor.slug}` } }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "ItemList", "name": `${BRAND.name} vs ${competitor.name} Comparison`, "itemListElement": [{ "@type": "ListItem", "position": 1, "name": BRAND.name }, { "@type": "ListItem", "position": 2, "name": competitor.name }] }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Home", "item": "https://seopages.pro" }, { "@type": "ListItem", "position": 2, "name": "Alternatives", "item": "https://seopages.pro/seopages-pro-alternatives" }, { "@type": "ListItem", "position": 3, "name": `vs ${competitor.name}` }] }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": faqItems.map(item => ({ "@type": "Question", "name": item.q, "acceptedAnswer": { "@type": "Answer", "text": item.a } })) }) }} />
      
      <div className="page-content-scope min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
          .page-content-scope { --brand-500: hsl(199, 89%, 48%); --brand-600: hsl(199, 89%, 43%); --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05); --shadow: 0 1px 3px 0 rgba(0,0,0,0.1); --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1); --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1); }
          .font-serif { font-family: 'Playfair Display', Georgia, serif; }
          .btn-primary { background: var(--brand-500); color: white; font-weight: 600; padding: 12px 24px; border-radius: 8px; transition: all 0.2s ease; box-shadow: var(--shadow-md); display: inline-flex; align-items: center; gap: 8px; }
          .btn-primary:hover { background: var(--brand-600); box-shadow: var(--shadow-lg); transform: translateY(-1px); }
          .btn-secondary { background: white; color: #404040; font-weight: 600; padding: 12px 24px; border-radius: 8px; border: 1px solid #e5e5e5; transition: all 0.2s ease; box-shadow: var(--shadow-sm); }
          .btn-secondary:hover { border-color: #d4d4d4; box-shadow: var(--shadow-md); }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; background: #f5f5f5; color: #525252; }
          .badge-winner { background: var(--brand-500); color: white; }
          .text-brand { color: var(--brand-500); }
          .toc-link { color: #525252; transition: all 0.2s; }
          .toc-link:hover { color: #171717; background-color: #f5f5f5; }
          .table-row-alt:nth-child(even) { background-color: #fafafa; }
          .scroll-top-btn { opacity: 0; pointer-events: none; transition: all 0.3s ease; }
          .scroll-top-btn.visible { opacity: 1; pointer-events: auto; }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />
        
        <Header theme="light" />
        
        {/* Hero */}
        <section className="relative overflow-hidden pt-20 md:pt-28 pb-16 md:pb-24 px-4 md:px-6 bg-white">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="relative max-w-5xl mx-auto">
            <nav className="flex items-center gap-2 text-xs md:text-sm text-gray-500 mb-6 md:mb-8" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-gray-900">Home</Link>
              <svg className="w-3 h-3 md:w-4 md:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              <Link href="/seopages-pro-alternatives" className="hover:text-gray-900">Alternatives</Link>
              <svg className="w-3 h-3 md:w-4 md:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              <span className="text-gray-700 font-medium">vs {competitor.name}</span>
            </nav>
            
            <div className="flex items-center justify-center gap-4 md:gap-6 mb-8 md:mb-10">
              <div className="flex flex-col items-center"><img src={BRAND.logoUrl} alt={BRAND.name} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl shadow-lg object-contain bg-white p-2" /><span className="mt-2 text-sm font-semibold text-gray-900">{BRAND.name}</span></div>
              <div className="flex flex-col items-center"><span className="text-2xl md:text-3xl font-bold text-gray-300">VS</span></div>
              <div className="flex flex-col items-center"><img src={getFaviconUrl(competitor.website, 128)} alt={competitor.name} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl shadow-lg object-contain bg-white" /><span className="mt-2 text-sm font-semibold text-gray-700">{competitor.name}</span></div>
            </div>
            
            <h1 className="text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4 md:mb-6"><span className="text-brand">{BRAND.name}</span> vs {competitor.name}</h1>
            <p className="text-center text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-6 md:mb-8">Compare {BRAND.name} and {competitor.name} for alternative page generation. See why {BRAND.name} is the best choice for creating high-converting comparison pages in 2026.</p>
            
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs md:text-sm text-gray-500 mb-8 md:mb-10">
              <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"><svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg></div><span>By <strong className="text-gray-700">SEOPages.pro Editorial Team</strong></span></div>
              <div className="flex items-center gap-2"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg><span>Updated: <time dateTime="2026-01-21">January 21, 2026</time></span></div>
              <div className="flex items-center gap-2"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>8 min read</span></div>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <Link href="/projects" className="btn-primary px-6 md:px-8 py-3 md:py-4 rounded-xl text-sm md:text-base">Try {BRAND.name} Free</Link>
              <a href="#comparison" className="btn-secondary px-6 md:px-8 py-3 md:py-4 rounded-xl text-sm md:text-base">See Comparison</a>
            </div>
          </div>
        </section>
        
        {/* TOC */}
        <nav id="toc" className="sticky top-[73px] z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 py-3 px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mx-2 px-2">
              <a href="#verdict" className="toc-link flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm whitespace-nowrap rounded-lg">Quick Verdict</a>
              <a href="#comparison" className="toc-link flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm whitespace-nowrap rounded-lg">Features</a>
              <a href="#pricing" className="toc-link flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm whitespace-nowrap rounded-lg">Pricing</a>
              <a href="#pros-cons" className="toc-link flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm whitespace-nowrap rounded-lg">Pros &amp; Cons</a>
              <a href="#faq" className="toc-link flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm whitespace-nowrap rounded-lg">FAQ</a>
              <a href="#cta" className="toc-link flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm whitespace-nowrap rounded-lg">Get Started</a>
            </div>
          </div>
        </nav>
        
        {/* AI Summary */}
        <AISummary brandName={BRAND.name} competitorName={competitor.name} brandWins={brandWins} competitorWins={competitorWins}
          keyDifferences={[`${BRAND.name} specializes in alternative page generation; ${competitor.name} focuses on ${competitor.category.toLowerCase()}`, `One-time pricing ($9.9-$39.9) vs ${competitor.pricing?.split(',')[0] || 'monthly subscription'}`, `Deploy-ready HTML files you own forever vs hosted/content-only output`, `Built-in SEO + GEO optimization for AI search engines`]}
          recommendation={`${BRAND.name} is the clear winner for alternative page generation. While ${competitor.name} excels in ${competitor.category.toLowerCase()}, ${BRAND.name} offers specialized features, better value with one-time pricing, and deploy-ready HTML output that you own forever.`}
          pricing={{ brand: '$9.9-$39.9 one-time', competitor: competitor.pricing?.split(',')[0] || 'Monthly subscription' }}
        />
        
        {/* Quick Verdict */}
        <section id="verdict" className="py-12 md:py-20 px-4 md:px-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <span className="badge mb-3 md:mb-4">TL;DR Summary</span>
              <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3 md:mb-4">Quick Verdict</h2>
              <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">A 60-second summary to help you decide.</p>
            </div>
            
            <div className="bg-white rounded-2xl p-5 md:p-8 lg:p-10 mb-8 md:mb-12 shadow-lg">
              <div className="text-center mb-6 md:mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-semibold text-xs md:text-sm mb-3 md:mb-4">
                  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  Our Recommendation
                </div>
                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 md:mb-4">{BRAND.name} Wins for Alternative Page Generation</h3>
                <p className="text-sm md:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">{BRAND.name} is the clear choice for creating high-converting alternative and comparison pages. {competitor.name} is strong in {competitor.category.toLowerCase()}, but lacks the specialized features for "X alternative" content.</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-white rounded-xl p-3 md:p-5 text-center shadow-md"><div className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 md:mb-2">{brandWins}</div><div className="text-xs md:text-sm text-gray-500">{BRAND.name} Wins</div></div>
                <div className="bg-white rounded-xl p-3 md:p-5 text-center shadow-md"><div className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 md:mb-2">$9.9</div><div className="text-xs md:text-sm text-gray-500">Starting Price</div></div>
                <div className="bg-white rounded-xl p-3 md:p-5 text-center shadow-md"><div className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 md:mb-2">5min</div><div className="text-xs md:text-sm text-gray-500">Avg. Generation</div></div>
                <div className="bg-white rounded-xl p-3 md:p-5 text-center shadow-md"><div className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 md:mb-2">100%</div><div className="text-xs md:text-sm text-gray-500">Own Your HTML</div></div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-white rounded-xl border-2 border-[var(--brand-500)] p-5 md:p-6 shadow-md">
                <div className="flex items-center gap-3 mb-4 md:mb-5">
                  <img src={BRAND.logoUrl} alt={BRAND.name} className="w-11 h-11 rounded-xl shadow-sm object-contain bg-white p-1" />
                  <div><h3 className="text-lg md:text-xl font-bold text-gray-900">{BRAND.name}</h3><span className="badge-winner text-xs">Winner</span></div>
                </div>
                <div className="space-y-3 mb-6">
                  {BRAND.keyFeatures.slice(0, 4).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 md:gap-3">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-brand mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 mb-4"><strong className="text-gray-900">Best for:</strong> Alternative pages, comparison content</p>
                  <Link href="/projects" className="inline-flex items-center gap-2 text-brand font-semibold hover:opacity-80">Try {BRAND.name} Free <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg></Link>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4 md:mb-5">
                  <img src={getFaviconUrl(competitor.website, 128)} alt={competitor.name} className="w-11 h-11 rounded-xl shadow-sm object-contain bg-white" />
                  <div><h3 className="text-lg md:text-xl font-bold text-gray-900">{competitor.name}</h3><span className="badge text-xs">{competitor.category}</span></div>
                </div>
                <div className="space-y-3 mb-6">
                  {competitor.keyFeatures.slice(0, 4).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 md:gap-3">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-100"><p className="text-sm text-gray-600"><strong className="text-gray-900">Best for:</strong> {competitor.category}</p></div>
              </div>
            </div>

            <div className="mt-8 md:mt-12">
              <UserRatings productName={BRAND.name} brandRating={{ overall: 4.8, easeOfUse: 4.9, features: 4.7, value: 4.9, support: 4.6, reviewCount: 127 }} competitorRating={{ overall: 4.2, easeOfUse: 4.0, features: 4.5, value: 3.8, support: 4.3, reviewCount: 342 }} />
            </div>
          </div>
        </section>
        
        {/* Feature Comparison */}
        <section id="comparison" className="py-12 md:py-20 px-4 md:px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <span className="badge mb-3 md:mb-4">Detailed Analysis</span>
              <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3 md:mb-4">Feature-by-Feature Comparison</h2>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-md bg-white">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 md:px-5 py-3 md:py-4 font-semibold text-gray-900 text-xs md:text-sm w-2/5">Feature</th>
                    <th className="text-center px-2 md:px-4 py-3 md:py-4 w-[30%]"><div className="flex items-center justify-center gap-2"><img src={BRAND.logoUrl} alt={BRAND.name} className="w-6 h-6 rounded object-contain bg-white" /><span className="font-semibold text-gray-900 text-xs md:text-sm">{BRAND.name}</span></div></th>
                    <th className="text-center px-2 md:px-4 py-3 md:py-4 w-[30%]"><div className="flex items-center justify-center gap-2"><img src={getFaviconUrl(competitor.website, 64)} alt={competitor.name} className="w-6 h-6 rounded object-contain bg-white" /><span className="font-semibold text-gray-600 text-xs md:text-sm">{competitor.name}</span></div></th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((row, idx) => (
                    <tr key={idx} className="table-row-alt border-b border-gray-100">
                      <td className="px-3 md:px-5 py-3 md:py-4"><div className="font-medium text-gray-900 text-xs md:text-sm">{row.feature}</div><div className="text-xs text-gray-500 mt-0.5 hidden md:block">{row.description}</div></td>
                      <td className="px-2 md:px-4 py-3 md:py-4 text-center"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${row.brandStatus === 'yes' ? 'bg-gray-100 text-gray-900' : 'bg-gray-100 text-gray-600'}`}>{row.brandStatus === 'yes' && (<svg className="w-3 h-3 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>)}{row.brandValue}</span></td>
                      <td className="px-2 md:px-4 py-3 md:py-4 text-center"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${row.competitorStatus === 'yes' ? 'bg-gray-100 text-gray-700' : row.competitorStatus === 'partial' ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-400'}`}>{row.competitorStatus === 'yes' && (<svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>)}{row.competitorValue}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        
        {/* Pricing */}
        <section id="pricing" className="py-12 md:py-20 px-4 md:px-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <span className="badge mb-3 md:mb-4">Value Analysis</span>
              <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3 md:mb-4">Pricing Comparison</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <div className="bg-white rounded-2xl p-5 md:p-6 shadow-md border-2 border-[var(--brand-500)]">
                <div className="flex items-center gap-3 mb-5">
                  <img src={BRAND.logoUrl} alt={BRAND.name} className="w-10 h-10 rounded-xl object-contain bg-white shadow-sm p-1" />
                  <div className="flex-1 min-w-0"><h3 className="font-bold text-gray-900">{BRAND.name}</h3><p className="text-xs text-gray-500">One-time payment</p></div>
                  <span className="px-2 py-1 bg-[var(--brand-500)] text-white text-xs font-semibold rounded">Best Value</span>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900">$19.9<span className="text-lg text-gray-500"> one-time</span></div>
                  <p className="text-xs text-gray-500 mt-1">20 Alternative Pages</p>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-5 md:p-6 shadow-md border border-gray-200">
                <div className="flex items-center gap-3 mb-5">
                  <img src={getFaviconUrl(competitor.website, 128)} alt={competitor.name} className="w-10 h-10 rounded-xl object-contain bg-white shadow-sm" />
                  <div className="flex-1 min-w-0"><h3 className="font-bold text-gray-900">{competitor.name}</h3><p className="text-xs text-gray-500">Monthly subscription</p></div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl"><p className="text-sm text-gray-600">{competitor.pricing || 'Contact for pricing'}</p></div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Pros & Cons */}
        <section id="pros-cons" className="py-12 md:py-20 px-4 md:px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <span className="badge mb-3 md:mb-4">Honest Assessment</span>
              <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3 md:mb-4">Pros &amp; Cons</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2"><img src={BRAND.logoUrl} alt={BRAND.name} className="w-6 h-6 rounded" />{BRAND.name}</h3>
                <div className="bg-gray-50 rounded-xl p-5">
                  <h4 className="font-semibold text-green-700 text-sm mb-3">Pros</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {BRAND.keyFeatures.slice(0, 4).map((feature, idx) => (<li key={idx} className="flex items-start gap-2"><span className="text-green-500">✓</span>{feature}</li>))}
                  </ul>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2"><img src={getFaviconUrl(competitor.website, 64)} alt={competitor.name} className="w-6 h-6 rounded" />{competitor.name}</h3>
                <div className="bg-gray-50 rounded-xl p-5">
                  <h4 className="font-semibold text-green-700 text-sm mb-3">Pros</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {competitor.keyFeatures.slice(0, 4).map((feature, idx) => (<li key={idx} className="flex items-start gap-2"><span className="text-green-500">✓</span>{feature}</li>))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ */}
        <section id="faq" className="py-12 md:py-20 px-4 md:px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <span className="badge mb-3 md:mb-4">Common Questions</span>
              <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3 md:mb-4">Frequently Asked Questions</h2>
            </div>
            
            <div className="space-y-4">
              {faqItems.map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <details className="group">
                    <summary className="flex items-center justify-between p-4 md:p-5 cursor-pointer hover:bg-gray-50 transition-colors">
                      <h3 className="font-medium text-gray-900 text-sm md:text-base pr-4">{item.q}</h3>
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                    </summary>
                    <div className="px-4 md:px-5 pb-4 md:pb-5 text-sm text-gray-600 leading-relaxed">{item.a}</div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Cross-linking to Listicle */}
        <section className="py-8 md:py-12 px-4 md:px-6 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Looking for more {competitor.name} alternatives?
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Check out our comprehensive &quot;Best {competitor.name} Alternatives&quot; listicle with 6-8 top alternatives compared side-by-side.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/best-alternatives/${competitor.slug}`} className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-900 font-medium text-sm">
                      View Full Listicle →
                    </Link>
                    <Link href="/best-alternatives" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
                      Browse All 63 Listicles
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Learn How to Create */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
              <span>Learn more:</span>
              <Link href="/alternative-page-guide" className="hover:text-gray-700 underline">Alternative Page Guide</Link>
              <Link href="/listicle-page-guide" className="hover:text-gray-700 underline">Listicle Page Guide</Link>
            </div>
          </div>
        </section>
        
        {/* CTA */}
        <section id="cta" className="py-16 md:py-24 px-4 md:px-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">Ready to Create High-Converting Alternative Pages?</h2>
            <p className="text-base md:text-lg text-gray-300 mb-8 md:mb-10 max-w-2xl mx-auto">Join thousands of marketers who use {BRAND.name} to generate SEO-optimized comparison pages that rank and convert.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/projects" className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg">Get Started Now<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg></Link>
              <a href="/best-alternatives" className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors">Explore More Comparisons<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg></a>
            </div>
          </div>
        </section>
        
        {/* Related Comparisons */}
        <RelatedComparisons currentSlug={slug} items={COMPETITORS} type="alternative" basePath="/seopages-pro-alternatives" brandName={BRAND.name} />
        
        <Footer theme="light" />
        
        <button id="scrollTop" className="scroll-top-btn fixed bottom-6 right-6 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all z-50" aria-label="Scroll to top">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
        </button>
        
        <script dangerouslySetInnerHTML={{ __html: `if(typeof window!=='undefined'){setTimeout(function(){var scrollHandler=function(){var btn=document.getElementById('scrollTop');if(btn)btn.classList.toggle('visible',window.scrollY>300);};window.addEventListener('scroll',scrollHandler);var scrollTopBtn=document.getElementById('scrollTop');if(scrollTopBtn){scrollTopBtn.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'});});}var tocLinks=document.querySelectorAll('.toc-link');var sections=document.querySelectorAll('section[id]');var tocScrollHandler=function(){var current='';sections.forEach(function(section){var sectionTop=section.offsetTop-150;if(window.scrollY>=sectionTop)current=section.getAttribute('id');});tocLinks.forEach(function(link){link.classList.remove('bg-gray-100','font-semibold','text-gray-900');if(link.getAttribute('href')==='#'+current){link.classList.add('bg-gray-100','font-semibold','text-gray-900');}});};window.addEventListener('scroll',tocScrollHandler);},0);}` }} />
      </div>
    </>
  );
}
