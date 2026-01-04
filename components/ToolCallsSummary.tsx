'use client';

import { useState, useEffect } from 'react';
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
  showFiles?: boolean; // Control whether to show files in this component
}

// Extract plan steps from create_plan tool
function extractPlanSteps(toolInvocations: any[]): any[] {
  const planTool = toolInvocations.find(inv => inv.toolName === 'create_plan');
  if (!planTool || !planTool.args) return [];
  
  // Try multiple possible structures
  const steps = planTool.args.steps || planTool.result?.plan?.steps || planTool.result?.steps || [];
  
  // Normalize step structure
  return steps.map((step: any, index: number) => {
    if (typeof step === 'string') {
      return { step_number: index + 1, description: step };
    }
    return {
      step_number: step.step_number || index + 1,
      description: step.description || step.title || step
    };
  });
}

// Get current step number based on update_task_status calls
function getCurrentStepNumber(toolInvocations: any[], currentIndex: number): number {
  // Look back through invocations to find the last update_task_status before this index
  let currentStep = 1;
  
  for (let i = 0; i <= currentIndex; i++) {
    const inv = toolInvocations[i];
    if (inv.toolName === 'update_task_status' && inv.args) {
      const completedSteps = inv.args.completed_steps || [];
      if (completedSteps.length > 0) {
        currentStep = Math.max(...completedSteps) + 1;
      }
    }
  }
  
  return currentStep;
}

// Group tools by plan step based on update_task_status markers
function groupToolsByPlanStep(toolInvocations: any[], planSteps: any[]): Map<number, any[]> {
  const grouped = new Map<number, any[]>();
  
  if (planSteps.length === 0) {
    // No plan, return all tools in a single group
    return grouped;
  }

  // Find all update_task_status tools
  const statusUpdates = toolInvocations
    .map((inv, index) => ({ inv, index }))
    .filter(({ inv }) => inv.toolName === 'update_task_status')
    .map(({ inv, index }) => ({
      index,
      completedSteps: inv.args?.completed_steps || inv.result?.completedSteps || []
    }));

  // Find create_plan and tracker tools (to exclude from grouping)
  const excludeToolNames = new Set(['create_plan', 'create_conversation_tracker', 'update_task_status']);
  
  let currentStepNumber = 1;
  let lastStatusIndex = -1;

  toolInvocations.forEach((inv, index) => {
    // Skip excluded tools
    if (excludeToolNames.has(inv.toolName)) {
      // Update current step based on status updates
      const statusUpdate = statusUpdates.find(su => su.index === index);
      if (statusUpdate && statusUpdate.completedSteps.length > 0) {
        currentStepNumber = Math.max(...statusUpdate.completedSteps);
        lastStatusIndex = index;
      }
      return;
    }

    // Assign tool to current step
    if (!grouped.has(currentStepNumber)) {
      grouped.set(currentStepNumber, []);
    }
    grouped.get(currentStepNumber)!.push(inv);
  });

  return grouped;
}

// Group consecutive tools of the same type for compact display
function groupConsecutiveTools(tools: any[]): any[] {
  if (tools.length === 0) return [];
  
  const groups: any[] = [];
  let currentGroup: any = null;

  tools.forEach(tool => {
    if (!currentGroup || currentGroup.toolName !== tool.toolName) {
      // Start new group
      currentGroup = {
        toolName: tool.toolName,
        tools: [tool],
        isGroup: false
      };
      groups.push(currentGroup);
    } else {
      // Add to existing group
      currentGroup.tools.push(tool);
      currentGroup.isGroup = true; // Mark as group when 2+ tools
    }
  });

  return groups;
}

// Get tool details for display
function getToolDetails(inv: any): { name: string; detail: string; action: string } {
  const toolName = inv.toolName?.replace(/_/g, ' ') || 'Tool';
  const args = inv.args || {};
  const result = inv.result || {};

  switch (inv.toolName) {
    case 'keyword_overview':
      return { 
        name: 'Keyword Overview', 
        detail: args.keyword || result.keyword || '',
        action: 'Analyzing search volume and difficulty'
      };
    case 'generate_csv':
      return { 
        name: 'Generate CSV', 
        detail: args.filename ? `${args.filename}.csv` : '',
        action: 'Exporting data to CSV file'
      };
    case 'web_search':
      return { 
        name: 'Web Search', 
        detail: args.query || '',
        action: 'Searching real-time web for'
      };
    case 'extract_content':
      return { 
        name: 'Extract Content', 
        detail: args.url || '',
        action: 'Crawling and extracting正文 from'
      };
    case 'search_serp':
      return {
        name: 'SERP Search',
        detail: args.query || '',
        action: 'Fetching Google search results for'
      };
    case 'analyze_serp_structure':
      return {
        name: 'Analyze Page Structures',
        detail: args.query ? `${args.query} (top ${args.topN || 5})` : '',
        action: 'Reverse-engineering heading hierarchy for'
      };
    case 'generate_outline':
      return {
        name: 'Generate Outline',
        detail: args.title || args.target_keyword || '',
        action: 'Building H1-H3 content framework for'
      };
    case 'save_content_item':
      return {
        name: 'Save to Library',
        detail: args.title || '',
        action: 'Persisting page planning data'
      };
    case 'save_content_items_batch':
      const itemCount = args.items?.length || 0;
      return {
        name: 'Batch Save',
        detail: itemCount > 0 ? `${itemCount} items to library` : args.project_name || '',
        action: 'Persisting multiple page plans'
      };
    case 'create_plan':
      const stepCount = args.steps?.length || 0;
      return {
        name: 'Execution Plan',
        detail: stepCount > 0 ? `${stepCount} steps` : args.task_summary || '',
        action: 'Orchestrating task workflow'
      };
    default:
      const firstArg = Object.values(args).find(v => typeof v === 'string');
      return { 
        name: toolName.charAt(0).toUpperCase() + toolName.slice(1), 
        detail: typeof firstArg === 'string' ? firstArg.slice(0, 50) : '',
        action: 'Executing technical operation'
      };
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
  showFiles = false, // Default to false - files will be rendered separately in MessageList
}: ToolCallsSummaryProps) {
  // Check if any tool is still running (excluding tracker tools)
  const isRunning = toolInvocations.some(inv => {
    const isTrackerTool = inv.toolName === 'create_conversation_tracker' ||
      inv.toolName === 'add_task_to_tracker' ||
      inv.toolName === 'update_task_status';
    return inv.state === 'call' && !isTrackerTool;
  });
  
  // AI is thinking when streaming but no tool is currently running
  const isThinking = isStreaming && !isRunning;

  const [isExpanded, setIsExpanded] = useState(isRunning);
  const [filesExpanded, setFilesExpanded] = useState(isRunning);
  const [toolDetailsExpanded, setToolDetailsExpanded] = useState<Record<string, boolean>>({}); // Track each tool's expanded state

  // Auto-expand only when tools are actively running
  // Default to collapsed when finished
  useEffect(() => {
    if (isRunning) {
      setIsExpanded(true);
      setFilesExpanded(true);
    }
    // Don't auto-collapse - let user control it
  }, [isRunning]);

  // Toggle a specific tool's details
  const toggleToolDetails = (toolCallId: string) => {
    setToolDetailsExpanded(prev => ({
      ...prev,
      [toolCallId]: !prev[toolCallId]
    }));
  };

  // Track which steps are expanded
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
  
  // Track which tool groups are expanded
  const [expandedToolGroups, setExpandedToolGroups] = useState<Record<string, boolean>>({});
  
  // Toggle step expansion
  const toggleStep = (stepNumber: number) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepNumber]: !prev[stepNumber]
    }));
  };

  // Toggle tool group expansion
  const toggleToolGroup = (groupKey: string) => {
    setExpandedToolGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  console.log('[ToolCallsSummary] Rendering invocations:', toolInvocations?.length);

  if (!toolInvocations || toolInvocations.length === 0) {
    return null;
  }

  // Extract planning steps from create_plan
  const planSteps = extractPlanSteps(toolInvocations);
  const hasPlan = planSteps.length > 0;

  // Group tools by plan step
  const toolsByStep = groupToolsByPlanStep(toolInvocations, planSteps);

  // Separate file results (need special handling) from other results
  const fileResults: any[] = [];
  const otherInvocations: any[] = [];
  
  // Track which generate_images calls failed and were replaced by deerapi_generate_images
  const failedGenerateImagesIds = new Set<string>();
  toolInvocations.forEach(inv => {
    // Check if this is a deerapi_generate_images that succeeded after a failed generate_images
    if (inv.toolName === 'deerapi_generate_images' && inv.result?.success) {
      // Find failed generate_images calls for the same placeholders
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

  toolInvocations.forEach(inv => {
    // Check if this is a tracker-related tool - skip it completely
    const isTrackerTool = inv.toolName === 'create_conversation_tracker' ||
      inv.toolName === 'add_task_to_tracker' ||
      inv.toolName === 'update_task_status';
    
    // Check if result is a tracker file
    const isTrackerFile = inv.result?.metadata?.isTracker || 
      inv.result?.filename?.includes('conversation-tracker-');
    
    if (isTrackerTool || isTrackerFile) {
      return; // Skip tracker tools and files entirely
    }
    
    // Skip failed generate_images if it was replaced by a successful deerapi_generate_images
    if (inv.toolName === 'generate_images' && failedGenerateImagesIds.has(inv.toolCallId)) {
      return; // Hide the failed primary service call
    }
    
    // A tool invocation is a file result if:
    // 1. It has filename at top level (e.g. generate_csv)
    // 2. It has an images array (e.g. generate_images)
    // Note: We check inv.state === 'result' OR if it's a historical message from DB (which might lack 'state')
    const isResult = inv.state === 'result' || (inv.result && !inv.state);
    
    if (isResult && (
      (inv.result?.filename && inv.result?.mimeType) || 
      (Array.isArray(inv.result?.images))
    )) {
      fileResults.push(inv);
    }
    
    // Include in the list so the count and trace are complete
    otherInvocations.push(inv);
  });
  
  // Count only non-tracker tools
  const completedCount = otherInvocations.filter(inv => 
    inv.state === 'result' || (!inv.state && inv.result)
  ).length;

  // Render a plan step group with its tools
  const renderPlanStep = (step: any, stepTools: any[], stepNumber: number) => {
    const isExpanded = expandedSteps[stepNumber] !== false; // Default to expanded
    const completedCount = stepTools.filter(inv => inv.state === 'result' || (!inv.state && inv.result)).length;
    const totalCount = stepTools.length;
    const isComplete = totalCount > 0 && completedCount === totalCount;
    const isRunning = stepTools.some(inv => inv.state === 'call');

    // Group consecutive tools for compact display
    const toolGroups = groupConsecutiveTools(stepTools);

    return (
      <div key={stepNumber} className="space-y-1.5 py-2">
        {/* Step Header - Natural conversation style */}
        <button
          onClick={() => toggleStep(stepNumber)}
          className="w-full flex items-start gap-2 hover:opacity-80 transition-opacity text-left"
        >
          {/* Status Icon */}
          <div className="flex items-center justify-center w-4 h-4 flex-shrink-0 mt-0.5">
            {isComplete && (
              <svg className="w-4 h-4 text-[#10B981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {isRunning && (
              <svg className="w-4 h-4 text-[#F59E0B] animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
            {!isComplete && !isRunning && (
              <svg className="w-4 h-4 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
              </svg>
            )}
          </div>

          {/* Step Description */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#374151] font-medium leading-relaxed">{step.description}</p>
          </div>

          {/* Expand/Collapse Icon */}
          <svg 
            className={`w-3.5 h-3.5 text-[#9CA3AF] transition-transform flex-shrink-0 mt-1 ${isExpanded ? 'rotate-90' : ''}`} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {/* Step Tools - Indented, no borders */}
        {isExpanded && toolGroups.length > 0 && (
          <div className="ml-6 space-y-1.5">
            {toolGroups.map((group, groupIndex) => {
              if (group.isGroup) {
                return renderToolGroup(group, groupIndex === toolGroups.length - 1);
              } else {
                return renderToolInvocation(group.tools[0], groupIndex === toolGroups.length - 1);
              }
            })}
          </div>
        )}
      </div>
    );
  };

  // Render a group of same-type tools (e.g., 3x web_search)
  const renderToolGroup = (group: any, isLastInGroup: boolean) => {
    const { toolName, tools } = group;
    const { name } = getToolDetails(tools[0]);
    const completedCount = tools.filter((t: any) => t.state === 'result' || (!t.state && t.result)).length;
    
    // Generate unique key using first tool's ID
    const groupKey = `group-${toolName}-${tools[0].toolCallId}`;
    const groupExpanded = expandedToolGroups[groupKey] || false;

    return (
      <div key={groupKey} className="relative flex flex-col gap-1.5">
        <button
          onClick={() => toggleToolGroup(groupKey)}
          className="flex items-center gap-2 px-2 py-1 transition-all cursor-pointer hover:bg-[#F9FAFB]"
        >
          {/* Expand Icon */}
          <svg 
            className={`w-3 h-3 text-[#9CA3AF] transition-transform ${groupExpanded ? 'rotate-90' : ''}`} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>

          {/* Tool Name */}
          <span className="text-[10px] font-black uppercase tracking-tighter text-[#374151]">
            {name}
          </span>

          {/* Count Badge */}
          <span className="text-[9px] font-bold text-[#9CA3AF]">
            ({completedCount}/{tools.length})
          </span>
        </button>

        {/* Expanded Tools List */}
        {groupExpanded && (
          <div className="ml-4 space-y-1.5">
            {tools.map((tool: any, index: number) => renderToolInvocation(tool, index === tools.length - 1))}
          </div>
        )}
      </div>
    );
  };

  // Render a single tool result inline within a skill group
  const renderToolInvocation = (inv: any, isLastInGroup: boolean) => {
    const detailsExpanded = toolDetailsExpanded[inv.toolCallId] || false; // Get state from parent
    const isRunning = inv.state === 'call';
    const result = inv.result;
    const { name, detail, action } = getToolDetails(inv);
    const isError = result?.found === false || result?.error;
    const args = inv.args || {};

    // Truncate action text
    const fullAction = action + (detail ? ` "${detail}"` : '');
    const truncatedAction = fullAction.length > 50 ? fullAction.slice(0, 50) + '...' : fullAction;

    const brandGradient = 'linear-gradient(80deg, rgba(255, 175, 64, 0.15) -21.49%, rgba(209, 148, 236, 0.15) 18.44%, rgba(154, 143, 234, 0.15) 61.08%, rgba(101, 180, 255, 0.15) 107.78%)';
    const labelStyle = {
      background: isRunning ? 'rgba(243, 244, 246, 0.5)' : brandGradient,
      fontSize: '7px',
      fontWeight: '900',
      color: isRunning ? '#9CA3AF' : '#9A8FEA',
      padding: '1px 4px',
      borderRadius: '3px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '36px',
      textAlign: 'center' as const,
      flexShrink: 0,
      border: isRunning ? '1px solid #F3F4F6' : '1px solid rgba(154, 143, 234, 0.2)',
      opacity: isRunning ? 0.6 : 1
    };

    return (
      <div key={inv.toolCallId} className="relative flex flex-col gap-1.5 group">
        <div className="flex items-center gap-2">
        <div 
          className={`flex-1 flex items-center gap-2 px-2 py-1 transition-all cursor-pointer hover:bg-[#F9FAFB]`} 
          onClick={() => toggleToolDetails(inv.toolCallId)}
          title={fullAction} // Full text on hover
        >
          {/* Expand/Collapse Icon */}
          {(args && Object.keys(args).length > 0 || result) && (
            <svg 
              className={`w-3 h-3 text-[#9CA3AF] transition-transform ${detailsExpanded ? 'rotate-90' : ''}`} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          )}
          
          {/* Tool Section */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span style={labelStyle}>Tool</span>
            <span className={`text-[10px] font-black uppercase tracking-tighter ${isRunning ? 'text-[#9CA3AF]' : (isError ? 'text-[#EF4444]' : 'text-[#374151]')}`}>
              {name}
            </span>
          </div>

          {/* Separator */}
          <div className="h-2.5 w-[1px] bg-[#F3F4F6] shrink-0" />

          {/* Action Section - Truncated with hover */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span style={{ 
              ...labelStyle, 
              background: '#F3F4F6', 
              color: '#9CA3AF',
              border: '1px solid #E5E7EB',
              opacity: 0.8
            }}>Action</span>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className={`text-[10px] font-medium truncate flex-1 ${isRunning ? 'text-[#9CA3AF] italic' : (isError ? 'text-[#FCA5A5]' : 'text-[#6B7280]')}`}>
                {truncatedAction}
                {isRunning ? '...' : (isError ? ' (Failed)' : '')}
              </span>
              
              {/* Metrics for Keywords */}
              {result?.keyword && result?.found !== false && (
                <div className="flex items-center gap-1 text-[9px] text-[#9CA3AF] font-bold uppercase tracking-tighter shrink-0">
                  <span className="bg-white/60 px-1 py-0.5 rounded border border-[#F0F0F0]">V:{result.searchVolume?.toLocaleString()}</span>
                  <span className="bg-white/60 px-1 py-0.5 rounded border border-[#F0F0F0]">K:{result.keywordDifficulty?.toFixed(0)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>

        {/* Specialized display for create_plan steps */}
        {detailsExpanded && inv.toolName === 'create_plan' && args.steps && args.steps.length > 0 && (
          <div className="ml-2 pl-3 border-l border-dashed border-[#E5E7EB] space-y-1 py-0.5">
            {args.steps.map((step: any, idx: number) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-[9px] font-black text-[#9CA3AF] mt-0.5 min-w-[10px]">{step.step_number}</span>
                <span className="text-[9px] font-medium text-[#6B7280] leading-snug">{step.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* DEBUG: Detailed Input Arguments */}
        {detailsExpanded && args && Object.keys(args).length > 0 && (
          <div className="ml-2 pl-3 border-l border-dashed border-[#E5E7EB] space-y-1 py-1">
            <div className="flex items-center gap-1.5 mb-1">
              <svg className="w-3 h-3 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="text-[8px] font-black text-[#9CA3AF] uppercase tracking-wider">Input Parameters</span>
            </div>
            <div className="bg-[#FAFAFA] border border-[#F0F0F0] rounded p-2 max-h-[200px] overflow-y-auto thin-scrollbar">
              <pre className="text-[9px] text-[#374151] font-mono whitespace-pre-wrap break-words leading-relaxed">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* DEBUG: Detailed Output Result */}
        {detailsExpanded && result && !isRunning && (
          <div className="ml-2 pl-3 border-l border-dashed border-[#E5E7EB] space-y-1 py-1">
            <div className="flex items-center gap-1.5 mb-1">
              <svg className="w-3 h-3 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[8px] font-black text-[#9CA3AF] uppercase tracking-wider">Output Result</span>
              {result.success !== undefined && (
                <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded ${result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {result.success ? '✓ SUCCESS' : '✗ FAILED'}
                </span>
              )}
            </div>
            <div className="bg-[#FAFAFA] border border-[#F0F0F0] rounded p-2 max-h-[200px] overflow-y-auto thin-scrollbar">
              <pre className="text-[9px] text-[#374151] font-mono whitespace-pre-wrap break-words leading-relaxed">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Group otherInvocations by skill
  const groupedInvocations: { skillName: string, items: any[] }[] = [];
  otherInvocations.forEach(inv => {
    const skillName = inv.result?.executedSkill?.name || 'General';
    let group = groupedInvocations.find(g => g.skillName === skillName);
    if (!group) {
      group = { skillName, items: [] };
      groupedInvocations.push(group);
    }
    group.items.push(inv);
  });

  // Find the latest save_final_page result with item_id
  const latestSavedPage = toolInvocations
    .filter(inv => inv.toolName === 'save_final_page' && inv.result?.item_id)
    .pop();

  const skillLabelStyle = {
    background: 'linear-gradient(80deg, rgba(255, 175, 64, 0.15) -21.49%, rgba(209, 148, 236, 0.15) 18.44%, rgba(154, 143, 234, 0.15) 61.08%, rgba(101, 180, 255, 0.15) 107.78%)',
    fontSize: '8px',
    fontWeight: '900',
    color: '#9A8FEA',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '42px',
    textAlign: 'center' as const,
    flexShrink: 0,
    border: '1px solid rgba(154, 143, 234, 0.2)'
  };

  return (
    <div className="space-y-2">
      {/* HTML Preview Button - Show prominently if a page was saved */}
      {latestSavedPage && latestSavedPage.result?.item_id && (
        <div className="flex items-center gap-3">
          {onPreviewContentItem && (
            <button
              onClick={() => {
                onPreviewContentItem(latestSavedPage.result.item_id);
              }}
              className="text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
              style={{
                background: 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              <svg className="w-3.5 h-3.5 text-[#9A8FEA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ stroke: '#9A8FEA', strokeOpacity: 0.8 }}>
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Open Internal Preview
            </button>
          )}
          
          <a
            href={`/api/preview/${latestSavedPage.result.item_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-[#6B7280] hover:text-[#111827] transition-all flex items-center gap-1.5 px-3 py-1 bg-[#FAFAFA] border border-[#E5E5E5] rounded-full shadow-sm"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 8" />
              <line x1="10" y1="11" x2="21" y2="3" />
            </svg>
            View Live Page
          </a>
        </div>
      )}

      {/* Tool Invocations - Plan Step-based display */}
      {hasPlan && toolsByStep.size > 0 ? (
        /* Plan step-based display */
        <div className="space-y-2">
          {planSteps.map((step, index) => {
            const stepNumber = step.step_number;
            const stepTools = toolsByStep.get(stepNumber) || [];
            
            if (stepTools.length === 0) {
              return null; // Skip steps with no tools yet
            }
            
            return renderPlanStep(step, stepTools, stepNumber);
          })}
        </div>
      ) : groupedInvocations.length > 0 && (
        /* Legacy display (no phases) */
        <div className="border border-[#F0F0F0] rounded bg-[#FAFAFA] overflow-hidden">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-white/50 transition-colors"
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {isRunning || isThinking ? (
                <svg className={`w-3.5 h-3.5 animate-spin shrink-0 ${isThinking ? 'text-[#F59E0B]' : 'text-[#9A8FEA]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              )}
              {/* Show current running tool or thinking state in header line */}
              {(() => {
                // Find the current running tool (last one with state === 'call')
                const runningTool = otherInvocations.filter(inv => inv.state === 'call').pop();
                if (runningTool) {
                  const { name, detail, action } = getToolDetails(runningTool);
                  return (
                    <span className="text-xs text-[#9A8FEA] font-medium truncate">
                      <span className="font-bold">{name}</span>
                      <span className="text-[#B4A8F8] mx-1">|</span>
                      <span className="italic">{action}</span>
                      {detail && <span className="font-semibold"> "{detail.slice(0, 30)}{detail.length > 30 ? '...' : ''}"</span>}
                    </span>
                  );
                }
                // Show thinking state when streaming but no tool running
                if (isThinking) {
                  // Get the last completed tool to show context
                  const lastCompletedTool = otherInvocations.filter(inv => inv.state === 'result').pop();
                  const lastToolName = lastCompletedTool ? getToolDetails(lastCompletedTool).name : '';
                  return (
                    <span className="text-xs text-[#F59E0B] font-medium truncate">
                      <span className="italic">AI is preparing next step...</span>
                      {lastToolName && <span className="text-[#D4A84B] ml-1">(after {lastToolName})</span>}
                    </span>
                  );
                }
                return (
                  <span className="text-xs text-[#9CA3AF]">
                    Used {completedCount} Tool{completedCount > 1 ? 's' : ''}
                  </span>
                );
              })()}
            </div>
            <svg 
              className={`w-3.5 h-3.5 text-[#9CA3AF] transition-transform shrink-0 ml-2 ${isExpanded ? 'rotate-180' : ''}`} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Expanded content */}
          {isExpanded && (
            <div className="border-t border-[#F0F0F0] px-4 py-3 space-y-4 bg-white/50">
              {groupedInvocations.map((group, gIdx) => (
                <div key={gIdx} className="space-y-2">
                  {/* Skill Header */}
                  <div className="flex items-center gap-2">
                    <span style={skillLabelStyle}>Skill</span>
                    <span className="text-[10px] font-black text-[#111827] uppercase tracking-tighter">
                      {group.skillName}
                    </span>
                  </div>

                  {/* Tool Invocations (Children) */}
                  <div className="ml-4 space-y-1.5">
                    {group.items.map((inv, iIdx) => 
                      renderToolInvocation(inv, iIdx === group.items.length - 1)
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* File List - Only show if showFiles is true (for backwards compatibility) */}
      {showFiles && fileResults.length > 0 && (
        <div className="border border-[#F0F0F0] rounded bg-[#FAFAFA] overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setFilesExpanded(!filesExpanded)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-white/50 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-xs text-[#9CA3AF]">
                Generated Files ({fileResults.reduce((acc, inv) => {
                  if (Array.isArray(inv.result?.images)) {
                    return acc + inv.result.images.length;
                  }
                  return acc + 1;
                }, 0)})
              </span>
            </div>
            <svg 
              className={`w-3.5 h-3.5 text-[#9CA3AF] transition-transform ${filesExpanded ? 'rotate-180' : ''}`} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Files List */}
          {filesExpanded && (
            <div className="border-t border-[#F0F0F0] p-2 space-y-2 bg-white/50">
              {fileResults.map(inv => {
                // Check if this is a fallback scenario
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
                
                // If it's multiple images
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

                // If it's a single file
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

