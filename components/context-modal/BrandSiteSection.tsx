'use client';

import { useState, useEffect } from 'react';
import HeaderEditor from '../context-editors/HeaderEditor';
import FooterEditor from '../context-editors/FooterEditor';
import SitemapViewer from '../context-editors/SitemapViewer';
import type { BrandSiteSectionProps } from './types';

// Asset Upload Field Component
const AssetUploadField = ({ 
  label, 
  value, 
  onChange, 
  onFileChange, 
  previewUrl, 
  placeholder,
  id
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void;
  onFileChange: (file: File | null) => void;
  previewUrl: string | null;
  placeholder: string;
  id: string;
}) => {
  const [previewState, setPreviewState] = useState<'loading' | 'error' | 'success' | 'none'>('none');
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileChange(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setDisplayUrl(url);
      setPreviewState('success');
    }
  };

  const handleUrlChange = (newUrl: string) => {
    onChange(newUrl);
    if (newUrl.trim()) {
      setPreviewState('loading');
      setDisplayUrl(newUrl);
    } else {
      setPreviewState('none');
      setDisplayUrl(null);
    }
  };

  const handleImageLoad = () => {
    setPreviewState('success');
  };

  const handleImageError = () => {
    setPreviewState('error');
  };

  // Initial preview URL
  const currentPreviewUrl = previewUrl || displayUrl || (value.trim() ? value : null);

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[#374151]">{label}</label>
      <div className="flex gap-2">
        {/* Preview Box */}
        <div className="w-12 h-12 border border-[#E5E5E5] rounded-lg flex items-center justify-center bg-[#F9FAFB] flex-shrink-0 overflow-hidden">
          {currentPreviewUrl ? (
            <>
              {previewState === 'loading' && (
                <span className="text-[10px] text-[#9CA3AF]">Loading</span>
              )}
              {previewState === 'error' && (
                <span className="text-[10px] text-red-500">Preview Error</span>
              )}
              <img 
                src={currentPreviewUrl} 
                alt={label}
                className={`max-w-full max-h-full object-contain ${previewState !== 'success' ? 'hidden' : ''}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </>
          ) : (
            <span className="text-[10px] text-[#9CA3AF]">No preview</span>
          )}
        </div>
        
        {/* Input & Upload */}
        <div className="flex-1 space-y-1.5">
          <input
            type="text"
            value={value}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-2.5 py-1.5 text-xs border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA] focus:border-transparent"
          />
          <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-[#6B7280] hover:text-[#374151]">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id={id}
            />
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            <span>Upload file</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default function BrandSiteSection({
  siteContexts,
  showDebugInfo = false,
  metaTitle,
  setMetaTitle,
  metaDescription,
  setMetaDescription,
  metaKeywords,
  setMetaKeywords,
  domainName,
  setDomainName,
  ogImage,
  setOgImage,
  onOgImageFileChange,
  ogImagePreview,
  logoLightUrl,
  setLogoLightUrl,
  logoDarkUrl,
  setLogoDarkUrl,
  faviconLightUrl,
  setFaviconLightUrl,
  faviconDarkUrl,
  setFaviconDarkUrl,
  onLogoLightFileChange,
  onLogoDarkFileChange,
  onFaviconLightFileChange,
  onFaviconDarkFileChange,
  logoLightPreview,
  logoDarkPreview,
  faviconLightPreview,
  faviconDarkPreview,
  primaryColor,
  setPrimaryColor,
  secondaryColor,
  setSecondaryColor,
  headingFont,
  setHeadingFont,
  bodyFont,
  setBodyFont,
  tone,
  setTone,
  languages,
  setLanguages,
  userLogoUrl,
  setHeaderConfig,
  setFooterConfig,
  brandAssetsRef,
  colorsRef,
  typographyRef,
  toneRef,
  languagesRef,
  headerRef,
  footerRef,
  sitemapRef,
}: BrandSiteSectionProps) {
  const sitemapContext = siteContexts.find(c => c.type === 'sitemap');
  const logoContext = siteContexts.find(c => c.type === 'logo');
  const headerContext = siteContexts.find(c => c.type === 'header');
  const footerContext = siteContexts.find(c => c.type === 'footer');

  // State for header and footer initial config
  const [headerInitialConfig, setHeaderInitialConfig] = useState<any>(null);
  const [footerInitialConfig, setFooterInitialConfig] = useState<any>(null);

  // Parse header and footer data from siteContexts
  useEffect(() => {
    if (headerContext?.content) {
      try {
        const parsedHeader = JSON.parse(headerContext.content);
        // Transform API format to HeaderEditor format
        // Use primaryColor from colors if available, otherwise default to dark
        setHeaderInitialConfig({
          siteName: logoContext?.brand_name || '',
          logo: logoLightUrl || '',
          navigation: parsedHeader.navigation?.map((nav: any) => ({
            label: nav.text,
            url: nav.url
          })) || [],
          ctaButton: {
            label: parsedHeader.ctaText || 'Get Started',
            url: '#',
            color: primaryColor || '#111827',
          },
        });
      } catch (err) {
        console.error('Failed to parse header content:', err);
      }
    }
  }, [headerContext, logoContext, logoLightUrl, primaryColor]);

  useEffect(() => {
    if (footerContext?.content) {
      try {
        const parsedFooter = JSON.parse(footerContext.content);
        // Transform API format to FooterEditor format
        // Use white background by default, with dark text
        setFooterInitialConfig({
          companyName: logoContext?.brand_name || '',
          tagline: metaDescription || '',
          backgroundColor: '#FFFFFF',
          textColor: '#374151',
          columns: parsedFooter.columns?.map((col: any) => ({
            title: col.title,
            links: col.links.map((link: any) => ({
              label: link.text,
              url: link.url
            }))
          })) || [],
          socialMedia: parsedFooter.socialLinks?.map((social: any) => ({
            platform: social.platform,
            url: social.url
          })) || [],
        });
      } catch (err) {
        console.error('Failed to parse footer content:', err);
      }
    }
  }, [footerContext, logoContext, metaDescription]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <h3 className="text-base font-bold text-[#111827]">Brand & Site</h3>
      </div>

      {/* Meta Info */}
      <div ref={brandAssetsRef} className="space-y-3 pl-6 mb-5">
        <h4 className="text-xs font-semibold text-[#111827]">Meta Info</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Title</label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Page title"
              className="w-full px-2.5 py-1.5 text-xs border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Keywords</label>
            <input
              type="text"
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              placeholder="keyword1, keyword2, keyword3"
              className="w-full px-2.5 py-1.5 text-xs border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#374151] mb-1">Description</label>
          <textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="Brief description of the page"
            rows={3}
            className="w-full px-2.5 py-1.5 text-xs border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA] resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#374151] mb-1">Domain Name</label>
          <input
            type="text"
            value={domainName}
            onChange={(e) => setDomainName(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-2.5 py-1.5 text-xs border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
          />
        </div>
        <AssetUploadField
          id="og-image"
          label="OG Image"
          value={ogImage}
          onChange={setOgImage}
          onFileChange={onOgImageFileChange}
          previewUrl={ogImagePreview}
          placeholder="https://example.com/og-image.png"
        />
      </div>

      {/* Logo & Favicon */}
      <div className="space-y-3 pl-6 mb-5 pt-5 border-t border-[#F3F4F6]">
        <h4 className="text-xs font-semibold text-[#111827]">Logo & Favicon</h4>
        <div className="grid grid-cols-2 gap-3">
          <AssetUploadField
            id="logo-light"
            label="Light Theme Logo"
            value={logoLightUrl}
            onChange={setLogoLightUrl}
            onFileChange={onLogoLightFileChange}
            previewUrl={logoLightPreview}
            placeholder="https://example.com/logo-light.svg"
          />
          <AssetUploadField
            id="logo-dark"
            label="Dark Theme Logo"
            value={logoDarkUrl}
            onChange={setLogoDarkUrl}
            onFileChange={onLogoDarkFileChange}
            previewUrl={logoDarkPreview}
            placeholder="https://example.com/logo-dark.svg"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <AssetUploadField
            id="favicon-light"
            label="Light Theme Favicon"
            value={faviconLightUrl}
            onChange={setFaviconLightUrl}
            onFileChange={onFaviconLightFileChange}
            previewUrl={faviconLightPreview}
            placeholder="https://example.com/favicon.ico"
          />
          <AssetUploadField
            id="favicon-dark"
            label="Dark Theme Favicon"
            value={faviconDarkUrl}
            onChange={setFaviconDarkUrl}
            onFileChange={onFaviconDarkFileChange}
            previewUrl={faviconDarkPreview}
            placeholder="https://example.com/favicon-dark.ico"
          />
        </div>
      </div>

      {/* Colors */}
      <div ref={colorsRef} className="space-y-3 pl-6 mb-5 pt-5 border-t border-[#F3F4F6]">
        <h4 className="text-xs font-semibold text-[#111827]">Colors</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Primary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-8 h-8 border border-[#E5E5E5] rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-2.5 py-1.5 text-xs border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Secondary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-8 h-8 border border-[#E5E5E5] rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex-1 px-2.5 py-1.5 text-xs border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tone */}
      <div ref={toneRef} className="space-y-3 pl-6 mb-5 pt-5 border-t border-[#F3F4F6]">
        <h4 className="text-xs font-semibold text-[#111827]">Tone</h4>
        <input
          type="text"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          placeholder="e.g., Professional, Friendly, Casual"
          className="w-full px-2.5 py-1.5 text-xs border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
        />
      </div>

      {/* Typography */}
      <div ref={typographyRef} className="space-y-3 pl-6 mb-5 pt-5 border-t border-[#F3F4F6]">
        <h4 className="text-xs font-semibold text-[#111827]">Typography</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Heading Font</label>
            <input
              type="text"
              value={headingFont}
              onChange={(e) => setHeadingFont(e.target.value)}
              placeholder="e.g., Montserrat, Poppins"
              className="w-full px-2.5 py-1.5 text-xs border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
            />
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">Font used for headings (H1, H2, etc.)</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Body Font</label>
            <input
              type="text"
              value={bodyFont}
              onChange={(e) => setBodyFont(e.target.value)}
              placeholder="e.g., Inter, Roboto, Open Sans"
              className="w-full px-2.5 py-1.5 text-xs border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
            />
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">Font used for body text and paragraphs</p>
          </div>
        </div>
      </div>

      {/* Languages */}
      <div ref={languagesRef} className="space-y-3 pl-6 mb-5 pt-5 border-t border-[#F3F4F6]">
        <h4 className="text-xs font-semibold text-[#111827]">Languages</h4>
        <input
          type="text"
          value={languages}
          onChange={(e) => setLanguages(e.target.value)}
          placeholder="e.g., en, zh, es (comma-separated)"
          className="w-full px-2.5 py-1.5 text-xs border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
        />
        <p className="text-[10px] text-[#9CA3AF]">Supported languages on the website</p>
      </div>

      {/* Header & Footer */}
      <div className="space-y-3 pl-6 mb-5 pt-5 border-t border-[#F3F4F6]">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-[#111827]">Header & Footer</h4>
          {domainName && (
            <div className="flex items-center gap-1.5 text-[10px] text-[#6B7280]">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>可在聊天中使用 Site Context skill 自动提取</span>
            </div>
          )}
        </div>
        
        {/* Header */}
        <div ref={headerRef} className="space-y-2">
          <label className="block text-xs font-medium text-[#6B7280]">Header 导航</label>
          <HeaderEditor
            initialConfig={headerInitialConfig || undefined}
            logoUrl={userLogoUrl || undefined}
            onConfigChange={setHeaderConfig}
          />
        </div>

        {/* Footer */}
        <div ref={footerRef} className="space-y-2 mt-4">
          <label className="block text-xs font-medium text-[#6B7280]">Footer 链接</label>
          <FooterEditor
            initialConfig={footerInitialConfig || undefined}
            logoUrl={userLogoUrl || undefined}
            onConfigChange={setFooterConfig}
          />
        </div>
      </div>

      {/* Sitemap */}
      <div ref={sitemapRef} className="space-y-3 pl-6 mb-5 pt-5 border-t border-[#F3F4F6]">
        <h4 className="text-xs font-semibold text-[#111827]">Sitemap</h4>
        <SitemapViewer content={sitemapContext?.content || undefined} />
      </div>
    </div>
  );
}

