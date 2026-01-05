'use client';

import { useState } from 'react';
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
    <div className="space-y-2">
      <label className="block text-xs font-medium text-[#374151]">{label}</label>
      <div className="flex gap-3">
        {/* Preview Box */}
        <div className="w-16 h-16 border border-[#E5E5E5] rounded-lg flex items-center justify-center bg-[#F9FAFB] flex-shrink-0 overflow-hidden">
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
        <div className="flex-1 space-y-2">
          <input
            type="text"
            value={value}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA] focus:border-transparent"
          />
          <label className="flex items-center gap-2 cursor-pointer text-xs text-[#6B7280] hover:text-[#374151]">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id={id}
            />
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
  typography,
  setTypography,
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

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <h3 className="text-base font-bold text-[#111827]">Brand & Site</h3>
      </div>

      {/* Meta Info */}
      <div ref={brandAssetsRef} className="space-y-4 pl-7 mb-6">
        <h4 className="text-sm font-semibold text-[#111827]">Meta Info</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Title</label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Page title"
              className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Keywords</label>
            <input
              type="text"
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              placeholder="keyword1, keyword2, keyword3"
              className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#374151] mb-1.5">Description</label>
          <textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="Brief description of the page"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA] resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#374151] mb-1.5">Domain Name</label>
          <input
            type="text"
            value={domainName}
            onChange={(e) => setDomainName(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
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
      <div className="space-y-4 pl-7 mb-6 pt-6 border-t border-[#F3F4F6]">
        <h4 className="text-sm font-semibold text-[#111827]">Logo & Favicon</h4>
        <div className="grid grid-cols-2 gap-4">
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
      <div ref={colorsRef} className="space-y-4 pl-7 mb-6 pt-6 border-t border-[#F3F4F6]">
        <h4 className="text-sm font-semibold text-[#111827]">Colors</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Primary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 border border-[#E5E5E5] rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Secondary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-10 h-10 border border-[#E5E5E5] rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div ref={typographyRef} className="space-y-4 pl-7 mb-6 pt-6 border-t border-[#F3F4F6]">
        <h4 className="text-sm font-semibold text-[#111827]">Typography</h4>
        <input
          type="text"
          value={typography}
          onChange={(e) => setTypography(e.target.value)}
          placeholder="e.g., Inter, Roboto, Open Sans"
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
        />
      </div>

      {/* Tone */}
      <div ref={toneRef} className="space-y-4 pl-7 mb-6 pt-6 border-t border-[#F3F4F6]">
        <h4 className="text-sm font-semibold text-[#111827]">Tone</h4>
        <input
          type="text"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          placeholder="e.g., Professional, Friendly, Casual"
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
        />
      </div>

      {/* Languages */}
      <div ref={languagesRef} className="space-y-4 pl-7 mb-6 pt-6 border-t border-[#F3F4F6]">
        <h4 className="text-sm font-semibold text-[#111827]">Languages</h4>
        <input
          type="text"
          value={languages}
          onChange={(e) => setLanguages(e.target.value)}
          placeholder="e.g., English, Spanish, French"
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
        />
      </div>

      {/* Header */}
      <div ref={headerRef} className="space-y-4 pl-7 mb-6 pt-6 border-t border-[#F3F4F6]">
        <h4 className="text-sm font-semibold text-[#111827]">Header</h4>
        <HeaderEditor
          logoUrl={userLogoUrl || undefined}
          onConfigChange={setHeaderConfig}
        />
      </div>

      {/* Footer */}
      <div ref={footerRef} className="space-y-4 pl-7 mb-6 pt-6 border-t border-[#F3F4F6]">
        <h4 className="text-sm font-semibold text-[#111827]">Footer</h4>
        <FooterEditor
          logoUrl={userLogoUrl || undefined}
          onConfigChange={setFooterConfig}
        />
      </div>

      {/* Sitemap */}
      <div ref={sitemapRef} className="space-y-4 pl-7 mb-6 pt-6 border-t border-[#F3F4F6]">
        <h4 className="text-sm font-semibold text-[#111827]">Sitemap</h4>
        <SitemapViewer content={sitemapContext?.content || undefined} />
      </div>
    </div>
  );
}

