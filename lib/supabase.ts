import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

const isMissingConfig = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (isMissingConfig && typeof window !== 'undefined') {
  console.warn('⚠️ Supabase environment variables are missing. Auth features will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const isSupabaseConfigured = !isMissingConfig;

/**
 * Creates a Supabase client with service role key to bypass RLS.
 * ONLY use this in Server Components or API Routes.
 */
export function getServiceSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Database types
export interface Conversation {
  id: string;
  user_id: string;
  project_id?: string | null; // Scope conversation to an SEO project
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  tavily_calls?: number;
  semrush_calls?: number;
  is_showcase?: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  tokens_input: number;
  tokens_output: number;
  created_at: string;
  tool_invocations?: any;
  attached_files?: any;
  attached_content_items?: any;
  annotations?: any;
}

export interface FileRecord {
  id: string;
  user_id: string;
  conversation_id: string | null;
  filename: string;
  original_filename: string;
  file_type: 'csv' | 'json' | 'txt' | 'other';
  mime_type: string;
  file_size: number;
  storage_path: string;
  public_url: string | null;
  metadata: any;
  created_at: string;
}

export interface ContentItem {
  id: string;
  user_id: string;
  seo_project_id: string | null; // Links to seo_projects (domain)
  project_id: string | null; // Links to content_projects (Topic Cluster)
  title: string;
  slug: string;
  page_type: 'alternative' | 'blog' | 'landing_page' | 'comparison' | 'guide' | 'listicle';
  target_keyword: string;
  seo_title: string;
  seo_description: string;
  keyword_data: any;
  outline: any;
  serp_insights: any;
  reference_urls: string[];
  internal_links: any[] | null;
  status: 'ready' | 'in_production' | 'generated' | 'published' | 'archived';
  priority?: number;
  estimated_word_count: number;
  tags: string[];
  notes: string;
  generated_content: string | null;
  published_domain: string | null;
  published_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentProject {
  id: string;
  user_id: string;
  seo_project_id: string | null; // Links to seo_projects (domain)
  name: string;
  description: string;
  created_at: string;
}

export interface SiteContext {
  id: string;
  user_id: string;
  type: 'logo' | 'header' | 'footer' | 'competitors';
  content: string | null; // JSON config for editors (header/footer config, competitors list)
  html?: string | null; // Generated HTML content (for header/footer)
  // Logo & Favicon (simplified - single field each)
  logo_url?: string | null;
  favicon_url?: string | null;
  // Legacy fields (for backward compatibility)
  logo_light_url?: string | null;
  file_url?: string | null;
  // Brand settings
  domain_name?: string | null;
  og_image?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  heading_font?: string | null;
  body_font?: string | null;
  languages?: string | null;
  // Project scoping
  project_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SEOProject {
  id: string;
  user_id: string;
  domain: string;
  created_at: string;
  updated_at: string;
}

// Structured content interfaces for different context types
export interface HeroSectionContent {
  headline?: string;
  subheadline?: string;
  callToAction?: string;
  media?: string;
  metrics?: string;
}

export interface SocialProofContent {
  testimonials?: string;
  caseStudies?: string;
  badges?: string;
  awards?: string;
  guarantees?: string;
  integrations?: string;
}

export interface AboutUsContent {
  companyStory?: string;
  missionVision?: string;
  coreValues?: string;
}

export interface ContactInformationContent {
  primaryContact?: string;
  locationHours?: string;
  supportChannels?: string;
  additional?: string;
}

export interface MessageFeedback {
  id: string;
  message_id: string;
  user_id: string;
  conversation_id: string;
  feedback_type: 'like' | 'dislike';
  reason: string;
  message_content: string | null;
  created_at: string;
}

// Helper function to deeply clean tool invocations and remove large data
// Helper functions
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  tokensInput: number = 0,
  tokensOutput: number = 0,
  toolInvocations?: any,
  attachedFiles?: any,
  attachedContentItems?: any,
  annotations?: any
) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
      tool_invocations: toolInvocations || null,
      attached_files: attachedFiles || null,
      attached_content_items: attachedContentItems || null,
      annotations: annotations || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getConversationMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Message[];
}

export async function getUserConversations(userId: string, projectId?: string) {
  let query = supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId);
  
  if (projectId) {
    query = query.eq('project_id', projectId);
  } else {
    // For global conversations or non-scoped ones
    query = query.is('project_id', null);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) throw error;
  return data as Conversation[];
}

export async function getConversationById(id: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Conversation;
}

export async function createConversation(userId: string, projectId?: string, title: string = 'New Conversation') {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      project_id: projectId || null,
      title,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Conversation;
}

export async function updateConversationTitle(conversationId: string, title: string, description?: string) {
  const updateData: any = { title, updated_at: new Date().toISOString() };
  if (description !== undefined) {
    updateData.description = description;
  }
  
  const { error } = await supabase
    .from('conversations')
    .update(updateData)
    .eq('id', conversationId);

  if (error) throw error;
}

export async function toggleConversationShowcase(conversationId: string, isShowcase: boolean) {
  const { error } = await supabase
    .from('conversations')
    .update({ is_showcase: isShowcase, updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) throw error;
}

export async function deleteConversation(conversationId: string) {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId);

  if (error) throw error;
}

export async function getConversationTokenStats(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('tokens_input, tokens_output')
    .eq('conversation_id', conversationId);

  if (error) throw error;

  const totalInput = data.reduce((sum, msg) => sum + (msg.tokens_input || 0), 0);
  const totalOutput = data.reduce((sum, msg) => sum + (msg.tokens_output || 0), 0);
  const totalTokens = totalInput + totalOutput;

  // Gemini 2.5 Flash pricing (per 1M tokens, under 128k context)
  // Input: $0.075, Output: $0.30
  const cost = (totalInput * 0.075 / 1000000) + (totalOutput * 0.30 / 1000000);

  return {
    inputTokens: totalInput,
    outputTokens: totalOutput,
    totalTokens,
    cost,
  };
}

// Increment API call counters
export async function incrementTavilyCalls(conversationId: string) {
  const { error } = await supabase.rpc('increment_tavily', { 
    conversation_id: conversationId 
  });
  
  // Fallback if RPC doesn't exist
  if (error) {
    const { data: conv } = await supabase
      .from('conversations')
      .select('tavily_calls')
      .eq('id', conversationId)
      .single();
    
    const currentCount = conv?.tavily_calls || 0;
    
    await supabase
      .from('conversations')
      .update({ tavily_calls: currentCount + 1 })
      .eq('id', conversationId);
  }
}

export async function incrementSemrushCalls(conversationId: string) {
  const { error } = await supabase.rpc('increment_semrush', { 
    conversation_id: conversationId 
  });
  
  // Fallback if RPC doesn't exist
  if (error) {
    const { data: conv } = await supabase
      .from('conversations')
      .select('semrush_calls')
      .eq('id', conversationId)
      .single();
    
    const currentCount = conv?.semrush_calls || 0;
    
    await supabase
      .from('conversations')
      .update({ semrush_calls: currentCount + 1 })
      .eq('id', conversationId);
  }
}

export async function incrementSerperCalls(conversationId: string) {
  const { error } = await supabase.rpc('increment_serper', { 
    conversation_id: conversationId 
  });
  
  // Fallback if RPC doesn't exist
  if (error) {
    const { data: conv } = await supabase
      .from('conversations')
      .select('serper_calls')
      .eq('id', conversationId)
      .single();
    
    const currentCount = conv?.serper_calls || 0;
    
    await supabase
      .from('conversations')
      .update({ serper_calls: currentCount + 1 })
      .eq('id', conversationId);
  }
}

// Get API call statistics
export async function getConversationApiStats(conversationId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('tavily_calls, semrush_calls, serper_calls')
    .eq('id', conversationId)
    .single();

  if (error) throw error;

  console.log('[getConversationApiStats] data:', data);

  return {
    tavilyCalls: data?.tavily_calls || 0,
    semrushCalls: data?.semrush_calls || 0,
    serperCalls: data?.serper_calls || 0,
  };
}

// File management functions
// Note: This function should be called from client-side with authenticated supabase client
export async function uploadFileToStorage(
  userId: string,
  conversationId: string | null,
  filename: string,
  content: string,
  mimeType: string,
  metadata?: any,
  existingFileId?: string
): Promise<FileRecord> {
  console.log('[uploadFileToStorage] ========================================');
  console.log('[uploadFileToStorage] Starting upload', { existingFileId });
  console.log('[uploadFileToStorage] Params:', {
    userId,
    conversationId,
    filename,
    mimeType,
    contentLength: content?.length,
    metadata
  });
  
  // Determine file type from mime type or filename
  let fileType: 'csv' | 'json' | 'txt' | 'other' = 'other';
  if (mimeType.includes('csv') || filename.endsWith('.csv')) fileType = 'csv';
  else if (mimeType.includes('json') || filename.endsWith('.json')) fileType = 'json';
  else if (mimeType.includes('markdown') || filename.endsWith('.md')) fileType = 'txt'; // Markdown as txt
  else if (mimeType.includes('text') || filename.endsWith('.txt')) fileType = 'txt';
  else if (filename.endsWith('.docx') || filename.endsWith('.doc')) fileType = 'other'; // Back to other, but ensure other is handled
  
  console.log('[uploadFileToStorage] Determined fileType:', fileType);

  // Handle Base64 content - many tools return Base64 for images or files
  // We try to decode if it looks like base64, regardless of type, 
  // as long as it doesn't look like raw JSON/CSV text
  // Base64 regex that handles optional padding and multiple of 4 length
  const looksLikeBase64 = typeof content === 'string' && 
    content.length > 0 && 
    !content.startsWith('{') && 
    !content.includes('\n') &&
    !content.includes(',') && 
    /^[A-Za-z0-9+/=]+$/.test(content.trim());
  
  // Create a blob from content
  let blob: Blob;
  if (looksLikeBase64) {
    try {
      // Modern and more robust way to convert base64 to blob/Uint8Array
      const binaryString = atob(content.trim());
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: mimeType });
      console.log('[uploadFileToStorage] Decoded content from Base64 successfully');
    } catch (e) {
      console.warn('[uploadFileToStorage] atob failed, using raw content as blob', e);
      blob = new Blob([content], { type: mimeType });
    }
  } else {
    blob = new Blob([content], { type: mimeType });
  }

  const fileSize = blob.size;

  // Determine storage path
  let storagePath: string = '';
  let fileIdToUse = existingFileId;

  if (!fileIdToUse && conversationId) {
    // Check if file with same name exists in this conversation
    const { data: existingFile } = await supabase
      .from('files')
      .select('id, storage_path')
      .eq('conversation_id', conversationId)
      .eq('filename', filename)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (existingFile) {
      fileIdToUse = existingFile.id;
      storagePath = existingFile.storage_path;
      console.log('[uploadFileToStorage] Found existing file by name, will update:', { fileIdToUse, storagePath });
    }
  }

  if (fileIdToUse) {
    // If we have an ID but not a storage path yet, fetch it
    if (!storagePath) {
      const { data: fileData } = await supabase
        .from('files')
        .select('storage_path')
        .eq('id', fileIdToUse)
        .single();
      storagePath = fileData?.storage_path || '';
    }
    
    if (storagePath) {
      console.log('[uploadFileToStorage] Reusing existing storage path:', storagePath);
    } else {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      storagePath = `${userId}/${timestamp}-${randomId}-${filename}`;
      console.log('[uploadFileToStorage] Existing file record storage path not found, generated new:', storagePath);
    }
  } else {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    storagePath = `${userId}/${timestamp}-${randomId}-${filename}`;
    console.log('[uploadFileToStorage] Generated new storage path:', storagePath);
  }

  // Upload to Supabase Storage (using client-side supabase with auth)
  console.log('[uploadFileToStorage] Uploading to Supabase Storage...');
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('files')
    .upload(storagePath, blob, {
      contentType: mimeType,
      upsert: true, // Always allow upsert if path is known
    });

  if (uploadError) {
    console.error('[uploadFileToStorage] ❌ Storage upload error:', uploadError);
    throw uploadError;
  }
  
  console.log('[uploadFileToStorage] ✅ Storage upload successful:', uploadData);

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('files')
    .getPublicUrl(storagePath);

  console.log('[uploadFileToStorage] Public URL:', urlData.publicUrl);

  // Save or update file record in database
  let fileRecord;
  let dbError;

  if (fileIdToUse) {
    console.log('[uploadFileToStorage] Updating existing record:', fileIdToUse);
    const { data: updatedRecord, error: updateError } = await supabase
      .from('files')
      .update({
        file_size: fileSize,
        public_url: urlData.publicUrl,
        metadata: metadata || null,
        created_at: new Date().toISOString() // Update timestamp to show it's fresh
      })
      .eq('id', fileIdToUse)
      .select()
      .single();
    
    fileRecord = updatedRecord;
    dbError = updateError;
  } else {
    const fileRecordToInsert = {
      user_id: userId,
      conversation_id: conversationId,
      filename,
      original_filename: filename,
      file_type: fileType,
      mime_type: mimeType,
      file_size: fileSize,
      storage_path: storagePath,
      public_url: urlData.publicUrl,
      metadata: metadata || null,
    };
    
    console.log('[uploadFileToStorage] Inserting new file record:', fileRecordToInsert);
    const { data: insertedRecord, error: insertError } = await supabase
      .from('files')
      .insert(fileRecordToInsert)
      .select()
      .single();
    
    fileRecord = insertedRecord;
    dbError = insertError;
  }

  if (dbError) {
    console.error('[uploadFileToStorage] ❌ Database error:', dbError);
    throw dbError;
  }

  console.log('[uploadFileToStorage] ✅ File record saved:', fileRecord.id);
  console.log('[uploadFileToStorage] ========================================');

  return fileRecord as FileRecord;
}

export async function getUserFiles(userId: string): Promise<FileRecord[]> {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as FileRecord[];
}

export async function getConversationFiles(conversationId: string): Promise<FileRecord[]> {
  console.log('[getConversationFiles] Querying files for conversation:', conversationId);
  
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getConversationFiles] ❌ Query error:', error);
    throw error;
  }
  
  console.log('[getConversationFiles] ✅ Found', data?.length || 0, 'files');
  if (data && data.length > 0) {
    data.forEach((file, idx) => {
      console.log(`[getConversationFiles] File ${idx + 1}:`, {
        id: file.id,
        filename: file.filename,
        fileType: file.file_type,
        conversationId: file.conversation_id
      });
    });
  }
  
  return data as FileRecord[];
}

export async function getUserContentItems(userId: string, seoProjectId?: string): Promise<ContentItem[]> {
  // Use API route to fetch content items (bypasses RLS issues)
  // This ensures fresh data is always returned after tool operations
  try {
    const params = new URLSearchParams({ user_id: userId });
    if (seoProjectId) {
      params.append('project_id', seoProjectId); // API expects project_id for SEO project filtering
    }
    
    const response = await fetch(`/api/content/items?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store', // Ensure fresh data
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch content items: ${response.statusText}`);
    }
    
    const { items, error } = await response.json();
    if (error) throw new Error(error);
    
    return items as ContentItem[];
  } catch (fetchError) {
    // Fallback to direct Supabase query if API fails
    console.warn('API fetch failed, falling back to direct query:', fetchError);
    let query = supabase
      .from('content_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    // Filter by SEO project (seo_project_id)
    if (seoProjectId) {
      query = query.eq('seo_project_id', seoProjectId);
    }
    
    const { data, error } = await query;

    if (error) throw error;
    return data as ContentItem[];
  }
}

export async function getUserContentProjects(userId: string, seoProjectId?: string): Promise<ContentProject[]> {
  // Use API route to fetch content projects (bypasses RLS issues)
  try {
    const params = new URLSearchParams({ user_id: userId });
    if (seoProjectId) {
      params.append('project_id', seoProjectId); // API expects project_id param for SEO project filtering
    }
    
    const response = await fetch(`/api/content/projects?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store', // Ensure fresh data
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch content projects: ${response.statusText}`);
    }
    
    const { projects, error } = await response.json();
    if (error) throw new Error(error);
    
    return projects as ContentProject[];
  } catch (fetchError) {
    // Fallback to direct Supabase query if API fails
    console.warn('API fetch failed, falling back to direct query:', fetchError);
    let query = supabase
      .from('content_projects')
      .select('*')
      .eq('user_id', userId);
    
    // Filter by SEO project ID (seo_project_id column)
    if (seoProjectId) {
      query = query.eq('seo_project_id', seoProjectId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data as ContentProject[];
  }
}

// SEO Projects (Domain-based)

export async function getSEOProjects(userId: string): Promise<SEOProject[]> {
  const { data, error } = await supabase
    .from('seo_projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getSEOProjectById(projectId: string): Promise<SEOProject | null> {
  const { data, error } = await supabase
    .from('seo_projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
}

export async function createSEOProject(userId: string, domain: string): Promise<SEOProject> {
  // Normalize domain: remove protocol if present, trim whitespace
  let normalizedDomain = domain.trim().toLowerCase();
  if (normalizedDomain.startsWith('http://')) normalizedDomain = normalizedDomain.slice(7);
  if (normalizedDomain.startsWith('https://')) normalizedDomain = normalizedDomain.slice(8);
  if (normalizedDomain.endsWith('/')) normalizedDomain = normalizedDomain.slice(0, -1);

  const { data, error } = await supabase
    .from('seo_projects')
    .insert({
      user_id: userId,
      domain: normalizedDomain,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSEOProject(projectId: string): Promise<void> {
  // CRITICAL: Cascade delete all related data
  // Order matters due to foreign key constraints
  
  console.log(`[deleteSEOProject] Starting cascade delete for project: ${projectId}`);
  
  // 1. First, get all conversations for this project to delete their messages
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id')
    .eq('project_id', projectId);
  
  if (conversations && conversations.length > 0) {
    const conversationIds = conversations.map(c => c.id);
    
    // Delete messages for all conversations
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .in('conversation_id', conversationIds);
    
    if (messagesError) {
      console.error('[deleteSEOProject] Failed to delete messages:', messagesError);
    } else {
      console.log(`[deleteSEOProject] Deleted messages for ${conversationIds.length} conversations`);
    }
    
    // Delete conversations
    const { error: conversationsError } = await supabase
      .from('conversations')
      .delete()
      .eq('project_id', projectId);
    
    if (conversationsError) {
      console.error('[deleteSEOProject] Failed to delete conversations:', conversationsError);
    } else {
      console.log(`[deleteSEOProject] Deleted ${conversationIds.length} conversations`);
    }
  }
  
  // 2. Delete content_items
  const { error: itemsError } = await supabase
    .from('content_items')
    .delete()
    .eq('project_id', projectId);
  
  if (itemsError) {
    console.error('[deleteSEOProject] Failed to delete content_items:', itemsError);
  } else {
    console.log('[deleteSEOProject] Deleted content_items');
  }
  
  // 3. Delete content_projects
  const { error: projectsError } = await supabase
    .from('content_projects')
    .delete()
    .eq('project_id', projectId);
  
  if (projectsError) {
    console.error('[deleteSEOProject] Failed to delete content_projects:', projectsError);
  } else {
    console.log('[deleteSEOProject] Deleted content_projects');
  }
  
  // 4. Delete site_contexts
  const { error: contextsError } = await supabase
    .from('site_contexts')
    .delete()
    .eq('project_id', projectId);
  
  if (contextsError) {
    console.error('[deleteSEOProject] Failed to delete site_contexts:', contextsError);
  } else {
    console.log('[deleteSEOProject] Deleted site_contexts');
  }
  
  // 5. Finally, delete the project itself
  const { error } = await supabase
    .from('seo_projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
  
  console.log(`[deleteSEOProject] Successfully deleted project and all related data: ${projectId}`);
}

export async function getContentItemById(itemId: string): Promise<ContentItem | null> {
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', itemId)
    .single();

  if (error) return null;
  return data as ContentItem;
}

export async function deleteFile(fileId: string, storagePath: string): Promise<void> {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('files')
    .remove([storagePath]);

  if (storageError) {
    console.error('Storage deletion error:', storageError);
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('files')
    .delete()
    .eq('id', fileId);

  if (dbError) throw dbError;
}

export async function deleteContentItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('content_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}

export async function deleteContentProject(projectId: string): Promise<void> {
  // First delete all items in this project
  const { error: itemsError } = await supabase
    .from('content_items')
    .delete()
    .eq('project_id', projectId);

  if (itemsError) throw itemsError;

  // Then delete the project itself
  const { error: projectError } = await supabase
    .from('content_projects')
    .delete()
    .eq('id', projectId);

  if (projectError) throw projectError;
}

// Site Context functions
export async function getSiteContexts(userId: string, projectId?: string): Promise<SiteContext[]> {
  let query = supabase
    .from('site_contexts')
    .select('*')
    .eq('user_id', userId);
  
  if (projectId) {
    query = query.eq('project_id', projectId);
  } else {
    // If no projectId, fetch global contexts (where project_id is null)
    query = query.is('project_id', null);
  }

  const { data: rawData, error } = await query.order('type', { ascending: true });

  if (error) throw error;
  
  // Transform data: only return relevant fields per type to reduce payload size
  const data = (rawData || []).map((ctx: any) => {
    // Base fields every type needs
    const base: any = {
      id: ctx.id,
      user_id: ctx.user_id,
      type: ctx.type,
      content: ctx.content,
      project_id: ctx.project_id,
      created_at: ctx.created_at,
      updated_at: ctx.updated_at,
    };

    // Only 'logo' type needs the brand asset columns
    if (ctx.type === 'logo') {
      return {
        ...base,
        // Simplified fields (prefer new fields, fallback to legacy)
        logo_url: ctx.logo_url || ctx.logo_light_url || ctx.logo_light || ctx.file_url,
        favicon_url: ctx.favicon_url || ctx.favicon_light_url || ctx.icon_light || ctx.favicon,
        // Legacy fields for backward compatibility
        file_url: ctx.file_url,
        logo_light_url: ctx.logo_light_url || ctx.logo_light,
        // Brand settings
        domain_name: ctx.domain_name,
        og_image: ctx.og_image,
        primary_color: ctx.primary_color,
        secondary_color: ctx.secondary_color,
        heading_font: ctx.heading_font,
        body_font: ctx.body_font,
        languages: ctx.languages,
      };
    }

    // Other types just need content
    return base;
  });
  
  return data;
}

export async function getSiteContextByType(
  userId: string,
  type: string,
  projectId?: string
): Promise<SiteContext | null> {
  let query = supabase
    .from('site_contexts')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type);
  
  if (projectId) {
    query = query.eq('project_id', projectId);
  } else {
    query = query.is('project_id', null);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function upsertSiteContext(
  userId: string,
  type: string,
  content?: string,
  fileUrl?: string,
  projectId?: string,
  html?: string
): Promise<SiteContext> {
  // First try to get existing
  const existing = await getSiteContextByType(userId, type, projectId);
  
  if (existing) {
    // Update existing
    const updateData: Record<string, unknown> = {
      content: content || null,
      file_url: fileUrl || null,
      project_id: projectId || null,
      updated_at: new Date().toISOString(),
    };
    // Only update html if explicitly provided (even if empty string, to clear it)
    if (html !== undefined) {
      updateData.html = html || null;
    }
    
    const { data, error } = await supabase
      .from('site_contexts')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new
    const insertData: Record<string, unknown> = {
      user_id: userId,
      type,
      content: content || null,
      file_url: fileUrl || null,
      project_id: projectId || null,
    };
    // Only set html if explicitly provided
    if (html !== undefined) {
      insertData.html = html || null;
    }
    
    const { data, error } = await supabase
      .from('site_contexts')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export async function deleteSiteContext(contextId: string): Promise<void> {
  const { error } = await supabase
    .from('site_contexts')
    .delete()
    .eq('id', contextId);

  if (error) throw error;
}

export async function getFileContent(fileId: string): Promise<{ content: string; filename: string; fileType: string }> {
  // Get file metadata from database
  const { data: fileRecord, error: dbError } = await supabase
    .from('files')
    .select('*')
    .eq('id', fileId)
    .single();

  if (dbError || !fileRecord) {
    throw new Error(`File not found: ${fileId}`);
  }

  // Download file content from storage
  const { data: fileData, error: storageError } = await supabase.storage
    .from('files')
    .download(fileRecord.storage_path);

  if (storageError || !fileData) {
    throw new Error(`Failed to download file: ${storageError?.message}`);
  }

  // Convert blob to text
  const content = await fileData.text();

  return {
    content,
    filename: fileRecord.filename,
    fileType: fileRecord.file_type,
  };
}

// Message Feedback functions
export async function saveMessageFeedback(
  messageId: string,
  userId: string,
  conversationId: string,
  feedbackType: 'like' | 'dislike',
  reason: string,
  messageContent: string | null = null
) {
  const { data, error } = await supabase
    .from('message_feedback')
    .insert({
      message_id: messageId,
      user_id: userId,
      conversation_id: conversationId,
      feedback_type: feedbackType,
      reason,
      message_content: messageContent,
    })
    .select()
    .single();

  if (error) throw error;
  return data as MessageFeedback;
}

export async function getMessageFeedbacks(messageId: string) {
  const { data, error } = await supabase
    .from('message_feedback')
    .select('*')
    .eq('message_id', messageId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as MessageFeedback[];
}

export async function getUserMessageFeedback(messageId: string, userId: string) {
  const { data, error } = await supabase
    .from('message_feedback')
    .select('*')
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data as MessageFeedback | null;
}

