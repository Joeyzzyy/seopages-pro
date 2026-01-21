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
  onOpenContextModal: (tab?: 'onsite' | 'knowledge') => void;
  isRefreshingSiteContexts?: boolean;
  isRefreshingContent?: boolean;
  contextTaskStatus: TaskStatus;
  credits?: number;
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
  onOpenContextModal,
  isRefreshingSiteContexts = false,
  isRefreshingContent = false,
  contextTaskStatus,
  credits = 1,
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
    return !!(logoContext?.brand_name || competitorsContext?.content);
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

  // Helper to render a single page item
  const renderPageItem = (item: ContentItem, isLocked: boolean) => {
    const task = getPageTask(item);
    const isSelected = selectedTaskId === task.id;
    const isRunning = task.status === 'running';
    const isCompleted = task.status === 'completed';

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
              <div className="text-xs font-medium text-[#374151] truncate">{task.title}</div>
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
          <h2 className="text-sm font-bold text-[#111827]">Tasks</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onRefreshSiteContexts();
                onRefreshContent();
              }}
              disabled={isRefreshingSiteContexts || isRefreshingContent}
              className="p-1.5 rounded hover:bg-[#F3F4F6] text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
              title="Refresh"
            >
              <svg className={`w-4 h-4 ${(isRefreshingSiteContexts || isRefreshingContent) ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {/* Context Task - Click to open modal directly */}
        <div className="p-2 border-b border-[#E5E5E5]">
          <button
            onClick={() => onOpenContextModal()}
            className="w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left hover:bg-[#FAFAFA]"
          >
            {getStatusIcon(contextTask.status, 'context')}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[#111827]">{contextTask.title}</div>
              <div className="text-xs text-[#6B7280] truncate">{contextTask.subtitle}</div>
            </div>
            <svg className="w-4 h-4 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>

        {/* Page Tasks */}
        <div className="p-2">
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Page Tasks</span>
            <span className="px-1.5 py-0.5 bg-[#F3F4F6] text-[#6B7280] text-[10px] font-medium rounded">
              {contentItems.length}
            </span>
          </div>

          {contentItems.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <svg className="w-10 h-10 text-[#E5E5E5] mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
              <p className="text-xs text-[#9CA3AF]">No page tasks yet</p>
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

              {/* Upgrade banner for locked items */}
              {contentItems.length > maxVisibleItems && (
                <div className="relative mt-2">
                  {/* Glassmorphism overlay - covers only this area */}
                  <div 
                    className="absolute inset-0 z-10 flex items-center justify-center rounded-lg"
                    style={{ 
                      background: 'linear-gradient(to bottom, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.95) 100%)',
                      backdropFilter: 'blur(2px)',
                    }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs text-[#6B7280]">
                        <span className="font-bold">{contentItems.length - maxVisibleItems}</span> more page{contentItems.length - maxVisibleItems > 1 ? 's' : ''} · 
                        <span className="font-bold"> {maxVisibleItems}</span> credit{maxVisibleItems > 1 ? 's' : ''} left
                      </span>
                      <a
                        href="/#pricing"
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white rounded-full transition-all hover:opacity-90 shadow-lg"
                        style={{
                          background: 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)',
                        }}
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        Upgrade
                      </a>
                    </div>
                  </div>
                  {/* Placeholder content to give height */}
                  <div className="py-8 opacity-0 pointer-events-none">
                    <div className="h-4"></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
