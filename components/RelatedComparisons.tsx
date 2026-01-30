'use client';

import Link from 'next/link';
import { OptimizedImage } from './OptimizedImage';

interface RelatedItem {
  slug: string;
  name: string;
  category: string;
  logoUrl?: string;
  website?: string;
}

interface RelatedComparisonsProps {
  currentSlug: string;
  items: RelatedItem[];
  type: 'alternative' | 'listicle';
  basePath: string;
  brandName?: string;
}

export function RelatedComparisons({ 
  currentSlug, 
  items, 
  type, 
  basePath,
  brandName = 'SEOPages.pro'
}: RelatedComparisonsProps) {
  // Filter out current item and get up to 6 related items
  const relatedItems = items
    .filter(item => item.slug !== currentSlug)
    .slice(0, 6);

  if (relatedItems.length === 0) return null;

  const getFaviconUrl = (domain: string, size: number = 128): string => {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
  };

  return (
    <section className="py-12 md:py-16 px-4 md:px-6 bg-gray-50 border-t border-gray-200">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8 md:mb-10">
          <span className="inline-block px-3 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full mb-3">
            Explore More
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            Related {type === 'alternative' ? 'Comparisons' : 'Reviews'}
          </h2>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            Check out these other {type === 'alternative' ? `${brandName} alternatives` : 'product comparisons'} to find the perfect solution for your needs.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {relatedItems.map((item) => (
            <Link
              key={item.slug}
              href={`${basePath}/${item.slug}`}
              className="group bg-white rounded-xl p-4 md:p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <OptimizedImage
                    src={item.logoUrl || getFaviconUrl(item.website || `${item.slug}.com`, 128)}
                    alt={`${item.name} logo`}
                    width={48}
                    height={48}
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate group-hover:text-blue-600 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">{item.category}</p>
                </div>
              </div>
              <div className="flex items-center text-xs text-gray-500 group-hover:text-blue-600 transition-colors">
                <span>Read comparison</span>
                <svg 
                  className="w-3.5 h-3.5 ml-1 transform group-hover:translate-x-0.5 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Internal Linking Context */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
            <span>More resources:</span>
            <Link href="/seopages-pro-alternatives" className="hover:text-gray-700 underline">
              1v1 Comparisons
            </Link>
            <Link href="/best-alternatives" className="hover:text-gray-700 underline">
              Best Alternatives
            </Link>
            <Link href="/alternative-page-guide" className="hover:text-gray-700 underline">
              Alternative Guide
            </Link>
            <Link href="/listicle-page-guide" className="hover:text-gray-700 underline">
              Listicle Guide
            </Link>
            <Link href="/" className="hover:text-gray-700 underline">
              Home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
