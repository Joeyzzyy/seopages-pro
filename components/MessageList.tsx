'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MarkdownMessage from './MarkdownMessage';
import ToolCallsSummary from './ToolCallsSummary';
import GeneratedFiles from './GeneratedFiles';
import FilePreviewModal from './FilePreviewModal';
import MessageFeedbackModal from './MessageFeedbackModal';
import { supabase } from '@/lib/supabase';
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
  onShowToast?: (message: string) => void;
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
  onRetry,
  onShowToast
}: MessageListProps) {
  const [previewingFile, setPreviewingFile] = useState<{url: string, filename: string} | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    messageId: string;
    feedbackType: 'like' | 'dislike' | null;
  }>({
    isOpen: false,
    messageId: '',
    feedbackType: null,
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [userFeedbacks, setUserFeedbacks] = useState<Record<string, 'like' | 'dislike'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const hasAutoRefreshedRef = useRef(false);
  const wasRunningRef = useRef(false);

  // Load user feedbacks for assistant messages
  useEffect(() => {
    if (!userId || !conversationId) return;

    const loadFeedbacks = async () => {
      const assistantMessages = messages.filter(m => m.role === 'assistant');
      const feedbacks: Record<string, 'like' | 'dislike'> = {};

      for (const msg of assistantMessages) {
        // Skip messages with non-UUID IDs (like "msg-xxx" or "error-xxx")
        if (!msg.id || !msg.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          console.log('Skipping feedback load for non-UUID message:', msg.id);
          continue;
        }

        try {
          const response = await fetch(
            `/api/message-feedback?messageId=${msg.id}&userId=${userId}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.feedback) {
              feedbacks[msg.id] = data.feedback.feedback_type;
            }
          }
        } catch (error) {
          console.error('Failed to load feedback for message:', msg.id, error);
        }
      }

      setUserFeedbacks(feedbacks);
    };

    loadFeedbacks();
  }, [messages, userId, conversationId]);

  // Auto-refresh when all tools complete
  useEffect(() => {
    if (isLoading || hasAutoRefreshedRef.current) return;
    
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant' || !lastMessage.toolInvocations) return;
    
    // Filter out excluded tools
    const excludedToolNames = new Set(['create_conversation_tracker', 'add_task_to_tracker', 'update_task_status', 'create_plan']);
    const displayInvocations = lastMessage.toolInvocations.filter(
      (inv: any) => !excludedToolNames.has(inv.toolName) &&
        !(inv.result?.metadata?.isTracker || inv.result?.filename?.includes('conversation-tracker-'))
    );
    
    if (displayInvocations.length === 0) return;
    
    const isRunningAny = displayInvocations.some((inv: any) => inv.state === 'call');
    const completedCount = displayInvocations.filter(
      (inv: any) => inv.state === 'result' || (!inv.state && inv.result)
    ).length;
    const totalCount = displayInvocations.length;
    const allCompleted = !isRunningAny && completedCount === totalCount && totalCount > 0;
    
    // If was running and now all completed, trigger refresh
    if (wasRunningRef.current && allCompleted && !hasAutoRefreshedRef.current) {
      hasAutoRefreshedRef.current = true;
      // Wait a bit for UI to update (collapse animation), then refresh
      setTimeout(() => {
        router.refresh();
      }, 1500);
    }
    
    wasRunningRef.current = isRunningAny;
  }, [messages, isLoading, router]);

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

  const handleFeedbackClick = (messageId: string, feedbackType: 'like' | 'dislike') => {
    setFeedbackModal({
      isOpen: true,
      messageId,
      feedbackType,
    });
  };

  const handleFeedbackSubmit = async (reason: string) => {
    if (!feedbackModal.messageId || !feedbackModal.feedbackType || !userId || !conversationId) return;

    setSubmittingFeedback(true);
    try {
      const message = messages.find(m => m.id === feedbackModal.messageId);
      const messageContent = message?.content || null;

      const response = await fetch('/api/message-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: feedbackModal.messageId,
          userId,
          conversationId,
          feedbackType: feedbackModal.feedbackType,
          reason,
          messageContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      // Update local state
      setUserFeedbacks(prev => ({
        ...prev,
        [feedbackModal.messageId]: feedbackModal.feedbackType!,
      }));

      setFeedbackModal({ isOpen: false, messageId: '', feedbackType: null });
      
      // Show success toast
      if (onShowToast) {
        onShowToast('Feedback submitted successfully!');
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      
      // Show error toast
      if (onShowToast) {
        onShowToast('Failed to submit feedback. Please try again later.');
      }
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (messages.length === 0) {
    return <div className="flex-1" />;
  }

  return (
    <>
      {messages.map((message: any, index: number) => {
        const isLastMessage = index === messages.length - 1;
        
        return (
        <div
          key={message.id}
          className={`flex flex-col gap-2 ${
            message.role === 'user' ? 'items-end' : 'items-start'
          }`}
        >
          {/* Display attached files, content items, and reference image - independent from message */}
          {message.role === 'user' && (() => {
            const attachedFiles = message.attachedFiles || 
              (Array.isArray(message.annotations) && message.annotations.find((a: any) => a.type === 'attached_files')?.data);
            const attachedContentItems = message.attachedContentItems ||
              (Array.isArray(message.annotations) && message.annotations.find((a: any) => a.type === 'attached_content_items')?.data);
            const referenceImageUrl = message.referenceImageUrl ||
              (Array.isArray(message.annotations) && message.annotations.find((a: any) => a.type === 'reference_image')?.data);
            
            if ((!attachedFiles || attachedFiles.length === 0) && 
                (!attachedContentItems || attachedContentItems.length === 0) && 
                !referenceImageUrl) return null;

            return (
            <div className="flex flex-wrap gap-2 max-w-[85%] px-4">
              {/* Reference Image */}
              {referenceImageUrl && (
                <div className="w-full mb-2">
                  <div className="inline-flex flex-col gap-1 bg-white border border-[#E5E5E5] rounded-lg p-2">
                    <span className="text-xs font-medium text-[#6B7280]">Reference Image</span>
                    <img 
                      src={referenceImageUrl} 
                      alt="Reference" 
                      className="max-w-[200px] max-h-[200px] object-cover rounded border border-[#E5E5E5]"
                    />
                  </div>
                </div>
              )}
              
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
          
          {/* Message content and tool calls - interleaved display */}
          <div
            className={`max-w-[85%] min-w-0 ${
              message.role === 'user'
                ? 'bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] text-[#374151] rounded-2xl px-5 py-3 shadow-sm'
                : 'text-[#374151] px-4 py-3'
            }`}
          >
            {message.role === 'user' ? (
              (() => {
                // Check if this is an auto-initiated message
                const isAutoInitiated = (message.content || '').includes('[Auto-initiated by system]');
                
                // Extract knowledge file references from message content
                const fileRefPattern = /\[Referenced Knowledge File: "([^"]+)" \(([^)]+)\)(?: - Storage: ([^\]]+))?\]/g;
                let cleanContent = message.content || '';
                const knowledgeRefs: { name: string; type: string }[] = [];
                
                let match;
                while ((match = fileRefPattern.exec(message.content || '')) !== null) {
                  knowledgeRefs.push({ name: match[1], type: match[2] });
                }
                
                // Remove file references and auto-initiated marker from display content
                cleanContent = cleanContent
                  .replace(fileRefPattern, '')
                  .replace(/\[Auto-initiated by system\]\n*/g, '')
                  .replace(/^\n+/, '')
                  .trim();
                
                // For auto-initiated messages, extract just the domain/URL and show a friendly short version
                if (isAutoInitiated) {
                  // Try to extract the URL from the message
                  const urlMatch = cleanContent.match(/for\s+(https?:\/\/[^\s.]+\.[^\s]+|[^\s]+\.[a-z]{2,})/i);
                  if (urlMatch) {
                    const domain = urlMatch[1].replace(/^https?:\/\//, '').replace(/\/$/, '');
                    cleanContent = `🚀 Start Alternative Page planning for ${domain}`;
                  } else {
                    cleanContent = '🚀 Start Alternative Page planning';
                  }
                }
                
                return (
                  <div className="group relative">
                    {/* Copy button - appears on hover */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(cleanContent);
                        if (onShowToast) onShowToast('Copied to clipboard!');
                      }}
                      className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-[#E5E7EB] text-[#6B7280] hover:text-[#374151]"
                      title="Copy message"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                    {/* Auto-initiated badge */}
                    {isAutoInitiated && (
                      <div className="flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full w-fit relative">
                        {/* Glow effect */}
                        <div 
                          className="absolute inset-0 rounded-full blur-md opacity-40"
                          style={{ background: 'linear-gradient(90deg, #FFAF40, #D194EC, #9A8FEA, #65B4FF)' }}
                        />
                        {/* Badge content */}
                        <div className="relative flex items-center gap-1.5 text-[10px] font-medium">
                          <svg 
                            className="w-3 h-3" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="url(#autoGradient)" 
                            strokeWidth="2"
                          >
                            <defs>
                              <linearGradient id="autoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#FFAF40" />
                                <stop offset="33%" stopColor="#D194EC" />
                                <stop offset="66%" stopColor="#9A8FEA" />
                                <stop offset="100%" stopColor="#65B4FF" />
                              </linearGradient>
                            </defs>
                            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span 
                            className="bg-clip-text text-transparent"
                            style={{ backgroundImage: 'linear-gradient(90deg, #FFAF40, #D194EC, #9A8FEA, #65B4FF)' }}
                          >
                            Auto-initiated by system to help you get started
                          </span>
                        </div>
                      </div>
                    )}
                    {/* Knowledge file references */}
                    {knowledgeRefs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {knowledgeRefs.map((ref, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#EEF2FF] border border-[#C7D2FE] rounded text-[10px] text-[#4338CA]"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <span className="font-medium">@{ref.name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Message content */}
                    <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                      {cleanContent}
                    </div>
                  </div>
                );
              })()
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
              <>
                {/* For assistant messages with tool calls: interleave content and tools */}
                {(() => {
                  // If there are no tool invocations, just show content
                  if (!message.toolInvocations || message.toolInvocations.length === 0) {
                    return message.content && <MarkdownMessage content={message.content} />;
                  }

                  // Check for keywords that indicate AI is about to execute or has executed tools
                  const hasExecutionIndicator = message.content && (
                    message.content.includes('Starting execution') ||
                    message.content.includes('Executing') ||
                    message.content.includes('In progress') ||
                    message.content.match(/Completed.*research|Completed.*analysis|Completed.*extraction/)
                  );

                  // If content mentions execution, split at that point
                  if (hasExecutionIndicator && message.content) {
                    // Find where execution starts or results appear
                    const executionMatch = message.content.match(/(Starting execution|Executing|In progress|Completed[^.\n]{0,30})/);
                    
                    if (executionMatch && executionMatch.index !== undefined) {
                      // Split at the execution indicator
                      const beforeExecution = message.content.substring(0, executionMatch.index + executionMatch[0].length);
                      const afterExecution = message.content.substring(executionMatch.index + executionMatch[0].length).trim();

                      return (
                        <>
                          {/* Opening statement before tools */}
                          {beforeExecution && (
                            <div className="mb-4">
                              <MarkdownMessage content={beforeExecution} />
                            </div>
                          )}
                          
                          {/* Results/summary before tools */}
                          {afterExecution && (
                            <div className="mb-4">
                              <MarkdownMessage content={afterExecution} />
                            </div>
                          )}
                          
                          {/* Tool executions at bottom (running tools will be sorted to bottom) */}
                          <div>
                            <ToolCallsSummary
                              toolInvocations={message.toolInvocations}
                              userId={userId}
                              conversationId={conversationId}
                              files={files}
                              onUploadSuccess={onUploadSuccess}
                              onPreviewContentItem={onPreviewContentItem}
                              isLastMessage={isLastMessage}
                              isStreaming={isLoading && isLastMessage}
                            />
                          </div>
                        </>
                      );
                    }
                  }

                  // Default: content first, then tools (so running tools stay at bottom)
                  return (
                    <>
                      {/* Show content first */}
                      {message.content && (
                        <div className="mb-4">
                          <MarkdownMessage content={message.content} />
                        </div>
                      )}
                      {/* Tool executions at bottom (running tools will be sorted to bottom) */}
                      <div>
                        <ToolCallsSummary
                          toolInvocations={message.toolInvocations}
                          userId={userId}
                          conversationId={conversationId}
                          files={files}
                          onUploadSuccess={onUploadSuccess}
                          onPreviewContentItem={onPreviewContentItem}
                          isLastMessage={isLastMessage}
                          isStreaming={isLoading && isLastMessage}
                        />
                      </div>
                    </>
                  );
                })()}
              </>
            )}
            
            {/* Token usage display for assistant messages */}
            {message.role === 'assistant' && message.tokenUsage && (
              <div className="mt-3">
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

            {/* Generated Files - Before feedback buttons */}
            {message.role === 'assistant' && message.toolInvocations && message.toolInvocations.length > 0 && (
              <div className="mt-3">
                <GeneratedFiles
                  toolInvocations={message.toolInvocations}
                  userId={userId}
                  conversationId={conversationId}
                  files={files}
                  onUploadSuccess={onUploadSuccess}
                />
              </div>
            )}

            {/* Feedback buttons for assistant messages */}
            {message.role === 'assistant' && 
             !message.content?.startsWith('Error:') && 
             !message.content?.startsWith('❌ Error:') && 
             userId &&
             !(isLoading && isLastMessage) && // Only hide if it's the last message AND still loading
             (
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => handleFeedbackClick(message.id, 'like')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    userFeedbacks[message.id] === 'like'
                      ? 'bg-[#ECFDF5] text-[#10B981] border border-[#10B981]'
                      : 'bg-white text-[#6B7280] border border-[#E5E5E5] hover:bg-[#F9FAFB]'
                  }`}
                  title="Like this response"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                  Like
                </button>
                <button
                  onClick={() => handleFeedbackClick(message.id, 'dislike')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    userFeedbacks[message.id] === 'dislike'
                      ? 'bg-[#FEF2F2] text-[#EF4444] border border-[#EF4444]'
                      : 'bg-white text-[#6B7280] border border-[#E5E5E5] hover:bg-[#F9FAFB]'
                  }`}
                  title="Dislike this response"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                  </svg>
                  Dislike
                </button>
              </div>
            )}
          </div>
        </div>
      )})}

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

      {/* Message Feedback Modal */}
      <MessageFeedbackModal
        isOpen={feedbackModal.isOpen}
        feedbackType={feedbackModal.feedbackType}
        onClose={() => setFeedbackModal({ isOpen: false, messageId: '', feedbackType: null })}
        onSubmit={handleFeedbackSubmit}
        isLoading={submittingFeedback}
      />
    </>
  );
}

