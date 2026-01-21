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
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';

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
  const [refreshingContent, setRefreshingContent] = useState(false);
  const [selectedContentItem, setSelectedContentItem] = useState<ContentItem | null>(null);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
  const [isDomainsOpen, setIsDomainsOpen] = useState(false);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [contextModalInitialTab, setContextModalInitialTab] = useState<'onsite' | 'knowledge'>('onsite');
  
  // Task state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [contextTaskStatus, setContextTaskStatus] = useState<TaskStatus>('pending');
  const [taskMessages, setTaskMessages] = useState<Map<string, any[]>>(new Map());
  
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
      let errorMessage = `❌ Error: ${error.message || 'An unexpected error occurred. Please try again.'}`;
      
      const errorMsg = {
        id: `error-${Date.now()}`,
        role: 'assistant' as const,
        content: errorMessage,
      };
      
      setMessages(prev => [...prev, errorMsg as any]);
      
      // Update task messages
      if (runningTaskId) {
        setTaskMessages(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(runningTaskId) || [];
          newMap.set(runningTaskId, [...existing, errorMsg]);
          return newMap;
        });
      }
      
      // Update task status
      if (runningTaskId === 'context-analysis') {
        setContextTaskStatus('error');
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
      const currentRunningTaskId = runningTaskId; // Capture before clearing
      
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
      
      const [convos] = await Promise.all([
        loadConversations(userId, projectId),
        loadContentItems(userId),
        loadContentProjects(userId),
      ]);

      // Check if context is empty and auto-initiate
      const hasBrandContext = contexts.some(c => c.type === 'logo');
      
      if (!hasBrandContext && lastInitiatedProjectId.current !== projectId) {
        console.log('[Auto-Initiate] No brand context found, triggering context analysis...');
        lastInitiatedProjectId.current = projectId;
        
        // Check if any conversation has messages
        let hasExistingMessages = false;
        if (convos && convos.length > 0) {
          const msgs = await getConversationMessages(convos[0].id);
          hasExistingMessages = msgs.length > 0;
        }

        if (!hasExistingMessages) {
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

## PHASE 1: Brand Assets Collection (use 'acquire_context_field' tool)
Collect and save the following brand assets to the database:
- 'brand-assets' → Logo, colors, fonts, metadata
- 'about-us' → Company story, mission, values  
- 'products-services' → Product/service offerings
- 'who-we-serve' → Target audience
- 'contact-info' → Email, phone, social links
- 'faq' → Frequently asked questions
- 'social-proof' → Testimonials, reviews, awards

Execute these in parallel batches for efficiency. Each field call requires: url="${fullUrl}", userId, projectId.

## PHASE 2: Competitor Research & Saving (CRITICAL: use ONLY 'save_site_context' tool)
After analyzing the website, identify and save at least 10 competitors to the BRAND ASSETS database:

**CRITICAL INSTRUCTIONS:**
- You MUST use the 'save_site_context' tool (NOT 'save_content_item' or 'save_content_items_batch')
- This saves to site_contexts table (Brand Assets), NOT to content_items table
- DO NOT create a content page or save to any cluster/project
- This is part of Brand Assets collection, just like logo, colors, etc.

Steps:
1. Research competitors in the same industry/market as ${fullUrl}
2. Find competitors offering similar products/services
3. Use web search or your knowledge to find at least 10 competitors
4. For each competitor, collect:
   - Competitor name (company/product name)
   - Competitor website URL (full URL with https://)
5. Call 'save_site_context' tool ONCE with ALL competitors:
   - type: 'competitors' (exactly this string)
   - content: JSON string of array format: [{"name": "Competitor Name", "url": "https://competitor.com"}, ...]
   - userId: (pass the userId from your context)
   - projectId: (pass the projectId from your context)
   
   Example content format (must be valid JSON string):
   [{"name": "Competitor 1", "url": "https://competitor1.com"}, {"name": "Competitor 2", "url": "https://competitor2.com"}, ...]

**VERY IMPORTANT:**
- You must find and save at least 10 competitors
- Use web search if needed to find relevant competitors
- DO NOT use save_content_item or save_content_items_batch - those save to content library, not brand assets
- The competitors list should appear in Brand Assets modal, not in Page Blueprint section

## PHASE 3: Page Planning (use 'web_search' and 'save_content_items_batch' tools)
After competitors are saved:
1. Use 'web_search' to research "[Competitor] alternative" for top 3-5 competitors
2. Design alternative page strategies with:
   - Page title: "[Your Brand] vs [Competitor]: The Best Alternative"
   - Target keyword: "[Competitor] alternative"
   - Key differentiators to highlight
   - Target audience segments
3. Create detailed content outlines for each page:
   - H1: Main comparison headline
   - H2s: Why switch, Feature comparison, User results, FAQ, Get Started
   - H3s: Specific subtopics under each section
4. **CRITICAL**: Call 'save_content_items_batch' to save ALL planned pages at once
   - This creates content_items records with proper UUIDs
   - Set page_type to 'alternative'
   - Set status to 'ready'
   - The returned item_ids are the UUIDs you need for page generation later

## CRITICAL EXECUTION INSTRUCTIONS:
- Execute ALL THREE phases in ONE continuous response
- Do NOT stop after Phase 1 or Phase 2 - continue immediately to the next phase
- Do NOT ask for user confirmation - proceed automatically
- Complete Phase 1 → immediately proceed to Phase 2 → immediately proceed to Phase 3
- Only report final completion after ALL phases are done

Start executing Phase 1 now, then immediately continue to Phase 2 and Phase 3 without stopping.`;
    
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
    
    const generateMessage = `Generate the alternative page for content item: ${item.id}

Page Details:
- Title: ${item.title}
- Target Keyword: ${item.target_keyword || 'N/A'}
- Page Type: ${item.page_type || 'alternative'}

Execute the full page generation workflow using the V2 skill.`;

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

  return (
    <div className="h-screen bg-[#FAFAFA] flex flex-col p-2 gap-2">
      {user && (
        <TopBar 
          user={user}
          onDomainsClick={() => setIsDomainsOpen(true)}
          showBackToProjects={true}
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
            onOpenContextModal={(tab) => {
              setContextModalInitialTab(tab || 'onsite');
              setIsContextModalOpen(true);
            }}
            isRefreshingSiteContexts={refreshingSiteContexts}
            isRefreshingContent={refreshingContent}
            contextTaskStatus={contextTaskStatus}
            credits={userCredits}
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
          projectId={projectId}
          initialTab={contextModalInitialTab}
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
