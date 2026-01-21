'use client';

import { useState, useEffect, useRef } from 'react';
import type { ContentItem, FileRecord } from '@/lib/supabase';
import type { Task } from './TaskList';
import ToolCallsSummary from './ToolCallsSummary';
import MarkdownMessage from './MarkdownMessage';
import ConfirmModal from './ConfirmModal';

interface TaskDetailPanelProps {
  task: Task | null;
  messages: any[];
  isLoading: boolean;
  userId?: string;
  conversationId?: string;
  files: FileRecord[];
  onUploadSuccess: () => void;
  onPreviewContentItem: (itemId: string) => void;
  onRegenerate?: (item: ContentItem) => void;
  isRegenerating?: boolean;  // Indicates if a regeneration is in progress
}

export default function TaskDetailPanel({
  task,
  messages,
  isLoading,
  userId,
  conversationId,
  files,
  onUploadSuccess,
  onPreviewContentItem,
  onRegenerate,
  isRegenerating = false,
}: TaskDetailPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current && isLoading) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  if (!task) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA] rounded-lg border border-[#E5E5E5]">
        <div className="text-center">
          <svg className="w-16 h-16 text-[#E5E5E5] mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 12h6" />
            <path d="M9 16h6" />
          </svg>
          <p className="text-sm text-[#9CA3AF]">Select a task to view details</p>
        </div>
      </div>
    );
  }

  // Context task is handled by modal, not shown in detail panel
  if (task.type === 'context') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA] rounded-lg border border-[#E5E5E5]">
        <div className="text-center">
          <svg className="w-16 h-16 text-[#E5E5E5] mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <p className="text-sm text-[#9CA3AF]">Click "Brand & Context" to edit</p>
        </div>
      </div>
    );
  }

  // Page task detail view
  const contentItem = task.data as ContentItem;
  const isGenerated = contentItem?.status === 'generated' || !!contentItem?.generated_content;

  // If generated AND not currently regenerating, show the rendered page with preview/code toggle
  // When regenerating, we want to show the execution log instead of the preview
  if (isGenerated && contentItem?.generated_content && !isRegenerating) {
    return (
      <GeneratedPageViewer 
        contentItem={contentItem} 
        title={task.title}
        onRegenerate={onRegenerate ? () => onRegenerate(contentItem) : undefined}
      />
    );
  }

  // If not generated, show page blueprint details
  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg border border-[#E5E5E5] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#E5E5E5]">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-[#111827] truncate">{task.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              {task.subtitle && (
                <span className="text-sm text-[#6B7280]">{task.subtitle}</span>
              )}
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                task.status === 'running'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {task.status === 'running' ? 'Running...' : 'Ready to Generate'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content: Show blueprint details OR execution log */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !isLoading ? (
          // No messages = show blueprint planning details
          <PageBlueprintDetails contentItem={contentItem} />
        ) : (
          // Has messages = show execution log
          <div className="p-4 space-y-4">
            {messages.map((message, index) => (
              <MessageItem
                key={message.id || index}
                message={message}
                isLastMessage={index === messages.length - 1}
                isStreaming={isLoading && index === messages.length - 1}
                userId={userId}
                conversationId={conversationId}
                files={files}
                onUploadSuccess={onUploadSuccess}
                onPreviewContentItem={onPreviewContentItem}
              />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-[#9A8FEA]">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Processing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}

// Generated Page Viewer with Preview/Code toggle
function GeneratedPageViewer({ 
  contentItem, 
  title,
  onRegenerate
}: { 
  contentItem: ContentItem; 
  title: string;
  onRegenerate?: () => void;
}) {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  const handleRegenerateClick = () => {
    setShowRegenerateConfirm(true);
  };

  const handleRegenerateConfirm = () => {
    setShowRegenerateConfirm(false);
    if (onRegenerate) {
      onRegenerate();
    }
  };

  const handleCopyCode = async () => {
    if (contentItem.generated_content) {
      await navigator.clipboard.writeText(contentItem.generated_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (contentItem.generated_content) {
      const blob = new Blob([contentItem.generated_content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contentItem.slug || 'page'}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg border border-[#E5E5E5] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
            Generated
          </span>
          <h2 className="text-sm font-medium text-[#374151] truncate max-w-[200px]">{title}</h2>
          {contentItem.updated_at && (
            <span className="text-[10px] text-[#9CA3AF] flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {new Date(contentItem.updated_at).toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false
              })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Preview/Code Toggle */}
          <div className="flex items-center bg-[#E5E5E5] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === 'preview'
                  ? 'bg-white text-[#111827] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Preview
              </span>
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === 'code'
                  ? 'bg-white text-[#111827] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                Code
              </span>
            </button>
          </div>

          {/* Actions */}
          {viewMode === 'code' && (
            <button
              onClick={handleCopyCode}
              className="px-2.5 py-1 text-xs font-medium text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E5E5] rounded-lg transition-colors flex items-center gap-1"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          )}

          <button
            onClick={handleDownload}
            className="px-2.5 py-1 text-xs font-medium text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E5E5] rounded-lg transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download
          </button>

          {/* Regenerate Button */}
          {onRegenerate && (
            <button
              onClick={handleRegenerateClick}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 border border-[#E5E5E5] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
              Regenerate
            </button>
          )}

          <a
            href={`/api/preview/${contentItem.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 bg-[#111827] text-white text-xs font-medium rounded-lg hover:bg-[#374151] transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            New Tab
          </a>
        </div>
      </div>

      {/* Content based on view mode */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'preview' ? (
          <iframe
            srcDoc={contentItem.generated_content || undefined}
            className="w-full h-full border-0"
            title={title}
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="h-full overflow-auto bg-[#1e1e1e]">
            <pre className="p-4 text-xs font-mono text-[#d4d4d4] whitespace-pre-wrap break-all">
              <code>{contentItem.generated_content}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Regenerate Confirmation Modal */}
      {showRegenerateConfirm && (
        <ConfirmModal
          title="Regenerate Page"
          message={`Are you sure you want to regenerate "${title}"? This will replace the current content with a new version.`}
          confirmText="Regenerate"
          cancelText="Cancel"
          onConfirm={handleRegenerateConfirm}
          onCancel={() => setShowRegenerateConfirm(false)}
          isDangerous={false}
        />
      )}
    </div>
  );
}

// Page Blueprint Details component - shows all planning fields
function PageBlueprintDetails({ contentItem }: { contentItem: ContentItem }) {
  if (!contentItem) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#9CA3AF]">No page data available</p>
      </div>
    );
  }

  // Parse outline if it's a string
  let outline = contentItem.outline;
  if (typeof outline === 'string') {
    try {
      outline = JSON.parse(outline);
    } catch {}
  }

  // Parse keyword_data if it's a string
  let keywordData = contentItem.keyword_data;
  if (typeof keywordData === 'string') {
    try {
      keywordData = JSON.parse(keywordData);
    } catch {}
  }

  // Parse serp_insights if it's a string
  let serpInsights = contentItem.serp_insights;
  if (typeof serpInsights === 'string') {
    try {
      serpInsights = JSON.parse(serpInsights);
    } catch {}
  }

  return (
    <div className="p-6 space-y-6">
      {/* Basic Info */}
      <section className="bg-[#FAFAFA] rounded-xl p-5">
        <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Basic Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <DetailField label="Title" value={contentItem.title} />
          <DetailField label="Page Type" value={contentItem.page_type} badge />
          <DetailField label="Target Keyword" value={contentItem.target_keyword} highlight />
          <DetailField label="Slug" value={contentItem.slug} code />
          <DetailField label="Priority" value={contentItem.priority?.toString()} />
          <DetailField label="Est. Word Count" value={contentItem.estimated_word_count?.toString()} />
        </div>
      </section>

      {/* SEO Meta */}
      <section className="bg-[#FAFAFA] rounded-xl p-5">
        <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          SEO Meta Tags
        </h3>
        <div className="space-y-3">
          <DetailField label="SEO Title" value={contentItem.seo_title} fullWidth />
          <DetailField label="Meta Description" value={contentItem.seo_description} fullWidth multiline />
        </div>
      </section>

      {/* Tags */}
      {contentItem.tags && contentItem.tags.length > 0 && (
        <section className="bg-[#FAFAFA] rounded-xl p-5">
          <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {contentItem.tags.map((tag, idx) => (
              <span key={idx} className="px-2 py-1 bg-[#E5E5E5] text-[#374151] text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Keyword Data */}
      {keywordData && (
        <section className="bg-[#FAFAFA] rounded-xl p-5">
          <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Keyword Data
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {keywordData.search_volume && (
              <DetailField label="Search Volume" value={keywordData.search_volume.toString()} />
            )}
            {keywordData.difficulty && (
              <DetailField label="Keyword Difficulty" value={keywordData.difficulty.toString()} />
            )}
            {keywordData.cpc && (
              <DetailField label="CPC" value={`$${keywordData.cpc}`} />
            )}
            {keywordData.competition && (
              <DetailField label="Competition" value={keywordData.competition} />
            )}
          </div>
          {keywordData.related_keywords && keywordData.related_keywords.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-[#9CA3AF] mb-2">Related Keywords</div>
              <div className="flex flex-wrap gap-1">
                {keywordData.related_keywords.slice(0, 10).map((kw: string, idx: number) => (
                  <span key={idx} className="px-2 py-0.5 bg-white text-[#6B7280] text-xs rounded border border-[#E5E5E5]">
                    {kw}
                  </span>
                ))}
                {keywordData.related_keywords.length > 10 && (
                  <span className="px-2 py-0.5 text-[#9CA3AF] text-xs">
                    +{keywordData.related_keywords.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Content Outline */}
      {outline && (
        <section className="bg-[#FAFAFA] rounded-xl p-5">
          <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            Content Outline
          </h3>
          <div className="space-y-2">
            {Array.isArray(outline) ? (
              outline.map((section: any, idx: number) => (
                <div key={idx} className="bg-white rounded-lg p-3 border border-[#E5E5E5]">
                  <div className="text-sm font-medium text-[#374151]">
                    {typeof section === 'string' ? section : section.title || section.heading || JSON.stringify(section)}
                  </div>
                  {section.description && (
                    <div className="text-xs text-[#6B7280] mt-1">{section.description}</div>
                  )}
                  {section.subsections && Array.isArray(section.subsections) && (
                    <div className="mt-2 pl-3 border-l-2 border-[#E5E5E5] space-y-1">
                      {section.subsections.map((sub: any, subIdx: number) => (
                        <div key={subIdx} className="text-xs text-[#6B7280]">
                          • {typeof sub === 'string' ? sub : sub.title || sub.heading || JSON.stringify(sub)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <pre className="text-xs text-[#6B7280] bg-white p-3 rounded-lg border border-[#E5E5E5] overflow-x-auto">
                {JSON.stringify(outline, null, 2)}
              </pre>
            )}
          </div>
        </section>
      )}

      {/* SERP Insights */}
      {serpInsights && (
        <section className="bg-[#FAFAFA] rounded-xl p-5">
          <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            SERP Insights
          </h3>
          <pre className="text-xs text-[#6B7280] bg-white p-3 rounded-lg border border-[#E5E5E5] overflow-x-auto max-h-40">
            {JSON.stringify(serpInsights, null, 2)}
          </pre>
        </section>
      )}

      {/* Reference URLs */}
      {contentItem.reference_urls && contentItem.reference_urls.length > 0 && (
        <section className="bg-[#FAFAFA] rounded-xl p-5">
          <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Reference URLs ({contentItem.reference_urls.length})
          </h3>
          <div className="space-y-1">
            {contentItem.reference_urls.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-[#6B7280] hover:text-[#111827] truncate"
              >
                {url}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Internal Links */}
      {contentItem.internal_links && contentItem.internal_links.length > 0 && (
        <section className="bg-[#FAFAFA] rounded-xl p-5">
          <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Internal Links ({contentItem.internal_links.length})
          </h3>
          <div className="space-y-1">
            {contentItem.internal_links.map((link: any, idx: number) => (
              <div key={idx} className="text-xs text-[#6B7280]">
                {typeof link === 'string' ? link : link.url || link.href || JSON.stringify(link)}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Notes */}
      {contentItem.notes && (
        <section className="bg-[#FAFAFA] rounded-xl p-5">
          <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Notes
          </h3>
          <p className="text-sm text-[#6B7280] whitespace-pre-wrap">{contentItem.notes}</p>
        </section>
      )}
    </div>
  );
}

// Detail field helper component
function DetailField({ 
  label, 
  value, 
  badge = false, 
  code = false, 
  highlight = false, 
  fullWidth = false,
  multiline = false
}: { 
  label: string; 
  value?: string | null; 
  badge?: boolean;
  code?: boolean;
  highlight?: boolean;
  fullWidth?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <div className="text-xs text-[#9CA3AF] mb-1">{label}</div>
      {value ? (
        badge ? (
          <span className="inline-block px-2 py-0.5 bg-[#E5E5E5] text-[#374151] text-xs font-medium rounded-full capitalize">
            {value.replace(/_/g, ' ')}
          </span>
        ) : code ? (
          <code className="text-xs font-mono bg-[#E5E5E5] px-2 py-0.5 rounded text-[#374151]">{value}</code>
        ) : highlight ? (
          <span className="text-sm font-medium text-[#111827] bg-yellow-50 px-1 rounded">{value}</span>
        ) : multiline ? (
          <p className="text-sm text-[#374151] whitespace-pre-wrap">{value}</p>
        ) : (
          <div className="text-sm text-[#374151]">{value}</div>
        )
      ) : (
        <span className="text-sm text-[#D1D5DB] italic">Not set</span>
      )}
    </div>
  );
}

// Message item component
function MessageItem({
  message,
  isLastMessage,
  isStreaming,
  userId,
  conversationId,
  files,
  onUploadSuccess,
  onPreviewContentItem,
}: {
  message: any;
  isLastMessage: boolean;
  isStreaming: boolean;
  userId?: string;
  conversationId?: string;
  files: FileRecord[];
  onUploadSuccess: () => void;
  onPreviewContentItem: (itemId: string) => void;
}) {
  const isUser = message.role === 'user';
  const hasToolInvocations = message.toolInvocations && message.toolInvocations.length > 0;

  // For user messages, just show a brief indicator
  if (isUser) {
    return (
      <div className="text-xs text-[#9CA3AF] py-2 border-b border-[#F3F4F6]">
        <span className="font-medium">Task started</span>
        {message.attachedContentItems && message.attachedContentItems.length > 0 && (
          <span className="ml-2">
            • {message.attachedContentItems.map((item: any) => item.title).join(', ')}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Tool calls summary */}
      {hasToolInvocations && (
        <ToolCallsSummary
          toolInvocations={message.toolInvocations}
          userId={userId}
          conversationId={conversationId}
          files={files}
          onUploadSuccess={onUploadSuccess}
          onPreviewContentItem={onPreviewContentItem}
          isLastMessage={isLastMessage}
          isStreaming={isStreaming}
        />
      )}

      {/* Text content */}
      {message.content && (
        <div className="prose prose-sm max-w-none">
          <MarkdownMessage content={message.content} />
        </div>
      )}
    </div>
  );
}
