'use client';

import UrlListEditor from '../context-editors/UrlListEditor';
import type { PagesSectionProps } from './types';

export default function PagesSection({
  siteContexts,
  showDebugInfo = false,
  keyWebsitePagesContent,
  setKeyWebsitePagesContent,
  landingPagesContent,
  setLandingPagesContent,
  blogResourcesContent,
  setBlogResourcesContent,
  keyWebsitePagesRef,
  landingPagesRef,
  blogResourcesRef,
}: PagesSectionProps) {
  const keyWebsitePagesContext = siteContexts.find(c => c.type === 'key-website-pages');
  const landingPagesContext = siteContexts.find(c => c.type === 'landing-pages');
  const blogResourcesContext = siteContexts.find(c => c.type === 'blog-resources');

  return (
    <div className="border-t border-[#E5E5E5] pt-8">
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <h3 className="text-base font-bold text-[#111827]">Pages</h3>
      </div>

      {/* Key Website Pages */}
      <div ref={keyWebsitePagesRef} className="space-y-4 pl-7 mb-6">
        <h4 className="text-sm font-semibold text-[#111827]">Key Website Pages</h4>
        <UrlListEditor
          initialContent={keyWebsitePagesContext?.content || undefined}
          onContentChange={setKeyWebsitePagesContent}
          placeholder="Enter key page URLs, one per line..."
          emptyMessage="No key pages found. Run context acquisition to discover pages."
        />
      </div>

      {/* Landing Pages */}
      <div ref={landingPagesRef} className="space-y-4 pl-7 mb-6 pt-6 border-t border-[#F3F4F6]">
        <h4 className="text-sm font-semibold text-[#111827]">Landing Pages</h4>
        <UrlListEditor
          initialContent={landingPagesContext?.content || undefined}
          onContentChange={setLandingPagesContent}
          placeholder="Enter landing page URLs, one per line..."
          emptyMessage="No landing pages found."
        />
      </div>

      {/* Blog & Resources */}
      <div ref={blogResourcesRef} className="space-y-4 pl-7 mb-6 pt-6 border-t border-[#F3F4F6]">
        <h4 className="text-sm font-semibold text-[#111827]">Blog & Resources</h4>
        <UrlListEditor
          initialContent={blogResourcesContext?.content || undefined}
          onContentChange={setBlogResourcesContent}
          placeholder="Enter blog/resource URLs, one per line..."
          emptyMessage="No blog or resource pages found."
        />
      </div>
    </div>
  );
}

