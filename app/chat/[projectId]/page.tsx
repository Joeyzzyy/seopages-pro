'use client';

import { useChat } from 'ai/react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  upsertSiteContext,
  getSEOProjectById
} from '@/lib/supabase';
import type { Conversation, FileRecord, ContentItem, ContentProject, SiteContext, SEOProject } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AuthButton from '@/components/AuthButton';
import ConversationSidebar from '@/components/ConversationSidebar';
import MessageList from '@/components/MessageList';
import ChatInput from '@/components/ChatInput';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import ConfirmModal from '@/components/ConfirmModal';
import ContentDrawer from '@/components/ContentDrawer';
import GSCIntegrationStatus from '@/components/GSCIntegrationStatus';
import DomainsModal from '@/components/DomainsModal';
import ContextModalNew from '@/components/ContextModalNew';
import PlaybookTrigger from '@/components/PlaybookTrigger';
import Toast from '@/components/Toast';
import TopBar from '@/components/TopBar';
import SkillsAndArtifactsSidebar from '@/components/SkillsAndArtifactsSidebar';
import ConversationsDropdown from '@/components/ConversationsDropdown';

interface Skill {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
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

// Extract current tasks from messages (looking for create_plan tool)
function extractCurrentTasks(messages: any[]): Array<{
  step_number: number;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}> {
  let planSteps: any[] = [];
  let completedSteps: number[] = [];
  let hasFinishedExecution = false;
  
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === 'assistant' && msg.toolInvocations) {
      const allToolsFinished = msg.toolInvocations.every(
        (inv: any) => inv.state === 'result' || (inv.result && !inv.state)
      );
      if (i === messages.length - 1 && allToolsFinished) {
        hasFinishedExecution = true;
      }
      
      for (const inv of msg.toolInvocations) {
        if (inv.toolName === 'create_plan' && inv.args?.steps && planSteps.length === 0) {
          planSteps = inv.args.steps.map((step: any, index: number) => {
            if (typeof step === 'string') {
              return { step_number: index + 1, description: step };
            }
            return {
              step_number: step.step_number || index + 1,
              description: step.description || step.title || step
            };
          });
        }
        
        if (inv.toolName === 'update_task_status' && inv.args?.completed_steps) {
          completedSteps = [...new Set([...completedSteps, ...inv.args.completed_steps])];
        }
      }
    }
  }
  
  if (planSteps.length === 0) return [];
  
  if (hasFinishedExecution && completedSteps.length > 0) {
    return planSteps.map((step) => ({
      step_number: step.step_number,
      description: step.description,
      status: 'completed' as const
    }));
  }
  
  const currentStepNumber = completedSteps.length > 0 ? Math.max(...completedSteps) + 1 : 1;
  
  return planSteps.map((step) => {
    const stepNum = step.step_number;
    let status: 'pending' | 'in_progress' | 'completed' | 'failed' = 'pending';
    
    if (completedSteps.includes(stepNum)) {
      status = 'completed';
    } else if (stepNum === currentStepNumber) {
      status = 'in_progress';
    }
    
    return {
      step_number: stepNum,
      description: step.description,
      status
    };
  });
}

export default function ProjectChatPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();

  // State
  const [user, setUser] = useState<User | null>(null);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const currentConversationRef = useRef<Conversation | null>(null);
  
  const updateCurrentConversation = (conv: Conversation | null) => {
    setCurrentConversation(conv);
    currentConversationRef.current = conv;
  };
  
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
  const [toast, setToast] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
  const [isArtifactsOpen, setIsArtifactsOpen] = useState(false);
  const [isDomainsOpen, setIsDomainsOpen] = useState(false);
  const [isGSCOpen, setIsGSCOpen] = useState(false);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [isConversationsListOpen, setIsConversationsListOpen] = useState(false);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [editingChatTitle, setEditingChatTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const allChatsButtonRef = useRef<HTMLButtonElement>(null);

  // Chat hook
  const { messages, input, handleInputChange, handleSubmit, append, isLoading, setMessages, setInput, stop } = useChat({
    onError: async (error) => {
      console.error('[useChat:onError] Chat stream error:', error);
      const lastMessage = messages[messages.length - 1];
      const hasPartialResponse = lastMessage && lastMessage.role === 'assistant';
      let errorMessage = `❌ Error: ${error.message || 'An unexpected error occurred. Please try again.'}`;
      
      const errorMsg = {
        id: `error-${Date.now()}`,
        role: 'assistant' as const,
        content: errorMessage,
      };
      
      setMessages(prev => [...prev, errorMsg as any]);
      
      const conversation = currentConversationRef.current;
      if (conversation && user) {
        try {
          if (hasPartialResponse && (lastMessage.content || (lastMessage.toolInvocations?.length ?? 0) > 0)) {
            const estimatedOutputTokens = Math.ceil((lastMessage.content || '').length / 4);
            const estimatedInputTokens = Math.ceil(messages.slice(0, -1).map((m: any) => m.content).join(' ').length / 4);
            
            await saveMessage(
              conversation.id,
              'assistant',
              lastMessage.content || '⚠️ (Partial response - interrupted by error)',
              estimatedInputTokens,
              estimatedOutputTokens,
              lastMessage.toolInvocations
            );
          }
          await saveMessage(conversation.id, 'assistant', errorMessage, 0, 0, null);
        } catch (saveError) {
          console.error('[useChat:onError] Failed to save error message:', saveError);
        }
      }
    },
    onFinish: async (message: any, options: any) => {
      const messageId = message.id || `${message.role}-${message.content?.slice(0, 50)}`;
      if (processedMessageIdsRef.current.has(messageId)) return;
      
      const conversation = currentConversationRef.current;
      if (conversation && user) {
        processedMessageIdsRef.current.add(messageId);
        try {
          const estimatedOutputTokens = Math.ceil((message.content || '').length / 4);
          const estimatedInputTokens = Math.ceil(messages.map(m => m.content).join(' ').length / 4);
          
          const savedMsg = await saveMessage(
            conversation.id, 'assistant', message.content || '',
            estimatedInputTokens, estimatedOutputTokens, message.toolInvocations
          );

          await loadTokenStats(conversation.id);
          await loadFiles(conversation.id);
        } catch (error) {
          console.error('Failed to save message:', error);
        }
      }
    },
  });

  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const isLoadingRef = useRef(false);
  
  useEffect(() => {
    if (isLoadingRef.current && !isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const messageId = lastMessage.id || `${lastMessage.role}-${lastMessage.content?.slice(0, 50)}`;
      if (lastMessage.role === 'assistant' && !processedMessageIdsRef.current.has(messageId)) {
        handleAssistantMessageComplete(lastMessage);
      }
    }
    isLoadingRef.current = isLoading;
  }, [isLoading, messages.length]);

  const handleAssistantMessageComplete = async (message: any) => {
    const messageId = message.id || `${message.role}-${message.content?.slice(0, 50)}`;
    if (processedMessageIdsRef.current.has(messageId)) return;
    
    const conversation = currentConversationRef.current;
    if (!conversation || !user) return;
    
    processedMessageIdsRef.current.add(messageId);
    try {
      const estimatedOutputTokens = Math.ceil((message.content || '').length / 4);
      const estimatedInputTokens = Math.ceil(messages.map(m => m.content).join(' ').length / 4);
      
      await saveMessage(
        conversation.id, 'assistant', message.content || '',
        estimatedInputTokens, estimatedOutputTokens, message.toolInvocations
      );
      
      await loadFiles(conversation.id);
      await loadTokenStats(conversation.id);
    } catch (error) {
      console.error('[handleAssistantMessageComplete] Failed to save message:', error);
    }
  };

  // Auth & Project state
  useEffect(() => {
    if (!projectId) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        initProject(session.user.id);
      } else {
        router.push('/');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        initProject(session.user.id);
      } else {
        router.push('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [projectId]);

  const initProject = async (userId: string) => {
    try {
      console.log(`[Project-Init] Initializing project: ${projectId} for user: ${userId}`);
      setInitialLoading(true);
      const project = await getSEOProjectById(projectId);
      if (!project || project.user_id !== userId) {
        console.error('[Project-Init] Project not found or unauthorized');
        router.push('/projects');
        return;
      }
      setCurrentProject(project);
      
      // Load project specific data
      const contexts = await getSiteContexts(userId, projectId);
      setSiteContexts(contexts);
      console.log(`[Project-Init] Loaded ${contexts.length} site contexts`);
      
      const [convos] = await Promise.all([
        loadConversations(userId, projectId),
        loadContentItems(userId),
        loadContentProjects(userId)
      ]);

      // Check if context is empty and auto-initiate via skill
      // Check for 'logo' type which is our main brand context indicator
      const hasBrandContext = contexts.some(c => c.type === 'logo');
      
      if (!hasBrandContext && lastInitiatedProjectId.current !== projectId) {
        console.log('[Auto-Initiate] No brand context found, triggering skill acquisition...');
        lastInitiatedProjectId.current = projectId;
        
        // Check if any conversation has messages
        let hasExistingMessages = false;
        if (convos && convos.length > 0) {
          const msgs = await getConversationMessages(convos[0].id);
          hasExistingMessages = msgs.length > 0;
        }

        if (!hasExistingMessages) {
          autoInitiateSiteContext(project.domain, userId, convos?.[0] || null);
        }
      }
    } catch (error) {
      console.error('Failed to init project:', error);
      router.push('/projects');
    } finally {
      setInitialLoading(false);
    }
  };

  const lastInitiatedProjectId = useRef<string | null>(null);

  const autoInitiateSiteContext = async (domain: string, userId: string, existingConvo: Conversation | null = null) => {
    // Create first conversation for the project if none exists
    let conversationToUse = existingConvo;
    if (!conversationToUse) {
      try {
        console.log('[Auto-Initiate] Creating new conversation for context analysis...');
        conversationToUse = await createConversation(userId, projectId, `Context Analysis: ${domain}`);
        setConversations([conversationToUse]);
        updateCurrentConversation(conversationToUse);
      } catch (error) {
        console.error('[Auto-Initiate] Failed to create conversation:', error);
        return;
      }
    } else {
      updateCurrentConversation(conversationToUse);
    }

    // Ensure domain has protocol
    const fullUrl = domain.startsWith('http') ? domain : `https://${domain}`;
    const prompt = `Acquire complete site context for ${fullUrl}. Use acquire_context_field to extract each field one by one: brand-assets, hero-section, contact-info, sitemap, page-classification, problem-statement, who-we-serve, use-cases, products-services, about-us, faq, social-proof. Report progress after each field.`;
    
    console.log(`[Auto-Initiate] Sending context acquisition request for: ${fullUrl}`);
    
    // Wait for state to settle, then trigger the skill
    setTimeout(() => {
      console.log('[Auto-Initiate] Calling append with site-context skill...');
      append(
        { role: 'user', content: prompt } as any,
        {
          data: {
            userId: userId,
            conversationId: conversationToUse!.id,
            projectId: projectId,
            activeSkillId: 'site-context',
          } as any,
        }
      ).then(() => {
        console.log('[Auto-Initiate] Append completed');
      }).catch(err => {
        console.error('[Auto-Initiate] Error calling append:', err);
      });
    }, 500);
  };

  // Fetch skills
  useEffect(() => {
    fetch('/api/skills')
      .then(res => res.json())
      .then(data => setSkills(data.skills || []))
      .catch(err => console.error('Failed to fetch skills:', err));
  }, []);

  // Load data functions
  const loadConversations = async (userId: string, projectId: string) => {
    try {
      const convos = await getUserConversations(userId, projectId);
      setConversations(convos);
      if (convos.length > 0) {
        await switchConversation(convos[0]);
      }
      return convos;
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return [];
    }
  };

  const loadFiles = async (conversationId: string | null) => {
    if (!conversationId) {
      setFiles([]);
      return;
    }
    try {
      const conversationFiles = await getConversationFiles(conversationId);
      setFiles(conversationFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
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
      const contexts = await getSiteContexts(userId, projectId);
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
      setTokenStats({
        inputTokens: stats.inputTokens,
        outputTokens: stats.outputTokens,
      });
      setApiStats({
        tavilyCalls: apiCalls.tavilyCalls,
        semrushCalls: apiCalls.semrushCalls,
        serperCalls: apiCalls.serperCalls || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const switchConversation = async (conversation: Conversation) => {
    updateCurrentConversation(conversation);
    processedMessageIdsRef.current.clear();
    try {
      const msgs = await getConversationMessages(conversation.id);
      const mappedMessages = msgs.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        toolInvocations: m.tool_invocations,
        annotations: m.annotations,
      }));
      setMessages(mappedMessages);
      loadTokenStats(conversation.id);
      loadFiles(conversation.id);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleNewConversation = async () => {
    if (!user) return;
    try {
      const newConvo = await createConversation(user.id, projectId);
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
      setConversations(conversations.map(c => c.id === conversationId ? { ...c, title: newTitle.trim() } : c));
      if (currentConversation?.id === conversationId) {
        setCurrentConversation({ ...currentConversation, title: newTitle.trim() });
      }
    } catch (error) {
      console.error('Failed to rename conversation:', error);
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
        if (updatedConversations.length > 0) switchConversation(updatedConversations[0]);
        else {
          setCurrentConversation(null);
          setMessages([]);
          setFiles([]);
          setTokenStats({ inputTokens: 0, outputTokens: 0 });
          setApiStats({ tavilyCalls: 0, semrushCalls: 0, serperCalls: 0 });
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleSaveSiteContext = async (data: any) => {
    if (!user) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const response = await fetch('/api/site-contexts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...data, projectId: projectId }),
      });

      if (!response.ok) throw new Error('Failed to save site context');
      await loadSiteContexts(user.id);
      setToast({ isOpen: true, message: 'Context saved successfully!' });
    } catch (error) {
      console.error('Failed to save site context:', error);
      setToast({ isOpen: true, message: 'Failed to save context' });
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    
    let conversationToUse = currentConversation;
    if (!conversationToUse) {
      conversationToUse = await createConversation(user.id, projectId);
      setConversations([conversationToUse, ...conversations]);
      updateCurrentConversation(conversationToUse);
    }
    
    const messageContent = input;
    setInput('');
    
    saveMessage(conversationToUse.id, 'user', messageContent, Math.ceil(messageContent.length / 4), 0)
      .then(() => loadTokenStats(conversationToUse!.id))
      .catch(err => console.error('Failed to save message:', err));
    
    await append({ role: 'user', content: messageContent } as any, {
      data: {
        userId: user.id,
        conversationId: conversationToUse.id,
        projectId: projectId,
      } as any,
    });
  };

  const handlePlaybookSubmit = async (message: string, useNewConversation: boolean) => {
    if (!user) return;
    let conversationToUse = currentConversation;
    if (useNewConversation || !conversationToUse) {
      conversationToUse = await createConversation(user.id, projectId);
      setConversations([conversationToUse, ...conversations]);
      updateCurrentConversation(conversationToUse);
      setMessages([]);
    }
    
    if (conversationToUse) {
      saveMessage(conversationToUse.id, 'user', message, Math.ceil(message.length / 4), 0)
        .then(() => loadTokenStats(conversationToUse!.id))
        .catch(err => console.error('Failed to save playbook message:', err));

      append({ role: 'user', content: message } as any, {
        data: {
          userId: user.id,
          conversationId: conversationToUse.id,
          projectId: projectId,
          activeSkillId: activePlaybook?.id,
        } as any,
      });
      setActivePlaybook(null);
    }
  };

  const handleExportLog = () => {
    if (!messages.length) return;
    let logText = `CONVERSATION LOG: ${currentConversation?.title || 'Untitled'}\nID: ${currentConversation?.id || 'N/A'}\n\n`;
    messages.forEach((msg, idx) => {
      logText += `[${msg.role.toUpperCase()} #${idx + 1}]\n${msg.content}\n\n`;
    });
    navigator.clipboard.writeText(logText);
    setToast({ isOpen: true, message: 'Log copied to clipboard!' });
  };

  return (
    <div className="h-screen bg-[#FAFAFA] flex flex-col p-2 gap-2">
      {user && (
        <TopBar 
          user={user}
          onDomainsClick={() => setIsDomainsOpen(true)}
          onGSCClick={() => setIsGSCOpen(true)}
          showBackToProjects={true}
        />
      )}

      <div className="flex-1 flex overflow-hidden gap-2">
        {user && (
          <div className="shrink-0">
            <ConversationSidebar
              siteContexts={siteContexts}
              contentItems={contentItems}
              contentProjects={contentProjects}
              onEditSiteContext={() => {}}
              onSelectContentItem={(item) => setSelectedContentItem(item)}
              onRefreshContent={() => loadContentItems(user.id)}
              onDeleteProject={() => {}}
              onDeleteContentItem={() => {}}
              onOpenContextModal={() => setIsContextModalOpen(true)}
              conversationId={currentConversation?.id}
              currentTasks={extractCurrentTasks(messages)}
            />
          </div>
        )}

        <div className="flex-1 flex flex-col bg-white rounded-lg border border-[#E5E5E5] shadow-sm overflow-hidden">
          <header className="px-6 py-1.5 border-b border-[#E5E5E5] shrink-0 h-10 flex items-center">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                  {currentProject?.domain ? `Chat: ${currentProject.domain}` : 'Chat'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {currentConversation && (
                  <button onClick={handleExportLog} className="px-2 py-1 rounded border border-[#E5E5E5] text-[10px] font-medium text-[#6B7280] hover:bg-[#F3F4F6]">
                    Copy Chat
                  </button>
                )}
                <div className="flex items-center gap-2 relative">
                  <button onClick={() => setIsConversationsListOpen(!isConversationsListOpen)} ref={allChatsButtonRef} className="px-2 py-0.5 rounded border border-[#E5E5E5] text-[#6B7280] hover:bg-white text-[10px] font-medium">
                    All Chats
                  </button>
                  <button onClick={handleNewConversation} className="px-2 py-0.5 rounded border border-[#E5E5E5] text-[#6B7280] hover:bg-white text-[10px] font-medium">
                    New Chat
                  </button>
                  <ConversationsDropdown
                    isOpen={isConversationsListOpen}
                    onClose={() => setIsConversationsListOpen(false)}
                    conversations={conversations}
                    currentConversationId={currentConversation?.id}
                    buttonRef={allChatsButtonRef}
                    onSelectConversation={(id) => {
                      const c = conversations.find(x => x.id === id);
                      if (c) switchConversation(c);
                    }}
                    onDeleteConversation={confirmDeleteConversation}
                  />
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 flex flex-col bg-white overflow-hidden">
            {initialLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto thin-scrollbar">
                  <div className="w-full max-w-5xl mx-auto px-4 py-6">
                    <MessageList
                      messages={messages}
                      isLoading={isLoading}
                      userId={user?.id}
                      conversationId={currentConversation?.id}
                      files={files}
                      contentItems={contentItems}
                      onUploadSuccess={() => loadFiles(currentConversation?.id || null)}
                      onShowToast={(m) => setToast({ isOpen: true, message: m })}
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
                  skills={skills}
                  referenceImageUrl={referenceImageUrl}
                  conversationId={currentConversation?.id}
                  tokenStats={tokenStats}
                  apiStats={apiStats}
                  onInputChange={handleInputChange}
                  onSubmit={handleCustomSubmit}
                  onStop={stop}
                  onAttachFile={(id) => setAttachedFileIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])}
                  onRemoveFile={(id) => setAttachedFileIds(p => p.filter(x => x !== id))}
                  onAttachContentItem={(id) => setAttachedContentItemIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])}
                  onRemoveContentItem={(id) => setAttachedContentItemIds(p => p.filter(x => x !== id))}
                  onPlaybookClick={(s) => setActivePlaybook(s)}
                  onReferenceImageChange={setReferenceImageUrl}
                  onUploadSuccess={() => loadFiles(currentConversation?.id || null)}
                />
              </>
            )}
          </main>
        </div>

        {user && (
          <div className="shrink-0">
            <SkillsAndArtifactsSidebar
              skills={skills}
              files={files}
              onPlaybookClick={(s) => setActivePlaybook(s)}
              onDeleteFile={(id, path) => deleteFile(id, path).then(() => loadFiles(currentConversation?.id || null))}
            />
          </div>
        )}
      </div>

      {isContextModalOpen && (
        <ContextModalNew
          isOpen={isContextModalOpen}
          onClose={() => setIsContextModalOpen(false)}
          siteContexts={siteContexts}
          onSave={handleSaveSiteContext}
        />
      )}

      <DomainsModal isOpen={isDomainsOpen} onClose={() => setIsDomainsOpen(false)} />
      <ContentDrawer item={selectedContentItem} onClose={() => setSelectedContentItem(null)} />
      {activePlaybook && (
        <PlaybookTrigger
          skill={activePlaybook}
          userId={user?.id}
          siteContexts={siteContexts}
          onCancel={() => setActivePlaybook(null)}
          onSubmit={handlePlaybookSubmit}
        />
      )}
      <Toast isOpen={toast.isOpen} message={toast.message} onClose={() => setToast(p => ({ ...p, isOpen: false }))} />
      {deletingConversationId && <DeleteConfirmModal onConfirm={handleDeleteConversation} onCancel={() => setDeletingConversationId(null)} />}
    </div>
  );
}

