import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { LISTICLE_PAGES, BRAND_INFO } from './data';

export const metadata: Metadata = {
  title: 'Best Software Alternatives Guide 2026 | SEOPages.pro',
  description: 'Find the best alternatives to popular software tools. Expert-tested comparisons of AI writers, SEO tools, and more. Updated for 2026.',
  keywords: ['software alternatives', 'best alternatives', 'tool comparisons', 'AI writing tools', 'SEO tools'],
  openGraph: {
    title: 'Best Software Alternatives Guide 2026',
    description: 'Find the best alternatives to popular software tools. Expert-tested comparisons.',
    url: 'https://seopages.pro/best-alternatives',
    type: 'website',
    images: [
      {
        url: 'https://seopages.pro/new-logo.png',
        width: 512,
        height: 512,
        alt: 'Best Software Alternatives',
      },
    ],
  },
  alternates: {
    canonical: 'https://seopages.pro/best-alternatives',
  },
};

// Favicon helper
function getFaviconUrl(domain: string, size: number = 64): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

export default function BestAlternativesHubPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <SiteHeader />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6">
            <span className="text-sm text-gray-400">{LISTICLE_PAGES.length} Best-Of Guides</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-white">Find the</span>
            <br />
            <span className="bg-gradient-to-r from-[#FFAF40] via-[#D194EC] to-[#65B4FF] bg-clip-text text-transparent">
              Best Alternatives
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Expert-tested comparisons to help you find the perfect software alternatives. 
            We analyze features, pricing, and real-world performance.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Link
              href={BRAND_INFO.ctaUrl}
              className="px-6 py-3 bg-gradient-to-r from-[#FFAF40] via-[#9A8FEA] to-[#65B4FF] text-white font-semibold rounded-xl hover:opacity-90 transition-all"
            >
              Generate Your Own Alternative Pages
            </Link>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { stat: `${LISTICLE_PAGES.length}`, label: 'Tool Comparisons' },
              { stat: '40+', label: 'Products Reviewed' },
              { stat: '2026', label: 'Updated For' },
              { stat: '100%', label: 'Expert Tested' },
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="text-2xl font-bold bg-gradient-to-r from-[#9A8FEA] to-[#65B4FF] bg-clip-text text-transparent">
                  {item.stat}
                </div>
                <div className="text-sm text-gray-400">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Why Trust Our Reviews Section */}
      <section className="py-16 px-4 sm:px-6 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Why Trust Our Reviews
          </h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12">
            We take software comparisons seriously. Here&apos;s how we ensure quality.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-8 h-8 text-[#9A8FEA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'Hands-On Testing',
                description: 'We personally test every tool we review. No sponsored placements or paid reviews.',
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-[#9A8FEA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Real Pricing Data',
                description: 'Prices verified directly from official websites. Updated monthly for accuracy.',
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-[#9A8FEA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: 'Honest Assessment',
                description: 'We include pros AND cons. Every tool has tradeoffs - we help you understand them.',
              },
            ].map((item, idx) => (
              <div key={idx} className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-[#9A8FEA]/50 transition-all">
                <div className="mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* All Listicle Pages */}
      <section id="guides" className="py-16 px-4 sm:px-6 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Best Alternatives Guides
          </h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12">
            Click any guide to see the full breakdown with features, pricing, pros & cons.
          </p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {LISTICLE_PAGES.map((page) => (
              <Link
                key={page.slug}
                href={`/best-alternatives/${page.slug}`}
                className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-[#9A8FEA]/50 hover:bg-white/[0.08] transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                    <img
                      src={getFaviconUrl(page.targetWebsite, 48)}
                      alt={page.targetProduct}
                      className="w-8 h-8"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-[#9A8FEA] transition-colors">
                      Best {page.targetProduct} Alternatives
                    </h3>
                    <span className="text-xs text-gray-500">{page.products.length} alternatives reviewed</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                  {page.heroDescription}
                </p>
                
                {/* Top 3 products preview */}
                <div className="flex items-center gap-1 mb-4">
                  {page.products.slice(0, 4).map((product, idx) => (
                    <div 
                      key={idx}
                      className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center overflow-hidden -ml-1 first:ml-0 border border-[#0A0A0A]"
                      title={product.name}
                    >
                      <img
                        src={product.logoUrl || getFaviconUrl(product.website, 32)}
                        alt={product.name}
                        className="w-4 h-4"
                      />
                    </div>
                  ))}
                  {page.products.length > 4 && (
                    <span className="text-xs text-gray-500 ml-2">+{page.products.length - 4} more</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9A8FEA]">Updated Jan 2026</span>
                  <svg className="w-4 h-4 text-gray-600 group-hover:text-[#9A8FEA] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Create Your Own Alternative Pages
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Want to generate comparison pages like these for your product? SEOPages.pro makes it easy.
          </p>
          <Link
            href={BRAND_INFO.ctaUrl}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#FFAF40] via-[#9A8FEA] to-[#65B4FF] text-white font-semibold rounded-xl hover:opacity-90 transition-all text-lg"
          >
            {BRAND_INFO.ctaText}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
      
      <SiteFooter />
    </div>
  );
}
