'use client';

import { useState, useEffect } from 'react';
import type { SiteContext } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { generateHeaderHTML, defaultHeaderConfig } from '@/lib/templates/default-header';
import { generateFooterHTML, defaultFooterConfig } from '@/lib/templates/default-footer';

interface SiteContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    type: 'logo' | 'header' | 'footer' | 'meta' | 'sitemap';
    content?: string;
    fileUrl?: string;
  }) => Promise<void>;
  type: 'logo' | 'header' | 'footer' | 'meta' | 'sitemap';
  context?: SiteContext | null;
  allContexts?: SiteContext[]; // Pass all contexts to get logo URL
}

export default function SiteContextModal({
  isOpen,
  onClose,
  onSave,
  type,
  context,
  allContexts = [],
}: SiteContextModalProps) {
  const [content, setContent] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Brand gradient color (default)
  const brandGradient = 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)';
  
  // Header form state
  const [headerConfig, setHeaderConfig] = useState({
    siteName: 'My Site',
    logo: '',
    navigation: [
      { label: 'Home', url: '/' },
      { label: 'About', url: '/about' },
      { label: 'Services', url: '/services' },
      { label: 'Contact', url: '/contact' },
    ],
    ctaButton: { 
      label: 'Get Started', 
      url: '/get-started',
      color: brandGradient // Default brand gradient
    },
  });
  
  // Footer form state
  const [footerConfig, setFooterConfig] = useState({
    companyName: 'My Company',
    tagline: 'Building the future, one line of code at a time.',
    logo: '',
    columns: [
      {
        title: 'Product',
        links: [
          { label: 'Features', url: '/features' },
          { label: 'Pricing', url: '/pricing' },
          { label: 'FAQ', url: '/faq' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About', url: '/about' },
          { label: 'Blog', url: '/blog' },
          { label: 'Careers', url: '/careers' },
        ],
      },
      {
        title: 'Support',
        links: [
          { label: 'Help Center', url: '/help' },
          { label: 'Contact', url: '/contact' },
          { label: 'Privacy', url: '/privacy' },
        ],
      },
    ],
    socialMedia: [
      { platform: 'twitter' as const, url: 'https://twitter.com/example' },
      { platform: 'linkedin' as const, url: 'https://linkedin.com/company/example' },
    ],
    backgroundColor: brandGradient, // Default brand gradient
    textColor: '#E5E7EB', // Default light gray text
  });

  // Get user's uploaded logo URL
  const userLogoUrl = allContexts.find(c => c.type === 'logo')?.file_url || null;

  useEffect(() => {
    if (userLogoUrl) {
      if (type === 'header' && !headerConfig.logo) {
        setHeaderConfig(prev => ({ ...prev, logo: userLogoUrl }));
      } else if (type === 'footer' && !footerConfig.logo) {
        setFooterConfig(prev => ({ ...prev, logo: userLogoUrl }));
      }
    }
  }, [userLogoUrl, type, headerConfig.logo, footerConfig.logo]);

  // Preprocess HTML to replace image sources
  const preprocessHTML = (htmlContent: string, userLogoUrl?: string) => {
    if (!htmlContent) return htmlContent;
    
    // If no user logo, use a placeholder SVG
    const logoUrl = userLogoUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40"%3E%3Crect width="120" height="40" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="12" fill="%239ca3af"%3ELogo%3C/text%3E%3C/svg%3E';
    
    // Replace common patterns that won't load
    let processed = htmlContent;
    
    // Replace _next/image paths
    processed = processed.replace(
      /src="[^"]*\/_next\/image[^"]*"/g,
      `src="${logoUrl}"`
    );
    
    // Replace srcset with _next/image
    processed = processed.replace(
      /srcset="[^"]*\/_next\/image[^"]*"/g,
      `srcset="${logoUrl}"`
    );
    
    // Replace relative paths starting with /
    processed = processed.replace(
      /src="\/(?!\/)[^"]*\.(png|jpg|jpeg|gif|svg|webp)"/gi,
      `src="${logoUrl}"`
    );
    
    return processed;
  };

  // Generate full HTML document for iframe preview
  const generatePreviewHTML = (htmlContent: string, userLogoUrl?: string) => {
    const processedContent = preprocessHTML(htmlContent, userLogoUrl);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      background: white;
    }
    /* Ensure images fit properly */
    img {
      max-width: 100%;
      height: auto;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div style="transform: scale(0.6); transform-origin: top left; width: 166.67%; min-height: 100vh;">
    ${processedContent}
  </div>
</body>
</html>`;
  };

  const titles = {
    logo: 'Logo',
    header: 'Header',
    footer: 'Footer',
    meta: 'Meta Tags',
    sitemap: 'Sitemap',
  };

  const placeholders = {
    logo: '',
    header: 'Paste your header HTML code here...\n\nExample:\n<header>\n  <nav>...</nav>\n</header>',
    footer: 'Paste your footer HTML code here...\n\nExample:\n<footer>\n  <p>&copy; 2024 Your Company</p>\n</footer>',
    meta: 'Paste your complete <head> tag content here (including <head> and </head> tags)...\n\nYou can copy the entire <head> section from your browser console or HTML source.',
    sitemap: 'Sitemap data is stored automatically as a JSON list of URLs.',
  };

  // Extract meta information from head tag for preview
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

    // Basic Meta
    const charset = doc.querySelector('meta[charset]')?.getAttribute('charset') || '';
    const title = doc.querySelector('title')?.textContent || getMetaContent('meta[property="og:title"]') || getMetaContent('meta[name="twitter:title"]');
    const description = getMetaContent('meta[name="description"]') || getMetaContent('meta[property="og:description"]');
    const keywords = getMetaContent('meta[name="keywords"]');
    const author = getMetaContent('meta[name="author"]');
    const language = getMetaContent('meta[name="language"]') || doc.documentElement.getAttribute('lang') || '';
    
    // SEO Meta
    const canonical = getMetaContent('link[rel="canonical"]');
    const robots = getMetaContent('meta[name="robots"]');
    const viewport = getMetaContent('meta[name="viewport"]');
    
    // Open Graph
    const ogTitle = getMetaContent('meta[property="og:title"]');
    const ogDescription = getMetaContent('meta[property="og:description"]');
    const ogType = getMetaContent('meta[property="og:type"]');
    const ogImage = getMetaContent('meta[property="og:image"]');
    const ogUrl = getMetaContent('meta[property="og:url"]');
    const ogSiteName = getMetaContent('meta[property="og:site_name"]');
    
    // Twitter Card
    const twitterCard = getMetaContent('meta[name="twitter:card"]');
    const twitterTitle = getMetaContent('meta[name="twitter:title"]');
    const twitterDescription = getMetaContent('meta[name="twitter:description"]');
    const twitterImage = getMetaContent('meta[name="twitter:image"]');
    const twitterSite = getMetaContent('meta[name="twitter:site"]');
    const twitterCreator = getMetaContent('meta[name="twitter:creator"]');
    
    // Visual & Branding
    const themeColor = getMetaContent('meta[name="theme-color"]');
    const favicon = getMetaContent('link[rel="icon"]') || getMetaContent('link[rel="shortcut icon"]');
    const appleTouchIcon = getMetaContent('link[rel="apple-touch-icon"]');
    
    // Performance & Resources
    const preconnects = getAllMetaContent('link[rel="preconnect"]');
    const dnsPrefetch = getAllMetaContent('link[rel="dns-prefetch"]');
    
    // Analytics Detection
    const hasGoogleAnalytics = headContent.includes('googletagmanager.com/gtag') || headContent.includes('google-analytics.com');
    const hasGTM = headContent.includes('googletagmanager.com/gtm');
    const hasPostHog = headContent.includes('posthog');
    
    // Scripts Detection
    const scriptCount = doc.querySelectorAll('script').length;
    const stylesheetCount = doc.querySelectorAll('link[rel="stylesheet"]').length;
    const preloadCount = doc.querySelectorAll('link[rel="preload"]').length;

    return {
      // Basic
      charset,
      title,
      description,
      keywords,
      author,
      language,
      
      // SEO
      canonical,
      robots,
      viewport,
      
      // Open Graph
      ogTitle,
      ogDescription,
      ogType,
      ogImage,
      ogUrl,
      ogSiteName,
      
      // Twitter
      twitterCard,
      twitterTitle,
      twitterDescription,
      twitterImage,
      twitterSite,
      twitterCreator,
      
      // Visual
      themeColor,
      favicon,
      appleTouchIcon,
      
      // Performance
      preconnects,
      dnsPrefetch,
      
      // Analytics
      hasGoogleAnalytics,
      hasGTM,
      hasPostHog,
      
      // Stats
      scriptCount,
      stylesheetCount,
      preloadCount,
    };
  };

  useEffect(() => {
    if (context) {
      setContent(context.content || '');
      if (context.file_url) {
        setLogoPreviewUrl(context.file_url);
      }
    } else {
      setContent('');
      setLogoFile(null);
      setLogoPreviewUrl(null);
    }
  }, [context, isOpen, type]);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate HTML from config
  const generateHTMLFromConfig = () => {
    if (type === 'header') {
      return generateHeaderHTML(headerConfig);
    } else if (type === 'footer') {
      return generateFooterHTML(footerConfig);
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let fileUrl: string | undefined = context?.file_url || undefined;

      // Upload logo if it's a logo type and a new file is selected
      if (type === 'logo' && logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);

        // Get session token for authentication
        const { data: { session } } = await supabase.auth.getSession();
        const headers: HeadersInit = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const uploadResponse = await fetch('/api/upload-logo', {
          method: 'POST',
          body: formData,
          headers,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          console.error('Upload failed:', errorData);
          
          // Show more detailed error message
          let errorMessage = 'Failed to upload logo';
          if (errorData.details) {
            errorMessage += ': ' + errorData.details;
          }
          if (errorData.supabaseError) {
            errorMessage += '\n\nSupabase error: ' + errorData.supabaseError;
          }
          
          throw new Error(errorMessage);
        }

        const uploadData = await uploadResponse.json();
        fileUrl = uploadData.url;
      }

      await onSave({
        type,
        content: type !== 'logo' ? generateHTMLFromConfig() : undefined,
        fileUrl: type === 'logo' ? fileUrl : undefined,
      });

      onClose();
    } catch (error) {
      console.error('Error saving site context:', error);
      alert(error instanceof Error ? error.message : 'Failed to save. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111827]">
            Edit {titles[type]}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#F3F4F6] rounded transition-colors"
          >
            <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Logo Upload */}
            {type === 'logo' && (
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  Logo Image
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="sr-only"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="inline-flex items-center px-4 py-2 border border-[#E5E5E5] rounded-lg shadow-sm text-sm font-medium text-[#374151] bg-white hover:bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9AD6FF] cursor-pointer transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Choose Logo File
                    </label>
                    {logoFile && (
                      <span className="ml-3 text-xs text-[#6B7280]">
                        {logoFile.name}
                      </span>
                    )}
                  </div>
                  {logoPreviewUrl && (
                    <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E5E5]">
                      <p className="text-xs text-[#6B7280] mb-2">Preview:</p>
                      <div className="flex items-center justify-center">
                        <img
                          src={logoPreviewUrl}
                          alt="Logo preview"
                          className="max-h-32 object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Header/Footer Visual Editor */}
            {(type === 'header' || type === 'footer') && (
              <div className="space-y-4">
                {/* Visual Editor for Header */}
                {type === 'header' && (
                  <div className="space-y-3 p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E5E5]">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">Site Name</label>
                        <input
                          type="text"
                          value={headerConfig.siteName}
                          onChange={(e) => setHeaderConfig({ ...headerConfig, siteName: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">CTA Label</label>
                        <input
                          type="text"
                          value={headerConfig.ctaButton.label}
                          onChange={(e) => setHeaderConfig({
                            ...headerConfig,
                            ctaButton: { ...headerConfig.ctaButton, label: e.target.value }
                          })}
                          placeholder="Button Label"
                          className="w-full px-2.5 py-1.5 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] text-sm bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">CTA URL</label>
                        <input
                          type="text"
                          value={headerConfig.ctaButton.url}
                          onChange={(e) => setHeaderConfig({
                            ...headerConfig,
                            ctaButton: { ...headerConfig.ctaButton, url: e.target.value }
                          })}
                          placeholder="Button URL"
                          className="w-full px-2.5 py-1.5 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">CTA Color</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={headerConfig.ctaButton.color}
                            onChange={(e) => setHeaderConfig({
                              ...headerConfig,
                              ctaButton: { ...headerConfig.ctaButton, color: e.target.value }
                            })}
                            className="flex-1 px-2.5 py-1.5 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] text-[10px] font-mono bg-white"
                          />
                          <div 
                            className="w-8 h-8 rounded-lg border border-[#E5E5E5] flex-shrink-0"
                            style={{ background: headerConfig.ctaButton.color }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E5E5E5]">
                      <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Navigation Links</label>
                      <div className="space-y-1.5">
                        {headerConfig.navigation.map((link, index) => (
                          <div key={index} className="flex gap-2 items-center bg-white p-1.5 rounded-lg border border-[#F0F0F0]">
                            <input
                              type="text"
                              value={link.label}
                              onChange={(e) => {
                                const newNav = [...headerConfig.navigation];
                                newNav[index].label = e.target.value;
                                setHeaderConfig({ ...headerConfig, navigation: newNav });
                              }}
                              placeholder="Label"
                              className="w-1/3 px-2 py-1 border border-transparent hover:border-[#E5E5E5] rounded focus:border-[#9AD6FF] focus:outline-none text-xs"
                            />
                            <input
                              type="text"
                              value={link.url}
                              onChange={(e) => {
                                const newNav = [...headerConfig.navigation];
                                newNav[index].url = e.target.value;
                                setHeaderConfig({ ...headerConfig, navigation: newNav });
                              }}
                              placeholder="URL"
                              className="flex-1 px-2 py-1 border border-transparent hover:border-[#E5E5E5] rounded focus:border-[#9AD6FF] focus:outline-none text-xs font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newNav = headerConfig.navigation.filter((_, i) => i !== index);
                                setHeaderConfig({ ...headerConfig, navigation: newNav });
                              }}
                              className="p-1.5 text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setHeaderConfig({
                              ...headerConfig,
                              navigation: [...headerConfig.navigation, { label: 'New Link', url: '#' }]
                            });
                          }}
                          className="w-full py-1.5 text-[10px] font-bold text-[#6B7280] border border-dashed border-[#E5E5E5] rounded-lg hover:bg-white transition-colors uppercase tracking-wider"
                        >
                          + Add Link
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Visual Editor for Footer */}
                {type === 'footer' && (
                  <div className="space-y-3 p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E5E5]">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">Company Name</label>
                        <input
                          type="text"
                          value={footerConfig.companyName}
                          onChange={(e) => setFooterConfig({ ...footerConfig, companyName: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">Tagline</label>
                        <input
                          type="text"
                          value={footerConfig.tagline}
                          onChange={(e) => setFooterConfig({ ...footerConfig, tagline: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] text-sm bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-2 bg-white rounded-lg border border-[#E5E5E5]">
                        <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">Background</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={footerConfig.backgroundColor}
                            onChange={(e) => setFooterConfig({ ...footerConfig, backgroundColor: e.target.value })}
                            className="flex-1 px-2 py-1.5 border border-[#E5E5E5] rounded focus:outline-none text-[10px] font-mono"
                          />
                          <div 
                            className="w-6 h-6 rounded border border-[#E5E5E5] flex-shrink-0"
                            style={{ background: footerConfig.backgroundColor }}
                          />
                        </div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-[#E5E5E5]">
                        <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">Text Color</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={footerConfig.textColor}
                            onChange={(e) => setFooterConfig({ ...footerConfig, textColor: e.target.value })}
                            className="flex-1 px-2 py-1.5 border border-[#E5E5E5] rounded focus:outline-none text-[10px] font-mono"
                          />
                          <input
                            type="color"
                            value={footerConfig.textColor}
                            onChange={(e) => setFooterConfig({ ...footerConfig, textColor: e.target.value })}
                            className="w-6 h-6 rounded border border-[#E5E5E5] cursor-pointer p-0 overflow-hidden"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E5E5E5]">
                      <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Link Columns</label>
                      <div className="grid grid-cols-3 gap-2">
                        {footerConfig.columns.map((column, colIndex) => (
                          <div key={colIndex} className="p-2 bg-white rounded-lg border border-[#E5E5E5] flex flex-col">
                            <div className="flex items-center gap-1 mb-2">
                              <input
                                type="text"
                                value={column.title}
                                onChange={(e) => {
                                  const newColumns = [...footerConfig.columns];
                                  newColumns[colIndex].title = e.target.value;
                                  setFooterConfig({ ...footerConfig, columns: newColumns });
                                }}
                                className="flex-1 px-1.5 py-0.5 text-[10px] font-bold border-b border-transparent hover:border-[#E5E5E5] focus:border-[#9AD6FF] focus:outline-none uppercase tracking-tight"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newColumns = footerConfig.columns.filter((_, i) => i !== colIndex);
                                  setFooterConfig({ ...footerConfig, columns: newColumns });
                                }}
                                className="p-1 text-[#9CA3AF] hover:text-[#EF4444]"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <div className="space-y-1 flex-1">
                              {column.links.map((link, linkIndex) => (
                                <div key={linkIndex} className="flex gap-1 group">
                                  <input
                                    type="text"
                                    value={link.label}
                                    onChange={(e) => {
                                      const newColumns = [...footerConfig.columns];
                                      newColumns[colIndex].links[linkIndex].label = e.target.value;
                                      setFooterConfig({ ...footerConfig, columns: newColumns });
                                    }}
                                    placeholder="Link"
                                    className="flex-1 px-1 py-0.5 text-[10px] border border-transparent hover:border-[#F0F0F0] rounded focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newColumns = [...footerConfig.columns];
                                      newColumns[colIndex].links = newColumns[colIndex].links.filter((_, i) => i !== linkIndex);
                                      setFooterConfig({ ...footerConfig, columns: newColumns });
                                    }}
                                    className="p-0.5 text-[#9CA3AF] hover:text-[#EF4444] opacity-0 group-hover:opacity-100"
                                  >
                                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  const newColumns = [...footerConfig.columns];
                                  newColumns[colIndex].links.push({ label: 'New Link', url: '#' });
                                  setFooterConfig({ ...footerConfig, columns: newColumns });
                                }}
                                className="w-full py-1 text-[9px] text-[#9CA3AF] border border-dashed border-[#F0F0F0] rounded hover:bg-[#FAFAFA]"
                              >
                                + Add
                              </button>
                            </div>
                          </div>
                        ))}
                        {footerConfig.columns.length < 3 && (
                          <button
                            type="button"
                            onClick={() => {
                              setFooterConfig({
                                ...footerConfig,
                                columns: [...footerConfig.columns, { title: 'New Column', links: [] }]
                              });
                            }}
                            className="flex items-center justify-center border-2 border-dashed border-[#E5E5E5] rounded-lg hover:bg-white transition-colors p-4"
                          >
                            <svg className="w-4 h-4 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E5E5E5]">
                      <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Social Media</label>
                      <div className="grid grid-cols-2 gap-2">
                        {footerConfig.socialMedia.map((social, index) => (
                          <div key={index} className="flex gap-1.5 items-center bg-white p-1.5 rounded-lg border border-[#F0F0F0]">
                            <select
                              value={social.platform}
                              onChange={(e) => {
                                const newSocial = [...footerConfig.socialMedia];
                                newSocial[index].platform = e.target.value as any;
                                setFooterConfig({ ...footerConfig, socialMedia: newSocial });
                              }}
                              className="bg-transparent border-none text-[10px] font-bold text-[#374151] focus:ring-0 cursor-pointer uppercase shrink-0"
                            >
                              <option value="twitter">X</option>
                              <option value="facebook">FB</option>
                              <option value="linkedin">IN</option>
                              <option value="github">GH</option>
                              <option value="instagram">IG</option>
                            </select>
                            <input
                              type="text"
                              value={social.url}
                              onChange={(e) => {
                                const newSocial = [...footerConfig.socialMedia];
                                newSocial[index].url = e.target.value;
                                setFooterConfig({ ...footerConfig, socialMedia: newSocial });
                              }}
                              placeholder="URL"
                              className="flex-1 px-1 py-0.5 text-[10px] border-none focus:ring-0 font-mono truncate"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newSocial = footerConfig.socialMedia.filter((_, i) => i !== index);
                                setFooterConfig({ ...footerConfig, socialMedia: newSocial });
                              }}
                              className="p-1 text-[#9CA3AF] hover:text-[#EF4444]"
                            >
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setFooterConfig({
                              ...footerConfig,
                              socialMedia: [...footerConfig.socialMedia, { platform: 'twitter', url: '' }]
                            });
                          }}
                          className="py-1.5 text-[10px] font-bold text-[#6B7280] border border-dashed border-[#E5E5E5] rounded-lg hover:bg-white transition-colors uppercase tracking-wider"
                        >
                          + Social
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview - Using iframe for style isolation */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    Preview
                  </label>
                  <div className="border border-[#E5E5E5] rounded-lg overflow-hidden bg-gradient-to-b from-gray-50 to-white">
                    <div className="flex items-center justify-center py-4">
                      <iframe 
                        srcDoc={generatePreviewHTML(
                          generateHTMLFromConfig(),
                          userLogoUrl || undefined
                        )}
                        className={`w-full border-none bg-white shadow-sm ${type === 'footer' ? 'h-[200px]' : 'h-[100px]'}`}
                        title={`${type} preview`}
                        sandbox="allow-same-origin allow-scripts"
                        style={{ display: 'block' }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-2">
                    Preview is scaled to fit. Local images are replaced with your logo.
                  </p>
                </div>
              </div>
            )}

            {/* Meta Tags - Code above, Preview below */}
            {type === 'meta' && (
              <div className="space-y-4">
                {/* Code Editor */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    Head Tag Content
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={placeholders[type]}
                    rows={12}
                    className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] focus:border-transparent font-mono text-sm resize-none"
                  />
                  <p className="text-xs text-[#9CA3AF] mt-2">
                    Paste the complete &lt;head&gt; tag content from your browser console or HTML source.
                  </p>
                </div>

                {/* Meta Information Preview */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    Extracted Meta Information
                  </label>
                  <div className="border border-[#E5E5E5] rounded-lg overflow-hidden bg-white">
                    {(() => {
                      const metaInfo = extractMetaInfo(content);
                      if (!metaInfo || !content) {
                        return (
                          <div className="p-6 text-center text-sm text-[#9CA3AF]">
                            Paste your head tag content above to see extracted meta information
                          </div>
                        );
                      }

                      return (
                        <div className="p-4 space-y-6">
                          {/* Basic Information Section */}
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
                                  <div className="text-sm text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded">
                                    {metaInfo.title}
                                  </div>
                                </div>
                              )}
                              {metaInfo.description && (
                                <div>
                                  <div className="text-xs font-semibold text-[#6B7280] mb-1">Description</div>
                                  <div className="text-sm text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded">
                                    {metaInfo.description}
                                  </div>
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

                          {/* SEO Section */}
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

                          {/* Open Graph Section */}
                          {(metaInfo.ogTitle || metaInfo.ogDescription || metaInfo.ogType || metaInfo.ogImage || metaInfo.ogUrl || metaInfo.ogSiteName) && (
                            <div>
                              <div className="text-xs font-bold text-[#111827] mb-3 flex items-center">
                                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                Open Graph (Facebook/LinkedIn)
                              </div>
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  {metaInfo.ogTitle && (
                                    <div className="col-span-2">
                                      <div className="text-xs font-semibold text-[#6B7280] mb-1">OG Title</div>
                                      <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded">{metaInfo.ogTitle}</div>
                                    </div>
                                  )}
                                  {metaInfo.ogDescription && (
                                    <div className="col-span-2">
                                      <div className="text-xs font-semibold text-[#6B7280] mb-1">OG Description</div>
                                      <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded">{metaInfo.ogDescription}</div>
                                    </div>
                                  )}
                                  {metaInfo.ogType && (
                                    <div>
                                      <div className="text-xs font-semibold text-[#6B7280] mb-1">Type</div>
                                      <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded">{metaInfo.ogType}</div>
                                    </div>
                                  )}
                                  {metaInfo.ogSiteName && (
                                    <div>
                                      <div className="text-xs font-semibold text-[#6B7280] mb-1">Site Name</div>
                                      <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded truncate">{metaInfo.ogSiteName}</div>
                                    </div>
                                  )}
                                  {metaInfo.ogUrl && (
                                    <div className="col-span-2">
                                      <div className="text-xs font-semibold text-[#6B7280] mb-1">URL</div>
                                      <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded truncate">{metaInfo.ogUrl}</div>
                                    </div>
                                  )}
                                </div>
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

                          {/* Twitter Card Section */}
                          {(metaInfo.twitterCard || metaInfo.twitterTitle || metaInfo.twitterDescription || metaInfo.twitterImage || metaInfo.twitterSite) && (
                            <div>
                              <div className="text-xs font-bold text-[#111827] mb-3 flex items-center">
                                <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                </svg>
                                Twitter Card
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {metaInfo.twitterCard && (
                                  <div>
                                    <div className="text-xs font-semibold text-[#6B7280] mb-1">Card Type</div>
                                    <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded">{metaInfo.twitterCard}</div>
                                  </div>
                                )}
                                {metaInfo.twitterSite && (
                                  <div>
                                    <div className="text-xs font-semibold text-[#6B7280] mb-1">Site Handle</div>
                                    <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded">{metaInfo.twitterSite}</div>
                                  </div>
                                )}
                                {metaInfo.twitterCreator && (
                                  <div>
                                    <div className="text-xs font-semibold text-[#6B7280] mb-1">Creator</div>
                                    <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded">{metaInfo.twitterCreator}</div>
                                  </div>
                                )}
                                {metaInfo.twitterTitle && (
                                  <div className="col-span-2">
                                    <div className="text-xs font-semibold text-[#6B7280] mb-1">Title</div>
                                    <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded">{metaInfo.twitterTitle}</div>
                                  </div>
                                )}
                                {metaInfo.twitterDescription && (
                                  <div className="col-span-2">
                                    <div className="text-xs font-semibold text-[#6B7280] mb-1">Description</div>
                                    <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded">{metaInfo.twitterDescription}</div>
                                  </div>
                                )}
                                {metaInfo.twitterImage && (
                                  <div className="col-span-2">
                                    <div className="text-xs font-semibold text-[#6B7280] mb-1">Image URL</div>
                                    <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded truncate">{metaInfo.twitterImage}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Visual & Branding Section */}
                          {(metaInfo.themeColor || metaInfo.favicon || metaInfo.appleTouchIcon) && (
                            <div>
                              <div className="text-xs font-bold text-[#111827] mb-3 flex items-center">
                                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                                Visual & Branding
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {metaInfo.themeColor && (
                                  <div>
                                    <div className="text-xs font-semibold text-[#6B7280] mb-1">Theme Color</div>
                                    <div className="flex items-center gap-2 bg-[#F9FAFB] px-3 py-2 rounded">
                                      <div className="w-4 h-4 rounded border border-[#E5E5E5]" style={{ backgroundColor: metaInfo.themeColor }}></div>
                                      <span className="text-xs text-[#111827]">{metaInfo.themeColor}</span>
                                    </div>
                                  </div>
                                )}
                                {metaInfo.favicon && (
                                  <div>
                                    <div className="text-xs font-semibold text-[#6B7280] mb-1">Favicon</div>
                                    <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded truncate">✓ Set</div>
                                  </div>
                                )}
                                {metaInfo.appleTouchIcon && (
                                  <div>
                                    <div className="text-xs font-semibold text-[#6B7280] mb-1">Apple Icon</div>
                                    <div className="text-xs text-[#111827] bg-[#F9FAFB] px-3 py-2 rounded truncate">✓ Set</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Performance & Analytics Section */}
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
                              
                              {/* Analytics Services */}
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

                              {/* Performance Hints */}
                              {(metaInfo.preconnects.length > 0 || metaInfo.dnsPrefetch.length > 0) && (
                                <div>
                                  <div className="text-xs font-semibold text-[#6B7280] mb-1">Performance Hints</div>
                                  <div className="bg-[#F9FAFB] px-3 py-2 rounded space-y-1">
                                    {metaInfo.preconnects.length > 0 && (
                                      <div className="text-xs text-[#111827]">
                                        <span className="font-semibold">Preconnect:</span> {metaInfo.preconnects.length} domains
                                      </div>
                                    )}
                                    {metaInfo.dnsPrefetch.length > 0 && (
                                      <div className="text-xs text-[#111827]">
                                        <span className="font-semibold">DNS Prefetch:</span> {metaInfo.dnsPrefetch.length} domains
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Sitemap View */}
            {type === 'sitemap' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    Sitemap Analysis
                  </label>
                  <div className="border border-[#E5E5E5] rounded-lg bg-[#F9FAFB] p-4 max-h-[500px] overflow-y-auto thin-scrollbar">
                    {(() => {
                      if (!content) return <p className="text-[#9CA3AF] italic text-sm text-center py-10">No sitemap data stored.</p>;
                      try {
                        const data = JSON.parse(content);
                        const isCategorized = data.categorizedUrls && !Array.isArray(data);
                        const urls = isCategorized ? data.urls : data;
                        const categories = isCategorized ? data.categorizedUrls : null;

                        return (
                          <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
                              <p className="text-[10px] font-bold text-[#111827] uppercase tracking-widest">
                                Total URLs: {urls.length}
                              </p>
                              {isCategorized && (
                                <span className="text-[9px] font-bold bg-[#9A8FEA]/10 text-[#9A8FEA] px-2 py-0.5 rounded-full">
                                  AUTO-CATEGORIZED
                                </span>
                              )}
                            </div>

                            {/* Category Pills */}
                            {isCategorized && (
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(categories).map(([cat, list]: [string, any]) => (
                                  list.length > 0 && (
                                    <div key={cat} className="flex items-center gap-1.5 bg-white border border-[#F0F0F0] px-2 py-1 rounded-lg">
                                      <span className="text-[10px] font-bold text-[#374151] uppercase">{cat}</span>
                                      <span className="text-[9px] font-medium text-[#9CA3AF] bg-[#FAFAFA] px-1.5 py-0.5 rounded-md border border-[#F5F5F5]">{list.length}</span>
                                    </div>
                                  )
                                ))}
                              </div>
                            )}

                            {/* URL List */}
                            <div className="space-y-4">
                              {isCategorized ? (
                                Object.entries(categories).map(([cat, list]: [string, any]) => (
                                  list.length > 0 && (
                                    <div key={cat} className="space-y-1.5">
                                      <h4 className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-tighter flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#9AD6FF]"></span>
                                        {cat} Pages
                                      </h4>
                                      <div className="grid grid-cols-1 gap-1 pl-3 border-l border-[#F0F0F0]">
                                        {list.slice(0, 50).map((url: string, i: number) => (
                                          <div key={i} className="text-[11px] text-[#4B5563] truncate font-mono hover:text-[#9A8FEA] cursor-default" title={url}>
                                            {url}
                                          </div>
                                        ))}
                                        {list.length > 50 && (
                                          <div className="text-[10px] text-[#9CA3AF] italic pl-1">
                                            + {list.length - 50} more urls...
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                ))
                              ) : (
                                <div className="grid grid-cols-1 gap-1">
                                  {urls.map((url: string, i: number) => (
                                    <div key={i} className="text-[11px] text-[#4B5563] truncate font-mono" title={url}>
                                      {i + 1}. {url}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      } catch (e) {
                        return <p className="text-red-500 text-xs font-mono">Error parsing sitemap JSON: {e instanceof Error ? e.message : 'Unknown error'}</p>;
                      }
                    })()}
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-3 bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                    <span className="font-bold text-blue-600 mr-1">NOTE:</span>
                    Sitemap data is acquired via the <strong>"Site Context Acquisition"</strong> skill. It is automatically categorized by path structure (Blog, Product, etc.) to help the AI map your topic clusters more accurately.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#374151] hover:bg-[#F3F4F6] rounded-lg transition-colors"
            >
              Cancel
            </button>
            {type !== 'sitemap' && (
              <button
                type="submit"
                disabled={isUploading}
                className="px-6 py-2 text-sm font-medium text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)',
                }}
              >
                {isUploading ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

