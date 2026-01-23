'use client';

import { useChat } from 'ai/react';
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
  getConversationTokenStats, 
  getConversationApiStats, 
  getConversationFiles, 
  getUserContentItems,
  getUserContentProjects,
  getContentItemById,
  deleteContentItem,
  deleteContentProject,
  getSiteContexts,
  getSEOProjectById
} from '@/lib/supabase';
import type { Conversation, FileRecord, ContentItem, ContentProject, SiteContext } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import TopBar from '@/components/TopBar';
import TaskList, { Task, TaskStatus } from '@/components/TaskList';
import TaskDetailPanel from '@/components/TaskDetailPanel';
import ContentDrawer from '@/components/ContentDrawer';
import DomainsModal from '@/components/DomainsModal';
import ContextModalNew from '@/components/ContextModalNew';
import CompetitorsModal from '@/components/CompetitorsModal';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import SiteInitializationOverlay from '@/components/SiteInitializationOverlay';

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
  
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [contentProjects, setContentProjects] = useState<ContentProject[]>([]);
  const [siteContexts, setSiteContexts] = useState<SiteContext[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshingSiteContexts, setRefreshingSiteContexts] = useState(false);
  const [refreshingBrandAssets, setRefreshingBrandAssets] = useState(false);
  const [refreshingCompetitors, setRefreshingCompetitors] = useState(false);
  const [refreshingContent, setRefreshingContent] = useState(false);
  const [planningPages, setPlanningPages] = useState(false);
  const [selectedContentItem, setSelectedContentItem] = useState<ContentItem | null>(null);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
  const [isDomainsOpen, setIsDomainsOpen] = useState(false);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [isCompetitorsModalOpen, setIsCompetitorsModalOpen] = useState(false);
  
  // Task state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [runningTaskId, setRunningTaskIdState] = useState<string | null>(null);
  const runningTaskIdRef = useRef<string | null>(null);
  const setRunningTaskId = (id: string | null) => {
    runningTaskIdRef.current = id;
    setRunningTaskIdState(id);
  };
  const [contextTaskStatus, setContextTaskStatus] = useState<TaskStatus>('pending');
  const [taskMessages, setTaskMessages] = useState<Map<string, any[]>>(new Map());
  
  // Initialization mode - show full screen overlay during first-time context acquisition
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Delete confirmation
  const [deletingCluster, setDeletingCluster] = useState<{ id: string; name: string } | null>(null);
  const [deletingContentItem, setDeletingContentItem] = useState<{ id: string; name: string } | null>(null);

  // User credits and subscription
  const [userCredits, setUserCredits] = useState<number>(1);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');

  // Fetch user credits from API
  const fetchUserCredits = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/user/credits', { headers });
      if (response.ok) {
        const data = await response.json();
        setUserCredits(data.credits ?? 1);
        setSubscriptionTier(data.subscription_tier ?? 'free');
      }
    } catch (error) {
      console.error('Failed to fetch user credits:', error);
    }
  };

  // Chat hook
  const { messages, append, isLoading, setMessages, stop } = useChat({
    onError: async (error) => {
      console.error('[useChat:onError] Chat stream error:', error);
      const lastMessage = messages[messages.length - 1];
      let errorMessage = `Error: ${error.message || 'An unexpected error occurred. Please try again.'}`;
      
      const errorMsg = {
        id: `error-${Date.now()}`,
        role: 'assistant' as const,
        content: errorMessage,
      };
      
      setMessages(prev => [...prev, errorMsg as any]);
      
      // Update task messages
      const currentTaskId = runningTaskIdRef.current;
      if (currentTaskId) {
        setTaskMessages(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(currentTaskId) || [];
          newMap.set(currentTaskId, [...existing, errorMsg]);
          return newMap;
        });
      }
      
      // Update task status
      if (currentTaskId === 'context-analysis') {
        setContextTaskStatus('error');
        // Exit initialization mode on error
        setIsInitializing(false);
      }
      setRunningTaskId(null);
      
      const conversation = currentConversationRef.current;
      if (conversation && user) {
        try {
          await saveMessage(conversation.id, 'assistant', errorMessage, 0, 0, null);
        } catch (saveError) {
          console.error('[useChat:onError] Failed to save error message:', saveError);
        }
      }
    },
    onFinish: async (message: any) => {
      const messageId = message.id || `${message.role}-${message.content?.slice(0, 50)}`;
      if (processedMessageIdsRef.current.has(messageId)) return;
      
      const conversation = currentConversationRef.current;
      const currentRunningTaskId = runningTaskIdRef.current; // Use ref to get latest value
      
      if (conversation && user) {
        processedMessageIdsRef.current.add(messageId);
        try {
          const estimatedOutputTokens = Math.ceil((message.content || '').length / 4);
          const estimatedInputTokens = Math.ceil(messages.map(m => m.content).join(' ').length / 4);
          
          await saveMessage(
            conversation.id, 'assistant', message.content || '',
            estimatedInputTokens, estimatedOutputTokens, message.toolInvocations
          );

          await loadFiles(conversation.id);
          
          // Refresh content after generation completes
          if (currentRunningTaskId && currentRunningTaskId !== 'context-analysis') {
            await loadContentItems(user.id);
            
            // Auto-switch to preview: fetch the updated content item and update selectedTask
            try {
              const updatedItem = await getContentItemById(currentRunningTaskId);
              if (updatedItem && updatedItem.status === 'generated' && updatedItem.generated_content) {
                setSelectedTask(prev => {
                  if (prev && prev.id === currentRunningTaskId && prev.type === 'page') {
                    return {
                      ...prev,
                      status: 'completed',
                      data: updatedItem,
                    };
                  }
                  return prev;
                });
                console.log(`[onFinish] Auto-switched to preview for task: ${currentRunningTaskId}`);
              }
            } catch (fetchErr) {
              console.error('[onFinish] Failed to fetch updated content item:', fetchErr);
            }
          }
          
          // Refresh contexts after context task completes
          if (currentRunningTaskId === 'context-analysis') {
            await loadSiteContexts(user.id);
            await loadContentItems(user.id);
            setContextTaskStatus('completed');
          }
        } catch (error) {
          console.error('Failed to save message:', error);
        }
      }
      
      // Update task status
      if (currentRunningTaskId === 'context-analysis') {
        setContextTaskStatus('completed');
      }
      setRunningTaskId(null);
      
      // Refresh credits after task completes (in case credits were consumed)
      fetchUserCredits();
    },
  });

  // Update task messages when messages change
  useEffect(() => {
    if (runningTaskId && messages.length > 0) {
      setTaskMessages(prev => {
        const newMap = new Map(prev);
        newMap.set(runningTaskId, [...messages]);
        return newMap;
      });
    }
  }, [messages, runningTaskId]);

  // Sync selectedTask.data with contentItems when contentItems updates
  // This ensures the preview always shows the latest content after regeneration
  useEffect(() => {
    if (selectedTask && selectedTask.type === 'page' && contentItems.length > 0) {
      const updatedItem = contentItems.find(item => item.id === selectedTask.id);
      if (updatedItem) {
        const currentData = selectedTask.data as ContentItem | undefined;
        // Check if the content has actually changed (compare updated_at or generated_content)
        if (currentData?.updated_at !== updatedItem.updated_at || 
            currentData?.generated_content !== updatedItem.generated_content) {
          console.log(`[Sync] Updating selectedTask.data for ${selectedTask.id}, new updated_at: ${updatedItem.updated_at}`);
          setSelectedTask(prev => prev ? {
            ...prev,
            status: updatedItem.status === 'generated' ? 'completed' : prev.status,
            data: updatedItem,
          } : null);
        }
      }
    }
  }, [contentItems, selectedTask?.id]);

  // Auto-exit initialization mode when context acquisition completes
  const wasLoadingRef = useRef(false);
  useEffect(() => {
    // Check if loading just finished (transition from true to false)
    if (wasLoadingRef.current && !isLoading && isInitializing && runningTaskId === 'context-analysis') {
      // Context acquisition completed, exit initialization mode
      console.log('[Initialization] Context acquisition completed, exiting initialization mode');
      setIsInitializing(false);
      setContextTaskStatus('completed');
      setRunningTaskId(null);
      // Refresh data
      if (user) {
        loadSiteContexts(user.id);
        loadContentItems(user.id);
      }
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading, isInitializing, runningTaskId, user]);

  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  
  // Track if project has been initialized
  const projectInitializedRef = useRef<string | null>(null);

  // Auth & Project state
  useEffect(() => {
    if (!projectId) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserCredits(); // Load user credits
        if (projectInitializedRef.current !== projectId) {
          initProject(session.user.id);
          projectInitializedRef.current = projectId;
        }
      } else {
        router.push('/');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        if (projectInitializedRef.current !== projectId) {
          initProject(session.user.id);
          projectInitializedRef.current = projectId;
        }
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
      
      const [convos, items] = await Promise.all([
        loadConversations(userId, projectId),
        loadContentItems(userId),
        loadContentProjects(userId),
      ]);

      // Check if context is empty and auto-initiate
      const hasBrandContext = contexts.some(c => c.type === 'logo');
      const hasContentItems = items && items.length > 0;
      
      // Check if any conversation has messages
      let hasExistingMessages = false;
      if (convos && convos.length > 0) {
        const msgs = await getConversationMessages(convos[0].id);
        hasExistingMessages = msgs.length > 0;
      }
      
      console.log(`[Project-Init] Status: brandContext=${hasBrandContext}, contentItems=${hasContentItems}, messages=${hasExistingMessages}`);
      
      // Project needs initialization if:
      // 1. No brand context AND no messages (fresh project)
      // 2. Has brand context but no content items AND no messages (incomplete initialization)
      const needsInitialization = !hasExistingMessages && (!hasBrandContext || !hasContentItems);
      
      if (needsInitialization) {
        // Check if we already tried to initialize this project in this session
        if (lastInitiatedProjectId.current === projectId) {
          // Already tried to initialize but still incomplete - redirect to projects page
          console.log('[Auto-Initiate] Project data is incomplete after initialization attempt, redirecting to projects...');
          router.push('/projects');
          return;
        }
        
        console.log('[Auto-Initiate] Project needs initialization, triggering context analysis...');
        lastInitiatedProjectId.current = projectId;
        
        // Show full-screen initialization overlay
        setIsInitializing(true);
        // Auto-select context task and start analysis
        setSelectedTask({
          id: 'context-analysis',
          type: 'context',
          title: 'Brand & Context',
          subtitle: 'Initializing...',
          status: 'running',
          data: contexts,
        });
        autoInitiateSiteContext(project.domain, userId, convos?.[0] || null);
      } else {
        setContextTaskStatus('completed');
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
    setContextTaskStatus('running');
    setRunningTaskId('context-analysis');
    
    let conversationToUse = existingConvo;
    if (!conversationToUse) {
      try {
        console.log('[Auto-Initiate] Creating new conversation for context analysis...');
        conversationToUse = await createConversation(userId, projectId, `Context Analysis: ${domain}`);
        setConversations([conversationToUse]);
        updateCurrentConversation(conversationToUse);
      } catch (error) {
        console.error('[Auto-Initiate] Failed to create conversation:', error);
        setContextTaskStatus('error');
        setRunningTaskId(null);
        return;
      }
    } else {
      updateCurrentConversation(conversationToUse);
    }

    const fullUrl = domain.startsWith('http') ? domain : `https://${domain}`;
    const prompt = `[Auto-initiated by system]

I'm starting the Alternative Page planning process for ${fullUrl}. You MUST complete ALL THREE PHASES in ONE continuous execution without stopping or asking for confirmation. Do not pause between phases - execute them sequentially in a single response.

## EXECUTION RULES:
- Complete ALL phases in ONE go - do not wait for user confirmation
- Execute phases sequentially: Phase 1 → Phase 2 → Phase 3
- Do not stop or ask "should I continue?" - just proceed automatically
- Report completion only after ALL phases are done

## PHASE 1: Site Context Collection (use 'acquire_site_context' tool)

Call the 'acquire_site_context' tool ONCE with field="all" to extract:
- Brand assets (logo, favicon, colors, fonts, domain info)
- Header structure and HTML
- Footer structure and HTML

**CRITICAL TOOL PARAMETERS:**
- url: "${fullUrl}"
- field: "all" (MUST be exactly "all", "brand-assets", "header", or "footer" - no other values!)
- userId: (from your context)
- projectId: (from your context)

This is ONE tool call, not multiple. The "all" field extracts everything needed.

## PHASE 2: Competitor Research & Saving (use 'save_site_context' tool)

After Phase 1 completes, identify and save at least 10 competitors:

1. Research competitors in the same industry/market as ${fullUrl}
2. Use web_search if needed to find relevant competitors
3. Call 'save_site_context' tool ONCE with ALL competitors:
   - type: "competitors"
   - content: JSON string array format: [{"name": "Competitor Name", "url": "https://competitor.com"}, ...]
   - userId: (from your context)
   - projectId: (from your context)

## PHASE 3: Page Planning (use 'save_content_items_batch' tool)

After competitors are saved:
1. Use 'web_search' to research "[Competitor] alternative" for top 3-5 competitors
2. Design alternative page strategies with detailed outlines
3. Call 'save_content_items_batch' to save ALL planned pages at once:
   - Set page_type to 'alternative'
   - Set status to 'ready'

## CRITICAL EXECUTION INSTRUCTIONS:
- Execute ALL THREE phases in ONE continuous response
- Phase 1: Call acquire_site_context with field="all" (ONE call)
- Phase 2: Research and save competitors
- Phase 3: Plan and save alternative pages
- Do NOT ask for user confirmation - proceed automatically
- Only report final completion after ALL phases are done

Start executing Phase 1 now with acquire_site_context(url="${fullUrl}", field="all"), then immediately continue to Phase 2 and Phase 3.`;
    
    console.log(`[Auto-Initiate] Sending context acquisition request for: ${fullUrl}`);
    
    try {
      await saveMessage(conversationToUse.id, 'user', prompt, Math.ceil(prompt.length / 4), 0);
      console.log('[Auto-Initiate] User message saved to database');
    } catch (saveError) {
      console.error('[Auto-Initiate] Failed to save user message:', saveError);
    }
    
    setTimeout(() => {
      console.log('[Auto-Initiate] Calling append for brand assets + page planning...');
      append(
        { role: 'user', content: prompt } as any,
        {
          data: {
            userId: userId,
            conversationId: conversationToUse!.id,
            projectId: projectId,
            isAutoInitiated: true,
          } as any,
        }
      ).catch(err => {
        console.error('[Auto-Initiate] Error calling append:', err);
        setContextTaskStatus('error');
        setRunningTaskId(null);
      });
    }, 500);
  };

  // Load data functions
  const loadConversations = async (userId: string, projectId: string) => {
    try {
      const convos = await getUserConversations(userId, projectId);
      setConversations(convos);
      if (convos.length > 0) {
        updateCurrentConversation(convos[0]);
        // Load messages for existing conversations
        const msgs = await getConversationMessages(convos[0].id);
        if (msgs.length > 0) {
          const mappedMessages = msgs.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            toolInvocations: m.tool_invocations,
            annotations: m.annotations,
          }));
          setMessages(mappedMessages);
          // Store in task messages for context task
          setTaskMessages(prev => {
            const newMap = new Map(prev);
            newMap.set('context-analysis', mappedMessages);
            return newMap;
          });
        }
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

  const loadContentItems = async (userId: string): Promise<ContentItem[]> => {
    try {
      // CRITICAL: Filter by projectId to only show current project's content items
      const items = await getUserContentItems(userId, projectId);
      setContentItems(items);
      return items;
    } catch (error) {
      console.error('Failed to load content items:', error);
      return [];
    }
  };

  const loadContentProjects = async (userId: string) => {
    try {
      // CRITICAL: Filter by projectId to only show current project's content projects
      const projects = await getUserContentProjects(userId, projectId);
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

  // Handle page planning based on competitors
  const handlePlanPages = async (competitors?: Array<{ name: string; url: string; description?: string }>) => {
    if (!user) return;
    
    setPlanningPages(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      // Get competitors from context if not provided
      let competitorsToUse = competitors;
      if (!competitorsToUse) {
        const competitorsContext = siteContexts.find(c => c.type === 'competitors');
        try {
          competitorsToUse = competitorsContext?.content ? JSON.parse(competitorsContext.content) : [];
        } catch {
          competitorsToUse = [];
        }
      }

      if (!competitorsToUse || competitorsToUse.length === 0) {
        setToast({ isOpen: true, message: 'No competitors found. Please add competitors first.' });
        return;
      }

      // Get brand name from domain
      const logoContext = siteContexts.find(c => c.type === 'logo');
      const domainName = (logoContext as any)?.domain_name || currentProject?.domain || '';
      const brandName = domainName.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split('.')[0];
      const capitalizedBrandName = brandName.charAt(0).toUpperCase() + brandName.slice(1);

      console.log(`[PlanPages] Planning pages for ${competitorsToUse.length} competitors, brand: ${capitalizedBrandName}`);

      const response = await fetch('/api/context-acquisition/competitors/create-pages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          projectId,
          brandName: capitalizedBrandName,
          competitors: competitorsToUse,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create pages');
      }

      console.log(`[PlanPages] Result:`, result);

      // Refresh content items to show new pages
      await loadContentItems(user.id);

      if (result.created > 0) {
        setToast({ isOpen: true, message: `Created ${result.created} new page plan${result.created > 1 ? 's' : ''}!` });
      } else if (result.skipped > 0) {
        setToast({ isOpen: true, message: 'All competitors already have page plans.' });
      }
    } catch (error: any) {
      console.error('Failed to plan pages:', error);
      setToast({ isOpen: true, message: error.message || 'Failed to plan pages' });
    } finally {
      setPlanningPages(false);
    }
  };

  const handleDeleteCluster = async () => {
    if (!deletingCluster || !user) return;
    try {
      await deleteContentProject(deletingCluster.id);
      setContentProjects(prev => prev.filter(p => p.id !== deletingCluster.id));
      setContentItems(prev => prev.filter(i => i.project_id !== deletingCluster.id));
      setDeletingCluster(null);
    } catch (error) {
      console.error('Failed to delete cluster:', error);
      alert('Failed to delete cluster. Please try again.');
    }
  };

  const handleDeleteContentItem = async () => {
    if (!deletingContentItem || !user) return;
    try {
      await deleteContentItem(deletingContentItem.id);
      setContentItems(prev => prev.filter(i => i.id !== deletingContentItem.id));
      setDeletingContentItem(null);
    } catch (error) {
      console.error('Failed to delete content item:', error);
      alert('Failed to delete item. Please try again.');
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

  // Handle task selection
  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    
    // Load messages for this task
    if (task.type === 'context') {
      const contextMessages = taskMessages.get('context-analysis') || [];
      if (contextMessages.length > 0) {
        setMessages(contextMessages);
      }
    } else {
      const pageMessages = taskMessages.get(task.id) || [];
      setMessages(pageMessages);
    }
  };

  // Handle page generation
  const handleGeneratePage = async (item: ContentItem) => {
    if (!user || !currentConversation || isLoading) return;
    
    // Check if this is a regeneration (page already has content)
    const isRegenerate = item.status === 'generated' || !!item.generated_content;
    
    // Set running state
    setRunningTaskId(item.id);
    setSelectedTask({
      id: item.id,
      type: 'page',
      title: item.title,
      subtitle: item.target_keyword || '',
      status: 'running',
      data: item,
    });
    
    // Clear messages for new task
    setMessages([]);
    
    const generateMessage = isRegenerate 
      ? `REGENERATE the alternative page for content item: ${item.id}

IMPORTANT: This is a FULL REGENERATION request. You MUST:
1. Execute the COMPLETE workflow from scratch
2. Research competitor information again (web_search, perplexity_search)
3. Generate ALL new content sections
4. DO NOT skip any steps just because the page already has content
5. Ignore any existing generated_content - create everything fresh

Page Details:
- Title: ${item.title}
- Target Keyword: ${item.target_keyword || 'N/A'}
- Page Type: ${item.page_type || 'alternative'}

Execute the FULL page generation workflow. Do NOT take shortcuts.`
      : `Generate the alternative page for content item: ${item.id}

Page Details:
- Title: ${item.title}
- Target Keyword: ${item.target_keyword || 'N/A'}
- Page Type: ${item.page_type || 'alternative'}

Execute the full page generation workflow.`;

    try {
      await saveMessage(currentConversation.id, 'user', generateMessage, Math.ceil(generateMessage.length / 4), 0);
      
      await append(
        { role: 'user', content: generateMessage } as any,
        {
          data: {
            userId: user.id,
            conversationId: currentConversation.id,
            projectId: projectId,
            attachedContentItems: [{
              id: item.id,
              title: item.title,
              page_type: item.page_type,
              target_keyword: item.target_keyword,
              status: item.status,
            }],
          } as any,
        }
      );
    } catch (error) {
      console.error('Failed to generate page:', error);
      setRunningTaskId(null);
      setToast({ isOpen: true, message: 'Failed to start generation' });
    }
  };

  // Get messages for current task
  const getCurrentTaskMessages = () => {
    if (!selectedTask) return [];
    if (selectedTask.type === 'context') {
      return taskMessages.get('context-analysis') || messages;
    }
    return taskMessages.get(selectedTask.id) || messages;
  };

  // Handle initialization complete
  const handleInitializationComplete = async () => {
    setIsInitializing(false);
    setContextTaskStatus('completed');
    // Refresh site contexts after initialization
    if (user) {
      await loadSiteContexts(user.id);
      await loadContentItems(user.id);
    }
  };

  // Show initialization overlay if in initialization mode
  if (isInitializing && currentProject) {
    return (
      <SiteInitializationOverlay
        domain={currentProject.domain}
        messages={messages}
        isLoading={isLoading}
        onComplete={handleInitializationComplete}
      />
    );
  }

  return (
    <div className="h-screen bg-[#FAFAFA] flex flex-col p-2 gap-2">
      {user && (
        <TopBar 
          user={user}
          onDomainsClick={() => setIsDomainsOpen(true)}
          credits={userCredits}
          subscriptionTier={subscriptionTier}
        />
      )}

      <div className="flex-1 flex overflow-hidden gap-2">
        {/* Left: Task List */}
        {user && (
          <TaskList
            siteContexts={siteContexts}
            contentItems={contentItems}
            contentProjects={contentProjects}
            selectedTaskId={selectedTask?.id || null}
            runningTaskId={runningTaskId}
            onSelectTask={handleSelectTask}
            onGeneratePage={handleGeneratePage}
            onRefreshContent={async () => {
              setRefreshingContent(true);
              await loadContentItems(user.id);
              setRefreshingContent(false);
            }}
            onRefreshSiteContexts={async () => {
              setRefreshingSiteContexts(true);
              await loadSiteContexts(user.id);
              setRefreshingSiteContexts(false);
            }}
            onRefreshBrandAssets={async () => {
              setRefreshingBrandAssets(true);
              await loadSiteContexts(user.id);
              setRefreshingBrandAssets(false);
            }}
            onRefreshCompetitors={async () => {
              setRefreshingCompetitors(true);
              await loadSiteContexts(user.id);
              setRefreshingCompetitors(false);
            }}
            onOpenBrandAssetsModal={() => setIsContextModalOpen(true)}
            onOpenCompetitorsModal={() => setIsCompetitorsModalOpen(true)}
            isRefreshingSiteContexts={refreshingSiteContexts}
            isRefreshingBrandAssets={refreshingBrandAssets}
            isRefreshingCompetitors={refreshingCompetitors}
            isRefreshingContent={refreshingContent}
            isPlanningPages={planningPages}
            contextTaskStatus={contextTaskStatus}
            credits={userCredits}
            projectDomain={currentProject?.domain}
          />
        )}

        {/* Right: Task Detail Panel */}
        {initialLoading ? (
          <div className="flex-1 flex items-center justify-center bg-white rounded-lg border border-[#E5E5E5]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : (
          <TaskDetailPanel
            task={selectedTask}
            messages={getCurrentTaskMessages()}
            isLoading={isLoading && runningTaskId === selectedTask?.id}
            userId={user?.id}
            conversationId={currentConversation?.id}
            files={files}
            onUploadSuccess={() => loadFiles(currentConversation?.id || null)}
            onPreviewContentItem={async (itemId) => {
              try {
                const item = await getContentItemById(itemId);
                if (item) {
                  setSelectedContentItem(item);
                } else {
                  setToast({ isOpen: true, message: 'Content item not found' });
                }
              } catch (error) {
                console.error('Failed to load content item:', error);
                setToast({ isOpen: true, message: 'Failed to load content item' });
              }
            }}
            onRegenerate={(item) => handleGeneratePage(item)}
            onContentUpdate={(itemId, newContent) => {
              // Update contentItems state with the new content
              setContentItems(prev => prev.map(item => 
                item.id === itemId 
                  ? { ...item, generated_content: newContent, updated_at: new Date().toISOString() }
                  : item
              ));
              // Also update selectedTask if it's the same item
              if (selectedTask && selectedTask.id === itemId) {
                setSelectedTask(prev => prev ? {
                  ...prev,
                  data: { ...(prev.data as ContentItem), generated_content: newContent, updated_at: new Date().toISOString() }
                } : null);
              }
            }}
            isRegenerating={runningTaskId === selectedTask?.id && isLoading}
          />
        )}
      </div>

      {/* Modals */}
      {isContextModalOpen && (
        <ContextModalNew
          isOpen={isContextModalOpen}
          onClose={() => setIsContextModalOpen(false)}
          siteContexts={siteContexts}
          onSave={handleSaveSiteContext}
          onRefresh={async () => {
            if (user) await loadSiteContexts(user.id);
          }}
          projectId={projectId}
        />
      )}

      {isCompetitorsModalOpen && (
        <CompetitorsModal
          isOpen={isCompetitorsModalOpen}
          onClose={() => setIsCompetitorsModalOpen(false)}
          siteContexts={siteContexts}
          onSave={handleSaveSiteContext}
          onRefresh={async () => {
            if (user) await loadSiteContexts(user.id);
          }}
          projectId={projectId}
          onPlanPages={handlePlanPages}
        />
      )}

      <DomainsModal isOpen={isDomainsOpen} onClose={() => setIsDomainsOpen(false)} />
      <ContentDrawer item={selectedContentItem} onClose={() => setSelectedContentItem(null)} />
      <Toast isOpen={toast.isOpen} message={toast.message} onClose={() => setToast(p => ({ ...p, isOpen: false }))} />
      
      {deletingCluster && (
        <ConfirmModal
          title="Delete Cluster"
          message={`Are you sure you want to delete "${deletingCluster.name}"? This will permanently remove all pages in this cluster.`}
          confirmText="Delete Cluster"
          onConfirm={handleDeleteCluster}
          onCancel={() => setDeletingCluster(null)}
          isDangerous={true}
        />
      )}
      
      {deletingContentItem && (
        <ConfirmModal
          title="Delete Page"
          message={`Are you sure you want to delete "${deletingContentItem.name}"? This action cannot be undone.`}
          confirmText="Delete Page"
          onConfirm={handleDeleteContentItem}
          onCancel={() => setDeletingContentItem(null)}
          isDangerous={true}
        />
      )}
    </div>
  );
}
