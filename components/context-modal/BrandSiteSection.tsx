'use client';

import { useState, useEffect } from 'react';
import HeaderEditor from '../context-editors/HeaderEditor';
import FooterEditor from '../context-editors/FooterEditor';
import type { BrandSiteSectionProps } from './types';

/**
 * Ensure logo URL is absolute by prepending domain if it's a relative path
 */
function ensureAbsoluteLogoUrl(logoUrl: string | null | undefined, domainName: string | undefined): string | undefined {
  if (!logoUrl) return undefined;
  
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

  const handleImageLoad = () => setPreviewState('success');
  const handleImageError = () => setPreviewState('error');

  const currentPreviewUrl = previewUrl || displayUrl || (value.trim() ? value : null);

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[#374151]">{label}</label>
      <div className="flex gap-2">
        <div className="w-12 h-12 border border-[#E5E5E5] rounded-lg flex items-center justify-center bg-[#F9FAFB] flex-shrink-0 overflow-hidden">
          {currentPreviewUrl ? (
            <>
              {previewState === 'loading' && <span className="text-[10px] text-[#9CA3AF]">Loading</span>}
              {previewState === 'error' && <span className="text-[10px] text-red-500">Error</span>}
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
        <div className="flex-1 space-y-1.5">
          <input
            type="text"
            value={value}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-2.5 py-1.5 text-xs bg-white text-[#111827] placeholder:text-[#9CA3AF] border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA] focus:border-transparent"
          />
          <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-[#6B7280] hover:text-[#374151]">
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id={id} />
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
  domainName,
  setDomainName,
  ogImage,
  setOgImage,
  onOgImageFileChange,
  ogImagePreview,
  logoUrl,
  setLogoUrl,
  faviconUrl,
  setFaviconUrl,
  onLogoFileChange,
  onFaviconFileChange,
  logoPreview,
  faviconPreview,
  primaryColor,
  setPrimaryColor,
  secondaryColor,
  setSecondaryColor,
  headingFont,
  setHeadingFont,
  bodyFont,
  setBodyFont,
  languages,
  setLanguages,
  userLogoUrl,
  setHeaderConfig,
  setFooterConfig,
  brandAssetsRef,
  colorsRef,
  typographyRef,
  languagesRef,
  headerRef,
  footerRef,
}: BrandSiteSectionProps) {
  const headerContext = siteContexts.find(c => c.type === 'header');
  const footerContext = siteContexts.find(c => c.type === 'footer');
  
  // Ensure logo URL is absolute for header/footer generation
  const absoluteLogoUrl = ensureAbsoluteLogoUrl(userLogoUrl, domainName);

  // State for header and footer initial config
  const [headerInitialConfig, setHeaderInitialConfig] = useState<any>(null);
  const [footerInitialConfig, setFooterInitialConfig] = useState<any>(null);

  // Parse header config from content (JSON format)
  useEffect(() => {
    if (headerContext?.content) {
      const content = headerContext.content.trim();
      // Skip if content is HTML (legacy format)
      if (content.startsWith('<')) return;
      
      try {
        const parsedHeader = JSON.parse(content);
        // Ensure logo URL is absolute
        const configLogoUrl = ensureAbsoluteLogoUrl(parsedHeader.logo || logoUrl, domainName);
        setHeaderInitialConfig({
          siteName: parsedHeader.siteName || '',
          logo: configLogoUrl || '',
          navigation: parsedHeader.navigation || [],
          ctaButton: parsedHeader.ctaButton || {
            label: 'Get Started',
            url: '#',
            color: primaryColor || '#111827',
          },
        });
      } catch (err) {
        console.error('Failed to parse header content:', err);
      }
    }
  }, [headerContext, logoUrl, primaryColor, domainName]);

  // Parse footer config from content (JSON format)
  useEffect(() => {
    if (footerContext?.content) {
      const content = footerContext.content.trim();
      // Skip if content is HTML (legacy format)
      if (content.startsWith('<')) return;
      
      try {
        const parsedFooter = JSON.parse(content);
        // Ensure logo URL is absolute
        const configLogoUrl = ensureAbsoluteLogoUrl(parsedFooter.logo || logoUrl, domainName);
        setFooterInitialConfig({
          companyName: parsedFooter.companyName || '',
          tagline: parsedFooter.tagline || '',
          logo: configLogoUrl || '',
          backgroundColor: parsedFooter.backgroundColor || '#FFFFFF',
          textColor: parsedFooter.textColor || '#374151',
          columns: parsedFooter.columns || [],
          socialMedia: parsedFooter.socialMedia || [],
        });
      } catch (err) {
        console.error('Failed to parse footer content:', err);
      }
    }
  }, [footerContext, logoUrl, domainName]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <h3 className="text-base font-bold text-[#111827]">Brand & Site</h3>
      </div>

      {/* Domain Name */}
      <div ref={brandAssetsRef} className="space-y-3 pl-6 mb-5">
        <h4 className="text-xs font-semibold text-[#111827]">Domain</h4>
        <div>
          <label className="block text-xs font-medium text-[#374151] mb-1">Domain Name</label>
          <input
            type="text"
            value={domainName}
            onChange={(e) => setDomainName(e.target.value)}
            placeholder="example.com"
            className="w-full px-2.5 py-1.5 text-xs bg-white text-[#111827] placeholder:text-[#9CA3AF] border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
          />
        </div>
      </div>

      {/* Logo, Favicon & OG Image */}
      <div className="space-y-3 pl-6 mb-5 pt-5 border-t-2 border-[#E5E5E5]">
        <h4 className="text-xs font-semibold text-[#111827]">Logo, Favicon & OG Image</h4>
        <div className="grid grid-cols-3 gap-3">
          <AssetUploadField
            id="logo"
            label="Logo"
            value={logoUrl}
            onChange={setLogoUrl}
            onFileChange={onLogoFileChange}
            previewUrl={logoPreview}
            placeholder="https://example.com/logo.svg"
          />
          <AssetUploadField
            id="favicon"
            label="Favicon"
            value={faviconUrl}
            onChange={setFaviconUrl}
            onFileChange={onFaviconFileChange}
            previewUrl={faviconPreview}
            placeholder="https://example.com/favicon.ico"
          />
          <AssetUploadField
            id="og-image"
            label="OG Image"
            value={ogImage}
            onChange={setOgImage}
            onFileChange={onOgImageFileChange}
            previewUrl={ogImagePreview}
            placeholder="https://example.com/og.png"
          />
        </div>
      </div>

      {/* Colors */}
      <div ref={colorsRef} className="space-y-3 pl-6 mb-5 pt-5 border-t-2 border-[#E5E5E5]">
        <h4 className="text-xs font-semibold text-[#111827]">Colors</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Primary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={primaryColor || '#9A8FEA'}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-8 h-8 border border-[#E5E5E5] rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#9A8FEA"
                className="flex-1 px-2.5 py-1.5 text-xs bg-white text-[#111827] placeholder:text-[#9CA3AF] border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Secondary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={secondaryColor || '#FF5733'}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-8 h-8 border border-[#E5E5E5] rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                placeholder="#FF5733"
                className="flex-1 px-2.5 py-1.5 text-xs bg-white text-[#111827] placeholder:text-[#9CA3AF] border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div ref={typographyRef} className="space-y-3 pl-6 mb-5 pt-5 border-t-2 border-[#E5E5E5]">
        <h4 className="text-xs font-semibold text-[#111827]">Typography</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Heading Font</label>
            <input
              type="text"
              value={headingFont}
              onChange={(e) => setHeadingFont(e.target.value)}
              placeholder="e.g., Montserrat, Poppins"
              className="w-full px-2.5 py-1.5 text-xs bg-white text-[#111827] placeholder:text-[#9CA3AF] border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Body Font</label>
            <input
              type="text"
              value={bodyFont}
              onChange={(e) => setBodyFont(e.target.value)}
              placeholder="e.g., Inter, Roboto"
              className="w-full px-2.5 py-1.5 text-xs bg-white text-[#111827] placeholder:text-[#9CA3AF] border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
            />
          </div>
        </div>
      </div>

      {/* Languages */}
      <div ref={languagesRef} className="space-y-3 pl-6 mb-5 pt-5 border-t-2 border-[#E5E5E5]">
        <h4 className="text-xs font-semibold text-[#111827]">Languages</h4>
        <input
          type="text"
          value={languages}
          onChange={(e) => setLanguages(e.target.value)}
          placeholder="e.g., en, zh, es (comma-separated)"
          className="w-full px-2.5 py-1.5 text-xs bg-white text-[#111827] placeholder:text-[#9CA3AF] border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
        />
      </div>

      {/* Header & Footer */}
      <div className="space-y-3 pl-6 mb-5 pt-5 border-t-2 border-[#E5E5E5]">
        <h4 className="text-xs font-semibold text-[#111827]">Header & Footer</h4>
        
        {/* Header */}
        <div ref={headerRef} className="space-y-2">
          <label className="block text-xs font-medium text-[#6B7280]">Header Navigation</label>
          <HeaderEditor
            initialConfig={headerInitialConfig || undefined}
            logoUrl={absoluteLogoUrl}
            onConfigChange={setHeaderConfig}
          />
        </div>

        {/* Footer */}
        <div ref={footerRef} className="space-y-2 mt-4">
          <label className="block text-xs font-medium text-[#6B7280]">Footer Links</label>
          <FooterEditor
            initialConfig={footerInitialConfig || undefined}
            logoUrl={absoluteLogoUrl}
            onConfigChange={setFooterConfig}
          />
        </div>
      </div>
    </div>
  );
}
