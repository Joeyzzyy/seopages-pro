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
    
    const hasGoogleAnalytics = headContent.includes('googletagmanager.com/gtag') || headContent.includes('google-analytics.com');
    const hasGTM = headContent.includes('googletagmanager.com/gtm');
    const hasPostHog = headContent.includes('posthog');
    
    const scriptCount = doc.querySelectorAll('script').length;
    const stylesheetCount = doc.querySelectorAll('link[rel="stylesheet"]').length;
    const preloadCount = doc.querySelectorAll('link[rel="preload"]').length;

    return {
      charset, title, description, keywords, author, language,
      canonical, robots, viewport,
      ogTitle, ogDescription, ogType, ogImage, ogUrl, ogSiteName,
      twitterCard, twitterTitle, twitterDescription, twitterImage, twitterSite, twitterCreator,
      themeColor, favicon, appleTouchIcon,
      preconnects, dnsPrefetch,
      hasGoogleAnalytics, hasGTM, hasPostHog,
      scriptCount, stylesheetCount, preloadCount,
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
                  Basic Information
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
                  <div className="grid grid-cols-2 gap-2">
                    {metaInfo.charset && (
                      <div>
                        <div className="text-xs font-semibold text-[#6B7280] mb-1">Charset</div>
                        <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded">{metaInfo.charset}</div>
                      </div>
                    )}
                    {metaInfo.language && (
                      <div>
                        <div className="text-xs font-semibold text-[#6B7280] mb-1">Language</div>
                        <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded">{metaInfo.language}</div>
                      </div>
                    )}
                    {metaInfo.author && (
                      <div>
                        <div className="text-xs font-semibold text-[#6B7280] mb-1">Author</div>
                        <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded truncate">{metaInfo.author}</div>
                      </div>
                    )}
                    {metaInfo.keywords && (
                      <div>
                        <div className="text-xs font-semibold text-[#6B7280] mb-1">Keywords</div>
                        <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded truncate">{metaInfo.keywords}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SEO */}
              {(metaInfo.canonical || metaInfo.robots || metaInfo.viewport) && (
                <div>
                  <div className="text-xs font-bold text-[#111827] mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    SEO Settings
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {metaInfo.canonical && (
                      <div className="col-span-2">
                        <div className="text-xs font-semibold text-[#6B7280] mb-1">Canonical URL</div>
                        <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded truncate">{metaInfo.canonical}</div>
                      </div>
                    )}
                    {metaInfo.robots && (
                      <div>
                        <div className="text-xs font-semibold text-[#6B7280] mb-1">Robots</div>
                        <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded">{metaInfo.robots}</div>
                      </div>
                    )}
                    {metaInfo.viewport && (
                      <div>
                        <div className="text-xs font-semibold text-[#6B7280] mb-1">Viewport</div>
                        <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded truncate">{metaInfo.viewport}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Open Graph */}
              {(metaInfo.ogTitle || metaInfo.ogDescription || metaInfo.ogImage) && (
                <div>
                  <div className="text-xs font-bold text-[#111827] mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Open Graph
                  </div>
                  <div className="space-y-2">
                    {metaInfo.ogTitle && (
                      <div>
                        <div className="text-xs font-semibold text-[#6B7280] mb-1">OG Title</div>
                        <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded">{metaInfo.ogTitle}</div>
                      </div>
                    )}
                    {metaInfo.ogDescription && (
                      <div>
                        <div className="text-xs font-semibold text-[#6B7280] mb-1">OG Description</div>
                        <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded">{metaInfo.ogDescription}</div>
                      </div>
                    )}
                    {metaInfo.ogImage && (
                      <div>
                        <div className="text-xs font-semibold text-[#6B7280] mb-1">OG Image</div>
                        <div className="bg-[#F9FAFB] px-3 py-2 rounded">
                          <img 
                            src={metaInfo.ogImage} 
                            alt="OG preview" 
                            className="max-h-32 object-contain rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = `<div class="text-xs text-[#6B7280] break-all">${metaInfo.ogImage}</div>`;
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Performance & Analytics */}
              <div>
                <div className="text-xs font-bold text-[#111827] mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Performance & Analytics
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-xs font-semibold text-[#6B7280] mb-1">Scripts</div>
                      <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded text-center">{metaInfo.scriptCount}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#6B7280] mb-1">Stylesheets</div>
                      <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded text-center">{metaInfo.stylesheetCount}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#6B7280] mb-1">Preloads</div>
                      <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded text-center">{metaInfo.preloadCount}</div>
                    </div>
                  </div>
                  
                  {(metaInfo.hasGoogleAnalytics || metaInfo.hasGTM || metaInfo.hasPostHog) && (
                    <div>
                      <div className="text-xs font-semibold text-[#6B7280] mb-1">Analytics Services</div>
                      <div className="flex flex-wrap gap-1.5">
                        {metaInfo.hasGoogleAnalytics && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-[#4285F4] text-white">
                            Google Analytics
                          </span>
                        )}
                        {metaInfo.hasGTM && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-[#FF6C37] text-white">
                            GTM
                          </span>
                        )}
                        {metaInfo.hasPostHog && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-[#FF6C37] text-white">
                            PostHog
                          </span>
                        )}
                      </div>
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

