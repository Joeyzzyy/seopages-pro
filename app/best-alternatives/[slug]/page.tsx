import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LISTICLE_PAGES, getListiclePageBySlug, BRAND_INFO, ListicleProduct } from '../data';
import FAQSection from '../FAQSection';
import ScrollToTop from '../ScrollToTop';

// Generate static paths for all listicle pages
export function generateStaticParams() {
  return LISTICLE_PAGES.map((page) => ({
    slug: page.slug,
  }));
}

// Generate metadata for each page
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getListiclePageBySlug(slug);
  
  if (!page) {
    return { title: 'Not Found' };
  }
  
  return {
    title: page.title,
    description: page.metaDescription,
    keywords: [`${page.targetProduct} alternatives`, `best ${page.targetProduct} alternatives`, 'software comparison', page.targetProduct],
    openGraph: {
      title: page.title,
      description: page.metaDescription,
      url: `https://seopages.pro/best-alternatives/${slug}`,
      type: 'article',
    },
    alternates: {
      canonical: `https://seopages.pro/best-alternatives/${slug}`,
    },
  };
}

// Favicon helper
function getFaviconUrl(domain: string, size: number = 128): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

// Screenshot helper
function getScreenshotUrl(website: string): string {
  const url = encodeURIComponent(`https://${website}`);
  return `https://api.screenshotmachine.com?key=7cec4c&url=${url}&dimension=1366x768&device=desktop&format=png&cacheLimit=86400&delay=2000&zoom=100`;
}

// Star rating component
function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        if (star <= fullStars) {
          return (
            <svg key={star} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          );
        } else if (star === fullStars + 1 && hasHalf) {
          return (
            <svg key={star} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <defs>
                <linearGradient id={`half-${star}`}>
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="#D1D5DB" />
                </linearGradient>
              </defs>
              <path fill={`url(#half-${star})`} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          );
        } else {
          return (
            <svg key={star} className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          );
        }
      })}
    </div>
  );
}

// Product card component - matching demo exactly
function ProductCard({ product, isWinner }: { product: ListicleProduct; isWinner: boolean }) {
  const logoSrc = product.logoUrl || getFaviconUrl(product.website, 128);
  
  return (
    <article 
      id={`product-${product.rank}`}
      className={`rounded-3xl transition-all duration-300 p-6 md:p-8 relative overflow-hidden scroll-mt-32 ${
        isWinner 
          ? 'bg-gradient-to-br from-white to-gray-50/50 ring-2 ring-[#9A8FEA] ring-offset-4 shadow-2xl' 
          : 'bg-white border border-gray-100 shadow-lg hover:shadow-xl'
      }`}
    >
      {/* Winner accent decoration */}
      {isWinner && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100/50 to-transparent rounded-bl-full pointer-events-none" />
      )}
      
      {/* Header */}
      <div className="flex items-start gap-4 mb-6 relative">
        {/* Rank Badge */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-md ${
          isWinner ? 'bg-[#9A8FEA] text-white shadow-[#9A8FEA]/20' : 'bg-gray-200 text-gray-700'
        }`}>
          {product.rank}
        </div>
        
        {/* Logo & Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <img 
              src={logoSrc} 
              alt={product.name} 
              className="w-14 h-14 rounded-xl shadow-md object-contain bg-white"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">{product.name}</h3>
                {isWinner && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-300">
                    Top Pick
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{product.tagline}</p>
            </div>
          </div>
          
          {/* Rating */}
          <div className="flex items-center gap-2 mt-2">
            <StarRating rating={product.rating} />
            <span className="text-sm font-semibold text-gray-700">{product.rating}</span>
            <span className="text-xs text-gray-400">/ 5.0</span>
          </div>
        </div>
      </div>
      
      {/* Description */}
      <p className="text-gray-600 mb-6 leading-relaxed text-base">
        {product.description}
      </p>
      
      {/* Homepage Screenshot */}
      <div className="mb-8 rounded-xl overflow-hidden border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
        <div className="bg-gray-100 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-xs text-gray-500 truncate ml-2">https://{product.website}</span>
        </div>
        <img 
          src={getScreenshotUrl(product.website)}
          alt={`${product.name} homepage screenshot`}
          className="w-full h-auto"
          loading="lazy"
        />
      </div>
      
      {/* Key Features */}
      <div className="mb-8">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Key Features
        </h4>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {product.keyFeatures.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
              <svg className={`w-5 h-5 mt-0.5 shrink-0 ${isWinner ? 'text-[#9A8FEA]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Pricing */}
      <div className="mb-8 p-5 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-100">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pricing
        </h4>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-gray-900">{product.pricing}</span>
          {product.hasFreeplan && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Free tier</span>
          )}
          {product.pricingNote && (
            <span className="text-gray-500">{product.pricingNote}</span>
          )}
        </div>
      </div>
      
      {/* Pros & Cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-green-50/50 rounded-2xl border border-green-100">
          <h4 className="text-xs font-bold text-green-700 uppercase tracking-widest mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            Pros
          </h4>
          <ul className="space-y-2">
            {product.pros.map((pro, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 bg-red-50/30 rounded-2xl border border-red-100/50">
          <h4 className="text-xs font-bold text-red-600 uppercase tracking-widest mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
            </svg>
            Cons
          </h4>
          <ul className="space-y-2">
            {product.cons.map((con, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Best For */}
      <div className="p-5 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 rounded-2xl border border-blue-100/50 mb-6">
        <h4 className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Best For
        </h4>
        <p className="text-sm text-gray-700 font-medium">{product.bestFor}</p>
      </div>
      
      {/* CTA */}
      {isWinner ? (
        <Link
          href={BRAND_INFO.ctaUrl}
          className="block w-full py-3 rounded-xl text-sm font-semibold text-center mt-4 bg-gradient-to-r from-[#9A8FEA] to-[#65B4FF] text-white hover:opacity-90 transition-all shadow-lg"
        >
          Try {product.name} Free
        </Link>
      ) : (
        <div className="w-full py-3 text-center text-sm text-gray-500 mt-4">
          <a 
            href={`https://${product.website}`} 
            target="_blank" 
            rel="nofollow noopener" 
            className="hover:text-gray-700 transition-colors"
          >
            Visit Website →
          </a>
        </div>
      )}
    </article>
  );
}

export default async function ListicleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getListiclePageBySlug(slug);
  
  if (!page) {
    notFound();
  }

  const currentYear = new Date().getFullYear();
  const currentDate = new Date().toISOString().split('T')[0];

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": page.title,
            "description": page.metaDescription,
            "articleSection": "Software Reviews",
            "datePublished": currentDate,
            "dateModified": currentDate,
            "author": {
              "@type": "Organization",
              "name": "SEOPages.pro Editorial Team",
              "url": "https://seopages.pro"
            },
            "publisher": {
              "@type": "Organization",
              "name": "SEOPages.pro",
              "logo": {
                "@type": "ImageObject",
                "url": "https://seopages.pro/new-logo.png"
              }
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": page.title,
            "numberOfItems": page.products.length,
            "itemListElement": page.products.map((product, idx) => ({
              "@type": "ListItem",
              "position": idx + 1,
              "item": {
                "@type": "SoftwareApplication",
                "name": product.name,
                "applicationCategory": "BusinessApplication",
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": product.rating,
                  "bestRating": 5,
                  "worstRating": 1,
                },
              },
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": page.faqs.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": { "@type": "Answer", "text": faq.answer },
            })),
          }),
        }}
      />
      
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-6 py-4 max-w-7xl">
            <div className="flex items-center justify-between gap-8">
              <Link href="/" className="flex items-center">
                <img src={BRAND_INFO.logoUrl} alt="SEOPages.pro" className="h-8 w-auto" />
              </Link>
              <nav className="hidden md:flex items-center space-x-6 flex-1 justify-center">
                <Link href="/" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">Home</Link>
                <Link href="/best-alternatives" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">Best Alternatives</Link>
                <Link href="/seopages-pro-alternatives" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">Comparisons</Link>
              </nav>
              <Link href={BRAND_INFO.ctaUrl} className="hidden md:block px-6 py-2.5 text-sm font-medium rounded-lg bg-gray-900 text-white hover:opacity-90 transition-all">
                Get Started
              </Link>
            </div>
          </div>
        </header>

        <main>
          {/* Hero Section */}
          <section className="relative overflow-hidden pt-24 md:pt-32 pb-20 md:pb-28 px-4 md:px-6 bg-gradient-to-b from-gray-50 via-white to-white">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-[#9A8FEA]/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-tl from-gray-200/30 to-transparent rounded-full blur-3xl" />
            
            <div className="relative max-w-5xl mx-auto">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-xs md:text-sm text-gray-500 mb-8 md:mb-10" aria-label="Breadcrumb">
                <Link href="/" className="hover:text-gray-900 transition-colors font-medium">Home</Link>
                <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <Link href="/best-alternatives" className="hover:text-gray-900 transition-colors font-medium">Best Alternatives</Link>
                <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-900 font-semibold">{page.targetProduct}</span>
              </nav>
              
              {/* Title */}
              <h1 className="text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6 md:mb-8" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {page.title}
              </h1>
              
              {/* Description */}
              <p className="text-center text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-10 md:mb-12 leading-relaxed">
                {page.heroDescription}
              </p>
              
              {/* CTA Button */}
              <div className="flex items-center justify-center mb-10 md:mb-12">
                <Link 
                  href={BRAND_INFO.ctaUrl}
                  className="px-10 py-4 rounded-2xl text-base font-semibold shadow-lg bg-gradient-to-r from-[#9A8FEA] to-[#65B4FF] text-white hover:opacity-90 transition-all"
                >
                  Try {BRAND_INFO.name} Free
                </Link>
              </div>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-10 md:mb-12">
                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Hands-on testing</span>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Pricing compared</span>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <span className="font-medium">Fair & unbiased</span>
                </div>
              </div>
              
              {/* Author & Update Info */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100 max-w-xl mx-auto">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold text-gray-900 block">Editorial Team</span>
                    <span className="text-xs text-gray-500">Product Research Team</span>
                  </div>
                </div>
                <div className="hidden sm:block w-px h-8 bg-gray-200" />
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-600">Updated <time dateTime={currentDate} className="font-semibold text-gray-900">Jan {new Date().getDate()}, {currentYear}</time></span>
                </div>
              </div>
            </div>
          </section>

          {/* Comparison Table Section */}
          <section id="comparison-table" className="py-16 md:py-20 px-4 md:px-6 bg-gray-50">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">Quick Comparison</h2>
              <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
                Compare all {page.products.length} alternatives at a glance. Scroll horizontally to see all features.
              </p>
              
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide sticky left-0 bg-gray-50">Product</th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide whitespace-nowrap">Starting Price</th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Rating</th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Free Tier</th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Best For</th>
                      </tr>
                    </thead>
                    <tbody>
                      {page.products.map((product, idx) => (
                        <tr 
                          key={product.slug}
                          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx === 0 ? 'bg-[#9A8FEA]/5' : ''}`}
                        >
                          <td className={`px-4 py-4 sticky left-0 ${idx === 0 ? 'bg-[#9A8FEA]/5' : 'bg-white'}`}>
                            <div className="flex items-center gap-3">
                              <img 
                                src={product.logoUrl || getFaviconUrl(product.website, 64)}
                                alt={product.name}
                                className="w-8 h-8 rounded-lg object-contain bg-white shadow-sm"
                              />
                              <span className="font-medium text-gray-900 whitespace-nowrap">{product.name}</span>
                              {idx === 0 && (
                                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-300">#1</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {product.pricing}
                            {product.hasFreeplan && (
                              <span className="ml-2 text-xs text-green-600">Free tier</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-sm font-medium text-gray-700">{product.rating}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {product.hasFreeplan ? (
                              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 max-w-[200px] truncate">{product.bestFor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Not available</span>
                </div>
              </div>
            </div>
          </section>

          {/* Product Cards Section */}
          <section id="products-list" className="py-16 md:py-20 px-4 md:px-6 bg-gray-50">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">Detailed Reviews</h2>
              <div className="space-y-6 md:space-y-8">
                {page.products.map((product, idx) => (
                  <ProductCard key={product.slug} product={product} isWinner={idx === 0} />
                ))}
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <FAQSection faqs={page.faqs} targetProduct={page.targetProduct} />

          {/* Final CTA Section */}
          <section id="cta" className="py-16 md:py-24 px-4 md:px-6 bg-gray-50 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
            
            <div className="relative max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
                Ready to Try the Best {page.targetProduct} Alternative?
              </h2>
              <p className="text-base md:text-lg text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed">
                {BRAND_INFO.name} is our #1 pick for {currentYear}. Get started with a free page and see the difference for yourself.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                <Link 
                  href={BRAND_INFO.ctaUrl}
                  className="w-full sm:w-auto px-10 py-4 rounded-2xl text-base font-semibold shadow-lg text-center bg-gradient-to-r from-[#9A8FEA] to-[#65B4FF] text-white hover:opacity-90 transition-all"
                >
                  Try {BRAND_INFO.name} Free
                </Link>
                <a 
                  href="#comparison-table"
                  className="w-full sm:w-auto px-10 py-4 rounded-2xl text-base font-semibold text-center bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  See Full Comparison
                </a>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs md:text-sm text-gray-500">
                {['Free trial', 'No credit card required', 'Generate pages in minutes'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#9A8FEA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-100">
          <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-1">
                <Link href="/" className="flex items-center gap-2 mb-4">
                  <img src={BRAND_INFO.logoUrl} alt="SEOPages.pro" className="h-8 w-auto" />
                  <span className="text-sm italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    seopages<span className="text-[#9A8FEA]">.</span>pro
                  </span>
                </Link>
                <p className="text-xs text-gray-500">
                  AI-powered alternative page generator for SEO professionals.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-gray-900">Product</h4>
                <ul className="space-y-3">
                  <li><Link href="/" className="text-sm text-gray-600 hover:text-gray-900">Home</Link></li>
                  <li><Link href="/#features" className="text-sm text-gray-600 hover:text-gray-900">Features</Link></li>
                  <li><Link href="/#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-gray-900">Resources</h4>
                <ul className="space-y-3">
                  <li><Link href="/best-alternatives" className="text-sm text-gray-600 hover:text-gray-900">Best Alternatives</Link></li>
                  <li><Link href="/seopages-pro-alternatives" className="text-sm text-gray-600 hover:text-gray-900">Comparisons</Link></li>
                  <li><Link href="/alternative-page-guide" className="text-sm text-gray-600 hover:text-gray-900">Guide</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-gray-900">Legal</h4>
                <ul className="space-y-3">
                  <li><Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900">Terms of Service</Link></li>
                  <li><a href="mailto:wps_zy@126.com" className="text-sm text-gray-600 hover:text-gray-900">Contact Us</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-100 mt-8 pt-8 text-sm text-center text-gray-500">
              <p>&copy; {currentYear} seopages.pro. All rights reserved.</p>
            </div>
          </div>
        </footer>

        {/* Scroll to Top Button */}
        <ScrollToTop />
      </div>
    </>
  );
}
