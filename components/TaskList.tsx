'use client';

import { useState, useEffect } from 'react';
import type { SiteContext, ContentItem, ContentProject } from '@/lib/supabase';

export type TaskType = 'context' | 'page';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'error';

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  subtitle?: string;
  status: TaskStatus;
  data?: any; // ContentItem for page tasks, context data for context tasks
}

interface TaskListProps {
  siteContexts: SiteContext[];
  contentItems: ContentItem[];
  contentProjects: ContentProject[];
  selectedTaskId: string | null;
  runningTaskId: string | null;
  onSelectTask: (task: Task) => void;
  onGeneratePage: (item: ContentItem) => void;
  onRefreshContent: () => void;
  onRefreshSiteContexts: () => void;
  onRefreshBrandAssets?: () => void;
  onRefreshCompetitors?: () => void;
  onOpenBrandAssetsModal: () => void;
  onOpenCompetitorsModal: () => void;
  isRefreshingSiteContexts?: boolean;
  isRefreshingBrandAssets?: boolean;
  isRefreshingCompetitors?: boolean;
  isRefreshingContent?: boolean;
  isPlanningPages?: boolean;
  contextTaskStatus: TaskStatus;
  credits?: number;
  projectDomain?: string;
}

export default function TaskList({
  siteContexts,
  contentItems,
  contentProjects,
  selectedTaskId,
  runningTaskId,
  onSelectTask,
  onGeneratePage,
  onRefreshContent,
  onRefreshSiteContexts,
  onRefreshBrandAssets,
  onRefreshCompetitors,
  onOpenBrandAssetsModal,
  onOpenCompetitorsModal,
  isRefreshingSiteContexts = false,
  isRefreshingBrandAssets = false,
  isRefreshingCompetitors = false,
  isRefreshingContent = false,
  isPlanningPages = false,
  contextTaskStatus,
  credits = 1,
  projectDomain,
}: TaskListProps) {
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  // Group items by project (keep original order)
  const groupedContent = contentProjects.map(project => ({
    ...project,
    items: contentItems.filter(item => item.project_id === project.id)
  }));

  // Items without a project (Uncategorized)
  const uncategorizedItems = contentItems.filter(item => !item.project_id);

  // Auto-expand first project when content loads
  useEffect(() => {
    if (groupedContent.length > 0 && Object.keys(expandedProjects).length === 0) {
      setExpandedProjects({ [groupedContent[0].id]: true });
    }
  }, [groupedContent.length]);

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  // Check if context has meaningful data
  const hasContextData = () => {
    const logoContext = siteContexts.find(ctx => ctx.type === 'logo');
    const competitorsContext = siteContexts.find(ctx => ctx.type === 'competitors');
    return !!(logoContext?.domain_name || logoContext?.logo_url || competitorsContext?.content);
  };

  // Context task
  const contextTask: Task = {
    id: 'context-analysis',
    type: 'context',
    title: 'Brand Assets',
    subtitle: hasContextData() ? 'Click to view/edit' : 'Initializing...',
    status: contextTaskStatus,
    data: siteContexts,
  };

  // Calculate visible items based on credits
  // With 1 credit, user can only see 1 page task (the first one)
  const maxVisibleItems = credits;

  // Convert content items to tasks
  const getPageTask = (item: ContentItem): Task => {
    const isGenerated = item.status === 'generated' || !!item.generated_content;
    const isRunning = runningTaskId === item.id;
    
    return {
      id: item.id,
      type: 'page',
      title: item.title,
      subtitle: item.target_keyword || item.page_type || '',
      status: isRunning ? 'running' : isGenerated ? 'completed' : 'pending',
      data: item,
    };
  };

  const getStatusIcon = (status: TaskStatus, type: TaskType) => {
    if (status === 'running') {
      return (
        <div className="w-5 h-5 flex items-center justify-center">
          <svg className="w-4 h-4 animate-spin text-[#9A8FEA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      );
    }
    if (status === 'completed') {
      return (
        <div className="w-5 h-5 flex items-center justify-center">
          <svg className="w-4 h-4 text-[#10B981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
      );
    }
    if (status === 'error') {
      return (
        <div className="w-5 h-5 flex items-center justify-center">
          <svg className="w-4 h-4 text-[#EF4444]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
      );
    }
    // pending
    if (type === 'context') {
      return (
        <div className="w-5 h-5 flex items-center justify-center">
          <svg className="w-4 h-4 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-5 h-5 flex items-center justify-center">
        <svg className="w-4 h-4 text-[#D1D5DB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13 2 13 9 20 9" />
        </svg>
      </div>
    );
  };

  // Get page type badge
  const getPageTypeBadge = (pageType: string) => {
    switch (pageType) {
      case 'alternative':
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-blue-50 text-blue-600 shrink-0" title="1v1 Comparison Page">
            1v1
          </span>
        );
      case 'listicle':
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-purple-50 text-purple-600 shrink-0" title="Best Of / Listicle Page">
            Best Of
          </span>
        );
      case 'comparison':
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-green-50 text-green-600 shrink-0" title="Comparison Page">
            Compare
          </span>
        );
      default:
        return null;
    }
  };

  // Helper to render a single page item
  const renderPageItem = (item: ContentItem, isLocked: boolean) => {
    const task = getPageTask(item);
    const isSelected = selectedTaskId === task.id;
    const isRunning = task.status === 'running';
    const isCompleted = task.status === 'completed';
    const pageTypeBadge = getPageTypeBadge(item.page_type);

    return (
      <div key={item.id} className={isLocked ? 'locked-item' : ''}>
        <div
          className={`group flex items-center gap-2 p-2 rounded-lg transition-all ${
            isSelected 
              ? 'bg-[#F3F4F6] border border-[#E5E5E5]' 
              : 'hover:bg-[#FAFAFA]'
          }`}
        >
          <button
            onClick={() => !isLocked && onSelectTask(task)}
            className="flex-1 flex items-center gap-2 min-w-0 text-left"
            disabled={isLocked}
          >
            {getStatusIcon(task.status, 'page')}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-[#374151] truncate">{task.title}</span>
                {pageTypeBadge}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#9CA3AF]">
                {task.subtitle && <span className="truncate">{task.subtitle}</span>}
                {isCompleted && item.updated_at && (
                  <>
                    {task.subtitle && <span className="text-[#D1D5DB]">·</span>}
                    <span className="shrink-0">
                      {new Date(item.updated_at).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: false
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </button>

          {/* Action buttons - hidden when locked */}
          {!isLocked && (
            <div className="flex items-center gap-1 shrink-0">
              {!isCompleted && !isRunning && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGeneratePage(item);
                  }}
                  className="px-2 py-1 text-[10px] font-semibold rounded transition-all"
                  style={{
                    background: 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)',
                    color: 'white',
                  }}
                >
                  Generate
                </button>
              )}
              {isCompleted && (
                <a
                  href={`/api/preview/${item.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded hover:bg-white text-[#9A8FEA] transition-all"
                  title="View Live Page"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Calculate global item index across all projects
  let globalItemIndex = 0;

  return (
    <aside className="w-80 bg-white border border-[#E5E5E5] rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#E5E5E5] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#9CA3AF]">Current Project:</span>
            <h2 className="text-sm font-bold text-[#111827] truncate max-w-[140px]">{projectDomain || 'Unknown'}</h2>
          </div>
          <a
            href="/projects"
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded transition-all"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Projects
          </a>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {/* Brand Assets Section - Clickable */}
        <div className="p-2 border-b border-[#E5E5E5]">
          <button
            onClick={() => onOpenBrandAssetsModal()}
            className="w-full bg-[#FAFAFA] rounded-lg p-2.5 hover:bg-[#F3F4F6] transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span className="text-xs font-semibold text-[#374151]">Brand Assets</span>
              </div>
              <svg className="w-4 h-4 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
            {(() => {
              const logoContext = siteContexts.find(ctx => ctx.type === 'logo');
              const headerContext = siteContexts.find(ctx => ctx.type === 'header');
              const footerContext = siteContexts.find(ctx => ctx.type === 'footer');
              const hasLogo = !!(logoContext?.logo_light_url || logoContext?.file_url);
              const hasHeader = !!(headerContext?.content || headerContext?.html);
              const hasFooter = !!(footerContext?.content || footerContext?.html);
              return (
                <div className="space-y-0.5">
                  {[
                    { label: 'Logo & Colors', filled: hasLogo },
                    { label: 'Header', filled: hasHeader },
                    { label: 'Footer', filled: hasFooter },
                  ].map(({ label, filled }) => (
                    <div key={label} className="flex items-center gap-2 px-2 py-1 text-[11px] text-[#6B7280]">
                      <span className={`w-1.5 h-1.5 rounded-full ${filled ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </button>
        </div>

        {/* Competitors Section - Clickable */}
        <div className="p-2 border-b border-[#E5E5E5]">
          <button
            onClick={() => onOpenCompetitorsModal()}
            className="w-full bg-[#FAFAFA] rounded-lg p-2.5 hover:bg-[#F3F4F6] transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span className="text-xs font-semibold text-[#374151]">Competitors</span>
              </div>
              <svg className="w-4 h-4 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
            {(() => {
              const competitorsContext = siteContexts.find(ctx => ctx.type === 'competitors');
              let competitorCount = 0;
              let competitorNames: string[] = [];
              if (competitorsContext?.content) {
                try {
                  const parsed = JSON.parse(competitorsContext.content);
                  if (Array.isArray(parsed)) {
                    competitorCount = parsed.length;
                    competitorNames = parsed.slice(0, 3).map((c: any) => c.name || c.url || 'Unknown');
                  }
                } catch {}
              }
              return (
                <div className="px-2 py-1 text-[11px] text-[#6B7280]">
                  {competitorCount > 0 ? (
                    <div className="space-y-0.5">
                      {competitorNames.map((name, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <span className="truncate">{name}</span>
                        </div>
                      ))}
                      {competitorCount > 3 && (
                        <div className="text-[10px] text-[#9CA3AF] ml-3.5">+{competitorCount - 3} more</div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                      <span>No competitors yet</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </button>
        </div>

        {/* Your Page Blueprint */}
        <div className="p-2">
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Your Page Blueprint</span>
            <div className="flex items-center gap-1.5">
              {/* Refresh Button */}
              <button
                onClick={() => onRefreshContent()}
                disabled={isRefreshingContent || isPlanningPages}
                className={`p-1 rounded hover:bg-[#F3F4F6] text-[#9CA3AF] hover:text-[#6B7280] transition-colors ${isRefreshingContent ? 'opacity-50' : ''}`}
                title="Refresh Pages"
              >
                <svg className={`w-3.5 h-3.5 ${isRefreshingContent ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 2v6h-6" />
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M3 22v-6h6" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                </svg>
              </button>
              <span className="px-1.5 py-0.5 bg-[#F3F4F6] text-[#6B7280] text-[10px] font-medium rounded">
                {contentItems.length}
              </span>
            </div>
          </div>
          
          {/* Planning Pages Loading State */}
          {isPlanningPages && (
            <div className="mb-3 px-3 py-2.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span className="text-xs font-medium text-blue-700">Planning pages based on competitors...</span>
              </div>
            </div>
          )}

          {/* Upgrade banner - show at top when there are locked items */}
          {contentItems.length > maxVisibleItems && (
            <div className="mb-3 px-3 py-2.5 bg-gradient-to-r from-amber-50 to-purple-50 rounded-lg border border-amber-100">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B7280]">
                    <span className="font-bold">{contentItems.length}</span> pages planned
                  </span>
                  <a
                    href="/#pricing"
                    className="inline-flex items-center gap-1 px-3 py-1 text-[10px] font-semibold text-white rounded-full transition-all hover:opacity-90 shadow-sm"
                    style={{
                      background: 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)',
                    }}
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Upgrade
                  </a>
                </div>
                <div className="text-[10px] text-[#9CA3AF]">
                  Your plan allows <span className="font-semibold text-[#6B7280]">{maxVisibleItems}</span> page{maxVisibleItems > 1 ? 's' : ''}. 
                  Upgrade to generate all <span className="font-semibold text-[#6B7280]">{contentItems.length}</span> pages.
                </div>
              </div>
            </div>
          )}

          {contentItems.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <svg className="w-10 h-10 text-[#E5E5E5] mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
              <p className="text-xs text-[#9CA3AF]">No pages yet</p>
              <p className="text-[10px] text-[#D1D5DB] mt-1">Pages will appear after context analysis</p>
            </div>
          ) : (
            <div className="space-y-1 relative">
              {/* If only one project group and no uncategorized, show items directly without group header */}
              {groupedContent.length === 1 && uncategorizedItems.length === 0 ? (
                <div className="space-y-0.5">
                  {groupedContent[0].items.map((item) => {
                    const currentIndex = globalItemIndex;
                    globalItemIndex++;
                    const isLocked = currentIndex >= maxVisibleItems;
                    return renderPageItem(item, isLocked);
                  })}
                </div>
              ) : (
                /* Multiple projects - show with group headers */
                groupedContent.map((project) => (
                  <div key={project.id}>
                    <button
                      onClick={() => toggleProject(project.id)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#F3F4F6] transition-all"
                    >
                      <svg 
                        className={`w-3 h-3 text-[#9CA3AF] transition-transform ${expandedProjects[project.id] ? 'rotate-90' : ''}`} 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                      <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-tight flex-1 text-left truncate">
                        {project.name}
                      </span>
                      <span className="text-[10px] text-[#9CA3AF]">{project.items.length}</span>
                    </button>

                    {expandedProjects[project.id] && (
                      <div className="ml-2 space-y-0.5">
                        {project.items.map((item) => {
                          const currentIndex = globalItemIndex;
                          globalItemIndex++;
                          const isLocked = currentIndex >= maxVisibleItems;
                          return renderPageItem(item, isLocked);
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Uncategorized items */}
              {uncategorizedItems.map((item) => {
                const currentIndex = globalItemIndex;
                globalItemIndex++;
                const isLocked = currentIndex >= maxVisibleItems;
                return renderPageItem(item, isLocked);
              })}

            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
