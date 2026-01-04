'use client';

import { useState, useEffect, useRef } from 'react';
import type { SiteContext } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import LogoEditor from './context-editors/LogoEditor';
import HeaderEditor from './context-editors/HeaderEditor';
import FooterEditor from './context-editors/FooterEditor';
import MetaEditor from './context-editors/MetaEditor';
import SitemapViewer from './context-editors/SitemapViewer';
import { generateHeaderHTML } from '@/lib/templates/default-header';
import { generateFooterHTML } from '@/lib/templates/default-footer';

interface ContextModalNewProps {
  isOpen: boolean;
  onClose: () => void;
  siteContexts: SiteContext[];
  onSave: (data: {
    type: 'logo' | 'header' | 'footer' | 'meta' | 'sitemap';
    content?: string;
    fileUrl?: string;
  }) => Promise<void>;
}

type TabType = 'onsite' | 'offsite' | 'knowledge';

export default function ContextModalNew({
  isOpen,
  onClose,
  siteContexts,
  onSave,
}: ContextModalNewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('onsite');
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#9A8FEA');
  const [secondaryColor, setSecondaryColor] = useState('#FF5733');
  const [typography, setTypography] = useState('');
  const [tone, setTone] = useState('');
  const [languages, setLanguages] = useState('');
  const [headerConfig, setHeaderConfig] = useState<any>(null);
  const [footerConfig, setFooterConfig] = useState<any>(null);
  const [metaContent, setMetaContent] = useState('');

  // Refs for scrolling
  const brandAssetsRef = useRef<HTMLDivElement>(null);
  const colorsRef = useRef<HTMLDivElement>(null);
  const typographyRef = useRef<HTMLDivElement>(null);
  const toneRef = useRef<HTMLDivElement>(null);
  const languagesRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const sitemapRef = useRef<HTMLDivElement>(null);

  // Get contexts by type
  const logoContext = siteContexts.find(c => c.type === 'logo');
  const headerContext = siteContexts.find(c => c.type === 'header');
  const footerContext = siteContexts.find(c => c.type === 'footer');
  const metaContext = siteContexts.find(c => c.type === 'meta');
  const sitemapContext = siteContexts.find(c => c.type === 'sitemap');

  const userLogoUrl = logoContext?.file_url || null;

  // Initialize states when modal opens
  useEffect(() => {
    if (isOpen) {
      setLogoPreviewUrl(logoContext?.file_url || null);
      setMetaContent(metaContext?.content || '');
      
      // Load brand asset fields from logo context
      if (logoContext) {
        setPrimaryColor((logoContext as any).primary_color || '#9A8FEA');
        setSecondaryColor((logoContext as any).secondary_color || '#FF5733');
        setTypography((logoContext as any).heading_font || '');
        setTone((logoContext as any).tone || '');
        setLanguages((logoContext as any).languages || '');
      }
    }
  }, [isOpen, logoContext, metaContext]);

  const handleLogoChange = (file: File | null, previewUrl: string | null) => {
    setLogoFile(file);
    setLogoPreviewUrl(previewUrl);
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Save logo if changed
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);

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
          throw new Error(errorData.details || 'Failed to upload logo');
        }

        const uploadData = await uploadResponse.json();
        await onSave({ type: 'logo', fileUrl: uploadData.url });
      }

      // Save brand asset fields (stored in a general context type or with logo)
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Save brand colors, typography, tone, languages
      await fetch('/api/site-contexts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: 'logo', // Store brand assets with logo type
          primaryColor,
          secondaryColor,
          headingFont: typography,
          bodyFont: typography, // Using same for now, can split later
          tone,
          languages,
        }),
      });

      // Save header if configured
      if (headerConfig) {
        await onSave({
          type: 'header',
          content: generateHeaderHTML(headerConfig),
        });
      }

      // Save footer if configured
      if (footerConfig) {
        await onSave({
          type: 'footer',
          content: generateFooterHTML(footerConfig),
        });
      }

      // Save meta if changed
      if (metaContent) {
        await onSave({
          type: 'meta',
          content: metaContent,
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

  if (!isOpen) return null;

  const navigationItems = [
    { label: 'Brand Assets', ref: brandAssetsRef, icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    )},
    { label: 'Colors', ref: colorsRef, indent: true },
    { label: 'Typography', ref: typographyRef, indent: true },
    { label: 'Tone & Voice', ref: toneRef, indent: true },
    { label: 'Languages', ref: languagesRef, indent: true },
    { label: 'Site Elements', ref: headerRef, icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
      </svg>
    )},
    { label: 'Header', ref: headerRef, indent: true },
    { label: 'Footer', ref: footerRef, indent: true },
    { label: 'Meta Tags', ref: metaRef, indent: true },
    { label: 'Sitemap', ref: sitemapRef, indent: true },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E5E5] shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-[#111827] mb-1">
                Context Wizard
              </h2>
              <p className="text-sm text-[#6B7280] leading-relaxed max-w-3xl">
                Define your brand identity, products, team, competitive positioning, and upload supporting knowledge to power smarter agent decisions.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#F3F4F6] rounded transition-colors ml-4 shrink-0"
            >
              <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E5E5E5] shrink-0 px-6">
          <button
            onClick={() => setActiveTab('onsite')}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'onsite'
                ? 'text-[#111827]'
                : 'text-[#9CA3AF] hover:text-[#6B7280]'
            }`}
          >
            On Site
            {activeTab === 'onsite' && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{
                  background: 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)',
                }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('offsite')}
            disabled
            className="px-4 py-3 text-sm font-medium text-[#9CA3AF] opacity-50 cursor-not-allowed relative"
          >
            Off Site
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[9px] font-bold">Soon</span>
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            disabled
            className="px-4 py-3 text-sm font-medium text-[#9CA3AF] opacity-50 cursor-not-allowed relative"
          >
            Knowledge
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[9px] font-bold">Soon</span>
          </button>
        </div>

        {/* Content with Navigation */}
        <div className="flex flex-1 min-h-0">
          {/* Left Navigation */}
          <div className="w-48 border-r border-[#E5E5E5] overflow-y-auto thin-scrollbar shrink-0">
            <div className="p-3 space-y-0.5">
              {navigationItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => scrollToSection(item.ref)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-colors hover:bg-[#F3F4F6] ${
                    item.indent ? 'pl-8 text-[#6B7280]' : 'font-medium text-[#374151]'
                  }`}
                >
                  {item.icon && item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <form onSubmit={handleSaveAll} className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto p-6 thin-scrollbar">
              {activeTab === 'onsite' && (
                <div className="space-y-8 max-w-4xl">
                  {/* Brand Assets Section */}
                  <div ref={brandAssetsRef}>
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <h3 className="text-base font-bold text-[#111827]">Brand Assets</h3>
                    </div>
                    
                    <div className="space-y-4 pl-7">
                      {/* Logo */}
                      <LogoEditor
                        logoUrl={userLogoUrl || undefined}
                        onLogoChange={handleLogoChange}
                      />

                      {/* Colors & Typography - Two columns */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Colors */}
                        <div ref={colorsRef}>
                          <label className="block text-sm font-medium text-[#374151] mb-2">
                            Brand Colors
                          </label>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-[#6B7280] mb-1">Primary Color</label>
                              <div className="flex gap-2 items-center">
                                <input
                                  type="color"
                                  value={primaryColor}
                                  onChange={(e) => setPrimaryColor(e.target.value)}
                                  className="w-10 h-10 rounded border border-[#E5E5E5] cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={primaryColor}
                                  onChange={(e) => setPrimaryColor(e.target.value)}
                                  className="flex-1 px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] font-mono"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-[#6B7280] mb-1">Secondary Color</label>
                              <div className="flex gap-2 items-center">
                                <input
                                  type="color"
                                  value={secondaryColor}
                                  onChange={(e) => setSecondaryColor(e.target.value)}
                                  className="w-10 h-10 rounded border border-[#E5E5E5] cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={secondaryColor}
                                  onChange={(e) => setSecondaryColor(e.target.value)}
                                  className="flex-1 px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Typography */}
                        <div ref={typographyRef}>
                          <label className="block text-sm font-medium text-[#374151] mb-2">
                            Typography
                          </label>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-[#6B7280] mb-1">Heading Font</label>
                              <input
                                type="text"
                                value={typography}
                                onChange={(e) => setTypography(e.target.value)}
                                placeholder="e.g., Inter"
                                className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-[#6B7280] mb-1">Body Font</label>
                              <input
                                type="text"
                                placeholder="e.g., Roboto"
                                className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tone & Voice */}
                      <div ref={toneRef}>
                        <label className="block text-sm font-medium text-[#374151] mb-2">
                          Tone & Voice
                        </label>
                        <textarea
                          value={tone}
                          onChange={(e) => setTone(e.target.value)}
                          placeholder="e.g., Professional, friendly, conversational, technical..."
                          rows={3}
                          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] focus:border-transparent resize-none"
                        />
                      </div>

                      {/* Languages */}
                      <div ref={languagesRef}>
                        <label className="block text-sm font-medium text-[#374151] mb-2">
                          Languages
                        </label>
                        <input
                          type="text"
                          value={languages}
                          onChange={(e) => setLanguages(e.target.value)}
                          placeholder="e.g., English, Chinese, Spanish"
                          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Site Elements Section */}
                  <div className="border-t border-[#E5E5E5] pt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="9" y1="3" x2="9" y2="21" />
                      </svg>
                      <h3 className="text-base font-bold text-[#111827]">Site Elements</h3>
                    </div>
                    
                    <div className="space-y-6 pl-7">
                      {/* Header */}
                      <div ref={headerRef}>
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="3" y1="9" x2="21" y2="9" />
                          </svg>
                          <h4 className="text-sm font-semibold text-[#374151]">Header</h4>
                        </div>
                        <HeaderEditor
                          logoUrl={userLogoUrl || undefined}
                          onConfigChange={setHeaderConfig}
                        />
                      </div>

                      {/* Footer */}
                      <div ref={footerRef} className="border-t border-[#E5E5E5] pt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="3" y1="15" x2="21" y2="15" />
                          </svg>
                          <h4 className="text-sm font-semibold text-[#374151]">Footer</h4>
                        </div>
                        <FooterEditor
                          logoUrl={userLogoUrl || undefined}
                          onConfigChange={setFooterConfig}
                        />
                      </div>

                      {/* Meta Tags */}
                      <div ref={metaRef} className="border-t border-[#E5E5E5] pt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="16 18 22 12 16 6" />
                            <polyline points="8 6 2 12 8 18" />
                          </svg>
                          <h4 className="text-sm font-semibold text-[#374151]">Meta Tags</h4>
                        </div>
                        <MetaEditor
                          initialContent={metaContext?.content || undefined}
                          onContentChange={setMetaContent}
                        />
                      </div>

                      {/* Sitemap */}
                      <div ref={sitemapRef} className="border-t border-[#E5E5E5] pt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 3v18h18" />
                            <path d="M18 17V9" />
                            <path d="M13 17V5" />
                            <path d="M8 17v-3" />
                          </svg>
                          <h4 className="text-sm font-semibold text-[#374151]">Sitemap</h4>
                        </div>
                        <SitemapViewer content={sitemapContext?.content || undefined} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'offsite' && (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-[#9CA3AF] italic">Off Site features coming soon</p>
                </div>
              )}

              {activeTab === 'knowledge' && (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-[#9CA3AF] italic">Knowledge base features coming soon</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#374151] hover:bg-[#F3F4F6] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 text-sm font-medium text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)',
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
