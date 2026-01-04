'use client';

import { useState, useEffect } from 'react';
import { generateFooterHTML } from '@/lib/templates/default-footer';

interface FooterConfig {
  companyName: string;
  tagline: string;
  logo: string;
  columns: Array<{
    title: string;
    links: Array<{ label: string; url: string }>;
  }>;
  socialMedia: Array<{
    platform: 'twitter' | 'facebook' | 'linkedin' | 'github' | 'instagram';
    url: string;
  }>;
  backgroundColor: string;
  textColor: string;
}

interface FooterEditorProps {
  initialConfig?: Partial<FooterConfig>;
  logoUrl?: string;
  onConfigChange: (config: FooterConfig) => void;
}

const BRAND_GRADIENT = 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)';

export default function FooterEditor({ initialConfig, logoUrl, onConfigChange }: FooterEditorProps) {
  const [footerConfig, setFooterConfig] = useState<FooterConfig>({
    companyName: initialConfig?.companyName || 'My Company',
    tagline: initialConfig?.tagline || 'Building the future, one line of code at a time.',
    logo: initialConfig?.logo || logoUrl || '',
    columns: initialConfig?.columns || [
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
    socialMedia: initialConfig?.socialMedia || [
      { platform: 'twitter', url: 'https://twitter.com/example' },
      { platform: 'linkedin', url: 'https://linkedin.com/company/example' },
    ],
    backgroundColor: initialConfig?.backgroundColor || BRAND_GRADIENT,
    textColor: initialConfig?.textColor || '#E5E7EB',
  });

  useEffect(() => {
    if (logoUrl && !footerConfig.logo) {
      const updatedConfig = { ...footerConfig, logo: logoUrl };
      setFooterConfig(updatedConfig);
      onConfigChange(updatedConfig);
    }
  }, [logoUrl]);

  useEffect(() => {
    onConfigChange(footerConfig);
  }, [footerConfig]);

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
    const html = generateFooterHTML(footerConfig);
    const processedContent = preprocessHTML(html, footerConfig.logo);
    
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
  <div style="transform: scale(0.6); transform-origin: top left; width: 166.67%; min-height: 100vh;">
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
                    <span className="inline-flex items-center gap-0.5">
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Add
                    </span>
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
              <span className="inline-flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Social
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
              className="w-full border-none bg-white shadow-sm h-[200px]"
              title="Footer preview"
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

