'use client';

import { useState, useEffect } from 'react';
import { generateHeaderHTML, defaultHeaderConfig } from '@/lib/templates/default-header';

interface HeaderConfig {
  siteName: string;
  logo: string;
  navigation: Array<{ label: string; url: string }>;
  ctaButton: {
    label: string;
    url: string;
    color: string;
  };
}

interface HeaderEditorProps {
  initialConfig?: Partial<HeaderConfig>;
  logoUrl?: string;
  onConfigChange: (config: HeaderConfig) => void;
}

const BRAND_GRADIENT = 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)';

export default function HeaderEditor({ initialConfig, logoUrl, onConfigChange }: HeaderEditorProps) {
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>({
    siteName: initialConfig?.siteName || 'My Site',
    logo: initialConfig?.logo || logoUrl || '',
    navigation: initialConfig?.navigation || [
      { label: 'Home', url: '/' },
      { label: 'About', url: '/about' },
      { label: 'Services', url: '/services' },
      { label: 'Contact', url: '/contact' },
    ],
    ctaButton: initialConfig?.ctaButton || {
      label: 'Get Started',
      url: '/get-started',
      color: BRAND_GRADIENT,
    },
  });

  // Update config when initialConfig changes
  useEffect(() => {
    if (initialConfig) {
      setHeaderConfig({
        siteName: initialConfig.siteName || 'My Site',
        logo: initialConfig.logo || logoUrl || '',
        navigation: initialConfig.navigation || [
          { label: 'Home', url: '/' },
          { label: 'About', url: '/about' },
          { label: 'Services', url: '/services' },
          { label: 'Contact', url: '/contact' },
        ],
        ctaButton: initialConfig.ctaButton || {
          label: 'Get Started',
          url: '/get-started',
          color: BRAND_GRADIENT,
        },
      });
    }
  }, [initialConfig, logoUrl]);

  useEffect(() => {
    if (logoUrl && !headerConfig.logo) {
      const updatedConfig = { ...headerConfig, logo: logoUrl };
      setHeaderConfig(updatedConfig);
      onConfigChange(updatedConfig);
    }
  }, [logoUrl]);

  useEffect(() => {
    onConfigChange(headerConfig);
  }, [headerConfig]);

  const preprocessHTML = (htmlContent: string, userLogoUrl?: string) => {
    if (!htmlContent) return htmlContent;
    
    const logoUrl = userLogoUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40"%3E%3Crect width="120" height="40" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="12" fill="%239ca3af"%3ELogo%3C/text%3E%3C/svg%3E';
    
    let processed = htmlContent;
    processed = processed.replace(/src="[^"]*\/_next\/image[^"]*"/g, `src="${logoUrl}"`);
    processed = processed.replace(/srcset="[^"]*\/_next\/image[^"]*"/g, `srcset="${logoUrl}"`);
    processed = processed.replace(/src="\/(?!\/)[^"]*\.(png|jpg|jpeg|gif|svg|webp)"/gi, `src="${logoUrl}"`);
    
    return processed;
  };

  const generatePreviewHTML = () => {
    const html = generateHeaderHTML(headerConfig);
    const processedContent = preprocessHTML(html, headerConfig.logo);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background: white; }
    img { max-width: 100%; height: auto; object-fit: contain; }
  </style>
</head>
<body>
  <div style="transform: scale(0.75); transform-origin: top left; width: 133.33%; min-height: 100vh;">
    ${processedContent}
  </div>
</body>
</html>`;
  };

  return (
    <div className="space-y-4">
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
              <span className="inline-flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add Link
              </span>
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#374151] mb-2">
          Preview
        </label>
        <div className="border border-[#E5E5E5] rounded-lg overflow-hidden bg-gradient-to-b from-gray-50 to-white">
          <div className="flex items-center justify-center py-4">
            <iframe 
              srcDoc={generatePreviewHTML()}
              className="w-full border-none bg-white shadow-sm h-[100px]"
              title="Header preview"
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
  );
}

