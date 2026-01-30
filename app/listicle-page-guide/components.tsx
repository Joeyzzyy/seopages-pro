'use client';

import Link from 'next/link';

// ============================================
// SEO/GEO Enhanced Components for Listicle Guide
// Based on docs/SEO_EEAT_RULES_PRO.md & docs/GEO_CORE_RULES_PRO.md
// Consistent with alternative-page-guide components
// ============================================

// Last Updated Badge - R03: Freshness
export function LastUpdated({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
      <span>Last Updated: <time dateTime={date}>{date}</time></span>
    </div>
  );
}

// Table of Contents - O04: Heading Hierarchy & Navigation
export function TableOfContents({ items }: { items: { id: string; title: string; level?: number }[] }) {
  return (
    <nav className="mb-12 p-6 bg-white/5 border border-white/10 rounded-xl" aria-label="Table of Contents">
      <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
        <svg className="w-5 h-5 text-[#65B4FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
        </svg>
        Table of Contents
      </h2>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className={item.level === 2 ? 'pl-4' : ''}>
            <a 
              href={`#${item.id}`} 
              className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#65B4FF]"></span>
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Key Takeaways / TL;DR Box - O01: Summary Box
export function KeyTakeaways({ items, title = "Key Takeaways" }: { items: string[]; title?: string }) {
  return (
    <div className="mb-12 p-6 bg-gradient-to-br from-[#65B4FF]/10 to-[#9A8FEA]/5 border border-[#65B4FF]/30 rounded-xl">
      <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
        <svg className="w-5 h-5 text-[#65B4FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {title}
      </h2>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3 text-gray-300">
            <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Inline Internal Link Component - A04: Site Structure
export function InternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="text-[#65B4FF] hover:text-[#9A8FEA] underline decoration-[#65B4FF]/30 hover:decoration-[#9A8FEA]/50 transition-colors"
    >
      {children}
    </Link>
  );
}

// External Citation Link - R01: External Citations & A01: Citation Quality
export function ExternalCitation({ 
  href, 
  source, 
  children 
}: { 
  href: string; 
  source: string; 
  children: React.ReactNode 
}) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-[#65B4FF] hover:text-[#9A8FEA] transition-colors inline-flex items-center gap-1"
      title={`Source: ${source}`}
    >
      {children}
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
      </svg>
    </a>
  );
}

// Back to Pillar Link - Internal Linking Best Practice
export function BackToPillar() {
  return (
    <div className="mb-8">
      <Link 
        href="/listicle-page-guide" 
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
        </svg>
        Back to Listicle Page Guide (Pillar)
      </Link>
    </div>
  );
}

// Related Internal Link Card - For contextual linking in body
export function RelatedLinkCard({ 
  href, 
  title, 
  description 
}: { 
  href: string; 
  title: string; 
  description: string 
}) {
  return (
    <Link 
      href={href}
      className="block p-4 my-6 bg-white/5 border border-white/10 rounded-lg hover:border-[#65B4FF]/50 transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#65B4FF]/20 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-[#65B4FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </div>
        <div>
          <h4 className="text-white font-medium group-hover:text-[#65B4FF] transition-colors">{title}</h4>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
    </Link>
  );
}

// Cluster Navigation - Shows all pages in the topic cluster
export function ClusterNav({ 
  currentSlug, 
  pages 
}: { 
  currentSlug: string; 
  pages: { slug: string; title: string }[] 
}) {
  return (
    <nav className="mb-12 p-6 bg-white/5 border border-white/10 rounded-xl" aria-label="Topic Cluster">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Listicle Page Guide Series
      </h3>
      <ul className="space-y-2">
        <li>
          <Link 
            href="/listicle-page-guide"
            className={`text-sm flex items-center gap-2 py-1 ${
              currentSlug === 'index' 
                ? 'text-[#65B4FF] font-medium' 
                : 'text-gray-400 hover:text-white transition-colors'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFAF40]"></span>
            What is a Listicle Page Generator? (Pillar)
          </Link>
        </li>
        {pages.map((page, idx) => (
          <li key={idx}>
            <Link 
              href={`/listicle-page-guide/${page.slug}`}
              className={`text-sm flex items-center gap-2 py-1 ${
                currentSlug === page.slug 
                  ? 'text-[#65B4FF] font-medium' 
                  : 'text-gray-400 hover:text-white transition-colors'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#65B4FF]"></span>
              {page.title}
            </Link>
          </li>
        ))}
      </ul>
      
      {/* Cross-links to related resources */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Related Resources
        </h4>
        <ul className="space-y-2">
          <li>
            <Link 
              href="/alternative-page-guide"
              className="text-sm flex items-center gap-2 py-1 text-gray-400 hover:text-[#9A8FEA] transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#9A8FEA]"></span>
              Alternative Page Guide →
            </Link>
          </li>
          <li>
            <Link 
              href="/best-alternatives"
              className="text-sm flex items-center gap-2 py-1 text-gray-400 hover:text-[#FFAF40] transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFAF40]"></span>
              63+ Real Listicle Examples →
            </Link>
          </li>
          <li>
            <Link 
              href="/seopages-pro-alternatives"
              className="text-sm flex items-center gap-2 py-1 text-gray-400 hover:text-[#65B4FF] transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#65B4FF]"></span>
              50+ 1v1 Comparison Examples →
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

// Data/Stats Highlight Box - R04: Data Precision
export function StatHighlight({ 
  stat, 
  description, 
  source 
}: { 
  stat: string; 
  description: string; 
  source?: string 
}) {
  return (
    <div className="my-6 p-6 bg-gradient-to-r from-[#FFAF40]/10 to-[#65B4FF]/10 border-l-4 border-[#FFAF40] rounded-r-xl">
      <div className="text-3xl font-bold text-white mb-2">{stat}</div>
      <p className="text-gray-300">{description}</p>
      {source && (
        <p className="text-xs text-gray-500 mt-2">Source: {source}</p>
      )}
    </div>
  );
}

// Hero Section Component
export function GuideHero({ 
  title, 
  subtitle, 
  breadcrumb,
  isPillar = false,
  imageUrl,
}: { 
  title: string; 
  subtitle: string; 
  breadcrumb: string;
  isPillar?: boolean;
  imageUrl: string;
}) {
  return (
    <header className="relative pt-24 pb-16 px-4 sm:px-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#65B4FF]/20 via-[#9A8FEA]/10 to-transparent rounded-full blur-3xl" />
      </div>
      
      <div className="relative max-w-4xl mx-auto text-center">
        {/* Breadcrumb */}
        <nav className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href="/listicle-page-guide" className="hover:text-white transition-colors">Listicle Page Guide</Link>
          {!isPillar && (
            <>
              <span>/</span>
              <span className="text-gray-300">{breadcrumb}</span>
            </>
          )}
        </nav>
        
        {isPillar && (
          <span className="inline-block px-3 py-1 bg-[#65B4FF]/20 text-[#65B4FF] text-xs font-semibold rounded-full mb-4">
            COMPREHENSIVE GUIDE
          </span>
        )}
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight text-white">
          {title}
        </h1>
        
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          {subtitle}
        </p>
        
        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link 
            href="/projects" 
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#FFAF40] via-[#9A8FEA] to-[#65B4FF] text-white font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            Try Page Generator
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </Link>
          <a 
            href="#content" 
            className="w-full sm:w-auto px-8 py-4 border border-white/20 text-white font-medium rounded-xl hover:bg-white/5 transition-all text-center"
          >
            Read Guide
          </a>
        </div>
        
        {/* Hero Image */}
        <div className="relative max-w-3xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <img src={imageUrl} alt={title} className="w-full h-auto" />
        </div>
      </div>
    </header>
  );
}

// Section Components
export function IntroSection({ content }: { content: string }) {
  return (
    <section className="prose prose-invert prose-lg max-w-none mb-12">
      <p className="text-lg text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: content }} />
    </section>
  );
}

export function H2Section({ title, content }: { title: string; content: string }) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">{title}</h2>
      <div className="text-gray-300 leading-relaxed space-y-4" dangerouslySetInnerHTML={{ __html: content }} />
    </section>
  );
}

export function FeaturesSection({ title, items }: { 
  title: string; 
  items: { icon: React.ReactNode; title: string; description: string }[] 
}) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-white">{title}</h2>
      <div className="grid sm:grid-cols-2 gap-6">
        {items.map((item, idx) => (
          <div key={idx} className="p-6 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-[#65B4FF]/20 flex items-center justify-center mb-4">
              {item.icon}
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">{item.title}</h3>
            <p className="text-gray-400 text-sm">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProcessSection({ title, items }: { 
  title: string; 
  items: { title: string; description: string }[] 
}) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-white">{title}</h2>
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#FFAF40] via-[#9A8FEA] to-[#65B4FF]" />
        <div className="space-y-8">
          {items.map((item, idx) => (
            <div key={idx} className="relative flex gap-6 pl-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FFAF40] via-[#9A8FEA] to-[#65B4FF] flex items-center justify-center text-white font-bold text-sm shrink-0 z-10">
                {idx + 1}
              </div>
              <div className="pb-8">
                <h3 className="text-lg font-semibold mb-2 text-white">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FAQSection({ title = 'Frequently Asked Questions', items }: { 
  title?: string; 
  items: { question: string; answer: string }[] 
}) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-white">{title}</h2>
      <div className="space-y-4">
        {items.map((item, idx) => (
          <details key={idx} className="group p-6 bg-white/5 border border-white/10 rounded-xl">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <h3 className="text-lg font-semibold pr-4 text-white">{item.question}</h3>
              <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
              </svg>
            </summary>
            <p className="mt-4 text-gray-400 leading-relaxed">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function ComparisonTable({ title, items }: {
  title: string;
  items: { feature: string; listicle: boolean; alternative: boolean }[];
}) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-white">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-4 px-4 text-left text-sm font-semibold text-gray-300">Feature</th>
              <th className="py-4 px-4 text-center text-sm font-semibold text-[#65B4FF]">Listicle Page</th>
              <th className="py-4 px-4 text-center text-sm font-semibold text-[#9A8FEA]">Alternative Page</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-white/5">
                <td className="py-4 px-4 text-sm text-gray-300">{item.feature}</td>
                <td className="py-4 px-4 text-center">
                  {item.listicle ? (
                    <svg className="w-5 h-5 text-green-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  )}
                </td>
                <td className="py-4 px-4 text-center">
                  {item.alternative ? (
                    <svg className="w-5 h-5 text-green-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// Related Pages Component
export function RelatedPages({ pages }: { 
  pages: { title: string; slug: string; description: string }[] 
}) {
  return (
    <section className="mt-16 pt-12 border-t border-white/10">
      <h2 className="text-2xl font-bold mb-8 text-white">Related Articles</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map((page, idx) => (
          <Link 
            key={idx}
            href={`/listicle-page-guide/${page.slug}`} 
            className="block p-6 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all hover:-translate-y-1"
          >
            <h3 className="text-lg font-semibold mb-2 text-white">{page.title}</h3>
            <p className="text-sm text-gray-400">{page.description}</p>
            <span className="inline-flex items-center gap-1 mt-4 text-[#65B4FF] text-sm font-medium">
              Read more
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// Final CTA Component
export function FinalCTA() {
  return (
    <section className="mt-16 p-8 sm:p-12 bg-gradient-to-br from-[#65B4FF]/20 to-[#9A8FEA]/10 rounded-2xl border border-white/10 text-center">
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">Ready to Create Your Listicle Pages?</h2>
      <p className="text-gray-400 mb-8 max-w-xl mx-auto">
        Stop spending hours crafting &quot;Top 10&quot; and &quot;Best Of&quot; pages. Let AI do the heavy lifting while you focus on strategy.
      </p>
      <Link 
        href="/projects" 
        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#FFAF40] via-[#9A8FEA] to-[#65B4FF] text-white font-semibold rounded-xl hover:opacity-90 transition-all"
      >
        Get Started - $4.9 for 10 Pages
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
        </svg>
      </Link>
    </section>
  );
}

// Icons
export const Icons = {
  lightning: (
    <svg className="w-6 h-6 text-[#65B4FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
    </svg>
  ),
  shield: (
    <svg className="w-6 h-6 text-[#9A8FEA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
    </svg>
  ),
  code: (
    <svg className="w-6 h-6 text-[#FFAF40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
    </svg>
  ),
  dollar: (
    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  list: (
    <svg className="w-6 h-6 text-[#65B4FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
    </svg>
  ),
  trending: (
    <svg className="w-6 h-6 text-[#9A8FEA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
    </svg>
  ),
  users: (
    <svg className="w-6 h-6 text-[#FFAF40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
    </svg>
  ),
  star: (
    <svg className="w-6 h-6 text-[#FFAF40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
    </svg>
  ),
};
