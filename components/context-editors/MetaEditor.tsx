'use client';

import { useState, useEffect } from 'react';

interface MetaEditorProps {
  initialContent?: string;
  onContentChange: (content: string) => void;
}

export default function MetaEditor({ initialContent = '', onContentChange }: MetaEditorProps) {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    onContentChange(content);
  }, [content]);

  const extractMetaInfo = (headContent: string) => {
    if (!headContent) return null;

    const parser = new DOMParser();
    const doc = parser.parseFromString(headContent, 'text/html');
    
    const getMetaContent = (selector: string) => {
      const el = doc.querySelector(selector);
      return el?.getAttribute('content') || el?.getAttribute('href') || '';
    };

    const getAllMetaContent = (selector: string) => {
      const elements = doc.querySelectorAll(selector);
      return Array.from(elements).map(el => el.getAttribute('content') || el.getAttribute('href') || '').filter(Boolean);
    };

    const charset = doc.querySelector('meta[charset]')?.getAttribute('charset') || '';
    const title = doc.querySelector('title')?.textContent || getMetaContent('meta[property="og:title"]') || getMetaContent('meta[name="twitter:title"]');
    const description = getMetaContent('meta[name="description"]') || getMetaContent('meta[property="og:description"]');
    const keywords = getMetaContent('meta[name="keywords"]');
    const author = getMetaContent('meta[name="author"]');
    const language = getMetaContent('meta[name="language"]') || doc.documentElement.getAttribute('lang') || '';
    
    const canonical = getMetaContent('link[rel="canonical"]');
    const robots = getMetaContent('meta[name="robots"]');
    const viewport = getMetaContent('meta[name="viewport"]');
    
    const ogTitle = getMetaContent('meta[property="og:title"]');
    const ogDescription = getMetaContent('meta[property="og:description"]');
    const ogType = getMetaContent('meta[property="og:type"]');
    const ogImage = getMetaContent('meta[property="og:image"]');
    const ogUrl = getMetaContent('meta[property="og:url"]');
    const ogSiteName = getMetaContent('meta[property="og:site_name"]');
    
    const twitterCard = getMetaContent('meta[name="twitter:card"]');
    const twitterTitle = getMetaContent('meta[name="twitter:title"]');
    const twitterDescription = getMetaContent('meta[name="twitter:description"]');
    const twitterImage = getMetaContent('meta[name="twitter:image"]');
    const twitterSite = getMetaContent('meta[name="twitter:site"]');
    const twitterCreator = getMetaContent('meta[name="twitter:creator"]');
    
    const themeColor = getMetaContent('meta[name="theme-color"]');
    const favicon = getMetaContent('link[rel="icon"]') || getMetaContent('link[rel="shortcut icon"]');
    const appleTouchIcon = getMetaContent('link[rel="apple-touch-icon"]');
    
    const preconnects = getAllMetaContent('link[rel="preconnect"]');
    const dnsPrefetch = getAllMetaContent('link[rel="dns-prefetch"]');

    return {
      charset, title, description, keywords, author, language,
      canonical, robots, viewport,
      ogTitle, ogDescription, ogType, ogImage, ogUrl, ogSiteName,
      twitterCard, twitterTitle, twitterDescription, twitterImage, twitterSite, twitterCreator,
      themeColor, favicon, appleTouchIcon,
      preconnects, dnsPrefetch,
    };
  };

  const metaInfo = extractMetaInfo(content);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#374151] mb-2">
          Head Tag Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your complete <head> tag content here (including <head> and </head> tags)...

You can copy the entire <head> section from your browser console or HTML source."
          rows={12}
          className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] focus:border-transparent font-mono text-sm resize-none"
        />
        <p className="text-xs text-[#9CA3AF] mt-2">
          Paste the complete &lt;head&gt; tag content from your browser console or HTML source.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#374151] mb-2">
          Extracted Meta Information
        </label>
        <div className="border border-[#E5E5E5] rounded-lg overflow-hidden bg-white">
          {!metaInfo || !content ? (
            <div className="p-6 text-center text-sm text-[#9CA3AF]">
              Paste your head tag content above to see extracted meta information
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {/* Basic Information */}
              <div>
                <div className="text-xs font-bold text-[#111827] mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Meta Information
                </div>
                <div className="space-y-2">
                  {metaInfo.title && (
                    <div>
                      <div className="text-xs font-semibold text-[#6B7280] mb-1">Title</div>
                      <div className="text-sm text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded">{metaInfo.title}</div>
                    </div>
                  )}
                  {metaInfo.description && (
                    <div>
                      <div className="text-xs font-semibold text-[#6B7280] mb-1">Description</div>
                      <div className="text-sm text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded">{metaInfo.description}</div>
                    </div>
                  )}
                  {metaInfo.keywords && (
                    <div>
                      <div className="text-xs font-semibold text-[#6B7280] mb-1">Keywords</div>
                      <div className="text-sm text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded">{metaInfo.keywords}</div>
                    </div>
                  )}
                  {metaInfo.canonical && (
                    <div>
                      <div className="text-xs font-semibold text-[#6B7280] mb-1">Domain Name</div>
                      <div className="text-sm text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded truncate">{metaInfo.canonical}</div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

