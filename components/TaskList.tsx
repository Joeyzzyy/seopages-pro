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
  isDiscoveringCompetitors?: boolean;
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
  isDiscoveringCompetitors = false,
  isPlanningPages = false,
  contextTaskStatus,
  credits = 0,
  projectDomain,
}: TaskListProps) {
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [typeFilter, setTypeFilter] = useState<'all' | 'alternative' | 'listicle'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'planned' | 'generated'>('all');

  // Calculate counts for filters
  const counts = {
    all: contentItems.length,
    alternative: contentItems.filter(item => item.page_type === 'alternative').length,
    listicle: contentItems.filter(item => item.page_type === 'listicle').length,
    planned: contentItems.filter(item => item.status === 'ready').length,
    generated: contentItems.filter(item => item.status === 'generated').length,
  };

  // Apply filters and sort: generated first, then by updated_at descending (newest first)
  const filteredItems = contentItems
    .filter(item => {
      const matchesType = typeFilter === 'all' || item.page_type === typeFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesType && matchesStatus;
    })
    .sort((a, b) => {
      // First: generated items on top, planned items below
      if (a.status === 'generated' && b.status !== 'generated') return -1;
      if (a.status !== 'generated' && b.status === 'generated') return 1;
      // Then: within same status, sort by updated_at descending (newest first)
      // Use updated_at because created_at is batch creation time, updated_at reflects generation time
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  // Group filtered items by project (items within each group are sorted by created_at desc)
  const groupedContent = contentProjects.map(project => ({
    ...project,
    items: filteredItems.filter(item => item.project_id === project.id)
  }));

  // Filtered items without a project (Uncategorized) - already sorted
  const uncategorizedItems = filteredItems.filter(item => !item.project_id);

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

  // All items are now visible - credits check happens on Generate click
  // const maxVisibleItems = credits;

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
  const renderPageItem = (item: ContentItem) => {
    const task = getPageTask(item);
    const isSelected = selectedTaskId === task.id;
    const isRunning = task.status === 'running';
    const isCompleted = task.status === 'completed';
    const pageTypeBadge = getPageTypeBadge(item.page_type);

    return (
      <div key={item.id}>
        <div
          className={`group flex items-center gap-2 p-2 rounded-lg transition-all ${
            isSelected 
              ? 'bg-[#F3F4F6] border border-[#E5E5E5]' 
              : 'hover:bg-[#FAFAFA]'
          }`}
        >
          <button
            onClick={() => onSelectTask(task)}
            className="flex-1 flex items-center gap-2 min-w-0 text-left"
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

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
              {!isCompleted && !isRunning && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGeneratePage(item);
                  }}
                  disabled={!!runningTaskId}
                  className={`px-2 py-1 text-[10px] font-semibold rounded transition-all ${
                    runningTaskId ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{
                    background: runningTaskId 
                      ? '#D1D5DB'
                      : 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)',
                    color: 'white',
                  }}
                  title={runningTaskId ? 'Another page is being generated...' : 'Generate this page'}
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
        </div>
      </div>
    );
  };


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
              const hasDomain = !!(logoContext?.domain_name?.trim());
              const hasLogo = !!(logoContext?.logo_url || logoContext?.logo_light_url || logoContext?.file_url);
              const hasLanguage = !!(logoContext?.languages?.trim());
              const hasHeader = !!(headerContext?.content || headerContext?.html);
              const hasFooter = !!(footerContext?.content || footerContext?.html);
              return (
                <div className="space-y-0.5">
                  {[
                    { label: 'Domain', filled: hasDomain },
                    { label: 'Logo', filled: hasLogo },
                    { label: 'Language', filled: hasLanguage },
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
              let needsReviewCount = 0;
              let competitorNames: string[] = [];
              let competitorsFailed: boolean[] = [];
              if (competitorsContext?.content) {
                try {
                  const parsed = JSON.parse(competitorsContext.content);
                  if (Array.isArray(parsed)) {
                    competitorCount = parsed.length;
                    needsReviewCount = parsed.filter((c: any) => c.logo_fetch_failed === true).length;
                    const first3 = parsed.slice(0, 3);
                    competitorNames = first3.map((c: any) => c.name || c.url || 'Unknown');
                    competitorsFailed = first3.map((c: any) => c.logo_fetch_failed === true);
                  }
                } catch {}
              }
              return (
                <div className="px-2 py-1 text-[11px] text-[#6B7280]">
                  {competitorCount > 0 ? (
                    <div className="space-y-0.5">
                      {competitorNames.map((name, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${competitorsFailed[idx] ? 'bg-amber-400' : 'bg-green-500'}`} />
                          <span className={`truncate ${competitorsFailed[idx] ? 'text-amber-600' : ''}`}>{name}</span>
                        </div>
                      ))}
                      {competitorCount > 3 && (
                        <div className="text-[10px] text-[#9CA3AF] ml-3.5">+{competitorCount - 3} more</div>
                      )}
                      {needsReviewCount > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-700">
                          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{needsReviewCount} need{needsReviewCount !== 1 ? '' : 's'} review</span>
                        </div>
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
            </div>
          </div>
          
          {/* Filter Tabs */}
          {contentItems.length > 0 && (
            <div className="px-2 mb-3 space-y-1.5">
              {/* Type Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#9CA3AF] w-10">Type</span>
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                    typeFilter === 'all' 
                      ? 'bg-[#111827] text-white' 
                      : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                  }`}
                >
                  All {counts.all}
                </button>
                <button
                  onClick={() => setTypeFilter('alternative')}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                    typeFilter === 'alternative' 
                      ? 'bg-[#111827] text-white' 
                      : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                  }`}
                >
                  1v1 {counts.alternative}
                </button>
                <button
                  onClick={() => setTypeFilter('listicle')}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                    typeFilter === 'listicle' 
                      ? 'bg-[#111827] text-white' 
                      : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                  }`}
                >
                  Listicle {counts.listicle}
                </button>
              </div>
              
              {/* Status Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#9CA3AF] w-10">Status</span>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                    statusFilter === 'all' 
                      ? 'bg-[#111827] text-white' 
                      : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('planned')}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                    statusFilter === 'planned' 
                      ? 'bg-[#111827] text-white' 
                      : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                  }`}
                >
                  Todo {counts.planned}
                </button>
                <button
                  onClick={() => setStatusFilter('generated')}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                    statusFilter === 'generated' 
                      ? 'bg-[#111827] text-white' 
                      : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                  }`}
                >
                  Done {counts.generated}
                </button>
              </div>
            </div>
          )}
          
          {/* Discovering Competitors Loading State */}
          {isDiscoveringCompetitors && (
            <div className="mb-3 px-3 py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span className="text-xs font-medium text-emerald-700">Discovering competitors via AI + Web Search...</span>
              </div>
            </div>
          )}
          
          {/* Planning Pages Loading State */}
          {isPlanningPages && !isDiscoveringCompetitors && (
            <div className="mb-3 px-3 py-2.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span className="text-xs font-medium text-blue-700">Planning pages based on competitors...</span>
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
          ) : filteredItems.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <svg className="w-8 h-8 text-[#E5E5E5] mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <p className="text-xs text-[#9CA3AF]">No matching pages</p>
              <button 
                onClick={() => { setTypeFilter('all'); setStatusFilter('all'); }}
                className="text-[10px] text-blue-500 hover:underline mt-1"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-1 relative">
              {/* Render all filtered items in sorted order (generated first, then by time desc) */}
              <div className="space-y-0.5">
                {filteredItems.map((item) => renderPageItem(item))}
              </div>

            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
