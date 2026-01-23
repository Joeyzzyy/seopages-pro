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
  onContentUpdate?: (itemId: string, newContent: string) => void;
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
  onContentUpdate,
  isRegenerating = false,
}: TaskDetailPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep scroll at top - new messages appear at top and push old ones down
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Always keep scroll at top so newest messages are visible
    container.scrollTop = 0;
  }, [messages.length]);

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
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
          <p className="text-base font-medium text-[#374151] mb-1">Ready to generate pages?</p>
          <p className="text-sm text-[#9CA3AF]">Select a page from the left panel to start generating!</p>
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
        onContentUpdate={onContentUpdate ? (newContent: string) => onContentUpdate(contentItem.id, newContent) : undefined}
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
                {task.status === 'running' ? 'In Progress' : 'Ready to Generate'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content: Show blueprint details OR execution log */}
      <div ref={containerRef} className="flex-1 overflow-y-auto flex flex-col">
        {(() => {
          // Check if we have any displayable content (assistant messages with tools or content)
          const hasDisplayableContent = messages.some((m: any) => 
            m.role === 'assistant' && (
              (m.toolInvocations && m.toolInvocations.length > 0) || 
              (m.content && m.content.trim())
            )
          );
          
          // No messages and not loading = show blueprint
          if (messages.length === 0 && !isLoading) {
            return <PageBlueprintDetails contentItem={contentItem} />;
          }
          
          // Loading but no displayable content yet = show thinking indicator
          // This covers: no messages yet, or only user message, or assistant message without tools/content
          if (isLoading && !hasDisplayableContent) {
            return <ThinkingIndicator pageTitle={task.title} />;
          }
          
          // Has displayable content = show execution log
          return (
            <div className="p-4 space-y-4">
              {(() => {
                // Find the first user message to get task start info
                const userMessage = messages.find((m: any) => m.role === 'user');
                const taskStartTime = userMessage?.created_at || userMessage?.createdAt;
                const taskTitle = userMessage?.attachedContentItems?.[0]?.title || '';
                
                const renderedMessages = [...messages].reverse().map((message, index) => {
                  const originalIndex = messages.length - 1 - index;
                  return (
                    <MessageItem
                      key={message.id || originalIndex}
                      message={message}
                      isLastMessage={originalIndex === messages.length - 1}
                      isStreaming={isLoading && originalIndex === messages.length - 1}
                      userId={userId}
                      conversationId={conversationId}
                      files={files}
                      onUploadSuccess={onUploadSuccess}
                      onPreviewContentItem={onPreviewContentItem}
                      taskStartTime={taskStartTime}
                      taskTitle={taskTitle}
                      onRetry={onRegenerate && contentItem ? () => onRegenerate(contentItem) : undefined}
                    />
                  );
                });
                
                return renderedMessages;
              })()}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// Thinking indicator while AI prepares response
function ThinkingIndicator({ pageTitle }: { pageTitle: string }) {
  const [dots, setDots] = useState('');
  const [phase, setPhase] = useState(0);
  
  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);
  
  // Phase progression for visual feedback
  useEffect(() => {
    const phases = [0, 1, 2, 3];
    let currentPhase = 0;
    const interval = setInterval(() => {
      currentPhase = (currentPhase + 1) % phases.length;
      setPhase(currentPhase);
    }, 2500);
    return () => clearInterval(interval);
  }, []);
  
  const phaseMessages = [
    'Analyzing page blueprint',
    'Preparing generation workflow',
    'Initializing AI assistant',
    'Starting execution'
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      {/* Animated orb */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 via-blue-100 to-cyan-100 animate-pulse" />
        <div 
          className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-200 via-blue-200 to-cyan-200 animate-spin"
          style={{ animationDuration: '3s' }}
        />
        <div className="absolute inset-4 rounded-full bg-white flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-purple-500 animate-pulse" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5"
          >
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
      </div>
      
      {/* Page title */}
      <h3 className="text-lg font-semibold text-[#111827] mb-2 text-center max-w-md truncate">
        {pageTitle}
      </h3>
      
      {/* Current phase */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-[#6B7280]">
          {phaseMessages[phase]}{dots}
        </span>
      </div>
      
      {/* Progress steps */}
      <div className="flex items-center gap-2">
        {[0, 1, 2, 3].map((step) => (
          <div
            key={step}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              step <= phase 
                ? 'bg-purple-500 scale-100' 
                : 'bg-[#E5E5E5] scale-75'
            }`}
          />
        ))}
      </div>
      
      {/* Hint text */}
      <p className="text-xs text-[#9CA3AF] mt-8 text-center max-w-sm">
        AI is preparing to generate your page. This may take a few moments as we analyze the blueprint and set up the workflow.
      </p>
    </div>
  );
}

// Theme color presets
const THEME_PRESETS = [
  { name: 'blue', label: 'Ocean Blue', h: 199, s: 89, color: '#0ea5e9' },
  { name: 'emerald', label: 'Emerald Green', h: 160, s: 84, color: '#10b981' },
  { name: 'violet', label: 'Violet Purple', h: 263, s: 70, color: '#8b5cf6' },
  { name: 'rose', label: 'Rose Pink', h: 350, s: 89, color: '#f43f5e' },
  { name: 'amber', label: 'Amber Gold', h: 38, s: 92, color: '#f59e0b' },
  { name: 'teal', label: 'Teal', h: 172, s: 66, color: '#14b8a6' },
];

// Generated Page Viewer with Preview/Code toggle
function GeneratedPageViewer({ 
  contentItem, 
  title,
  onRegenerate,
  onContentUpdate
}: { 
  contentItem: ContentItem; 
  title: string;
  onRegenerate?: () => void;
  onContentUpdate?: (newContent: string) => void;
}) {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>('blue');
  const [customColor, setCustomColor] = useState<string>('#0ea5e9');
  const [currentHtml, setCurrentHtml] = useState<string>(contentItem.generated_content || '');
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const themePickerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update currentHtml when contentItem.id changes (new item selected)
  // Don't update when generated_content changes (to avoid overwriting during theme save)
  useEffect(() => {
    setCurrentHtml(contentItem.generated_content || '');
    // Reset theme to default when switching items
    setSelectedTheme('blue');
    setCustomColor('#0ea5e9');
  }, [contentItem.id]); // Only depend on id, not generated_content

  // Close theme picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themePickerRef.current && !themePickerRef.current.contains(event.target as Node)) {
        setShowThemePicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save theme to database (debounced)
  const saveThemeToDatabase = async (h: number, s: number, hexColor: string) => {
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce save by 500ms
    saveTimeoutRef.current = setTimeout(async () => {
      if (!contentItem.id || !currentHtml) return;
      
      // Update CSS variables in HTML - support both naming conventions
      const brand500 = `hsl(${h}, ${s}%, 50%)`;
      const brand600 = `hsl(${h}, ${s}%, 45%)`;
      const brand700 = `hsl(${h}, ${s}%, 38%)`;
      const brandLight = `hsl(${h}, ${s}%, 97%)`;
      
      let updatedHtml = currentHtml;
      
      // Replace HSL-based CSS variables (--brand-500/600/700)
      updatedHtml = updatedHtml.replace(
        /--brand-500:\s*[^;]+;/g,
        `--brand-500: ${brand500};`
      );
      updatedHtml = updatedHtml.replace(
        /--brand-600:\s*[^;]+;/g,
        `--brand-600: ${brand600};`
      );
      updatedHtml = updatedHtml.replace(
        /--brand-700:\s*[^;]+;/g,
        `--brand-700: ${brand700};`
      );
      
      // Replace hex-based CSS variables (--brand-color/dark/light) - used by Listicle pages
      updatedHtml = updatedHtml.replace(
        /--brand-color:\s*[^;]+;/g,
        `--brand-color: ${hexColor};`
      );
      updatedHtml = updatedHtml.replace(
        /--brand-color-dark:\s*[^;]+;/g,
        `--brand-color-dark: ${brand600};`
      );
      updatedHtml = updatedHtml.replace(
        /--brand-color-light:\s*[^;]+;/g,
        `--brand-color-light: ${brandLight};`
      );
      
      setCurrentHtml(updatedHtml);
      setIsSavingTheme(true);
      
      try {
        const response = await fetch('/api/content/items', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_id: contentItem.id,
            generated_content: updatedHtml
          })
        });
        
        if (response.ok) {
          // Successfully saved to database
          // Don't call onContentUpdate to avoid triggering a re-render that would reset the iframe
          console.log('[Theme] Saved to database successfully');
        } else {
          console.error('Failed to save theme');
        }
      } catch (error) {
        console.error('Error saving theme:', error);
      } finally {
        setIsSavingTheme(false);
      }
    }, 500);
  };

  // Apply theme to iframe
  const applyThemeToIframe = (h: number, s: number, hexColor: string, shouldSave: boolean = true) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow?.document) return;
    
    const doc = iframe.contentWindow.document;
    const brand500 = `hsl(${h}, ${s}%, 50%)`;
    const brand600 = `hsl(${h}, ${s}%, 45%)`;
    const brand700 = `hsl(${h}, ${s}%, 38%)`;
    const brandLight = `hsl(${h}, ${s}%, 97%)`;
    
    // Try to find .page-content-scope element first (for merged pages)
    const pageContentScope = doc.querySelector('.page-content-scope') as HTMLElement;
    if (pageContentScope) {
      // HSL-based variables
      pageContentScope.style.setProperty('--brand-500', brand500);
      pageContentScope.style.setProperty('--brand-600', brand600);
      pageContentScope.style.setProperty('--brand-700', brand700);
      // Hex-based variables (used by Listicle pages)
      pageContentScope.style.setProperty('--brand-color', hexColor);
      pageContentScope.style.setProperty('--brand-color-dark', brand600);
      pageContentScope.style.setProperty('--brand-color-light', brandLight);
    }
    
    // Also set on :root for non-merged pages
    const root = doc.documentElement;
    root.style.setProperty('--brand-500', brand500);
    root.style.setProperty('--brand-600', brand600);
    root.style.setProperty('--brand-700', brand700);
    root.style.setProperty('--brand-color', hexColor);
    root.style.setProperty('--brand-color-dark', brand600);
    root.style.setProperty('--brand-color-light', brandLight);
    
    // Directly apply styles to buttons (fixes broken CSS selectors in older pages)
    const btnPrimaryElements = doc.querySelectorAll('.btn-primary');
    btnPrimaryElements.forEach((btn: Element) => {
      (btn as HTMLElement).style.background = `linear-gradient(135deg, ${hexColor}, ${brand600})`;
      (btn as HTMLElement).style.color = 'white';
    });
    
    // Apply to brand icon backgrounds
    const brandIconElements = doc.querySelectorAll('.bg-brand-icon');
    brandIconElements.forEach((el: Element) => {
      (el as HTMLElement).style.backgroundColor = hexColor;
    });
    
    // Apply to text-brand elements
    const textBrandElements = doc.querySelectorAll('.text-brand, .text-brand-icon');
    textBrandElements.forEach((el: Element) => {
      (el as HTMLElement).style.color = hexColor;
    });
    
    // Save to database if requested
    if (shouldSave) {
      saveThemeToDatabase(h, s, hexColor);
    }
  };

  // Handle preset theme selection
  const handleThemeSelect = (theme: typeof THEME_PRESETS[0]) => {
    setSelectedTheme(theme.name);
    setCustomColor(theme.color);
    applyThemeToIframe(theme.h, theme.s, theme.color, true);
  };

  // Handle custom color change
  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setCustomColor(hex);
    setSelectedTheme('custom');
    
    // Convert hex to HSL and apply
    const hsl = hexToHslLocal(hex);
    applyThemeToIframe(hsl.h, hsl.s, hex, true);
  };

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
    if (currentHtml) {
      await navigator.clipboard.writeText(currentHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (currentHtml) {
      const blob = new Blob([currentHtml], { type: 'text/html' });
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
          {/* Theme Color Picker - Only show in preview mode */}
          {viewMode === 'preview' && (
            <div className="relative flex items-center" ref={themePickerRef}>
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                className="w-6 h-6 rounded border border-gray-300 shadow-sm hover:scale-110 transition-transform"
                style={{ backgroundColor: customColor }}
                title="Change Theme Color"
              />
              
              {/* Theme Picker Dropdown */}
              {showThemePicker && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-[#E5E5E5] p-3 z-50 w-[200px]">
                  <div className="text-xs font-medium text-[#374151] mb-2">Theme Color</div>
                  
                  {/* Preset Colors */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {THEME_PRESETS.map((theme) => (
                      <button
                        key={theme.name}
                        onClick={() => handleThemeSelect(theme)}
                        className={`w-6 h-6 rounded transition-transform hover:scale-110 flex-shrink-0 ${
                          selectedTheme === theme.name ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                        }`}
                        style={{ backgroundColor: theme.color }}
                        title={theme.label}
                      />
                    ))}
                  </div>
                  
                  {/* Custom Color Picker */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#E5E5E5]">
                    <label className="text-xs text-[#6B7280] flex-shrink-0">Custom:</label>
                    <input
                      type="color"
                      value={customColor}
                      onChange={handleCustomColorChange}
                      className="w-6 h-6 rounded cursor-pointer border border-gray-200 flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => {
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                          setCustomColor(e.target.value);
                          if (e.target.value.length === 7) {
                            setSelectedTheme('custom');
                            const hsl = hexToHslLocal(e.target.value);
                            applyThemeToIframe(hsl.h, hsl.s, e.target.value);
                          }
                        }
                      }}
                      className="w-[70px] text-xs px-1.5 py-1 border border-[#E5E5E5] rounded font-mono"
                      placeholder="#0ea5e9"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

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
      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'preview' ? (
          <iframe
            key={contentItem.id}
            ref={iframeRef}
            srcDoc={currentHtml || undefined}
            className="w-full h-full border-0"
            title={title}
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="h-full overflow-auto bg-[#1e1e1e]">
            <pre className="p-4 text-xs font-mono text-[#d4d4d4] whitespace-pre-wrap break-all">
              <code>{currentHtml}</code>
            </pre>
          </div>
        )}
        {/* Saving indicator */}
        {isSavingTheme && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/70 text-white text-xs rounded-full">
            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving...
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
          showIcon={false}
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

// Helper: Convert hex to HSL (local version for theme picker)
function hexToHslLocal(hex: string): { h: number; s: number; l: number } {
  let r = 0, g = 0, b = 0;
  
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
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
  taskStartTime,
  taskTitle,
  onRetry,
}: {
  message: any;
  isLastMessage: boolean;
  isStreaming: boolean;
  userId?: string;
  conversationId?: string;
  files: FileRecord[];
  onUploadSuccess: () => void;
  onPreviewContentItem: (itemId: string) => void;
  taskStartTime?: string;
  taskTitle?: string;
  onRetry?: () => void;
}) {
  const isUser = message.role === 'user';
  const hasToolInvocations = message.toolInvocations && message.toolInvocations.length > 0;
  const isErrorMessage = message.content?.startsWith('Error:');

  // Don't render user messages separately - they'll be shown as "Task Started" in tool list
  if (isUser) {
    return null;
  }

  // Don't render empty assistant messages (no tools, no content)
  const hasContent = hasToolInvocations || message.content;
  if (!hasContent) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Tool calls summary - includes "Task Started" as first item */}
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
          taskStartTime={taskStartTime}
          taskTitle={taskTitle}
        />
      )}

      {/* Error message with special styling */}
      {isErrorMessage && message.content && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-rose-700 font-medium mb-1">Generation Failed</div>
              <div className="text-rose-600 text-sm leading-relaxed">
                {message.content.split('\n')[0].replace('Error: ', '')}
              </div>
            </div>
          </div>
          
          {/* No credits charged notice */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 pl-11">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>No credits were charged for this failed attempt</span>
          </div>
          
          {/* Retry button */}
          {onRetry && (
            <div className="pl-11">
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Normal text content (not error) */}
      {!isErrorMessage && message.content && (
        <div className="prose prose-sm max-w-none">
          <MarkdownMessage content={message.content} />
        </div>
      )}
    </div>
  );
}
