'use client';

import { useState, useEffect, useRef } from 'react';
import { generateFooterHTML } from '@/lib/templates/default-footer';

// Scaled Preview Component - fits content to container without scrollbars
function ScaledPreview({ html, contentHeight }: { html: string; contentHeight: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.35);
  const desktopWidth = 1280;
  
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const newScale = containerWidth / desktopWidth;
        setScale(newScale);
      }
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);
  
  const scaledHeight = contentHeight * scale;
  
  return (
    <div>
      <label className="block text-xs font-medium text-[#374151] mb-1.5">Preview</label>
      <div 
        ref={containerRef}
        className="border border-[#E5E5E5] rounded overflow-hidden bg-white"
        style={{ height: `${scaledHeight}px` }}
      >
        <iframe 
          srcDoc={html}
          className="border-none bg-white"
          title="Preview"
          sandbox="allow-same-origin allow-scripts"
          style={{ 
            width: `${desktopWidth}px`, 
            height: `${contentHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        />
      </div>
      <p className="text-[10px] text-[#9CA3AF] mt-1">Preview scaled. Local images replaced with your logo.</p>
    </div>
  );
}

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
  // Note: backgroundColor and textColor removed - footer uses unified light theme
}

interface FooterEditorProps {
  initialConfig?: Partial<FooterConfig>;
  logoUrl?: string;
  onConfigChange: (config: FooterConfig) => void;
}

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
  });

  // Update config when initialConfig changes
  useEffect(() => {
    if (initialConfig) {
      setFooterConfig({
        companyName: initialConfig.companyName || 'My Company',
        tagline: initialConfig.tagline || 'Building the future, one line of code at a time.',
        logo: initialConfig.logo || logoUrl || '',
        columns: initialConfig.columns || [
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
        socialMedia: initialConfig.socialMedia || [
          { platform: 'twitter', url: 'https://twitter.com/example' },
          { platform: 'linkedin', url: 'https://linkedin.com/company/example' },
        ],
      });
    }
  }, [initialConfig, logoUrl]);

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
    const desktopWidth = 1280;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${desktopWidth}">
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { box-sizing: border-box; }
    html, body { 
      margin: 0; 
      padding: 0; 
      overflow: hidden;
      width: ${desktopWidth}px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; 
      background: white;
    }
    img { max-width: 100%; height: auto; object-fit: contain; }
    /* Force desktop grid layout (override responsive) */
    .md\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
    .md\\:col-span-1 { grid-column: span 1 / span 1 !important; }
  </style>
</head>
<body>
  ${processedContent}
</body>
</html>`;
  };

  return (
    <div className="space-y-3">
      <ScaledPreview html={generatePreviewHTML()} contentHeight={280} />

      <div className="space-y-2 p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E5E5]">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-0.5">Company Name</label>
            <input
              type="text"
              value={footerConfig.companyName}
              onChange={(e) => setFooterConfig({ ...footerConfig, companyName: e.target.value })}
              className="w-full px-2 py-1 border border-[#E5E5E5] rounded focus:outline-none focus:ring-1 focus:ring-[#9AD6FF] text-xs bg-white text-[#111827] placeholder:text-[#9CA3AF]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-0.5">Tagline</label>
            <input
              type="text"
              value={footerConfig.tagline}
              onChange={(e) => setFooterConfig({ ...footerConfig, tagline: e.target.value })}
              className="w-full px-2 py-1 border border-[#E5E5E5] rounded focus:outline-none focus:ring-1 focus:ring-[#9AD6FF] text-xs bg-white text-[#111827] placeholder:text-[#9CA3AF]"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-[#E5E5E5]">
          <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-1.5">Link Columns</label>
          <div className="grid grid-cols-3 gap-1.5">
            {footerConfig.columns.map((column, colIndex) => (
              <div key={colIndex} className="p-1.5 bg-white rounded border border-[#E5E5E5] flex flex-col">
                <div className="flex items-center gap-0.5 mb-1">
                  <input
                    type="text"
                    value={column.title}
                    onChange={(e) => {
                      const newColumns = [...footerConfig.columns];
                      newColumns[colIndex].title = e.target.value;
                      setFooterConfig({ ...footerConfig, columns: newColumns });
                    }}
                    className="flex-1 px-1 py-0.5 text-[9px] font-bold border-b border-transparent hover:border-[#E5E5E5] focus:border-[#9AD6FF] focus:outline-none uppercase tracking-tight bg-white text-[#111827] placeholder:text-[#9CA3AF]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newColumns = footerConfig.columns.filter((_, i) => i !== colIndex);
                      setFooterConfig({ ...footerConfig, columns: newColumns });
                    }}
                    className="p-0.5 text-[#9CA3AF] hover:text-[#EF4444]"
                  >
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-0.5 flex-1">
                  {column.links.map((link, linkIndex) => (
                    <div key={linkIndex} className="flex gap-0.5 group">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => {
                          const newColumns = [...footerConfig.columns];
                          newColumns[colIndex].links[linkIndex].label = e.target.value;
                          setFooterConfig({ ...footerConfig, columns: newColumns });
                        }}
                        placeholder="Link"
                        className="flex-1 px-1 py-0.5 text-[9px] border border-transparent hover:border-[#F0F0F0] rounded focus:outline-none bg-white text-[#111827] placeholder:text-[#9CA3AF]"
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
                        <svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    className="w-full py-0.5 text-[8px] text-[#9CA3AF] border border-dashed border-[#F0F0F0] rounded hover:bg-[#FAFAFA]"
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
                className="flex items-center justify-center border border-dashed border-[#E5E5E5] rounded hover:bg-white transition-colors p-3"
              >
                <svg className="w-3 h-3 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-[#E5E5E5]">
          <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-1.5">Social Media</label>
          <div className="grid grid-cols-2 gap-1.5">
            {footerConfig.socialMedia.map((social, index) => (
              <div key={index} className="flex gap-1 items-center bg-white p-1 rounded border border-[#F0F0F0]">
                <select
                  value={social.platform}
                  onChange={(e) => {
                    const newSocial = [...footerConfig.socialMedia];
                    newSocial[index].platform = e.target.value as any;
                    setFooterConfig({ ...footerConfig, socialMedia: newSocial });
                  }}
                  className="bg-transparent border-none text-[9px] font-bold text-[#374151] focus:ring-0 cursor-pointer uppercase shrink-0"
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
                  className="flex-1 px-1 py-0.5 text-[9px] border-none focus:ring-0 font-mono truncate bg-white text-[#111827] placeholder:text-[#9CA3AF]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newSocial = footerConfig.socialMedia.filter((_, i) => i !== index);
                    setFooterConfig({ ...footerConfig, socialMedia: newSocial });
                  }}
                  className="p-0.5 text-[#9CA3AF] hover:text-[#EF4444]"
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
                setFooterConfig({
                  ...footerConfig,
                  socialMedia: [...footerConfig.socialMedia, { platform: 'twitter', url: '' }]
                });
              }}
              className="py-1 text-[9px] font-medium text-[#6B7280] border border-dashed border-[#E5E5E5] rounded hover:bg-white transition-colors"
            >
              + Social
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

