'use client';

import { useChat } from 'ai/react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { 
  supabase, 
  createConversation, 
  getUserConversations, 
  getConversationMessages, 
  saveMessage, 
  deleteConversation,
  updateConversationTitle,
  toggleConversationShowcase, 
  getConversationTokenStats, 
  getConversationApiStats, 
  incrementTavilyCalls, 
  incrementSemrushCalls,
  incrementSerperCalls, 
  getConversationFiles, 
  getUserContentItems,
  getUserContentProjects,
  getContentItemById,
  deleteFile,
  deleteContentItem,
  deleteContentProject,
  uploadFileToStorage,
  getSiteContexts,
  getSiteContextByType,
  upsertSiteContext
} from '@/lib/supabase';
import type { Conversation, FileRecord, ContentItem, ContentProject, SiteContext } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AuthButton from '@/components/AuthButton';
import ConversationSidebar from '@/components/ConversationSidebar';
import MessageList from '@/components/MessageList';
import ChatInput from '@/components/ChatInput';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import ConfirmModal from '@/components/ConfirmModal';
import ContentDrawer from '@/components/ContentDrawer';
import RightSidebar from '@/components/RightSidebar';
import GSCIntegrationStatus from '@/components/GSCIntegrationStatus';
import DomainsModal from '@/components/DomainsModal';
import SiteContextModal from '@/components/SiteContextModal';
import PlaybookTrigger from '@/components/PlaybookTrigger';
import Toast from '@/components/Toast';

interface Skill {
  id: string;
  name: string;
  description: string;
  systemPrompt: string; // Added systemPrompt
  tools: Array<{
    id: string;
    description: string;
  }>;
  examples: string[];
  metadata: {
    category?: string;
    tags?: string[];
    playbook?: {
      trigger?: {
        type: 'form' | 'direct';
        fields?: Array<{
          id: string;
          label: string;
          type: 'text' | 'select' | 'country';
          options?: Array<{ label: string; value: string }>;
          placeholder?: string;
          required?: boolean;
          defaultValue?: string;
        }>;
        initialMessage?: string;
      }
    };
  };
}

export default function ChatPage() {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const currentConversationRef = useRef<Conversation | null>(null);
  
  // Helper to update both state and ref - ensures onFinish always has latest conversation
  const updateCurrentConversation = (conv: Conversation | null) => {
    console.log('[updateCurrentConversation] Setting conversation:', conv?.id);
    setCurrentConversation(conv);
    currentConversationRef.current = conv;
  };
  
  // Sync ref whenever state changes (backup mechanism)
  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);
  
  const [skills, setSkills] = useState<Skill[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [contentProjects, setContentProjects] = useState<ContentProject[]>([]);
  const [siteContexts, setSiteContexts] = useState<SiteContext[]>([]);
  const [tokenStats, setTokenStats] = useState({ inputTokens: 0, outputTokens: 0 });
  const [apiStats, setApiStats] = useState({ tavilyCalls: 0, semrushCalls: 0, serperCalls: 0 });
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [deletingContent, setDeletingContent] = useState<{
    type: 'project' | 'item';
    id: string;
    name: string;
  } | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [attachedFileIds, setAttachedFileIds] = useState<string[]>([]);
  const [attachedContentItemIds, setAttachedContentItemIds] = useState<string[]>([]);
  const [selectedContentItem, setSelectedContentItem] = useState<ContentItem | null>(null);
  const [activePlaybook, setActivePlaybook] = useState<Skill | null>(null);
  const [siteContextModal, setSiteContextModal] = useState<{
    isOpen: boolean;
    type: 'logo' | 'header' | 'footer' | 'meta' | 'sitemap';
    context?: SiteContext | null;
  } | null>(null);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
  const [isArtifactsOpen, setIsArtifactsOpen] = useState(false);
  const [isDomainsOpen, setIsDomainsOpen] = useState(false);

  // Chat hook
  const { messages, input, handleInputChange, handleSubmit, append, isLoading, setMessages, setInput, stop } = useChat({
    onError: async (error) => {
      console.error('[useChat:onError] ========================================');
      console.error('[useChat:onError] Chat stream error:', error);
      console.error('[useChat:onError] Error message:', error.message);
      console.error('[useChat:onError] Current conversation:', currentConversationRef.current?.id);
      console.error('[useChat:onError] Current user:', user?.id);
      console.error('[useChat:onError] Current messages count:', messages.length);
      console.error('[useChat:onError] ========================================');
      
      // Check if there's a partial AI response in the messages array
      // The last message might be an incomplete assistant message with tool invocations
      const lastMessage = messages[messages.length - 1];
      const hasPartialResponse = lastMessage && lastMessage.role === 'assistant';
      
      if (hasPartialResponse) {
        console.log('[useChat:onError] Found partial AI response with:');
        console.log('[useChat:onError] - Content length:', lastMessage.content?.length || 0);
        console.log('[useChat:onError] - Tool invocations:', lastMessage.toolInvocations?.length || 0);
      }
      
      // Build a concise, single-line error message
      let errorMessage = '';
      
      // Detect specific error types and provide targeted guidance
      if (error.message?.includes('context_length_exceeded') || error.message?.includes('context length')) {
        errorMessage = '❌ Error: Conversation too long. Please start a new conversation.';
      } else if (error.message?.includes('maximum context length')) {
        errorMessage = '❌ Error: Token limit exceeded. Try starting a new conversation or generating fewer sections.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch failed')) {
        errorMessage = '❌ Error: Network connection failed. Please check your internet and try again.';
      } else if (error.message?.includes('API') || error.message?.includes('api')) {
        errorMessage = '❌ Error: API connection failed. Please try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = '❌ Error: Request timeout. Please try again with a simpler request.';
      } else {
        errorMessage = `❌ Error: ${error.message || 'An unexpected error occurred. Please try again.'}`;
      }
      
      // Add note about partial results if applicable
      if (hasPartialResponse && (lastMessage.toolInvocations?.length ?? 0) > 0) {
        errorMessage += '\n\n⚠️ Some content was generated successfully before the error. Check the results above.';
      }
      
      // Append an error message to the chat UI
      const errorMsg = {
        id: `error-${Date.now()}`,
        role: 'assistant' as const,
        content: errorMessage,
      };
      
      setMessages(prev => [
        ...prev,
        errorMsg as any
      ]);
      
      // CRITICAL: Save the error message and any partial response to database
      const conversation = currentConversationRef.current;
      if (conversation && user) {
        try {
          console.log('[useChat:onError] Saving error message to database...');
          
          // If there's a partial response with tool invocations, save that first
          if (hasPartialResponse && (lastMessage.content || (lastMessage.toolInvocations?.length ?? 0) > 0)) {
            console.log('[useChat:onError] Saving partial AI response with tool invocations...');
            console.log('[useChat:onError] - Message ID:', lastMessage.id);
            console.log('[useChat:onError] - Content length:', lastMessage.content?.length || 0);
            console.log('[useChat:onError] - Tool invocations count:', lastMessage.toolInvocations?.length || 0);
            
            // Clean and upload any files in tool invocations
            const invocationsToClean = lastMessage.toolInvocations || [];
            
            // Log tool names for debugging
            if (invocationsToClean.length > 0) {
              console.log('[useChat:onError] - Tool calls:', invocationsToClean.map((inv: any) => inv.toolName).join(', '));
            }
            
            const cleanedToolInvocations = await Promise.all(
              invocationsToClean.map(async (inv: any) => {
                const cleaned = { ...inv };
                if (cleaned.result && typeof cleaned.result === 'object') {
                  const result = { ...cleaned.result };
                  
                  // Truncate large fields
                  const fieldsToClean = [
                    'html_content', 
                    'markdown_content', 
                    'merged_html', 
                    'fixed_html', 
                    'content',
                    'generated_content',
                    'raw_content'
                  ];

                  fieldsToClean.forEach(field => {
                    if (result[field] && typeof result[field] === 'string' && result[field].length > 500) {
                      result[field] = result[field].substring(0, 500) + `... (truncated ${result[field].length} chars)`;
                    }
                  });

                  cleaned.result = result;
                }
                return cleaned;
              })
            );
            
            const estimatedOutputTokens = Math.ceil((lastMessage.content || '').length / 4);
            const estimatedInputTokens = Math.ceil(messages.slice(0, -1).map((m: any) => m.content).join(' ').length / 4);
            
            await saveMessage(
              conversation.id,
              'assistant',
              lastMessage.content || '⚠️ (Partial response - interrupted by error)',
              estimatedInputTokens,
              estimatedOutputTokens,
              cleanedToolInvocations.length > 0 ? cleanedToolInvocations : null
            );
            console.log('[useChat:onError] ✅ Partial AI response saved successfully');
            console.log('[useChat:onError] - Saved', cleanedToolInvocations.length, 'tool invocations');
          } else {
            console.log('[useChat:onError] No partial response to save (no content or tool invocations)');
          }
          
          // Then save the error message
          await saveMessage(
            conversation.id,
            'assistant',
            errorMessage,
            0,
            0,
            null
          );
          console.log('[useChat:onError] ✅ Error message saved to database');
          console.log('[useChat:onError] ✅ All data persisted - reload page to see saved history');
        } catch (saveError) {
          console.error('[useChat:onError] ❌ Failed to save error message to database:', saveError);
          console.error('[useChat:onError] ❌ Error details:', saveError instanceof Error ? saveError.message : saveError);
        }
      } else {
        console.warn('[useChat:onError] Cannot save error - missing conversation or user');
      }
    },
    onResponse: (response) => {
      console.log('[useChat:onResponse] ========================================');
      console.log('[useChat:onResponse] Received response from API:', response.status, response.statusText);
      console.log('[useChat:onResponse] ========================================');
    },
    onFinish: async (message: any, options: any) => {
      console.log('[useChat:onFinish] ========================================');
      console.log('[useChat:onFinish] CALLBACK TRIGGERED!');
      console.log('[useChat:onFinish] Message:', message);
      console.log('[useChat:onFinish] Options:', options);
      console.log('[useChat:onFinish] Usage:', options?.usage);
      console.log('[useChat:onFinish] Message role:', message?.role);
      console.log('[useChat:onFinish] Message content length:', message?.content?.length || 0);
      console.log('[useChat:onFinish] Message toolInvocations:', message?.toolInvocations?.length || 0);
      console.log('[useChat:onFinish] Current currentConversation (state):', currentConversation?.id);
      console.log('[useChat:onFinish] Current currentConversation (ref):', currentConversationRef.current?.id);
      console.log('[useChat:onFinish] Current user:', user?.id);
      console.log('[useChat:onFinish] ========================================');
      
      // Extract token usage from options
      const tokenUsage = options?.usage ? {
        promptTokens: options.usage.promptTokens || 0,
        completionTokens: options.usage.completionTokens || 0,
        totalTokens: options.usage.totalTokens || 0
      } : null;
      
      // If we have usage data, add it to the message for display
      if (tokenUsage && message) {
        message.tokenUsage = tokenUsage;
        console.log('[useChat:onFinish] Added token usage to message:', tokenUsage);
      }
      
      // Skip if this message was already processed by useEffect handler
      const messageId = message.id || `${message.role}-${message.content?.slice(0, 50)}`;
      if (processedMessageIdsRef.current.has(messageId)) {
        console.log('[useChat:onFinish] Message already processed by useEffect handler, skipping onFinish');
        return;
      }
      
      const conversation = currentConversationRef.current;
      if (conversation && user) {
        console.log('[useChat:onFinish] Using conversation from ref:', conversation.id);
        // Mark as processed to prevent duplicate processing
        processedMessageIdsRef.current.add(messageId);
        
        try {
          // ONLY use toolInvocations from the CURRENT finished message
          const invocationsToClean = message.toolInvocations || [];
          console.log('[onFinish] Invocations found in current message:', invocationsToClean.length);

          if (invocationsToClean.length === 0 && !message.content) {
            console.warn('[onFinish] Empty assistant message, skipping save.');
            return;
          }

          const estimatedOutputTokens = Math.ceil((message.content || '').length / 4);
          const estimatedInputTokens = Math.ceil(messages.map(m => m.content).join(' ').length / 4);
          
          // Upload files and clean tool invocations before saving
          const cleanedToolInvocations = await Promise.all(
            invocationsToClean.map(async (inv: any) => {
              const cleaned = { ...inv };
              if (cleaned.result && typeof cleaned.result === 'object') {
                const result = { ...cleaned.result };
                
                // 1. Handle file uploads first
                const uploadFile = async (fileResult: any) => {
                  if (fileResult.needsUpload && fileResult.content && fileResult.filename) {
                    try {
                      console.log('[onFinish] Starting upload:', fileResult.filename);
                      const mergedMetadata = {
                        size: fileResult.size,
                        placeholderId: fileResult.placeholderId,
                        ...(fileResult.metadata || {})
                      };
                      
                      const fileRecord = await uploadFileToStorage(
                        user.id, conversation.id, fileResult.filename,
                        fileResult.content, fileResult.mimeType || 'image/png',
                        mergedMetadata,
                        fileResult.fileId
                      );
                      
                      fileResult.fileId = fileRecord.id;
                      fileResult.publicUrl = fileRecord.public_url;
                    } catch (e) { 
                      console.error('[onFinish] ❌ Upload failed:', e);
                    }
                    // Always remove the large content field after processing
                    delete fileResult.content;
                    delete fileResult.needsUpload;
                  }
                };

                if (Array.isArray(result.images)) {
                  await Promise.all(result.images.map((img: any) => uploadFile(img)));
                } else {
                  await uploadFile(result);
                }

                // 2. Aggressively clean large fields to prevent DB insert failure (Supabase/PostgreSQL limits)
                const fieldsToClean = [
                  'html_content', 
                  'markdown_content', 
                  'merged_html', 
                  'fixed_html', 
                  'content',
                  'generated_content',
                  'raw_content'
                ];

                fieldsToClean.forEach(field => {
                  if (result[field] && typeof result[field] === 'string' && result[field].length > 500) {
                    console.log(`[onFinish] Cleaning large field '${field}' from tool '${inv.toolName}'`);
                    result[field] = result[field].substring(0, 500) + `... (truncated ${result[field].length} chars)`;
                  }
                });

                // Also clean large nested fields in data property if exists
                if (result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
                  fieldsToClean.forEach(field => {
                    if (result.data[field] && typeof result.data[field] === 'string' && result.data[field].length > 500) {
                      result.data[field] = result.data[field].substring(0, 500) + `... (truncated)`;
                    }
                  });
                }

                cleaned.result = result;
              }
              return cleaned;
            })
          );
          
          console.log('[onFinish] Committing to DB...');
          const savedMsg = await saveMessage(
            conversation.id, 'assistant', message.content || '',
            estimatedInputTokens, estimatedOutputTokens, cleanedToolInvocations
          );
          console.log('[onFinish] Saved message ID:', savedMsg.id);

          setMessages(prev => {
            const newMessages = [...prev];
            const lastAssistantMsgIdx = newMessages.findLastIndex(m => m.role === 'assistant');
            if (lastAssistantMsgIdx !== -1) {
              newMessages[lastAssistantMsgIdx] = {
                ...newMessages[lastAssistantMsgIdx],
                toolInvocations: cleanedToolInvocations
              };
            }
            return newMessages;
          });
          
          console.log('[onFinish] Loading files for conversation:', conversation.id);
          await loadFiles(conversation.id);
          console.log('[onFinish] Files loaded, current files count:', files.length);
          // ... Rest of the logic (content updates, API increments) ...
          
          // Check if content library tool was used
          const hasContentUpdate = message.toolInvocations?.some(
            (inv: any) => [
              'save_content_item', 
              'save_content_items_batch', 
              'save_final_page',
              'delete_content_item',
              'delete_content_project',
              'assemble_html_page',
              'merge_html_with_site_contexts',
              'fix_style_conflicts'
            ].includes(inv.toolName)
          );
          if (hasContentUpdate) {
            console.log('[onFinish] Content update detected, refreshing library...');
            await Promise.all([
              loadContentItems(user.id),
              loadContentProjects(user.id)
            ]);
          }
          
          // Count API calls from tool invocations
          if (message.toolInvocations && message.toolInvocations.length > 0) {
            for (const invocation of message.toolInvocations) {
              const toolName = invocation.toolName;
              console.log('[onFinish] Tool invocation:', toolName);
              if (toolName === 'web_search' || toolName === 'extract_content' || toolName === 'crawl_site') {
                await incrementTavilyCalls(conversation.id);
              }
              if (toolName === 'keyword_overview') {
                await incrementSemrushCalls(conversation.id);
              }
              if (toolName === 'search_serp' || toolName === 'analyze_serp_structure') {
                console.log('[onFinish] Incrementing Serper calls for conversation:', conversation.id);
                await incrementSerperCalls(conversation.id);
              }
            }
          }
          
          await loadTokenStats(conversation.id);
        } catch (error) {
          console.error('Failed to save message:', error);
        }
      }
    },
  });

  // Monitor when assistant messages complete (since onFinish doesn't trigger reliably)
  const lastMessageRef = useRef<any>(null);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const isLoadingRef = useRef(false);
  
  useEffect(() => {
    console.log('[useEffect:MessageMonitor] isLoading changed:', isLoading);
    console.log('[useEffect:MessageMonitor] messages length:', messages.length);
    
    // Detect when loading finishes (true -> false) and there's a new assistant message
    if (isLoadingRef.current && !isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      console.log('[useEffect:MessageMonitor] Loading finished, last message:', {
        role: lastMessage.role,
        contentLength: lastMessage.content?.length || 0,
        hasToolInvocations: !!lastMessage.toolInvocations,
        messageId: lastMessage.id
      });
      
      // Only process assistant messages that we haven't processed yet
      // Check both by ID and by content to avoid duplicates
      const messageId = lastMessage.id || `${lastMessage.role}-${lastMessage.content?.slice(0, 50)}`;
      const alreadyProcessed = processedMessageIdsRef.current.has(messageId);
      
      if (lastMessage.role === 'assistant' && !alreadyProcessed) {
        console.log('[useEffect:MessageMonitor] New assistant message detected, processing...');
        processedMessageIdsRef.current.add(messageId);
        lastMessageRef.current = lastMessage;
        
        // Call the same logic as onFinish
        handleAssistantMessageComplete(lastMessage);
      } else if (alreadyProcessed) {
        console.log('[useEffect:MessageMonitor] Message already processed, skipping:', messageId);
      }
    }
    
    isLoadingRef.current = isLoading;
  }, [isLoading, messages]);
  
  // Extract onFinish logic into a separate function
  const handleAssistantMessageComplete = async (message: any) => {
    console.log('[handleAssistantMessageComplete] ========================================');
    console.log('[handleAssistantMessageComplete] Processing assistant message');
    console.log('[handleAssistantMessageComplete] Message:', message);
    console.log('[handleAssistantMessageComplete] Current conversation (ref):', currentConversationRef.current?.id);
    console.log('[handleAssistantMessageComplete] Current user:', user?.id);
    console.log('[handleAssistantMessageComplete] ========================================');
    
    // Check if this message was already processed
    const messageId = message.id || `${message.role}-${message.content?.slice(0, 50)}`;
    if (processedMessageIdsRef.current.has(messageId)) {
      console.log('[handleAssistantMessageComplete] Message already processed, skipping:', messageId);
      return;
    }
    
    const conversation = currentConversationRef.current;
    if (!conversation || !user) {
      console.warn('[handleAssistantMessageComplete] Missing conversation or user, skipping save');
      return;
    }
    
    // Mark as processed to prevent duplicate processing
    processedMessageIdsRef.current.add(messageId);
    
    console.log('[handleAssistantMessageComplete] Using conversation from ref:', conversation.id);
    try {
      // ONLY use toolInvocations from the CURRENT finished message
      const invocationsToClean = message.toolInvocations || [];
      console.log('[handleAssistantMessageComplete] Invocations found in current message:', invocationsToClean.length);

      if (invocationsToClean.length === 0 && !message.content) {
        console.warn('[handleAssistantMessageComplete] Empty assistant message, skipping save.');
        return;
      }

      const estimatedOutputTokens = Math.ceil((message.content || '').length / 4);
      const estimatedInputTokens = Math.ceil(messages.map(m => m.content).join(' ').length / 4);
      
      // Upload files and clean tool invocations before saving
      const cleanedToolInvocations = await Promise.all(
        invocationsToClean.map(async (inv: any) => {
          const cleaned = { ...inv };
          if (cleaned.result && typeof cleaned.result === 'object') {
            const result = { ...cleaned.result };
            
            // 1. Handle file uploads first
            const uploadFile = async (fileResult: any) => {
              if (fileResult.needsUpload && fileResult.content && fileResult.filename) {
                try {
                  console.log('[handleAssistantMessageComplete] Starting upload:', fileResult.filename);
                  const mergedMetadata = {
                    size: fileResult.size,
                    placeholderId: fileResult.placeholderId,
                    ...(fileResult.metadata || {})
                  };
                  
                  const fileRecord = await uploadFileToStorage(
                    user.id, conversation.id, fileResult.filename,
                    fileResult.content, fileResult.mimeType || 'image/png',
                    mergedMetadata,
                    fileResult.fileId
                  );
                  
                  fileResult.fileId = fileRecord.id;
                  fileResult.publicUrl = fileRecord.public_url;
                } catch (e) { 
                  console.error('[handleAssistantMessageComplete] ❌ Upload failed:', e);
                }
                // Always remove the large content field after processing
                delete fileResult.content;
                delete fileResult.needsUpload;
              }
            };

            if (Array.isArray(result.images)) {
              await Promise.all(result.images.map((img: any) => uploadFile(img)));
            } else {
              await uploadFile(result);
            }

            // 2. Aggressively clean large fields to prevent DB insert failure (Supabase/PostgreSQL limits)
            const fieldsToClean = [
              'html_content', 
              'markdown_content', 
              'merged_html', 
              'fixed_html', 
              'content',
              'generated_content',
              'raw_content'
            ];

            fieldsToClean.forEach(field => {
              if (result[field] && typeof result[field] === 'string' && result[field].length > 500) {
                console.log(`[handleAssistantMessageComplete] Cleaning large field '${field}' from tool '${inv.toolName}'`);
                result[field] = result[field].substring(0, 500) + `... (truncated ${result[field].length} chars)`;
              }
            });

            // Also clean large nested fields in data property if exists
            if (result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
              fieldsToClean.forEach(field => {
                if (result.data[field] && typeof result.data[field] === 'string' && result.data[field].length > 500) {
                  result.data[field] = result.data[field].substring(0, 500) + `... (truncated)`;
                }
              });
            }

            cleaned.result = result;
          }
          return cleaned;
        })
      );
      
      console.log('[handleAssistantMessageComplete] Committing to DB...');
      const savedMsg = await saveMessage(
        conversation.id, 'assistant', message.content || '',
        estimatedInputTokens, estimatedOutputTokens, cleanedToolInvocations
      );
      console.log('[handleAssistantMessageComplete] Saved message ID:', savedMsg.id);

      setMessages(prev => {
        const newMessages = [...prev];
        const lastAssistantMsgIdx = newMessages.findLastIndex(m => m.role === 'assistant');
        if (lastAssistantMsgIdx !== -1) {
          newMessages[lastAssistantMsgIdx] = {
            ...newMessages[lastAssistantMsgIdx],
            toolInvocations: cleanedToolInvocations
          };
        }
        return newMessages;
      });
      
      // Update files state immediately after processing all uploads
      // This is more reliable than waiting for DB propagation
      console.log('[handleAssistantMessageComplete] All uploads finished. Refreshing files list for Artifacts...');
      await loadFiles(conversation.id);
      
      // Check if content library tool was used
      const hasContentUpdate = message.toolInvocations?.some(
        (inv: any) => [
          'save_content_item', 
          'save_content_items_batch', 
          'save_final_page',
          'delete_content_item',
          'delete_content_project',
          'assemble_html_page',
          'merge_html_with_site_contexts',
          'fix_style_conflicts'
        ].includes(inv.toolName)
      );
      if (hasContentUpdate) {
        console.log('[handleAssistantMessageComplete] Content update detected, refreshing library...');
        await Promise.all([
          loadContentItems(user.id),
          loadContentProjects(user.id)
        ]);
      }
      
      // Count API calls from tool invocations
      if (message.toolInvocations && message.toolInvocations.length > 0) {
        for (const invocation of message.toolInvocations) {
          const toolName = invocation.toolName;
          console.log('[handleAssistantMessageComplete] Tool invocation:', toolName);
          if (toolName === 'web_search' || toolName === 'extract_content' || toolName === 'crawl_site') {
            await incrementTavilyCalls(conversation.id);
          }
          if (toolName === 'keyword_overview') {
            await incrementSemrushCalls(conversation.id);
          }
          if (toolName === 'search_serp' || toolName === 'analyze_serp_structure') {
            console.log('[handleAssistantMessageComplete] Incrementing Serper calls for conversation:', conversation.id);
            await incrementSerperCalls(conversation.id);
          }
        }
      }
      
      await loadTokenStats(conversation.id);
      console.log('[handleAssistantMessageComplete] ========================================');
      console.log('[handleAssistantMessageComplete] Processing complete!');
      console.log('[handleAssistantMessageComplete] ========================================');
    } catch (error) {
      console.error('[handleAssistantMessageComplete] ❌ Failed to save message:', error);
    }
  };

  // Auth state
  useEffect(() => {
    console.log('[useEffect:Auth] Initializing auth state...');
    let isInitialLoad = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[useEffect:Auth] Session loaded:', session?.user?.id || 'No user');
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('[useEffect:Auth] User logged in, loading data...');
        loadConversations(session.user.id);
        loadContentItems(session.user.id);
        loadContentProjects(session.user.id);
        loadSiteContexts(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[useEffect:Auth] Auth state changed:', _event, session?.user?.id || 'No user');
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }

      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('[useEffect:Auth] User signed in, loading conversations...');
        loadConversations(session.user.id);
        loadContentItems(session.user.id);
        loadContentProjects(session.user.id);
        loadSiteContexts(session.user.id);
      } else {
        console.log('[useEffect:Auth] User signed out, clearing state...');
        setConversations([]);
        updateCurrentConversation(null);
        setMessages([]);
        setFiles([]);
        setContentItems([]);
        setContentProjects([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [setMessages]);

  // Fetch skills
  useEffect(() => {
    fetch('/api/skills')
      .then(res => res.json())
      .then(data => setSkills(data.skills || []))
      .catch(err => console.error('Failed to fetch skills:', err));
  }, []);

  // Load data functions
  const loadConversations = async (userId: string) => {
    console.log('[loadConversations] Loading conversations for user:', userId);
    try {
      const convos = await getUserConversations(userId);
      console.log('[loadConversations] ✅ Loaded', convos.length, 'conversations');
      setConversations(convos);
      
      if (convos.length > 0) {
        console.log('[loadConversations] Switching to first conversation:', convos[0].id);
        switchConversation(convos[0]);
      } else {
        console.log('[loadConversations] No conversations found, creating new one');

        setCurrentConversation(null);
        setMessages([]);
        setFiles([]);
        setTokenStats({ inputTokens: 0, outputTokens: 0 });
        setApiStats({ tavilyCalls: 0, semrushCalls: 0, serperCalls: 0 });
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadFiles = async (conversationId: string | null) => {
    console.log('[loadFiles] Called with conversationId:', conversationId);
    try {
      if (!conversationId) {
        console.log('[loadFiles] No conversationId, clearing files');
        setFiles([]);
        return;
      }
      console.log('[loadFiles] Fetching files from DB for conversation:', conversationId);
      const conversationFiles = await getConversationFiles(conversationId);
      console.log('[loadFiles] ✅ Fetched files:', conversationFiles.length, 'files');
      conversationFiles.forEach((file, idx) => {
        console.log(`[loadFiles] File ${idx + 1}:`, {
          id: file.id,
          filename: file.filename,
          fileType: file.file_type,
          conversationId: file.conversation_id,
          createdAt: file.created_at
        });
      });
      setFiles(conversationFiles);
      console.log('[loadFiles] Files state updated');
    } catch (error) {
      console.error('[loadFiles] ❌ Failed to load files:', error);
    }
  };

  const loadContentItems = async (userId: string) => {
    try {
      const items = await getUserContentItems(userId);
      setContentItems(items);
    } catch (error) {
      console.error('Failed to load content items:', error);
    }
  };

  const loadContentProjects = async (userId: string) => {
    try {
      const projects = await getUserContentProjects(userId);
      setContentProjects(projects);
    } catch (error) {
      console.error('Failed to load content projects:', error);
    }
  };

  const loadSiteContexts = async (userId: string) => {
    try {
      const contexts = await getSiteContexts(userId);
      setSiteContexts(contexts);
    } catch (error) {
      console.error('Failed to load site contexts:', error);
    }
  };

  const loadTokenStats = async (conversationId: string) => {
    try {
      const [stats, apiCalls] = await Promise.all([
        getConversationTokenStats(conversationId),
        getConversationApiStats(conversationId),
      ]);
      console.log('[loadTokenStats] apiCalls:', apiCalls);
      setTokenStats({
        inputTokens: stats.inputTokens,
        outputTokens: stats.outputTokens,
      });
      setApiStats({
        tavilyCalls: apiCalls.tavilyCalls,
        semrushCalls: apiCalls.semrushCalls,
        serperCalls: apiCalls.serperCalls || 0,
      });
      console.log('[loadTokenStats] setApiStats with serperCalls:', apiCalls.serperCalls);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const switchConversation = async (conversation: Conversation) => {
    console.log('[switchConversation] ========================================');
    console.log('[switchConversation] Loading conversation:', conversation.id);
    console.log('[switchConversation] ========================================');
    updateCurrentConversation(conversation);
    // Clear processed message IDs when switching conversations
    processedMessageIdsRef.current.clear();
    lastMessageRef.current = null;
    try {
      const msgs = await getConversationMessages(conversation.id);
      console.log('[switchConversation] Fetched messages from DB:', msgs.length);
      
      const mappedMessages = msgs.map(m => {
        // Clean up toolInvocations: remove content from results without fileId
        // This fixes historical bug data where content was saved but file was never uploaded
        let cleanedToolInvocations = m.tool_invocations;
        if (cleanedToolInvocations) {
          console.log(`[switchConversation] Message ${m.id} has ${cleanedToolInvocations.length} tool invocations`);
          cleanedToolInvocations = cleanedToolInvocations.map((inv: any) => {
            if (inv.result && inv.result.content && !inv.result.fileId) {
              // Remove content from historical data without fileId
              const { content, ...restResult } = inv.result;
              return { ...inv, result: restResult };
            }
            return inv;
          });
        }
        
        return {
          id: m.id,
          role: m.role,
          content: m.content,
          toolInvocations: cleanedToolInvocations,
          attachedFiles: m.attached_files,
          attachedContentItems: m.attached_content_items,
        };
      });

      console.log('[switchConversation] Final mapped messages:', mappedMessages);
      setMessages(mappedMessages);
      
      console.log('[switchConversation] Loading token stats...');
      loadTokenStats(conversation.id);
      
      console.log('[switchConversation] Loading files...');
      await loadFiles(conversation.id);
      console.log('[switchConversation] ========================================');
      console.log('[switchConversation] Conversation load complete');
      console.log('[switchConversation] ========================================');
    } catch (error) {
      console.error('[switchConversation] ❌ Failed to load messages:', error);
    }
  };

  // Conversation operations
  const handleNewConversation = async () => {
    if (!user) return;
    
    try {
      const newConvo = await createConversation(user.id);
        setConversations([newConvo, ...conversations]);
        updateCurrentConversation(newConvo);
        setMessages([]);
        setFiles([]);
      setTokenStats({ inputTokens: 0, outputTokens: 0 });
      setApiStats({ tavilyCalls: 0, semrushCalls: 0, serperCalls: 0 });
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleRenameConversation = async (conversationId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    try {
      await updateConversationTitle(conversationId, newTitle.trim());
      setConversations(conversations.map(c => 
        c.id === conversationId ? { ...c, title: newTitle.trim() } : c
      ));
      if (currentConversation?.id === conversationId) {
        setCurrentConversation({ ...currentConversation, title: newTitle.trim() });
      }
    } catch (error) {
      console.error('Failed to rename conversation:', error);
      alert('Failed to rename conversation. Please try again.');
    }
  };

  const handleToggleShowcase = async (conversationId: string, isShowcase: boolean) => {
    try {
      await toggleConversationShowcase(conversationId, isShowcase);
      setConversations(conversations.map(c => 
        c.id === conversationId ? { ...c, is_showcase: isShowcase } : c
      ));
      if (currentConversation?.id === conversationId) {
        setCurrentConversation({ ...currentConversation, is_showcase: isShowcase });
      }
    } catch (error) {
      console.error('Failed to toggle showcase:', error);
      alert('Failed to update showcase status. Please try again.');
    }
  };

  const confirmDeleteConversation = (conversationId: string) => {
    setDeletingConversationId(conversationId);
  };

  const handleDeleteConversation = async () => {
    if (!deletingConversationId) return;
    
    const conversationId = deletingConversationId;
    setDeletingConversationId(null);
    
    try {
      await deleteConversation(conversationId);
      const updatedConversations = conversations.filter(c => c.id !== conversationId);
      setConversations(updatedConversations);
      
      if (currentConversation?.id === conversationId) {
        if (updatedConversations.length > 0) {
          await switchConversation(updatedConversations[0]);
        } else {
          setCurrentConversation(null);
          setMessages([]);
          setFiles([]);
          setTokenStats({ inputTokens: 0, outputTokens: 0 });
          setApiStats({ tavilyCalls: 0, semrushCalls: 0, serperCalls: 0 });
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  // File operations
  const handleDeleteFile = async (fileId: string, storagePath: string) => {
    try {
      await deleteFile(fileId, storagePath);
      if (currentConversation) {
        await loadFiles(currentConversation.id);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const handleAttachFile = (fileId: string) => {
    setAttachedFileIds(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFileIds(prev => prev.filter(id => id !== fileId));
  };

  const handleAttachContentItem = (itemId: string) => {
    setAttachedContentItemIds(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleRemoveContentItem = (itemId: string) => {
    setAttachedContentItemIds(prev => prev.filter(id => id !== itemId));
  };

  const handleRefreshContent = async () => {
    if (!user) return;
    // Add a visual indicator or toast here if needed
    console.log('[handleRefreshContent] Refreshing content library...');
    await Promise.all([
      loadContentItems(user.id),
      loadContentProjects(user.id)
    ]);
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    setDeletingContent({ type: 'project', id: projectId, name: projectName });
  };

  const handleDeleteContentItem = (itemId: string, itemTitle: string) => {
    setDeletingContent({ type: 'item', id: itemId, name: itemTitle });
  };

  const confirmDeleteContent = async () => {
    if (!deletingContent || !user) return;

    try {
      if (deletingContent.type === 'project') {
        await deleteContentProject(deletingContent.id);
      } else if (deletingContent.type === 'item') {
        await deleteContentItem(deletingContent.id);
      }

      // Refresh content list
      await Promise.all([
        loadContentItems(user.id),
        loadContentProjects(user.id)
      ]);

      // Close content drawer if deleted item was open
      if (deletingContent.type === 'item' && selectedContentItem?.id === deletingContent.id) {
        setSelectedContentItem(null);
      }
    } catch (error) {
      console.error('Failed to delete content:', error);
      alert('Failed to delete content. Please try again.');
    } finally {
      setDeletingContent(null);
    }
  };

  const handleEditSiteContext = async (type: 'logo' | 'header' | 'footer' | 'meta' | 'sitemap') => {
    if (!user) return;
    
    try {
      const context = await getSiteContextByType(user.id, type);
      setSiteContextModal({
        isOpen: true,
        type,
        context,
      });
    } catch (error) {
      console.error('Failed to load site context:', error);
    }
  };

  const handleSaveSiteContext = async (data: {
    type: 'logo' | 'header' | 'footer' | 'meta' | 'sitemap';
    content?: string;
    fileUrl?: string;
  }) => {
    if (!user) return;

    try {
      // Get session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/site-contexts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: data.type,
          content: data.content,
          fileUrl: data.fileUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save site context');
      }

      await loadSiteContexts(user.id);
      setSiteContextModal(null);
    } catch (error) {
      console.error('Failed to save site context:', error);
      throw error;
    }
  };

  // Stop message generation
  const handleStop = async () => {
    stop();
    
    // Add interruption message
    if (currentConversation && user) {
      try {
        const interruptionMessage = 'Operation interrupted by user';
        const estimatedTokens = Math.ceil(interruptionMessage.length / 4);
        
        await saveMessage(
          currentConversation.id,
          'assistant',
          interruptionMessage,
          0,
          estimatedTokens,
          undefined
        );
        
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: interruptionMessage,
          } as any
        ]);
        
        await loadTokenStats(currentConversation.id);
      } catch (error) {
        console.error('Failed to save interruption message:', error);
      }
    }
  };

  // Submit message
  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    let conversationToUse = currentConversation;
    
    if (!conversationToUse && user) {
      try {
        const newConvo = await createConversation(user.id);
        setConversations([newConvo, ...conversations]);
        updateCurrentConversation(newConvo);
        setMessages([]);
        setFiles([]);
        setTokenStats({ inputTokens: 0, outputTokens: 0 });
        setApiStats({ tavilyCalls: 0, semrushCalls: 0, serperCalls: 0 });
        conversationToUse = newConvo;
      } catch (error) {
        console.error('Failed to create conversation:', error);
        return;
      }
    }
    
    const attachedFiles = files.filter(f => attachedFileIds.includes(f.id));
    const attachedContentItems = contentItems.filter(item => attachedContentItemIds.includes(item.id));
    const messageContent = input;
    
    // Prepare attached files data with public URLs for immediate display
    const attachedFilesData = attachedFiles.map(f => ({
      id: f.id,
      filename: f.filename,
      fileType: f.file_type,
      publicUrl: f.public_url,
    }));

    // Prepare attached content items data
    const attachedContentItemsData = attachedContentItems.map(item => ({
      id: item.id,
      title: item.title,
      targetKeyword: item.target_keyword,
    }));
    
    // Clear input and attached items immediately for better UX
    setInput('');
    setAttachedFileIds([]);
    setAttachedContentItemIds([]);
    
    if (conversationToUse && user) {
      const estimatedInputTokens = Math.ceil(messageContent.length / 4);
      
      saveMessage(
        conversationToUse.id,
        'user',
        messageContent,
        estimatedInputTokens,
        0,
        undefined,
        attachedFilesData.length > 0 ? attachedFilesData : undefined,
        attachedContentItemsData.length > 0 ? attachedContentItemsData : undefined
      ).then(() => {
        loadTokenStats(conversationToUse.id);
      }).catch(error => {
        console.error('Failed to save message:', error);
      });
    }
    
      // Use append to add message with attached context immediately visible in UI
    const annotations = [];
    if (attachedFilesData.length > 0) {
      annotations.push({ type: 'attached_files', data: attachedFilesData });
    }
    if (attachedContentItemsData.length > 0) {
      annotations.push({ type: 'attached_content_items', data: attachedContentItemsData });
    }
    
    console.log('[handleCustomSubmit] Calling append with message:', messageContent.substring(0, 50));
    console.log('[handleCustomSubmit] Current conversation:', conversationToUse?.id);
    console.log('[handleCustomSubmit] Current user:', user?.id);
    
    await append(
      {
        role: 'user',
        content: messageContent,
        annotations: annotations.length > 0 ? annotations : undefined,
      } as any,
      {
        data: {
          attachedFiles: attachedFilesData,
          attachedContentItems: attachedContentItemsData,
          userId: user?.id || null,
          conversationId: conversationToUse?.id || null,
        } as any,
      }
    );
    
    console.log('[handleCustomSubmit] Append completed, waiting for response...');
  };

  const handlePlaybookSubmit = async (message: string, useNewConversation: boolean) => {
    const playbook = activePlaybook;
    setActivePlaybook(null);
    
    if (!user) return;
    
    let conversationToUse = currentConversation;
    const shouldCreateNew = useNewConversation || !conversationToUse;

    try {
      if (shouldCreateNew) {
        const newConvo = await createConversation(user.id);
        // Update local state
        setConversations([newConvo, ...conversations]);
        updateCurrentConversation(newConvo);
        setMessages([]);
        setFiles([]);
        setTokenStats({ inputTokens: 0, outputTokens: 0 });
        setApiStats({ tavilyCalls: 0, semrushCalls: 0, serperCalls: 0 });
        conversationToUse = newConvo;
      }
      
      if (conversationToUse && user) {
        // 1. Save user message to DB FIRST (Same pattern as handleCustomSubmit)
        const estimatedInputTokens = Math.ceil(message.length / 4);
        saveMessage(
          conversationToUse.id,
          'user',
          message,
          estimatedInputTokens,
          0
        ).then(() => {
          loadTokenStats(conversationToUse!.id);
        }).catch(error => {
          console.error('Failed to save playbook user message:', error);
        });

        // 2. Now append the message to the conversation WITHOUT awaiting it
        // This triggers the assistant response and handles the UI state correctly
        append(
          {
            role: 'user',
            content: message,
          } as any,
          {
            data: {
              userId: user.id,
              conversationId: conversationToUse.id,
              activeSkillId: playbook?.id, // 传递活跃技能 ID
            } as any,
          }
        );
      }
    } catch (error) {
      console.error('Failed to start playbook mission:', error);
    }
  };

  const handleExportLog = () => {
    if (!messages.length) return;

    let logText = `CONVERSATION LOG: ${currentConversation?.title || 'Untitled'}\n`;
    logText += `ID: ${currentConversation?.id || 'N/A'}\n`;
    logText += `Generated at: ${new Date().toLocaleString()}\n`;
    logText += `========================================\n\n`;

    messages.forEach((msg, idx) => {
      const role = msg.role.toUpperCase();
      logText += `[${role} #${idx + 1}]\n`;
      logText += `${msg.content}\n\n`;

      if (msg.toolInvocations && msg.toolInvocations.length > 0) {
        logText += `--- TOOL INVOCATIONS ---\n`;
        msg.toolInvocations.forEach((inv: any, i: number) => {
          logText += `Tool ${i + 1}: ${inv.toolName}\n`;
          logText += `Args: ${JSON.stringify(inv.args, null, 2)}\n`;
          if (inv.result) {
            const resultSummary = typeof inv.result === 'object' 
              ? JSON.stringify(inv.result, (key, value) => {
                  // Truncate large strings in log
                  if (typeof value === 'string' && value.length > 200) return value.slice(0, 200) + '... (truncated)';
                  if (Array.isArray(value) && value.length > 10) return `[Array of ${value.length} items]`;
                  return value;
                }, 2)
              : inv.result;
            logText += `Result: ${resultSummary}\n`;
          }
          logText += `\n`;
        });
        logText += `------------------------\n\n`;
      }
      logText += `----------------------------------------\n\n`;
    });

    navigator.clipboard.writeText(logText);
    setToast({ isOpen: true, message: 'Log copied to clipboard!' });
  };

  return (
    <div className="h-screen bg-[#FAFAFA] flex">
      {/* Left Sidebar */}
      {user && (
        <ConversationSidebar
          contentItems={contentItems}
          contentProjects={contentProjects}
          siteContexts={siteContexts}
          onSelectContentItem={(item) => setSelectedContentItem(item)}
          onRefreshContent={handleRefreshContent}
          onDeleteProject={handleDeleteProject}
          onDeleteContentItem={handleDeleteContentItem}
          onEditSiteContext={handleEditSiteContext}
          // Conversation props
          conversations={conversations}
          currentConversation={currentConversation}
          onNewConversation={handleNewConversation}
          onSwitchConversation={switchConversation}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={confirmDeleteConversation}
          onToggleShowcase={handleToggleShowcase}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        {user && (
          <header className="bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg text-[#111827]">
                {currentConversation ? currentConversation.title : 'New Conversation'}
              </h1>
              {currentConversation && (
                <div className="flex items-center gap-2">
                  {/* Domains Button */}
                  <button
                    onClick={() => setIsDomainsOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E5E5] text-xs font-bold text-[#6B7280] hover:bg-[#F3F4F6] transition-all"
                    title="Manage domains"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Domains
                  </button>
                  <GSCIntegrationStatus 
                    user={user} 
                    conversationId={currentConversation?.id} 
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsArtifactsOpen(!isArtifactsOpen);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all relative ${
                      isArtifactsOpen 
                        ? 'bg-[#111827] border-[#111827] text-white' 
                        : 'bg-white border-[#E5E5E5] text-[#6B7280] hover:bg-[#F3F4F6]'
                    }`}
                    title="Toggle Artifacts panel"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="text-xs font-bold">Artifacts</span>
                    {files.length > 0 && (
                      <span className={`flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold ${
                        isArtifactsOpen ? 'bg-white text-[#111827]' : 'bg-[#9A8FEA] text-white'
                      }`}>
                        {files.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={handleExportLog}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E5E5] text-xs font-bold text-[#6B7280] hover:bg-[#F3F4F6] transition-all"
                    title="Export conversation log as plain text"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    Export Log
                  </button>
                  <button
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/share/${currentConversation.id}`;
                      navigator.clipboard.writeText(shareUrl);
                      setToast({ isOpen: true, message: 'Share link copied to clipboard!' });
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E5E5] text-xs font-bold text-[#6B7280] hover:bg-[#F3F4F6] transition-all"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
                    </svg>
                    Share
                  </button>
                </div>
              )}
            </div>
          </header>
        )}

        {/* Chat area */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          {!user ? (
            <div className="flex-1 flex items-center justify-center relative">
              <div className="text-center">
                <div className="mb-8">
                  <Image 
                    src="/logo.svg" 
                    alt="Mini Seenos Logo" 
                    width={96} 
                    height={96}
                    className="mx-auto animate-subtle-shake"
                  />
                </div>
                <div className="flex justify-center">
                  <AuthButton />
                </div>
              </div>
            </div>
          ) : initialLoading ? (
            <div className="flex-1 flex items-center justify-center relative">
              <div className="flex flex-col items-center gap-4">
                <Image 
                  src="/logo.svg" 
                  alt="Loading..." 
                  width={96} 
                  height={96}
                  className="animate-subtle-shake"
                />
                <p className="text-sm text-gray-500 font-medium animate-pulse">Loading your workspace...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto relative thin-scrollbar flex flex-col" style={{ scrollbarGutter: 'stable' }}>
                <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-3 flex-1 flex flex-col">
                  <MessageList
                    messages={messages}
                    isLoading={isLoading}
                    userId={user?.id}
                    conversationId={currentConversation?.id}
                    files={files}
                    contentItems={contentItems}
                    onUploadSuccess={() => {
                      if (currentConversation) {
                        loadFiles(currentConversation.id);
                      }
                    }}
                    onRetry={() => {
                      if (messages.length > 0) {
                        // Find the last user message to resubmit
                        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
                        if (lastUserMessage) {
                          // Remove the error message from the UI
                          setMessages(prev => {
                            const lastIdx = prev.findLastIndex(m => m.role === 'assistant' && m.content?.startsWith('Error:'));
                            if (lastIdx !== -1) {
                              return prev.slice(0, lastIdx);
                            }
                            return prev;
                          });
                          
                          // Prepare data for resubmission
                          const lastMsgAny = lastUserMessage as any;
                          const attachedFilesData = lastMsgAny.attachedFiles || 
                            (Array.isArray(lastMsgAny.annotations) && lastMsgAny.annotations.find((a: any) => a.type === 'attached_files')?.data) || [];
                          const attachedContentItemsData = lastMsgAny.attachedContentItems ||
                            (Array.isArray(lastMsgAny.annotations) && lastMsgAny.annotations.find((a: any) => a.type === 'attached_content_items')?.data) || [];
                          
                          // Resubmit
                          append(
                            {
                              role: 'user',
                              content: lastUserMessage.content,
                            } as any,
                            {
                              data: {
                                attachedFiles: attachedFilesData,
                                attachedContentItems: attachedContentItemsData,
                                userId: user?.id || null,
                                conversationId: currentConversation?.id || null,
                              } as any,
                            }
                          );
                        }
                      }
                    }}
                    onPreviewContentItem={async (itemId: string) => {
                      // Load the content item from database to get the real saved data
                      try {
                        const item = await getContentItemById(itemId);
                        if (item) {
                          setSelectedContentItem(item);
                          // Refresh the content items list to show updated status in sidebar
                          if (user) {
                            await loadContentItems(user.id);
                          }
                        } else {
                          console.error('Content item not found:', itemId);
                        }
                      } catch (error) {
                        console.error('Failed to load content item for preview:', error);
                      }
                    }}
                  />
                </div>
              </div>

              <ChatInput
                input={input}
                isLoading={isLoading}
                files={files}
                contentItems={contentItems}
                attachedFileIds={attachedFileIds}
                attachedContentItemIds={attachedContentItemIds}
                tokenStats={tokenStats}
                apiStats={apiStats}
                skills={skills}
                onInputChange={handleInputChange}
                onSubmit={handleCustomSubmit}
                onStop={handleStop}
                onAttachFile={handleAttachFile}
                onRemoveFile={handleRemoveFile}
                onAttachContentItem={handleAttachContentItem}
                onRemoveContentItem={handleRemoveContentItem}
                onPlaybookClick={(skill) => setActivePlaybook(skill)}
              />
            </>
          )}
      </main>
    </div>

    {/* Delete Confirmation Modal */}
      {deletingConversationId && (
        <DeleteConfirmModal
          onConfirm={handleDeleteConversation}
          onCancel={() => setDeletingConversationId(null)}
        />
      )}

      {/* Content Delete Confirmation Modal */}
      {deletingContent && (
        <ConfirmModal
          title={deletingContent.type === 'project' ? 'Delete Project' : 'Delete Content Item'}
          message={
            deletingContent.type === 'project'
              ? `Are you sure you want to delete the project "${deletingContent.name}"? All content items under this project will also be permanently deleted. This action cannot be undone.`
              : `Are you sure you want to delete "${deletingContent.name}"? This action cannot be undone.`
          }
          confirmText="Delete"
          cancelText="Cancel"
          isDangerous={true}
          onConfirm={confirmDeleteContent}
          onCancel={() => setDeletingContent(null)}
        />
      )}

      {/* Site Context Modal */}
      {siteContextModal && (
        <SiteContextModal
          isOpen={siteContextModal.isOpen}
          onClose={() => setSiteContextModal(null)}
          onSave={handleSaveSiteContext}
          type={siteContextModal.type}
          context={siteContextModal.context}
          allContexts={siteContexts}
        />
      )}

      {/* Domains Modal */}
      <DomainsModal
        isOpen={isDomainsOpen}
        onClose={() => setIsDomainsOpen(false)}
      />

      {/* Content Detail Drawer */}
      <ContentDrawer
        item={selectedContentItem}
        onClose={() => setSelectedContentItem(null)}
      />

      {/* Right Sidebar (Floating Artifacts Panel) */}
      {user && (
        <RightSidebar
          files={files}
          onDeleteFile={handleDeleteFile}
          isOpen={isArtifactsOpen}
          onOpenChange={setIsArtifactsOpen}
        />
      )}

      {/* Playbook Trigger Modal */}
      {activePlaybook && (
        <PlaybookTrigger
          skill={activePlaybook}
          userId={user?.id}
          onCancel={() => setActivePlaybook(null)}
          onSubmit={handlePlaybookSubmit}
        />
      )}

      {/* Toast Notification */}
      <Toast 
        isOpen={toast.isOpen} 
        message={toast.message} 
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))} 
      />
    </div>
  );
}

