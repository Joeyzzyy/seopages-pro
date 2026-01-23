'use client';

import { useState, useEffect } from 'react';
import type { SiteContext, ContentItem, ContentProject } from '@/lib/supabase';

interface ConversationSidebarProps {
  siteContexts: SiteContext[];
  contentItems: ContentItem[];
  contentProjects: ContentProject[];
  onEditSiteContext: (type: 'logo' | 'header' | 'footer' | 'competitors') => void;
  onSelectContentItem: (item: ContentItem) => void;
  onRefreshContent: () => void;
  onRefreshSiteContexts?: () => void;
  onRefreshBrandAssets?: () => void;
  onRefreshCompetitors?: () => void;
  isRefreshingSiteContexts?: boolean;
  isRefreshingBrandAssets?: boolean;
  isRefreshingCompetitors?: boolean;
  isRefreshingContent?: boolean;
  onDeleteProject: (projectId: string, projectName: string) => void;
  onDeleteContentItem: (itemId: string, itemTitle: string) => void;
  onOpenContextModal?: (tab?: 'brand' | 'competitors') => void;
}

export default function ConversationSidebar({
  siteContexts,
  contentItems,
  contentProjects,
  onEditSiteContext,
  onSelectContentItem,
  onRefreshContent,
  onRefreshSiteContexts,
  onRefreshBrandAssets,
  onRefreshCompetitors,
  isRefreshingSiteContexts = false,
  isRefreshingBrandAssets = false,
  isRefreshingCompetitors = false,
  isRefreshingContent = false,
  onDeleteProject,
  onDeleteContentItem,
  onOpenContextModal,
}: ConversationSidebarProps) {
  // Group items by project first
  const groupedContent = contentProjects.map(project => ({
    ...project,
    items: contentItems.filter(item => item.project_id === project.id)
  }));

  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'project' | 'item';
    id: string;
    name: string;
    itemCount?: number;
  } | null>(null);
  const [expandedOnSite, setExpandedOnSite] = useState(true);

  // Auto-expand first project when content loads
  useEffect(() => {
    if (groupedContent.length > 0 && Object.keys(expandedClusters).length === 0) {
      setExpandedClusters({ [groupedContent[0].id]: true });
    }
  }, [groupedContent.length]);

  const sidebarWidth = 'w-72';

  const toggleCluster = (projectId: string) => {
    setExpandedClusters(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  // Items without a project (Uncategorized)
  const uncategorizedItems = contentItems.filter(item => !item.project_id);

  // Count acquired fields for each category - Simplified
  const getFieldCount = (category: string): { acquired: number; total: number } => {
    const fieldMappings: Record<string, string[]> = {
      'competitors': ['competitors'],
      'brand-site': ['logo', 'colors', 'typography', 'languages', 'header', 'footer'],
    };
    
    const fields = fieldMappings[category] || [];
    const acquired = fields.filter(field => hasContextValue(field)).length;
    
    return { acquired, total: fields.length };
  };

  // Helper function to check if a context field has value - Simplified
  const hasContextValue = (field: string): boolean => {
    const logoContext = siteContexts.find(ctx => ctx.type === 'logo');
    const headerContext = siteContexts.find(ctx => ctx.type === 'header');
    const footerContext = siteContexts.find(ctx => ctx.type === 'footer');
    const competitorsContext = siteContexts.find(ctx => ctx.type === 'competitors');
    
    const hasStringValue = (value: string | null | undefined): boolean => {
      return !!value && value.trim().length > 0;
    };
    
    const hasJsonContent = (content: string | null | undefined): boolean => {
      if (!content || !content.trim()) return false;
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed.length > 0;
        if (typeof parsed === 'object' && parsed !== null) {
          return Object.values(parsed).some(val => val !== null && val !== undefined);
        }
        return hasStringValue(String(parsed));
      } catch {
        return hasStringValue(content);
      }
    };
    
    switch (field) {
      case 'logo':
        return hasStringValue(logoContext?.logo_light_url) || hasStringValue(logoContext?.file_url);
      case 'colors':
        return hasStringValue(logoContext?.primary_color) || hasStringValue(logoContext?.secondary_color);
      case 'typography':
        return hasStringValue(logoContext?.heading_font) || hasStringValue(logoContext?.body_font);
      case 'languages':
        return hasStringValue(logoContext?.languages);
      case 'header':
        return hasStringValue(headerContext?.content) || hasStringValue(headerContext?.html);
      case 'footer':
        return hasStringValue(footerContext?.content) || hasStringValue(footerContext?.html);
      case 'competitors':
        return hasJsonContent(competitorsContext?.content);
      case 'brand-site':
        // Brand site is complete if logo and colors are set
        return (hasStringValue(logoContext?.logo_light_url) || hasStringValue(logoContext?.file_url)) &&
               (hasStringValue(logoContext?.primary_color) || hasStringValue(logoContext?.secondary_color));
      default:
        return false;
    }
  };

  // Red dot indicator component
  const RedDot = () => (
    <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full ml-1" title="Not filled"></span>
  );


  const getStatusStyle = (status: string): React.CSSProperties => {
    if (status === 'ready') {
      return {
        background: 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      };
    }
    if (status === 'generated') {
      return {
        background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      };
    }
    switch (status) {
      case 'in_production': return { color: '#F59E0B' };
      case 'published': return { color: '#10B981' };
      default: return { color: '#9CA3AF' };
    }
  };

  const handleProjectContextMenu = (e: React.MouseEvent, project: ContentProject) => {
    e.preventDefault();
    e.stopPropagation();
    const itemCount = contentItems.filter(item => item.project_id === project.id).length;
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'project',
      id: project.id,
      name: project.name,
      itemCount,
    });
  };

  const handleItemContextMenu = (e: React.MouseEvent, item: ContentItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'item',
      id: item.id,
      name: item.title,
    });
  };

  const handleContextMenuAction = (action: 'delete') => {
    if (!contextMenu) return;
    
    if (action === 'delete') {
      if (contextMenu.type === 'project') {
        onDeleteProject(contextMenu.id, contextMenu.name);
      } else {
        onDeleteContentItem(contextMenu.id, contextMenu.name);
      }
    }
    setContextMenu(null);
  };

  return (
    <aside className={`${sidebarWidth} bg-white border border-[#E5E5E5] rounded-lg shadow-sm flex flex-col h-full overflow-hidden`} onClick={() => setContextMenu(null)}>
      
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Context Section (Top 40%) */}
        <div className="flex flex-col min-h-0 border-b border-[#E5E5E5]" style={{ height: '40%' }}>
          <div className="px-4 py-1.5 text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center justify-between shrink-0 border-b border-[#E5E5E5] h-10">
            <span>Site Context</span>
            <button
              onClick={() => onOpenContextModal?.()}
              className="p-1 rounded hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827] transition-all cursor-pointer"
              title="Edit All Context"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto thin-scrollbar px-2 pb-2 pt-2">
            <div className="space-y-2">
              {/* Brand Assets Section */}
              <div className="bg-[#FAFAFA] rounded-lg p-2">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span className="text-xs font-semibold text-[#374151]">Brand Assets</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isRefreshingBrandAssets) onRefreshBrandAssets?.();
                      }}
                      disabled={isRefreshingBrandAssets}
                      className={`p-1 rounded hover:bg-white text-[#9CA3AF] hover:text-[#6B7280] transition-colors cursor-pointer ${isRefreshingBrandAssets ? 'opacity-50' : ''}`}
                      title="Re-fetch Brand Assets"
                    >
                      <svg className={`w-3 h-3 ${isRefreshingBrandAssets ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 2v6h-6" />
                        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                        <path d="M3 22v-6h6" />
                        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onOpenContextModal?.('brand')}
                      className="p-1 rounded hover:bg-white text-[#9CA3AF] hover:text-[#6B7280] transition-colors cursor-pointer"
                      title="Edit Brand Assets"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="space-y-0.5">
                  {[
                    { label: 'Logo & Colors', key: 'logo' },
                    { label: 'Header', key: 'header' },
                    { label: 'Footer', key: 'footer' },
                  ].map(({ label, key }) => {
                    const filled = hasContextValue(key);
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-2 px-2 py-1 text-[11px] text-[#6B7280]"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${filled ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="flex-1">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Competitors Section - Separate */}
              <div className="bg-[#FAFAFA] rounded-lg p-2">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="text-xs font-semibold text-[#374151]">Competitors</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isRefreshingCompetitors) onRefreshCompetitors?.();
                      }}
                      disabled={isRefreshingCompetitors}
                      className={`p-1 rounded hover:bg-white text-[#9CA3AF] hover:text-[#6B7280] transition-colors cursor-pointer ${isRefreshingCompetitors ? 'opacity-50' : ''}`}
                      title="Re-fetch Competitors"
                    >
                      <svg className={`w-3 h-3 ${isRefreshingCompetitors ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 2v6h-6" />
                        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                        <path d="M3 22v-6h6" />
                        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onOpenContextModal?.('competitors')}
                      className="p-1 rounded hover:bg-white text-[#9CA3AF] hover:text-[#6B7280] transition-colors cursor-pointer"
                      title="Edit Competitors"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                </div>
                {(() => {
                  const competitorsContext = siteContexts.find(ctx => ctx.type === 'competitors');
                  let competitorCount = 0;
                  if (competitorsContext?.content) {
                    try {
                      const parsed = JSON.parse(competitorsContext.content);
                      if (Array.isArray(parsed)) competitorCount = parsed.length;
                    } catch {}
                  }
                  return (
                    <div className="flex items-center gap-2 px-2 py-1 text-[11px] text-[#6B7280]">
                      <span className={`w-1.5 h-1.5 rounded-full ${competitorCount > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="flex-1">
                        {competitorCount > 0 ? `${competitorCount} competitor${competitorCount > 1 ? 's' : ''} configured` : 'No competitors yet'}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Knowledge (Brand Info) */}
              <button
                onClick={() => onOpenContextModal?.('brand')}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[#F3F4F6] text-left group transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 flex-1">
                  <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  <span className="text-xs font-medium text-[#374151]">Knowledge</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Page Blueprint Section (Bottom 60%) */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="px-4 py-1.5 text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center justify-between shrink-0 border-b border-[#E5E5E5] h-10">
            <div className="flex items-center gap-2">
              <span>Page Blueprint</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isRefreshingContent) onRefreshContent();
                }}
                disabled={isRefreshingContent}
                className={`p-0.5 rounded hover:bg-[#F3F4F6] text-[#9CA3AF] hover:text-[#6B7280] transition-colors cursor-pointer ${isRefreshingContent ? 'opacity-50' : ''}`}
                title="Refresh Content"
              >
                <svg className={`w-3 h-3 ${isRefreshingContent ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 2v6h-6" />
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M3 22v-6h6" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                </svg>
              </button>
            </div>
            <span className="bg-[#F3F4F6] text-[#6B7280] px-1.5 py-0.5 rounded text-[11px] font-medium">
              {contentItems.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto thin-scrollbar px-2 pb-2">
            {contentItems.length === 0 && contentProjects.length === 0 ? (
              <div className="px-3 py-4 text-[11px] text-[#9CA3AF] italic text-center">
                No page blueprints yet
              </div>
            ) : (
              <div className="space-y-1">
                {/* Topic Clusters (Projects) */}
                {groupedContent.map((cluster) => (
                  <div key={cluster.id} className="space-y-0.5">
                    <button
                      onClick={() => toggleCluster(cluster.id)}
                      onContextMenu={(e) => handleProjectContextMenu(e, cluster)}
                      className="w-full flex items-center gap-1.5 p-1 rounded hover:bg-[#F3F4F6] transition-all cursor-pointer group"
                    >
                      <span className={`text-[10px] text-[#D1D5DB] transition-transform ${expandedClusters[cluster.id] ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                      <span className="flex-1 text-[11px] font-bold text-[#4B5563] truncate text-left uppercase tracking-tight">
                        {cluster.name}
                      </span>
                    </button>
                    
                    {expandedClusters[cluster.id] && (
                      <div className="pl-2 ml-2 space-y-0.5">
                        {cluster.items.map((item) => {
                          const isGenerated = item.status === 'generated' || !!item.generated_content;
                          return (
                          <div key={item.id} className="group relative flex items-center gap-2 p-1 rounded hover:bg-[#F3F4F6] transition-all text-left">
                            <button
                              onClick={() => onSelectContentItem(item)}
                              onContextMenu={(e) => handleItemContextMenu(e, item)}
                              className="flex-1 flex items-center gap-2 min-w-0 cursor-pointer"
                            >
                              {isGenerated ? (
                                <svg className="w-3.5 h-3.5 text-[#10B981] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                  <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3 text-[#D1D5DB] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                                  <polyline points="13 2 13 9 20 9" />
                                </svg>
                              )}
                              <span className="flex-1 text-[11px] text-[#374151] truncate">
                                {item.title}
                              </span>
                            </button>
                            
                            {/* Live Preview Link for Generated Pages */}
                            {isGenerated && (
                              <a
                                href={`/api/preview/${item.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded transition-all shrink-0 cursor-pointer"
                                title="View Live Page"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <svg className="w-3 h-3 text-[#9A8FEA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                  <polyline points="15 3 21 3 21 8" />
                                  <line x1="10" y1="11" x2="21" y2="3" />
                                </svg>
                              </a>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {/* Uncategorized Items */}
                {uncategorizedItems.map((item) => {
                  const isGenerated = item.status === 'generated' || !!item.generated_content;
                  return (
                  <div key={item.id} className="group relative flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#F3F4F6] transition-all text-left">
                    <button
                      onClick={() => onSelectContentItem(item)}
                      onContextMenu={(e) => handleItemContextMenu(e, item)}
                      className="flex-1 flex items-center gap-2 min-w-0 cursor-pointer"
                    >
                      {isGenerated ? (
                        <svg className="w-3.5 h-3.5 text-[#10B981] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-[#D1D5DB] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                          <polyline points="13 2 13 9 20 9" />
                        </svg>
                      )}
                      <span className="flex-1 text-[11px] text-[#374151] truncate">
                        {item.title}
                      </span>
                    </button>
                    
                    {/* Live Preview Link for Generated Pages */}
                    {isGenerated && (
                      <a
                        href={`/api/preview/${item.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded transition-all shrink-0 cursor-pointer"
                        title="View Live Page"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-3 h-3 text-[#9A8FEA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 8" />
                          <line x1="10" y1="11" x2="21" y2="3" />
                        </svg>
                      </a>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          {/* Invisible overlay to catch clicks */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed bg-white border border-[#E5E5E5] rounded-md shadow-lg py-0.5 z-50 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleContextMenuAction('delete')}
              className="w-full px-3 py-1.5 text-left text-sm text-[#EF4444] hover:bg-[#FEF2F2] transition-colors flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>
                {contextMenu.type === 'project' 
                  ? `Delete Cluster${contextMenu.itemCount && contextMenu.itemCount > 0 ? ` (${contextMenu.itemCount} items)` : ''}`
                  : 'Delete Page'
                }
              </span>
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
