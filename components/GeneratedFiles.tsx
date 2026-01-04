'use client';

import { useState } from 'react';
import FileDownloadCard from './FileDownloadCard';
import type { FileRecord } from '@/lib/supabase';

interface GeneratedFilesProps {
  toolInvocations: any[];
  userId?: string;
  conversationId?: string;
  files?: FileRecord[];
  onUploadSuccess?: () => void;
}

export default function GeneratedFiles({
  toolInvocations,
  userId,
  conversationId,
  files = [],
  onUploadSuccess,
}: GeneratedFilesProps) {
  const [filesExpanded, setFilesExpanded] = useState(true);

  // Separate file results from tool invocations
  const fileResults: any[] = [];
  
  // Track which generate_images calls failed and were replaced by deerapi_generate_images
  const failedGenerateImagesIds = new Set<string>();
  toolInvocations.forEach(inv => {
    // Check if this is a deerapi_generate_images that succeeded after a failed generate_images
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
    const isResult = inv.state === 'result' || (inv.result && !inv.state);
    
    if (isResult && (
      (inv.result?.filename && inv.result?.mimeType) || 
      (Array.isArray(inv.result?.images))
    )) {
      fileResults.push(inv);
    }
  });

  if (fileResults.length === 0) {
    return null;
  }

  return (
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
  );
}

