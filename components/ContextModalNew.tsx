'use client';

import { useState, useEffect, useRef } from 'react';
import type { SiteContext } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { generateHeaderHTML } from '@/lib/templates/default-header';
import { generateFooterHTML } from '@/lib/templates/default-footer';
import { BrandSiteSection } from './context-modal';

/**
 * Ensure logo URL is absolute by prepending domain if it's a relative path
 */
function ensureAbsoluteLogoUrl(logoUrl: string | null | undefined, domainName: string | undefined): string {
  if (!logoUrl) return '';
  
  // Already absolute URL
  if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
    return logoUrl;
  }
  
  // Data URI - return as is
  if (logoUrl.startsWith('data:')) {
    return logoUrl;
  }
  
  // Relative path - needs domain to make absolute
  if (domainName) {
    const baseUrl = domainName.startsWith('http') ? domainName : `https://${domainName}`;
    const normalizedBase = baseUrl.replace(/\/$/, '');
    const normalizedPath = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
    return `${normalizedBase}${normalizedPath}`;
  }
  
  // No domain available, return as is (will be relative)
  return logoUrl;
}

interface ContextModalNewProps {
  isOpen: boolean;
  onClose: () => void;
  siteContexts: SiteContext[];
  onSave: (data: {
    type: SiteContext['type'];
    content?: string;
    fileUrl?: string;
    html?: string;
    domainName?: string;
    ogImage?: string;
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    headingFont?: string;
    bodyFont?: string;
    languages?: string;
  }) => Promise<void>;
  onRefresh?: () => Promise<void>;
  projectId?: string;
  initialTab?: 'brand' | 'competitors';
}

// Crawl mode type
type CrawlMode = 'incremental' | 'full';

// Crawl status type
interface CrawlStatus {
  isRunning: boolean;
  currentStep: string;
  progress: number;
  results: {
    'brand-assets'?: { success?: boolean; skipped?: boolean; extracted?: number; error?: string };
    'header'?: { success?: boolean; skipped?: boolean; navItems?: number; error?: string };
    'footer'?: { success?: boolean; skipped?: boolean; columns?: number; error?: string };
  };
  error?: string;
}

export default function ContextModalNew({
  isOpen,
  onClose,
  siteContexts,
  onSave,
  onRefresh,
  projectId,
  initialTab = 'brand',
}: ContextModalNewProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  // Auto-crawl states
  const [showCrawlPanel, setShowCrawlPanel] = useState(false);
  const [crawlUrl, setCrawlUrl] = useState('');
  const [crawlMode, setCrawlMode] = useState<CrawlMode>('incremental');
  const [crawlStatus, setCrawlStatus] = useState<CrawlStatus>({
    isRunning: false,
    currentStep: '',
    progress: 0,
    results: {},
  });

  // File states (simplified - single logo/favicon)
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [ogImageFile, setOgImageFile] = useState<File | null>(null);
  const [ogImagePreview, setOgImagePreview] = useState<string | null>(null);
  
  // Brand settings states (simplified)
  const [domainName, setDomainName] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [headingFont, setHeadingFont] = useState('');
  const [bodyFont, setBodyFont] = useState('');
  const [languages, setLanguages] = useState('');
  const [headerConfig, setHeaderConfig] = useState<any>(null);
  const [footerConfig, setFooterConfig] = useState<any>(null);
  
  // Refs for scrolling
  const brandAssetsRef = useRef<HTMLDivElement>(null);
  const colorsRef = useRef<HTMLDivElement>(null);
  const typographyRef = useRef<HTMLDivElement>(null);
  const languagesRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  // Get contexts
  const logoContext = siteContexts.find(c => c.type === 'logo');
  const userLogoUrl = logoContext?.logo_url || logoContext?.logo_light_url || logoContext?.file_url || null;

  // Initialize states when modal opens
  useEffect(() => {
    if (isOpen) {
      if (logoContext) {
        const ctx = logoContext as any;
        setDomainName(ctx.domain_name || '');
        setOgImage(ctx.og_image || '');
        // Use logo_url first, fallback to legacy fields
        setLogoUrl(ctx.logo_url || ctx.logo_light_url || ctx.file_url || '');
        setFaviconUrl(ctx.favicon_url || ctx.favicon_light_url || '');
        setPrimaryColor(ctx.primary_color || '');
        setSecondaryColor(ctx.secondary_color || '');
        setHeadingFont(ctx.heading_font || '');
        setBodyFont(ctx.body_font || '');
        setLanguages(ctx.languages || '');
        
        // Reset file states
        setLogoFile(null);
        setFaviconFile(null);
        setLogoPreview(null);
        setFaviconPreview(null);
      }
    }
  }, [isOpen, siteContexts, logoContext]);

  // File preview handlers (simplified)
  const handleLogoFileChange = (file: File | null) => {
    setLogoFile(file);
    if (file) setLogoPreview(URL.createObjectURL(file));
  };
  const handleFaviconFileChange = (file: File | null) => {
    setFaviconFile(file);
    if (file) setFaviconPreview(URL.createObjectURL(file));
  };
  const handleOgImageFileChange = (file: File | null) => {
    setOgImageFile(file);
    if (file) setOgImagePreview(URL.createObjectURL(file));
  };

  // Initialize crawlUrl from domainName when it changes
  useEffect(() => {
    if (domainName && !crawlUrl) {
      setCrawlUrl(domainName.startsWith('http') ? domainName : `https://${domainName}`);
    }
  }, [domainName, crawlUrl]);

  // Auto-crawl handler
  const handleCrawl = async () => {
    if (!crawlUrl) {
      alert('Please enter a website URL');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      alert('Please log in to use this feature');
      return;
    }

    setCrawlStatus({
      isRunning: true,
      currentStep: 'Connecting to website...',
      progress: 10,
      results: {},
    });

    try {
      setCrawlStatus(prev => ({ ...prev, currentStep: 'Fetching page content...', progress: 20 }));

      const response = await fetch('/api/crawl-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          url: crawlUrl,
          userId: session.user.id,
          projectId,
          mode: crawlMode,
        }),
      });

      setCrawlStatus(prev => ({ ...prev, currentStep: 'Analyzing content...', progress: 50 }));

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Crawl failed');
      }

      setCrawlStatus({
        isRunning: false,
        currentStep: 'Complete!',
        progress: 100,
        results: result.fields || {},
      });

      // Refresh the context data
      if (onRefresh) {
        await onRefresh();
      }

      // Update local state from results
      if (result.fields?.['brand-assets']?.data) {
        const data = result.fields['brand-assets'].data;
        if (data.domain_name) setDomainName(data.domain_name);
        if (data.og_image) setOgImage(data.og_image);
        // Use simplified logo_url and favicon_url fields
        if (data.logo_url) setLogoUrl(data.logo_url);
        if (data.favicon_url) setFaviconUrl(data.favicon_url);
        if (data.primary_color) setPrimaryColor(data.primary_color);
        if (data.secondary_color) setSecondaryColor(data.secondary_color);
        if (data.heading_font) setHeadingFont(data.heading_font);
        if (data.body_font) setBodyFont(data.body_font);
        if (data.languages) setLanguages(data.languages);
      }

    } catch (error: any) {
      console.error('[handleCrawl] Error:', error);
      setCrawlStatus({
        isRunning: false,
        currentStep: '',
        progress: 0,
        results: {},
        error: error.message || 'Failed to crawl website',
      });
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authHeaders: HeadersInit = {};
      if (session?.access_token) {
        authHeaders['Authorization'] = `Bearer ${session.access_token}`;
      }

      const uploadFile = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        const uploadResponse = await fetch('/api/upload-logo', {
          method: 'POST',
          body: formData,
          headers: authHeaders,
        });
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.details || 'Failed to upload file');
        }
        const uploadData = await uploadResponse.json();
        return uploadData.url;
      };

      let finalLogoUrl = logoUrl;
      let finalFaviconUrl = faviconUrl;
      let finalOgImage = ogImage;

      if (logoFile) finalLogoUrl = await uploadFile(logoFile);
      if (faviconFile) finalFaviconUrl = await uploadFile(faviconFile);
      if (ogImageFile) finalOgImage = await uploadFile(ogImageFile);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...authHeaders,
      };

      // Save logo/brand settings (simplified)
      await fetch('/api/site-contexts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: 'logo',
          domainName,
          ogImage: finalOgImage,
          logoUrl: finalLogoUrl,
          faviconUrl: finalFaviconUrl,
          primaryColor,
          secondaryColor,
          headingFont,
          bodyFont,
          languages,
          projectId,
        }),
      });

      // Save header config + HTML
      if (headerConfig) {
        // Ensure logo URL is absolute before saving
        const headerConfigWithAbsoluteLogo = {
          ...headerConfig,
          logo: ensureAbsoluteLogoUrl(headerConfig.logo, domainName),
        };
        await onSave({
          type: 'header',
          content: JSON.stringify(headerConfigWithAbsoluteLogo),
          html: generateHeaderHTML(headerConfigWithAbsoluteLogo),
        });
      }

      // Save footer config + HTML
      if (footerConfig) {
        // Ensure logo URL is absolute before saving
        const footerConfigWithAbsoluteLogo = {
          ...footerConfig,
          logo: ensureAbsoluteLogoUrl(footerConfig.logo, domainName),
        };
        await onSave({
          type: 'footer',
          content: JSON.stringify(footerConfigWithAbsoluteLogo),
          html: generateFooterHTML(footerConfigWithAbsoluteLogo),
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving context:', error);
      alert(error instanceof Error ? error.message : 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to check if a context field has value
  const hasContextValue = (field: string): boolean => {
    const hasStringValue = (value: string | null | undefined): boolean => {
      return !!value && value.trim().length > 0;
    };

    switch (field) {
      case 'domain':
        return hasStringValue(logoContext?.domain_name);
      case 'logo':
        return hasStringValue(logoContext?.logo_url) || hasStringValue(logoContext?.logo_light_url) || hasStringValue(logoContext?.file_url);
      case 'colors':
        return hasStringValue(logoContext?.primary_color) || hasStringValue(logoContext?.secondary_color);
      case 'typography':
        return hasStringValue(logoContext?.heading_font) || hasStringValue(logoContext?.body_font);
      case 'languages':
        return hasStringValue(logoContext?.languages);
      case 'header':
        const headerContext = siteContexts.find(c => c.type === 'header');
        return hasStringValue(headerContext?.content) || hasStringValue(headerContext?.html);
      case 'footer':
        const footerContext = siteContexts.find(c => c.type === 'footer');
        return hasStringValue(footerContext?.content) || hasStringValue(footerContext?.html);
      default:
        return false;
    }
  };

  // Status indicator component
  const StatusDot = ({ filled }: { filled: boolean }) => (
    <span className={`w-1.5 h-1.5 rounded-full ${filled ? 'bg-green-500' : 'bg-red-500'}`} title={filled ? 'Filled' : 'Not filled'}></span>
  );

  if (!isOpen) return null;

  // Sidebar items matching the right-side content sections
  const sidebarItems = [
    { key: 'domain', label: 'Domain', ref: brandAssetsRef },
    { key: 'logo', label: 'Logo, Favicon & OG', ref: brandAssetsRef },
    { key: 'colors', label: 'Colors', ref: colorsRef },
    { key: 'typography', label: 'Typography', ref: typographyRef },
    { key: 'languages', label: 'Languages', ref: languagesRef },
    { key: 'header', label: 'Header', ref: headerRef },
    { key: 'footer', label: 'Footer', ref: footerRef },
  ];

  // Scroll to section handler
  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-5xl h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9A8FEA] to-[#6366F1] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#111827]">Brand Assets</h2>
              <p className="text-xs text-[#6B7280]">Configure your brand and site settings</p>
            </div>
          </div>
          
          {/* Action Buttons - Moved to header for visibility */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCrawlPanel(!showCrawlPanel)}
              className={`py-1.5 px-3 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                showCrawlPanel 
                  ? 'bg-[#111827] text-white' 
                  : 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Auto-Fetch
            </button>
            
            <button
              type="submit"
              form="context-form"
              disabled={isSaving}
              className="py-1.5 px-4 bg-[#111827] text-white text-xs font-medium rounded-lg hover:bg-[#1F2937] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    <polyline points="17,21 17,13 7,13 7,21" />
                    <polyline points="7,3 7,8 15,8" />
                  </svg>
                  Save All
                </>
              )}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form id="context-form" onSubmit={handleSaveAll} className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-48 border-r border-[#E5E5E5] bg-[#FAFAFA] flex flex-col shrink-0">
            <div className="flex-1 overflow-y-auto p-3">
              <nav className="space-y-0.5">
                {sidebarItems.map((item) => (
                  <button
                    type="button"
                    key={item.key}
                    onClick={() => scrollToSection(item.ref)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#374151] rounded-lg hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                  >
                    <span>{item.label}</span>
                    <StatusDot filled={hasContextValue(item.key)} />
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Auto-Fetch Panel */}
            {showCrawlPanel && (
              <div className="mb-6 p-4 bg-[#FAFAFA] rounded-xl border border-[#E5E5E5]">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <h3 className="text-sm font-bold text-[#111827]">Auto-Fetch from Website</h3>
                </div>
                
                <p className="text-xs text-[#6B7280] mb-3">
                  Automatically crawl your website to extract brand assets, header, and footer.
                </p>
                
                {/* URL Input */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    value={crawlUrl}
                    onChange={(e) => setCrawlUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="flex-1 px-3 py-2 text-sm border border-[#D1D5DB] rounded-lg focus:ring-2 focus:ring-[#111827] focus:border-transparent outline-none"
                    disabled={crawlStatus.isRunning}
                  />
                </div>
                
                {/* Mode Selection */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setCrawlMode('incremental')}
                    disabled={crawlStatus.isRunning}
                    className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
                      crawlMode === 'incremental'
                        ? 'bg-[#111827] text-white'
                        : 'bg-white text-[#374151] border border-[#D1D5DB] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      <span>Fill Empty Only</span>
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">Only update empty fields</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCrawlMode('full')}
                    disabled={crawlStatus.isRunning}
                    className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
                      crawlMode === 'full'
                        ? 'bg-[#111827] text-white'
                        : 'bg-white text-[#374151] border border-[#D1D5DB] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                      </svg>
                      <span>Full Refresh</span>
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">Overwrite all fields</div>
                  </button>
                </div>
                
                {/* Crawl Button */}
                <button
                  type="button"
                  onClick={handleCrawl}
                  disabled={crawlStatus.isRunning || !crawlUrl}
                  className="w-full py-2.5 px-4 bg-[#111827] text-white text-sm font-medium rounded-lg hover:bg-[#1F2937] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {crawlStatus.isRunning ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>{crawlStatus.currentStep}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Start Crawling</span>
                    </>
                  )}
                </button>
                
                {/* Progress Bar */}
                {crawlStatus.isRunning && (
                  <div className="mt-3">
                    <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#111827] transition-all duration-300"
                        style={{ width: `${crawlStatus.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Results */}
                {!crawlStatus.isRunning && Object.keys(crawlStatus.results).length > 0 && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-[#E5E7EB]">
                    <h4 className="text-xs font-semibold text-[#111827] mb-2">Results</h4>
                    <div className="space-y-1.5">
                      {Object.entries(crawlStatus.results).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-[#6B7280] capitalize">{key.replace('-', ' ')}</span>
                          {value.skipped ? (
                            <span className="text-[#9CA3AF]">Skipped (has value)</span>
                          ) : value.success ? (
                            <span className="text-[#10B981] flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                              {(value as any).extracted ? `${(value as any).extracted} fields` : 
                               (value as any).navItems ? `${(value as any).navItems} nav items` :
                               (value as any).columns ? `${(value as any).columns} columns` : 'Done'}
                            </span>
                          ) : (
                            <span className="text-[#EF4444]">{value.error || 'Failed'}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Error */}
                {crawlStatus.error && (
                  <div className="mt-3 p-3 bg-[#FEF2F2] rounded-lg border border-[#FECACA]">
                    <div className="flex items-center gap-2 text-[#DC2626] text-xs">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4M12 16h.01" />
                      </svg>
                      <span>{crawlStatus.error}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <BrandSiteSection
                siteContexts={siteContexts}
                domainName={domainName}
                setDomainName={setDomainName}
                ogImage={ogImage}
                setOgImage={setOgImage}
                onOgImageFileChange={handleOgImageFileChange}
                ogImagePreview={ogImagePreview}
                logoUrl={logoUrl}
                setLogoUrl={setLogoUrl}
                faviconUrl={faviconUrl}
                setFaviconUrl={setFaviconUrl}
                onLogoFileChange={handleLogoFileChange}
                onFaviconFileChange={handleFaviconFileChange}
                logoPreview={logoPreview}
                faviconPreview={faviconPreview}
                primaryColor={primaryColor}
                setPrimaryColor={setPrimaryColor}
                secondaryColor={secondaryColor}
                setSecondaryColor={setSecondaryColor}
                headingFont={headingFont}
                setHeadingFont={setHeadingFont}
                bodyFont={bodyFont}
                setBodyFont={setBodyFont}
                languages={languages}
                setLanguages={setLanguages}
                userLogoUrl={userLogoUrl}
                setHeaderConfig={setHeaderConfig}
                setFooterConfig={setFooterConfig}
                brandAssetsRef={brandAssetsRef}
                colorsRef={colorsRef}
                typographyRef={typographyRef}
                languagesRef={languagesRef}
                headerRef={headerRef}
                footerRef={footerRef}
              />
          </div>
        </form>
      </div>
    </div>
  );
}
