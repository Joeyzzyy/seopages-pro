'use client';

import { useState } from 'react';
import FileDownloadCard from './FileDownloadCard';
import type { FileRecord } from '@/lib/supabase';

interface ToolCallsSummaryProps {
  toolInvocations: any[];
  userId?: string;
  conversationId?: string;
  files?: FileRecord[];
  onUploadSuccess?: () => void;
  onPreviewContentItem?: (itemId: string) => void;
  isLastMessage?: boolean;
  isStreaming?: boolean;
  showFiles?: boolean;
  taskStartTime?: string;  // Time when task started (for user message)
  taskTitle?: string;      // Task title to show as first item
}

// Format JSON for display with truncation for long values
function formatJsonValue(value: any, maxLength: number = 500): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') {
    if (value.length > maxLength) {
      return `"${value.slice(0, maxLength)}..." (${value.length} chars)`;
    }
    return `"${value}"`;
  }
  if (typeof value === 'object') {
    const str = JSON.stringify(value, null, 2);
    if (str.length > maxLength) {
      return str.slice(0, maxLength) + '... (truncated)';
    }
    return str;
  }
  return String(value);
}

// Get tool display name
function getToolDisplayName(toolName: string): string {
  const nameMap: Record<string, string> = {
    'keyword_overview': 'Keyword Overview',
    'generate_csv': 'Generate CSV',
    'web_search': 'Web Search',
    'extract_content': 'Extract Content',
    'search_serp': 'SERP Search',
    'analyze_serp_structure': 'Analyze Page Structures',
    'generate_outline': 'Generate Outline',
    'save_content_item': 'Save to Library',
    'save_content_items_batch': 'Batch Save',
    'create_plan': 'Create Plan',
    'acquire_context_field': 'Acquire Context Field',
  };
  return nameMap[toolName] || toolName?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Tool';
}


// Get brief action description
function getToolAction(inv: any): string {
  const args = inv.args || {};
  const result = inv.result || {};
  
  switch (inv.toolName) {
    case 'keyword_overview':
      return args.keyword || result.keyword || '';
    case 'web_search':
      return args.query || '';
    case 'extract_content':
      return args.url?.slice(0, 50) || '';
    case 'search_serp':
      return args.query || '';
    case 'analyze_serp_structure':
      return args.query || '';
    case 'generate_outline':
      return args.title || args.target_keyword || '';
    case 'save_content_item':
      return args.title || '';
    case 'save_content_items_batch':
      return `${args.items?.length || 0} items`;
    case 'acquire_context_field':
      return args.field || '';
    case 'research_product_deep':
      return args.product_name || '';
    default:
      const firstArg = Object.values(args).find(v => typeof v === 'string');
      return typeof firstArg === 'string' ? firstArg.slice(0, 50) : '';
  }
}

export default function ToolCallsSummary({ 
  toolInvocations, 
  userId, 
  conversationId, 
  files = [],
  onUploadSuccess,
  onPreviewContentItem,
  isLastMessage = false,
  isStreaming = false,
  showFiles = false,
  taskStartTime,
  taskTitle,
}: ToolCallsSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);  // Default expanded, no auto expand/collapse
  const [filesExpanded, setFilesExpanded] = useState(true);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  const toggleToolExpanded = (toolCallId: string) => {
    setExpandedTools(prev => {
      const next = new Set(prev);
      if (next.has(toolCallId)) {
        next.delete(toolCallId);
      } else {
        next.add(toolCallId);
      }
      return next;
    });
  };

  if (!toolInvocations || toolInvocations.length === 0) {
    return null;
  }

  // Filter out tracker tools and failed image generations
  const excludedToolNames = new Set(['create_conversation_tracker', 'add_task_to_tracker', 'update_task_status', 'create_plan']);
  
  const failedGenerateImagesIds = new Set<string>();
  toolInvocations.forEach(inv => {
    if (inv.toolName === 'deerapi_generate_images' && inv.result?.success) {
      const failedGenerateImages = toolInvocations.find(
        (prevInv: any) => 
          prevInv.toolName === 'generate_images' && 
          prevInv.toolCallId !== inv.toolCallId &&
          (!prevInv.result?.success || prevInv.result?.images?.some((img: any) => img.status === 'error'))
      );
      if (failedGenerateImages) {
        failedGenerateImagesIds.add(failedGenerateImages.toolCallId);
      }
    }
  });

  // Separate file results from other invocations
  const fileResults: any[] = [];
  const displayInvocations: any[] = [];
  
  toolInvocations.forEach(inv => {
    if (excludedToolNames.has(inv.toolName)) return;
    if (inv.result?.metadata?.isTracker || inv.result?.filename?.includes('conversation-tracker-')) return;
    if (inv.toolName === 'generate_images' && failedGenerateImagesIds.has(inv.toolCallId)) return;
    
    const isResult = inv.state === 'result' || (inv.result && !inv.state);
    
    if (isResult && ((inv.result?.filename && inv.result?.mimeType) || Array.isArray(inv.result?.images))) {
      fileResults.push(inv);
    }
    
    displayInvocations.push(inv);
  });
  
  const completedCount = displayInvocations.filter(inv => inv.state === 'result' || (!inv.state && inv.result)).length;
  const totalCount = displayInvocations.length;
  const runningTools = displayInvocations.filter(inv => inv.state === 'call');
  const isRunningAny = runningTools.length > 0;

  return (
    <div className="space-y-2">
      {/* Simple Tool List */}
      {displayInvocations.length > 0 && (
        <div className="border border-[#F0F0F0] rounded-lg bg-[#FAFAFA] overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {isRunningAny ? (
                <svg className="w-4 h-4 animate-spin text-[#9A8FEA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-[#10B981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              <span className="text-sm font-medium text-[#374151]">
                {isRunningAny 
                  ? `Running: ${runningTools.map(t => {
                      const name = getToolDisplayName(t.toolName);
                      const action = getToolAction(t);
                      return action ? `${name} (${action})` : name;
                    }).join(', ')}` 
                  : `${completedCount} tool${completedCount !== 1 ? 's' : ''} completed`
                }
              </span>
            </div>
            <svg 
              className={`w-4 h-4 text-[#9CA3AF] transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Tool List */}
          {isExpanded && (
            <div className="border-t border-[#F0F0F0] divide-y divide-[#F0F0F0]">
              {/* Waiting for next step indicator - show when all tools done but still streaming */}
              {isStreaming && !isRunningAny && completedCount > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full border-2 border-purple-300 border-t-purple-600 animate-spin" />
                    </div>
                    <span className="text-xs font-semibold text-purple-700">Thinking...</span>
                    <span className="text-xs text-purple-600">Preparing next step</span>
                  </div>
                </div>
              )}
              
              {[...displayInvocations]
                .reverse()  // Newest tools at top
                .sort((a, b) => {
                  // Sort: running tools FIRST (so they appear at top, most visible)
                  const aRunning = a.state === 'call';
                  const bRunning = b.state === 'call';
                  if (aRunning && !bRunning) return -1; // a goes before b (running first)
                  if (!aRunning && bRunning) return 1; // b goes before a
                  return 0; // maintain reversed order for same state
                })
                .map((inv) => {
                const isRunning = inv.state === 'call';
                const isComplete = inv.state === 'result' || (!inv.state && inv.result);
                const isError = inv.result?.found === false || inv.result?.error;
                const toolName = getToolDisplayName(inv.toolName);
                const action = getToolAction(inv);
                const isToolExpanded = expandedTools.has(inv.toolCallId);
                
                return (
                  <div key={inv.toolCallId} className="bg-white">
                    {/* Tool Row - Clickable */}
                    <div 
                      onClick={() => toggleToolExpanded(inv.toolCallId)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                    >
                      {/* Status Icon */}
                      <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                        {isRunning && (
                          <svg className="w-3.5 h-3.5 animate-spin text-[#9A8FEA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                        )}
                        {isComplete && !isError && (
                          <svg className="w-3.5 h-3.5 text-[#10B981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        {isError && (
                          <svg className="w-3.5 h-3.5 text-[#EF4444]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        )}
                      </div>
                      
                      {/* Tool Name */}
                      <span className={`text-xs font-semibold min-w-[120px] ${isRunning ? 'text-[#9A8FEA]' : isError ? 'text-[#EF4444]' : 'text-[#374151]'}`}>
                        {toolName}
                      </span>
                      
                      {/* Action */}
                      {action && (
                        <span className={`text-xs truncate flex-1 ${isRunning ? 'text-[#B4A8F8] italic' : 'text-[#6B7280]'}`}>
                          {action}
                        </span>
                      )}
                      
                      {/* Keyword Metrics */}
                      {inv.result?.keyword && inv.result?.found !== false && (
                        <div className="flex items-center gap-1.5 text-[10px] text-[#6B7280] font-medium flex-shrink-0">
                          <span className="bg-[#F3F4F6] px-1.5 py-0.5 rounded">Vol: {inv.result.searchVolume?.toLocaleString()}</span>
                          <span className="bg-[#F3F4F6] px-1.5 py-0.5 rounded">KD: {inv.result.keywordDifficulty?.toFixed(0)}%</span>
                        </div>
                      )}

                      {/* Expand Arrow */}
                      <svg 
                        className={`w-3 h-3 text-[#9CA3AF] transition-transform flex-shrink-0 ${isToolExpanded ? 'rotate-180' : ''}`} 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>

                    {/* Expanded Details */}
                    {isToolExpanded && (
                      <div className="px-3 pb-3 pt-1 bg-[#FAFAFA] border-t border-[#F0F0F0]">
                        {/* Input Arguments */}
                        {inv.args && Object.keys(inv.args).length > 0 && (
                          <div className="mb-2">
                            <div className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Input</div>
                            <div className="bg-white rounded border border-[#E5E7EB] p-2 overflow-x-auto">
                              <pre className="text-[11px] text-[#374151] whitespace-pre-wrap break-all font-mono">
                                {Object.entries(inv.args).map(([key, value]) => (
                                  <div key={key} className="mb-1 last:mb-0">
                                    <span className="text-[#9333EA]">{key}</span>
                                    <span className="text-[#6B7280]">: </span>
                                    <span className="text-[#059669]">{formatJsonValue(value, 300)}</span>
                                  </div>
                                ))}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Output Result */}
                        {inv.result && (
                          <div>
                            <div className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
                              Output {isError && <span className="text-[#EF4444] normal-case">(Error)</span>}
                            </div>
                            <div className={`bg-white rounded border p-2 overflow-x-auto ${isError ? 'border-[#FCA5A5] bg-[#FEF2F2]' : 'border-[#E5E7EB]'}`}>
                              <pre className={`text-[11px] whitespace-pre-wrap break-all font-mono ${isError ? 'text-[#B91C1C]' : 'text-[#374151]'}`}>
                                {formatJsonValue(inv.result, 1000)}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Still running indicator */}
                        {isRunning && (
                          <div className="text-[11px] text-[#9A8FEA] italic flex items-center gap-1.5">
                            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                            Running...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* File List */}
      {showFiles && fileResults.length > 0 && (
        <div className="border border-[#F0F0F0] rounded-lg bg-[#FAFAFA] overflow-hidden">
          <button
            onClick={() => setFilesExpanded(!filesExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-sm font-medium text-[#374151]">
                Generated Files ({fileResults.reduce((acc, inv) => {
                  if (Array.isArray(inv.result?.images)) {
                    return acc + inv.result.images.length;
                  }
                  return acc + 1;
                }, 0)})
              </span>
            </div>
            <svg 
              className={`w-4 h-4 text-[#9CA3AF] transition-transform ${filesExpanded ? 'rotate-180' : ''}`} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {filesExpanded && (
            <div className="border-t border-[#F0F0F0] p-2 space-y-2 bg-white/50">
              {fileResults.map(inv => {
                let fallbackInfo: { primaryServiceFailed?: string; fallbackUsed?: boolean } = {};
                if (inv.toolName === 'deerapi_generate_images') {
                  const previousGenerateImages = toolInvocations.find(
                    (prevInv: any) => 
                      prevInv.toolName === 'generate_images' && 
                      prevInv.toolCallId !== inv.toolCallId &&
                      (!prevInv.result?.success || prevInv.result?.images?.some((img: any) => img.status === 'error'))
                  );
                  if (previousGenerateImages) {
                    fallbackInfo = {
                      primaryServiceFailed: 'Google Gemini',
                      fallbackUsed: true
                    };
                  }
                }
                
                if (Array.isArray(inv.result?.images)) {
                  return inv.result.images.map((img: any, idx: number) => (
                    <FileDownloadCard
                      key={`${inv.toolCallId}-${idx}`}
                      result={{ ...img, needsUpload: false, ...fallbackInfo }}
                      userId={userId}
                      conversationId={conversationId}
                      files={files}
                      onUploadSuccess={onUploadSuccess}
                      toolName={inv.toolName}
                      compact={true}
                    />
                  ));
                }

                const safeResult = { ...inv.result, needsUpload: false, ...fallbackInfo };
                return (
                  <FileDownloadCard
                    key={inv.toolCallId}
                    result={safeResult}
                    userId={userId}
                    conversationId={conversationId}
                    files={files}
                    onUploadSuccess={onUploadSuccess}
                    toolName={inv.toolName}
                    compact={true}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
