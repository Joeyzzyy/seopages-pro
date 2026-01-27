'use client';

import { useState, useEffect, useRef } from 'react';
import { generateHeaderHTML, defaultHeaderConfig, NavItem } from '@/lib/templates/default-header';

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

interface HeaderConfig {
  siteName: string;
  logo: string;
  navigation: NavItem[]; // Now supports children for dropdown menus
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

const DEFAULT_CTA_COLOR = '#111827';

// NavItemEditor - supports both simple links and dropdown menus
function NavItemEditor({ 
  item, 
  onChange, 
  onDelete,
  isChild = false 
}: { 
  item: NavItem; 
  onChange: (updated: NavItem) => void; 
  onDelete: () => void;
  isChild?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className={`${isChild ? 'ml-4' : ''}`}>
      <div className={`flex gap-1.5 items-center bg-white p-1 rounded border ${hasChildren ? 'border-blue-200 bg-blue-50/30' : 'border-[#F0F0F0]'}`}>
        {/* Expand/collapse toggle for items with children */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors"
          >
            <svg 
              className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ) : (
          <div className="w-5" /> // Spacer for alignment
        )}
        
        <input
          type="text"
          value={item.label}
          onChange={(e) => onChange({ ...item, label: e.target.value })}
          placeholder="Label"
          className="w-1/3 px-1.5 py-0.5 border border-transparent hover:border-[#E5E5E5] rounded focus:border-[#9AD6FF] focus:outline-none text-[10px] bg-white text-[#111827] placeholder:text-[#9CA3AF]"
        />
        <input
          type="text"
          value={item.url}
          onChange={(e) => onChange({ ...item, url: e.target.value })}
          placeholder="URL"
          className="flex-1 px-1.5 py-0.5 border border-transparent hover:border-[#E5E5E5] rounded focus:border-[#9AD6FF] focus:outline-none text-[10px] font-mono bg-white text-[#111827] placeholder:text-[#9CA3AF]"
        />
        
        {/* Show children count badge */}
        {hasChildren && (
          <span className="px-1.5 py-0.5 text-[9px] font-medium bg-blue-100 text-blue-600 rounded">
            {item.children!.length} items
          </span>
        )}

        {/* Convert to/from dropdown (only for top-level items) */}
        {!isChild && (
          <button
            type="button"
            onClick={() => {
              if (hasChildren) {
                // Convert to simple link (remove children)
                const { children, ...rest } = item;
                onChange(rest);
              } else {
                // Convert to dropdown (add children)
                onChange({ ...item, children: [{ label: 'Sub Item', url: '#' }] });
              }
            }}
            className={`p-1 ${hasChildren ? 'text-blue-500 hover:text-blue-700' : 'text-[#9CA3AF] hover:text-blue-500'} hover:bg-blue-50 rounded transition-colors`}
            title={hasChildren ? 'Convert to simple link' : 'Convert to dropdown'}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        <button
          type="button"
          onClick={onDelete}
          className="p-1 text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded transition-colors"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Render children if expanded */}
      {hasChildren && expanded && (
        <div className="mt-1 space-y-1 border-l-2 border-blue-200 pl-1">
          {item.children!.map((child, childIndex) => (
            <NavItemEditor
              key={childIndex}
              item={child}
              isChild={true}
              onChange={(updated) => {
                const newChildren = [...item.children!];
                newChildren[childIndex] = updated;
                onChange({ ...item, children: newChildren });
              }}
              onDelete={() => {
                const newChildren = item.children!.filter((_, i) => i !== childIndex);
                if (newChildren.length === 0) {
                  // If no children left, convert to simple link
                  const { children, ...rest } = item;
                  onChange(rest);
                } else {
                  onChange({ ...item, children: newChildren });
                }
              }}
            />
          ))}
          <button
            type="button"
            onClick={() => {
              onChange({ 
                ...item, 
                children: [...(item.children || []), { label: 'New Sub Item', url: '#' }] 
              });
            }}
            className="ml-4 w-[calc(100%-1rem)] py-0.5 text-[9px] font-medium text-blue-500 border border-dashed border-blue-200 rounded hover:bg-blue-50 transition-colors"
          >
            + Add sub-item
          </button>
        </div>
      )}
    </div>
  );
}

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
      color: DEFAULT_CTA_COLOR,
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
          color: DEFAULT_CTA_COLOR,
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
    
    // Desktop width for rendering
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
    /* Force show all elements (override responsive hiding) */
    .md\\:flex { display: flex !important; }
    .md\\:block { display: block !important; }
    .md\\:hidden { display: none !important; }
    .hidden.md\\:flex { display: flex !important; }
    .hidden.md\\:block { display: block !important; }
  </style>
</head>
<body>
  ${processedContent}
</body>
</html>`;
  };

  return (
    <div className="space-y-3">
      <ScaledPreview html={generatePreviewHTML()} contentHeight={80} />

      <div className="space-y-2 p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E5E5]">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-0.5">Site Name</label>
            <input
              type="text"
              value={headerConfig.siteName}
              onChange={(e) => setHeaderConfig({ ...headerConfig, siteName: e.target.value })}
              className="w-full px-2 py-1 border border-[#E5E5E5] rounded focus:outline-none focus:ring-1 focus:ring-[#9AD6FF] text-xs bg-white text-[#111827] placeholder:text-[#9CA3AF]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-0.5">CTA Label</label>
            <input
              type="text"
              value={headerConfig.ctaButton.label}
              onChange={(e) => setHeaderConfig({
                ...headerConfig,
                ctaButton: { ...headerConfig.ctaButton, label: e.target.value }
              })}
              placeholder="Button Label"
              className="w-full px-2 py-1 border border-[#E5E5E5] rounded focus:outline-none focus:ring-1 focus:ring-[#9AD6FF] text-xs bg-white text-[#111827] placeholder:text-[#9CA3AF]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-0.5">CTA URL</label>
            <input
              type="text"
              value={headerConfig.ctaButton.url}
              onChange={(e) => setHeaderConfig({
                ...headerConfig,
                ctaButton: { ...headerConfig.ctaButton, url: e.target.value }
              })}
              placeholder="Button URL"
              className="w-full px-2 py-1 border border-[#E5E5E5] rounded focus:outline-none focus:ring-1 focus:ring-[#9AD6FF] text-xs bg-white text-[#111827] placeholder:text-[#9CA3AF]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-0.5">CTA Color</label>
            <div className="flex gap-1.5 items-center">
              <input
                type="color"
                value={headerConfig.ctaButton.color?.startsWith('#') ? headerConfig.ctaButton.color : '#111827'}
                onChange={(e) => setHeaderConfig({
                  ...headerConfig,
                  ctaButton: { ...headerConfig.ctaButton, color: e.target.value }
                })}
                className="w-8 h-8 border border-[#E5E5E5] rounded cursor-pointer flex-shrink-0"
              />
              <input
                type="text"
                value={headerConfig.ctaButton.color}
                onChange={(e) => setHeaderConfig({
                  ...headerConfig,
                  ctaButton: { ...headerConfig.ctaButton, color: e.target.value }
                })}
                placeholder="#111827"
                className="flex-1 px-2 py-1 border border-[#E5E5E5] rounded focus:outline-none focus:ring-1 focus:ring-[#9AD6FF] text-[10px] font-mono bg-white text-[#111827]"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-[#E5E5E5]">
          <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-1.5">Navigation Links</label>
          <div className="space-y-1.5">
            {headerConfig.navigation.map((link, index) => (
              <NavItemEditor
                key={index}
                item={link}
                onChange={(updated) => {
                  const newNav = [...headerConfig.navigation];
                  newNav[index] = updated;
                  setHeaderConfig({ ...headerConfig, navigation: newNav });
                }}
                onDelete={() => {
                  const newNav = headerConfig.navigation.filter((_, i) => i !== index);
                  setHeaderConfig({ ...headerConfig, navigation: newNav });
                }}
              />
            ))}
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setHeaderConfig({
                    ...headerConfig,
                    navigation: [...headerConfig.navigation, { label: 'New Link', url: '#' }]
                  });
                }}
                className="flex-1 py-1 text-[10px] font-medium text-[#6B7280] border border-dashed border-[#E5E5E5] rounded hover:bg-white transition-colors"
              >
                <span className="inline-flex items-center gap-0.5">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add Link
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setHeaderConfig({
                    ...headerConfig,
                    navigation: [...headerConfig.navigation, { label: 'Dropdown', url: '#', children: [{ label: 'Sub Item', url: '#' }] }]
                  });
                }}
                className="flex-1 py-1 text-[10px] font-medium text-[#6B7280] border border-dashed border-[#E5E5E5] rounded hover:bg-white transition-colors"
              >
                <span className="inline-flex items-center gap-0.5">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                  Add Dropdown
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

