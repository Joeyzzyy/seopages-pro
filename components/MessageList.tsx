'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import MarkdownMessage from './MarkdownMessage';
import ToolCallsSummary from './ToolCallsSummary';
import FilePreviewModal from './FilePreviewModal';
import type { FileRecord, ContentItem } from '@/lib/supabase';

interface MessageListProps {
  messages: any[];
  isLoading: boolean;
  userId?: string;
  conversationId?: string;
  files?: FileRecord[];
  contentItems?: ContentItem[];
  onUploadSuccess?: () => void;
  onPreviewFile?: (file: FileRecord) => void;
  onPreviewContentItem?: (itemId: string) => void;
  onRetry?: () => void;
}

export default function MessageList({ 
  messages, 
  isLoading, 
  userId, 
  conversationId,
  files = [],
  contentItems = [],
  onUploadSuccess,
  onPreviewFile,
  onPreviewContentItem,
  onRetry
}: MessageListProps) {
  const [previewingFile, setPreviewingFile] = useState<{url: string, filename: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        const container = messagesEndRef.current.closest('.overflow-y-auto');
        if (container) {
          const { scrollTop, scrollHeight, clientHeight } = container;
          
          // Use a slightly larger threshold for "at bottom" to be safe
          const isAtBottom = scrollHeight - scrollTop - clientHeight < 200;
          
          // Check if the very last message is from the user
          const lastMessageIsUser = messages.length > 0 && messages[messages.length - 1].role === 'user';

          // Force scroll if:
          // 1. User is already near bottom
          // 2. Loading just finished (!isLoading)
          // 3. User just sent a message (lastMessageIsUser)
          if (isAtBottom || !isLoading || lastMessageIsUser) {
            // Use 'smooth' when user sends a message or loading ends
            // Use 'auto' during streaming response to prevent jitter
            const behavior = (lastMessageIsUser || !isLoading) ? 'smooth' : 'auto';
            
            messagesEndRef.current.scrollIntoView({ 
              behavior,
              block: 'end'
            });
          }
        }
      }
    };

    // Use requestAnimationFrame to ensure the DOM has rendered the new content
    // before we calculate positions and scroll
    const rafId = requestAnimationFrame(scrollToBottom);
    return () => cancelAnimationFrame(rafId);
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Image 
          src="/logo.svg" 
          alt="Mini Seenos Logo" 
          width={96} 
          height={96}
          className="mx-auto animate-subtle-shake"
        />
      </div>
    );
  }

  return (
    <>
      {messages.map((message: any) => (
        <div
          key={message.id}
          className={`flex flex-col gap-2 ${
            message.role === 'user' ? 'items-end' : 'items-start'
          }`}
        >
          {/* Display attached files and content items - independent from message */}
          {message.role === 'user' && (() => {
            const attachedFiles = message.attachedFiles || 
              (Array.isArray(message.annotations) && message.annotations.find((a: any) => a.type === 'attached_files')?.data);
            const attachedContentItems = message.attachedContentItems ||
              (Array.isArray(message.annotations) && message.annotations.find((a: any) => a.type === 'attached_content_items')?.data);
            
            if ((!attachedFiles || attachedFiles.length === 0) && (!attachedContentItems || attachedContentItems.length === 0)) return null;

            return (
            <div className="flex flex-wrap gap-2 max-w-[85%] px-4">
              {/* Attached Files */}
              {attachedFiles && attachedFiles.map((attachedFile: any, idx: number) => {
                // Find the full file record to get public_url
                // Only use URL if file still exists in files list
                const fullFile = files.find(f => f.id === attachedFile.id);
                const fileUrl = fullFile?.public_url;
                const isAvailable = !!fullFile;
                
                if (isAvailable && fileUrl) {
                  const isImage = attachedFile.fileType === 'other' && 
                    (attachedFile.filename.toLowerCase().endsWith('.png') || 
                     attachedFile.filename.toLowerCase().endsWith('.jpg') || 
                     attachedFile.filename.toLowerCase().endsWith('.jpeg') || 
                     attachedFile.filename.toLowerCase().endsWith('.webp') ||
                     attachedFile.filename.toLowerCase().endsWith('.gif'));

                  return (
                    <div key={idx} className="flex flex-col gap-1 items-end">
                      {isImage && (
                        <div 
                          className="mb-1 max-w-sm rounded-lg overflow-hidden border border-[#E5E5E5] bg-white shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setPreviewingFile({url: fileUrl, filename: attachedFile.filename})}
                        >
                          <img 
                            src={fileUrl} 
                            alt={attachedFile.filename} 
                            className="max-w-full h-auto object-contain"
                          />
                        </div>
                      )}
                      <button
                        onClick={() => setPreviewingFile({url: fileUrl, filename: attachedFile.filename})}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-xs text-[#374151] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                        title={`Preview ${attachedFile.filename}`}
                      >
                        <svg className="w-3.5 h-3.5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                          <polyline points="13 2 13 9 20 9" />
                        </svg>
                        <span className="font-medium">{attachedFile.filename}</span>
                      </button>
                    </div>
                  );
                }
                
                // File no longer exists - show disabled state
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F3F4F6] border border-[#E5E5E5] rounded-lg text-xs text-[#9CA3AF]"
                    title="File deleted"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                      <polyline points="13 2 13 9 20 9" />
                    </svg>
                    <span className="font-medium line-through">{attachedFile.filename}</span>
                  </span>
                );
              })}
              
              {/* Attached Content Items */}
              {attachedContentItems && attachedContentItems.map((item: any, idx: number) => {
                // Use latest data from contentItems prop, fallback to snapshot
                const latestItem = contentItems.find(ci => ci.id === item.id) || item;
                
                const pageTypeColor =
                  latestItem.page_type === 'blog' ? 'text-blue-600' :
                  latestItem.page_type === 'landing_page' ? 'text-purple-600' :
                  latestItem.page_type === 'comparison' ? 'text-orange-600' :
                  latestItem.page_type === 'guide' ? 'text-green-600' :
                  latestItem.page_type === 'listicle' ? 'text-pink-600' :
                  'text-gray-600';
                
                return (
                  <span
                    key={`content-${idx}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-xs"
                  >
                    <svg className="w-3.5 h-3.5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    <span className={`text-[9px] font-bold uppercase ${pageTypeColor}`}>
                      {latestItem.page_type || 'blog'}
                    </span>
                    <span className="text-[#E5E5E5]">|</span>
                    <span 
                      className="font-medium truncate max-w-[150px]"
                      style={{
                        background: 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      {latestItem.title}
                    </span>
                    {latestItem.target_keyword && (
                      <>
                        <span className="text-[#E5E5E5]">•</span>
                        <span className="text-[9px] text-[#9CA3AF]">
                          {latestItem.target_keyword}
                        </span>
                      </>
                    )}
                  </span>
                );
              })}
            </div>
            );
          })()}
          
          {/* Message content */}
          <div
            className={`max-w-[85%] min-w-0 ${
              message.role === 'user'
                ? 'bg-[#F3F4F6] text-[#374151] rounded-2xl px-4 py-2.5'
                : 'text-[#374151] px-4 py-2'
            }`}
          >
            {message.role === 'user' ? (
              <div className="whitespace-pre-wrap break-words leading-relaxed">
                {message.content}
              </div>
            ) : (message.content?.startsWith('Error:') || message.content?.startsWith('❌ Error:')) ? (
              <div className="flex items-center gap-3">
                <div className="text-rose-600 leading-relaxed">
                  {/* Clean up multi-line error messages - only show first line or first sentence */}
                  {message.content.split('\n')[0].replace('❌ ', '')}
                </div>
                <button
                  onClick={onRetry}
                  className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-2 flex-shrink-0 transition-colors cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : (
              <MarkdownMessage content={message.content} />
            )}
            
            {/* Tool invocation results - unified display */}
            {message.toolInvocations && message.toolInvocations.length > 0 && (
              <div className="mt-4">
                <ToolCallsSummary
                  toolInvocations={message.toolInvocations}
                  userId={userId}
                  conversationId={conversationId}
                  files={files}
                  onUploadSuccess={onUploadSuccess}
                  onPreviewContentItem={onPreviewContentItem}
                  isLastMessage={messages.indexOf(message) === messages.length - 1}
                  isStreaming={isLoading && messages.indexOf(message) === messages.length - 1}
                />
              </div>
            )}
            
            {/* Token usage display for assistant messages */}
            {message.role === 'assistant' && message.tokenUsage && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>
                      <span className="font-medium text-gray-700">{message.tokenUsage.totalTokens.toLocaleString()}</span> tokens
                    </span>
                  </div>
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center gap-3">
                    <span>
                      <span className="font-medium text-gray-600">{message.tokenUsage.promptTokens.toLocaleString()}</span> in
                    </span>
                    <span>
                      <span className="font-medium text-gray-600">{message.tokenUsage.completionTokens.toLocaleString()}</span> out
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-start px-4 py-2">
          <div className="w-3 h-3 rounded-full bg-[#000000] animate-scale-pulse"></div>
        </div>
      )}
      
      {/* Scroll anchor */}
      <div ref={messagesEndRef} />

      {/* File Preview Modal */}
      {previewingFile && (
        <FilePreviewModal
          isOpen={!!previewingFile}
          onClose={() => setPreviewingFile(null)}
          fileUrl={previewingFile.url}
          filename={previewingFile.filename}
        />
      )}
    </>
  );
}

