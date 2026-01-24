import { createAzure } from '@ai-sdk/azure';
import { streamText } from 'ai';
import { skillRegistry, getCombinedSystemPrompt } from '../skills';

// Allow streaming responses to run for up to 300 seconds (5 minutes) for complex content production workflows
// Content generation requires: fetching contexts, drafting multiple sections, generating images, and saving
// This can easily take 2-4 minutes for a full page with 5+ sections and images
// Note: 300s is the max for Vercel Pro plan. For Hobby plan, max is 10s.
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    // Check if Azure OpenAI configuration is set
    if (!process.env.AZURE_OPENAI_API_KEY) {
      console.error('AZURE_OPENAI_API_KEY is not configured!');
      return new Response(
        JSON.stringify({ 
          error: 'Azure OpenAI API Key is not configured. Please add AZURE_OPENAI_API_KEY to your .env.local file.' 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!process.env.AZURE_OPENAI_ENDPOINT) {
      console.error('AZURE_OPENAI_ENDPOINT is not configured!');
      return new Response(
        JSON.stringify({ 
          error: 'Azure OpenAI Endpoint is not configured. Please add AZURE_OPENAI_ENDPOINT to your .env.local file.' 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { messages, data } = await req.json();
    
    // Safety check: Clean up extremely large tool results from historical messages to prevent context overflow
    let totalCleaned = 0;
    const cleanedMessages = messages.map((m: any) => {
      if (m.toolInvocations) {
        return {
          ...m,
          toolInvocations: m.toolInvocations.map((inv: any) => {
            if (inv.result && typeof inv.result === 'object') {
              const cleanedResult = { ...inv.result };
              
              // For file generation tools (images, markdown, html, etc), remove content after marking for upload
              // Check if result has needsUpload flag - this indicates a file that will be uploaded
              const isFileGenerationTool = cleanedResult.needsUpload === true;
              const isImageGenerationTool = inv.toolName === 'generate_images' || inv.toolName === 'deerapi_generate_images';
              
              if (isFileGenerationTool || isImageGenerationTool) {
                let hadContent = false;
                
                // Remove base64 content from top level if present
                // But keep essential metadata like publicUrl, fileId, filename, mimeType, size
                if (cleanedResult.content) {
                  const contentSize = cleanedResult.content.length;
                  delete cleanedResult.content;
                  cleanedResult.contentRemoved = true;
                  hadContent = true;
                  totalCleaned += contentSize;
                }
                
                // Also remove markdown_content and html_content which can be large
                if (cleanedResult.markdown_content) {
                  const mdSize = cleanedResult.markdown_content.length;
                  delete cleanedResult.markdown_content;
                  cleanedResult.markdownContentRemoved = true;
                  hadContent = true;
                  totalCleaned += mdSize;
                }
                
                if (cleanedResult.html_content) {
                  const htmlSize = cleanedResult.html_content.length;
                  delete cleanedResult.html_content;
                  cleanedResult.htmlContentRemoved = true;
                  hadContent = true;
                  totalCleaned += htmlSize;
                }
                
                // Remove base64 content from images array - we only need metadata and public_url
                if (Array.isArray(cleanedResult.images)) {
                  cleanedResult.images = cleanedResult.images.map((img: any) => {
                    // Remove all large fields that might contain base64
                    const { content, base64Content, data, base64, ...rest } = img;
                    if (content) {
                      totalCleaned += content.length;
                      hadContent = true;
                    }
                    // Only keep essential fields: status, placeholderId, filename, publicUrl, fileId, metadata, error
                    // Clean metadata to only keep small essential fields
                    const cleanMetadata = rest.metadata ? {
                      title: rest.metadata.title,
                      aspect_ratio: rest.metadata.aspect_ratio,
                      quality: rest.metadata.quality,
                      background: rest.metadata.background,
                      provider: rest.metadata.provider
                    } : undefined;
                    
                    return {
                      status: rest.status,
                      placeholderId: rest.placeholderId,
                      filename: rest.filename,
                      publicUrl: rest.publicUrl,
                      fileId: rest.fileId,
                      mimeType: rest.mimeType,
                      size: rest.size,
                      metadata: cleanMetadata,
                      error: rest.error,
                      contentRemoved: true
                    };
                  });
                }
                
                // ⭐ CRITICAL: Preserve essential metadata at top level (for non-image files like HTML, CSV, JSON, MD)
                // These fields are needed for download and preview functionality
                // DO NOT delete: publicUrl, fileId, filename, mimeType, size, metadata
                // Only the large 'content' field should be removed (already done above)
                
                // Also remove any other potential large fields
                if (cleanedResult.base64Content) {
                  totalCleaned += cleanedResult.base64Content.length;
                  delete cleanedResult.base64Content;
                }
                if (cleanedResult.base64) {
                  totalCleaned += cleanedResult.base64.length;
                  delete cleanedResult.base64;
                }
                if (cleanedResult.data) {
                  totalCleaned += cleanedResult.data.length;
                  delete cleanedResult.data;
                }
                
                if (hadContent) {
                  console.log(`[Message Cleanup] Removed base64 content from ${inv.toolName} (${totalCleaned} chars cleaned)`);
                }
              } else {
                // For other tools, remove huge base64 content if it leaked into the request
                let hadContent = false;
                
                if (cleanedResult.content && cleanedResult.content.length > 10000) {
                  totalCleaned += cleanedResult.content.length;
                  delete cleanedResult.content;
                  cleanedResult.truncated = true;
                  hadContent = true;
                }
                
                // Also clean markdown_content and html_content from other tools
                // ⭐ CRITICAL: Clean markdown_content from ALL tools in historical messages
                // The content is already saved to storage and can be retrieved via publicUrl
                // We only keep it in the CURRENT turn for assemble_html_page
                if (cleanedResult.markdown_content && cleanedResult.markdown_content.length > 1000) {
                  totalCleaned += cleanedResult.markdown_content.length;
                  delete cleanedResult.markdown_content;
                  cleanedResult.markdownContentTruncated = true;
                  hadContent = true;
                }
                
                if (cleanedResult.html_content && cleanedResult.html_content.length > 1000) {
                  totalCleaned += cleanedResult.html_content.length;
                  delete cleanedResult.html_content;
                  cleanedResult.htmlContentTruncated = true;
                  hadContent = true;
                }
                
                // Handle images array for other tools
                if (Array.isArray(cleanedResult.images)) {
                  cleanedResult.images = cleanedResult.images.map((img: any) => {
                    if (img.content && img.content.length > 10000) {
                      totalCleaned += img.content.length;
                      const { content, ...rest } = img;
                      return { ...rest, truncated: true };
                    }
                    return img;
                  });
                }
              }
              
              return { ...inv, result: cleanedResult };
            }
            return inv;
          })
        };
      }
      return m;
    });
    
    if (totalCleaned > 0) {
      console.log(`[Message Cleanup] Total base64 content cleaned: ${(totalCleaned / 1024 / 1024).toFixed(2)} MB`);
    }
    
    // Limit message history to prevent context overflow
    // Keep only the last 8 messages to ensure we don't accumulate too much context
    // This is especially important when generating multiple images and sections with markdown content
    // Reduced from 15 to 8 to handle content-heavy workflows
    const maxMessages = 8;
    let limitedMessages = cleanedMessages.length > maxMessages 
      ? cleanedMessages.slice(-maxMessages)
      : [...cleanedMessages]; // Create a copy to prevent mutations
    
    if (cleanedMessages.length > maxMessages) {
      console.log(`[Message Cleanup] Limited message history from ${cleanedMessages.length} to ${limitedMessages.length} messages`);
    }
    
    // Additional safety: Check total message size and warn if still too large
    const totalMessageSize = JSON.stringify(limitedMessages).length;
    const totalMessageTokens = Math.ceil(totalMessageSize / 4); // Rough estimate: 1 token ≈ 4 chars
    
    if (totalMessageSize > 300000) { // ~300KB (reduced from 500KB)
      console.warn(`[Message Cleanup] WARNING: Total message size is still large: ${(totalMessageSize / 1024).toFixed(2)} KB (~${totalMessageTokens.toLocaleString()} tokens)`);
      console.warn(`[Message Cleanup] Consider further reducing message history or cleaning more aggressively`);
    } else {
      console.log(`[Message Cleanup] Message size OK: ${(totalMessageSize / 1024).toFixed(2)} KB (~${totalMessageTokens.toLocaleString()} tokens)`);
    }

    console.log('Received messages:', limitedMessages.length, `(total size: ${(totalMessageSize / 1024).toFixed(2)} KB)`);
    
    const userId = data?.userId;
    const projectId = data?.projectId;
    const activeSkillId = data?.activeSkillId;
    const attachedContentItems = data?.attachedContentItems || [];
    const referenceImageUrl = data?.referenceImageUrl || null;
    const mentionedKnowledgeFiles = data?.mentionedKnowledgeFiles || [];
    
    // Import database functions
    const { getFileContent, getSEOProjectById } = await import('@/lib/supabase');
    
    // Fetch project info if projectId is provided
    let projectInfo = null;
    if (projectId) {
      try {
        projectInfo = await getSEOProjectById(projectId);
        console.log(`[Chat Route] Active Project: ${projectInfo?.domain || 'Unknown'} (${projectId})`);
      } catch (e) {
        console.error(`[Chat Route] Failed to fetch project info for ${projectId}:`, e);
      }
    }

    // Create server-side Supabase client for content items (bypasses RLS, with proxy support)
    const { createServerSupabaseAdmin } = await import('@/lib/supabase-server');
    const serverSupabase = createServerSupabaseAdmin();
    
    // Handle attached files
    const attachedFiles = data?.attachedFiles || [];
    if (attachedFiles.length > 0) {
      console.log('Attached files:', attachedFiles.map((f: any) => f.filename).join(', '));
      
      // Read file contents
      const fileContents = await Promise.all(
        attachedFiles.map(async (file: any) => {
          try {
            const { content, filename, fileType } = await getFileContent(file.id);
            return `=== File: ${filename} (${fileType}) ===\n${content}\n=== End of ${filename} ===`;
          } catch (error) {
            console.error(`Failed to read file ${file.filename}:`, error);
            return `=== File: ${file.filename} ===\n[Error: Could not read file]\n=== End of ${file.filename} ===`;
          }
        })
      );
      
      // Inject file contents into system message
      const fileContextMessage = {
        role: 'system' as const,
        content: `IMPORTANT - ATTACHED FILES CONTEXT:

The user has attached ${attachedFiles.length} file${attachedFiles.length > 1 ? 's' : ''} to their message. These files are listed below with their complete contents.

When you respond:
1. Acknowledge that you've received these files
2. Reference the files by name when discussing them
3. Use the exact data from these files in your analysis/work
4. DO NOT ask the user to provide these files again - you already have them

Attached Files:
${fileContents.join('\n\n')}`
      };
      
      // Add to beginning of limitedMessages array (not the original messages)
      limitedMessages.unshift(fileContextMessage);
      console.log('Injected file context into messages');
    }

    // Handle mentioned knowledge files - fetch and inject their contents
    if (mentionedKnowledgeFiles.length > 0) {
      console.log('Mentioned knowledge files:', mentionedKnowledgeFiles.map((f: any) => f.file_name).join(', '));
      
      // Read knowledge file contents
      const knowledgeContents = await Promise.all(
        mentionedKnowledgeFiles.map(async (file: any) => {
          try {
            // Get file content from Supabase Storage
            const { data: fileData, error: downloadError } = await serverSupabase.storage
              .from('knowledge')
              .download(file.storage_path);
            
            if (downloadError || !fileData) {
              console.error(`Failed to download knowledge file ${file.file_name}:`, downloadError);
              return `=== Knowledge File: ${file.file_name} ===\n[Error: Could not download file]\n=== End of ${file.file_name} ===`;
            }
            
            // For text-based files, read content directly
            const textMimeTypes = [
              'text/plain', 'text/csv', 'text/markdown', 'application/json',
              'application/xml', 'text/html', 'text/css', 'text/javascript'
            ];
            
            if (textMimeTypes.some(t => file.file_type.includes(t))) {
              const content = await fileData.text();
              const truncatedContent = content.length > 50000 
                ? content.substring(0, 50000) + '\n\n... [Content truncated, original size: ' + content.length + ' chars]'
                : content;
              return `=== Knowledge File: ${file.file_name} (${file.file_type}) ===\n${truncatedContent}\n=== End of ${file.file_name} ===`;
            }
            
            // For PDFs, try to extract text
            if (file.file_type === 'application/pdf') {
              // Return a placeholder - PDF parsing would require additional library
              return `=== Knowledge File: ${file.file_name} (PDF) ===\n[This is a PDF file. The AI can reference it by name but cannot read its contents directly. Consider converting to text format for better results.]\nFile URL: ${file.url || 'Not available'}\n=== End of ${file.file_name} ===`;
            }
            
            // For images
            if (file.file_type.startsWith('image/')) {
              return `=== Knowledge File: ${file.file_name} (Image) ===\n[This is an image file. The AI can reference it by name.]\nFile URL: ${file.url || 'Not available'}\n=== End of ${file.file_name} ===`;
            }
            
            // For other file types
            return `=== Knowledge File: ${file.file_name} (${file.file_type}) ===\n[File type not directly readable. Reference available by name.]\nFile URL: ${file.url || 'Not available'}\n=== End of ${file.file_name} ===`;
          } catch (error) {
            console.error(`Failed to process knowledge file ${file.file_name}:`, error);
            return `=== Knowledge File: ${file.file_name} ===\n[Error: Could not process file]\n=== End of ${file.file_name} ===`;
          }
        })
      );
      
      // Inject knowledge file contents into system message
      const knowledgeContextMessage = {
        role: 'system' as const,
        content: `IMPORTANT - REFERENCED KNOWLEDGE FILES:

The user has referenced ${mentionedKnowledgeFiles.length} knowledge file${mentionedKnowledgeFiles.length > 1 ? 's' : ''} using @ mentions. These files contain important context that should inform your response.

When you respond:
1. Acknowledge that you have access to these referenced knowledge files
2. Use the information from these files to provide more accurate and relevant responses
3. Reference the files by name when discussing specific information from them

Referenced Knowledge Files:
${knowledgeContents.join('\n\n')}`
      };
      
      // Add to beginning of limitedMessages array
      limitedMessages.unshift(knowledgeContextMessage);
      console.log('Injected knowledge file context into messages');
    }

    // Handle attached content items - fetch details to include in system prompt
    let contentItemsContext = '';
    let autoSelectedSkill: any = null;  // Declare at outer scope
    if (attachedContentItems.length > 0) {
      console.log('Attached content items:', attachedContentItems.map((i: any) => i.title).join(', '));
      console.log('Attached content items details:', JSON.stringify(attachedContentItems, null, 2));
      
      const contentItemDetails = await Promise.all(
        attachedContentItems.map(async (item: any) => {
          try {
            console.log(`[Content Items] Fetching content item with ID: ${item.id}, title: ${item.title}`);
            // Use server-side Supabase client to bypass RLS
            const { data: fullItem, error: itemError } = await serverSupabase
              .from('content_items')
              .select('*')
              .eq('id', item.id)
              .single();
            
            if (itemError) {
              console.error(`[Content Items] Error fetching item ${item.id}:`, itemError);
              return null;
            }
            
            console.log(`[Content Items] Fetched item:`, fullItem ? { id: fullItem.id, title: fullItem.title } : 'null');
            
            if (!fullItem) {
              console.warn(`[Content Items] Content item not found: ${item.id} (${item.title})`);
              return null;
            }
            
            const itemDetails = `=== Planned Content Item: ${fullItem.title} ===
ID: ${fullItem.id}
Target Keyword: ${fullItem.target_keyword || 'N/A'}
Page Type: ${fullItem.page_type || 'N/A'}
Status: ${fullItem.status || 'N/A'}
Slug: ${fullItem.slug || 'N/A'}
SEO Title: ${fullItem.seo_title || fullItem.title}
SEO Description: ${fullItem.seo_description || 'N/A'}

Outline:
${fullItem.outline ? (() => {
  const outlineStr = JSON.stringify(fullItem.outline, null, 2);
  return outlineStr.length > 2000 ? outlineStr.substring(0, 2000) + '\n... (truncated)' : outlineStr;
})() : 'No outline available'}

SERP Insights:
${fullItem.serp_insights ? (() => {
  const serpStr = JSON.stringify(fullItem.serp_insights, null, 2);
  return serpStr.length > 1000 ? serpStr.substring(0, 1000) + '\n... (truncated)' : serpStr;
})() : 'No SERP insights available'}

Keyword Data:
${fullItem.keyword_data ? (() => {
  const keywordStr = JSON.stringify(fullItem.keyword_data, null, 2);
  return keywordStr.length > 500 ? keywordStr.substring(0, 500) + '\n... (truncated)' : keywordStr;
})() : 'No keyword data available'}

Reference URLs:
${fullItem.reference_urls && fullItem.reference_urls.length > 0 ? fullItem.reference_urls.slice(0, 10).join('\n') : 'No reference URLs'}
=== End of ${fullItem.title} ===`;
            
            console.log(`[Content Items] Successfully formatted item: ${fullItem.title}`);
            return itemDetails;
          } catch (error) {
            console.error(`[Content Items] Failed to fetch content item ${item.title} (ID: ${item.id}):`, error);
            return null;
          }
        })
      );
      
      const validDetails = contentItemDetails.filter(d => d !== null);
      console.log(`[Content Items] Valid details count: ${validDetails.length} out of ${attachedContentItems.length}`);
      
      // Log size of content item details for monitoring
      if (validDetails.length > 0) {
        const totalSize = validDetails.reduce((sum, detail) => sum + (detail?.length || 0), 0);
        const estimatedTokens = Math.ceil(totalSize / 4);
        console.log(`[Content Items] Total size: ${(totalSize / 1024).toFixed(2)} KB (~${estimatedTokens.toLocaleString()} tokens)`);
        if (estimatedTokens > 50000) {
          console.warn(`[Content Items] ⚠️  WARNING: Content items context is very large (${estimatedTokens.toLocaleString()} tokens)!`);
        }
      }
      
      // Auto-detect skill based on page_type (remove 'let' since it's declared above)
      if (validDetails.length === 1 && attachedContentItems[0].page_type) {
        const pageType = attachedContentItems[0].page_type;
        const skillMapping: Record<string, string> = {
          'blog': 'blog-writer',
          'landing_page': 'landing-page-writer',
          'comparison': 'comparison-writer',
          'guide': 'guide-writer',
          'listicle': 'listicle-writer'
        };
        const targetSkillId = skillMapping[pageType];
        if (targetSkillId) {
          const skill = skillRegistry.get(targetSkillId);
          if (skill && skill.enabled) {
            autoSelectedSkill = skill;
            console.log(`[Auto-Routing] Detected page_type: ${pageType} → Auto-selected skill: ${skill.name} (${skill.id})`);
          }
        }
      }
      
      if (validDetails.length > 0) {
        let routingInfo = '';
        if (autoSelectedSkill) {
          routingInfo = `\n🎯 AUTO-ROUTING DETECTED 🎯\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPage Type: ${attachedContentItems[0].page_type}\nSelected Skill: ${autoSelectedSkill.name} (${autoSelectedSkill.id})\n\n⚠️ CRITICAL INSTRUCTION:\nYOU MUST use the "${autoSelectedSkill.name}" workflow for this content generation.\nDO NOT use the generic blog writing approach.\nDO NOT use the blog-writer skill unless this is a blog page.\nThe specialized workflow will be provided below.\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        }

        let skillAck = '2. Acknowledge the content items provided';
        if (autoSelectedSkill) {
          skillAck = `2. IMMEDIATELY acknowledge that you're using the "${autoSelectedSkill.name}" workflow for this ${attachedContentItems[0].page_type} page`;
        }

        const itemsList = validDetails.join('\n\n');

        contentItemsContext = `

====================
CRITICAL - ATTACHED CONTENT ITEMS FROM LIBRARY:
====================

The user has selected ${validDetails.length} planned content item(s) from their content library to work with.

⚠️ CRITICAL: CURRENT REQUEST CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the user says "Generate this page" or similar phrases WITHOUT specifying a page name:
- YOU MUST use the CURRENTLY ATTACHED content item(s) below
- DO NOT refer to pages from previous conversation turns
- The currently attached item(s) represent what the user wants NOW
- Ignore any previously generated pages in the conversation history
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${routingInfo}

MANDATORY INSTRUCTIONS:
1. IMMEDIATELY acknowledge which content item(s) you're working on (mention by title)
${skillAck}
3. Use the EXACT outlines, keywords, and SERP insights provided below
4. Follow the page type and structure specified
5. DO NOT ask the user to provide these details again - you already have them
6. DO NOT use placeholders - all data is provided below
7. If the user asks to generate the page (e.g., "generate this page" or equivalent in any language), they mean the attached content item(s) - proceed immediately with COMPLETE content generation.
8. When page generation is requested, you MUST:
   - Call 'create_plan' first (as required)
   - Then execute the FULL workflow (Steps 0 to 7) for the appropriate page type without stopping.
   - Use the exact structure, keywords, and insights from the attached content item.
   - DO NOT stop after drafting sections. You MUST generate images, assemble the HTML, and call 'save_final_page' in this same turn.
   - If the user asks for a specific page by title, prioritize that over others.
   - If multiple pages are attached, ask for confirmation which one to generate first, or generate them sequentially.

Attached Content Items:
${itemsList}

====================`;
        console.log('[Content Items] Prepared content items context for system prompt');
      } else {
        console.warn('[Content Items] No valid content item details found');
      }
    }

    // Get all tools from registered skills
    const rawTools = skillRegistry.getAllTools();
    console.log('Loaded tools:', Object.keys(rawTools).length);
    
    // Track tool execution for planning-first enforcement (per request)
    const requestState = {
      toolCalls: [] as string[],
      hasCalledPlan: false,
      firstToolCallMade: false,
      autoPlanned: false
    };
    
    // Wrap tools with planning-first enforcement
    const tools: any = {};
    for (const [toolName, toolDef] of Object.entries(rawTools)) {
      tools[toolName] = {
        ...toolDef,
        execute: async (args: any) => {
          // Check if this is the first tool call in this AI response
          const isFirstTool = !requestState.firstToolCallMade;
          requestState.firstToolCallMade = true;
          requestState.toolCalls.push(toolName);
          
          // Tools that are exempt from planning-first rule
          const exemptTools = [
            'create_plan',
            'create_conversation_tracker',
            'add_task_to_tracker', 
            'update_task_status',
            'read_conversation_tracker'
          ];
          
          // ENFORCE: First tool must be create_plan (unless it's an exempt tool)
          if (isFirstTool && !exemptTools.includes(toolName)) {
            // Auto-compensation strategy: Create a simple plan automatically
            console.warn(`⚠️  Planning skipped for '${toolName}' - Auto-generating simple plan...`);
            
            // Auto-create a simplified plan
            const autoPlan = {
              task_summary: `Execute ${toolName}`,
              steps: [{
                step_number: 1,
                description: `Call ${toolName} with provided parameters`,
                required_skills: ['core'],
                required_tools: [toolName],
                estimated_complexity: 'simple' as const
              }],
              considerations: ['Auto-generated plan for single tool execution']
            };
            
            // Mark planning as done (auto-planned)
            requestState.hasCalledPlan = true;
            requestState.autoPlanned = true;
            
            console.log('✅ Auto-plan created:', autoPlan.task_summary);
            
            // Log for monitoring (to analyze which tools frequently skip planning)
            console.log(`📊 Auto-plan stats: tool=${toolName}, user=${userId || 'unknown'}`);
          }
          
          // Track planning status
          if (toolName === 'create_plan') {
            requestState.hasCalledPlan = true;
            console.log('✅ Planning-first rule: create_plan called');
          }
          3
          // Execute the actual tool
          console.log(`🔧 Executing tool: ${toolName}${isFirstTool ? ' (first tool in response)' : ''}`);
          
          // Inject context if needed by the tool
          const toolArgs = { ...args };
          const toolSchema = (toolDef as any).parameters;
          
          // FORCE inject userId - always use the authenticated user (camelCase)
          if (userId && toolSchema?.shape && 'userId' in toolSchema.shape) {
            if (toolArgs.userId !== userId) {
              console.log(`[Auto-Injection] Overriding userId for tool: ${toolName}`);
            }
            toolArgs.userId = userId;
          }
          
          // FORCE inject user_id - snake_case variant (for tools like markdown_to_html_report)
          if (userId && toolSchema?.shape && 'user_id' in toolSchema.shape) {
            if (toolArgs.user_id !== userId) {
              console.log(`[Auto-Injection] Overriding user_id for tool: ${toolName}`);
            }
            toolArgs.user_id = userId;
          }
          
          // FORCE inject seo_project_id - for content tools that link to SEO project
          // These tools need seo_project_id to properly link content to the current SEO project
          const toolsNeedingSeoProjectId = ['save_content_items_batch', 'save_content_item'];
          if (projectId && toolsNeedingSeoProjectId.includes(toolName)) {
            console.log(`[Auto-Injection] Injecting seo_project_id: ${projectId} for tool: ${toolName}`);
            toolArgs.seo_project_id = projectId;
          }
          
          // FORCE inject projectId - always override AI's guess with the real project ID
          if (projectId && toolSchema?.shape && 'projectId' in toolSchema.shape) {
            if (toolArgs.projectId !== projectId) {
              console.log(`[Auto-Injection] Overriding projectId: ${toolArgs.projectId} -> ${projectId} for tool: ${toolName}`);
            }
            toolArgs.projectId = projectId;
          }
          
          // Fallback for domainId (legacy)
          if (projectId && toolSchema?.shape && 'domainId' in toolSchema.shape) {
            toolArgs.domainId = projectId;
          }

          try {
            const result = await (toolDef as any).execute(toolArgs);
            
            // Find which skill this tool belongs to
            // Optimization: If an activeSkillId is provided (from a Playbook), check it first
            let skill = activeSkillId ? skillRegistry.get(activeSkillId) : undefined;
            
            // Only use the active skill if it actually has this tool registered
            if (!skill || !(toolName in skill.tools)) {
              skill = skillRegistry.getSkillByToolId(toolName);
            }

            if (skill && result && typeof result === 'object' && !Array.isArray(result)) {
              (result as any).executedSkill = {
                id: skill.id,
                name: skill.name
              };
            }
            
            // Detailed Logging for Debugging
            if (result && typeof result === 'object') {
              const logResult = { ...result };
              // Truncate large strings or arrays for cleaner logs
              if (logResult.content && typeof logResult.content === 'string' && logResult.content.length > 200) {
                logResult.content = logResult.content.slice(0, 200) + `... (${logResult.content.length} chars)`;
              }
              if (Array.isArray(logResult.images)) {
                logResult.images = `[${logResult.images.length} images]`;
              }
              if (logResult.html_content) {
                logResult.html_content = `HTML (${logResult.html_content.length} chars)`;
              }
              
              console.log(`✅ Tool ${toolName} finished. Result summary:`, JSON.stringify(logResult, null, 2));
            } else {
              console.log(`✅ Tool ${toolName} finished. Result:`, result);
            }
            
            return result;
          } catch (toolError) {
            console.error(`❌ CRITICAL ERROR in tool ${toolName}:`, toolError);
            return {
              success: false,
              error: toolError instanceof Error ? toolError.message : 'Unknown tool execution error',
              toolName
            };
          }
        }
      };
    }
    
    console.log('✅ Tools wrapped with mandatory planning-first enforcement');

    // Initialize Azure OpenAI client
    const azure = createAzure({
      resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME || 'intelick-page-generation',
      apiKey: process.env.AZURE_OPENAI_API_KEY,
    });

    // Use configured deployment name or default to gpt-4.1
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1';
    console.log('Using Azure OpenAI deployment:', deploymentName);
    console.log('Starting streamText with planning-first enforcement...');
    
    // Build system prompt with content items context and auto-selected skill
    const baseSystemPrompt = getCombinedSystemPrompt(userId, projectId);
    
    // If a skill was auto-selected based on page_type, add its detailed instructions
    let autoSkillInstructions = '';
    if (autoSelectedSkill) {
      autoSkillInstructions = `
\n====================
🎯 AUTO-SELECTED WORKFLOW: ${autoSelectedSkill.name.toUpperCase()}
====================

Based on the attached content item's page type (${attachedContentItems[0].page_type}), you have been automatically assigned to use the following specialized workflow:

${autoSelectedSkill.systemPrompt}

⚠️ CRITICAL: Follow this workflow EXACTLY. Do not use generic blog writing patterns - this is a specialized ${attachedContentItems[0].page_type} page.
====================\n`;
    }
    
    // Add a strong "Keep Going" instruction at the very end
    const executionInstruction = `
\n====================
CRITICAL: EXECUTION CONTINUITY (MANDATORY)
====================
- You are strictly forbidden from stopping after 'create_plan' or 'create_conversation_tracker'.
- These tool calls must be IMMEDIATELY followed by the first execution step of your plan.
- Use the 'maxSteps' capability to COMPLETE THE ENTIRE PLAN in this same response.
- If you are generating a page, DO NOT STOP until you have called 'save_final_page'.
- NEVER stop to ask for preferences (like image style) unless the user specifically requested it. Use your best judgment and keep going.
- If you stop before completion, you have FAILED the task. KEEP GOING.

⚠️ ABSOLUTELY FORBIDDEN - PLACEHOLDER CONTENT ⚠️
- NEVER use "..." or "…" to abbreviate or skip content
- NEVER use placeholder text like "[content]", "[section here]", etc.
- When passing section HTML to assemble tools, use the COMPLETE output from section generators
- If you use placeholders, the assemble tool will REJECT your request and the page will be incomplete
- Incomplete pages are UNACCEPTABLE - this is the product we sell!

CRITICAL: FINAL RESPONSE (MANDATORY)
- After completing ALL tool calls (especially after 'save_final_page'), you MUST provide a text response to the user.
- DO NOT end with only tool calls - always include a final message explaining what was completed.
- Example: "✅ Page generated successfully! [View Live Page](URL) - The page includes X sections with Y images and follows the ${attachedContentItems?.[0]?.page_type || 'blog'} layout."
====================`;

    // Add reference image instruction if provided
    const referenceImageInstruction = referenceImageUrl ? `

====================
REFERENCE IMAGE FOR GENERATION
====================
The user has uploaded a reference image for image generation: ${referenceImageUrl}

IMPORTANT:
- When calling 'deerapi_generate_images' or 'generate_images', include this URL in the 'source_image_urls' parameter
- Use this reference image to maintain visual style consistency across generated images
- The reference image should guide the style, composition, or aesthetic of the generated images
====================
` : '';

    const fullSystemPrompt = baseSystemPrompt + contentItemsContext + autoSkillInstructions + referenceImageInstruction + executionInstruction;
    
    console.log('[System Prompt] Base length:', baseSystemPrompt.length, 'characters');
    console.log('[System Prompt] Content items context length:', contentItemsContext.length, 'characters');
    console.log('[System Prompt] Total length:', fullSystemPrompt.length, 'characters');
    
    // Final check: Log actual message size being sent to AI
    const finalMessageSize = JSON.stringify(limitedMessages).length;
    const finalMessageTokens = Math.ceil(finalMessageSize / 4);
    const systemPromptTokens = Math.ceil(fullSystemPrompt.length / 4);
    const estimatedTotalTokens = finalMessageTokens + systemPromptTokens + 7500; // +7500 for functions
    
    console.log('[Final Check] Messages size:', (finalMessageSize / 1024).toFixed(2), 'KB (~', finalMessageTokens.toLocaleString(), 'tokens)');
    console.log('[Final Check] System prompt:', (fullSystemPrompt.length / 1024).toFixed(2), 'KB (~', systemPromptTokens.toLocaleString(), 'tokens)');
    console.log('[Final Check] Estimated total:', estimatedTotalTokens.toLocaleString(), 'tokens');
    
    if (estimatedTotalTokens > 900000) {
      console.error('[Final Check] ❌ CRITICAL: Estimated token usage exceeds safe limit!');
      console.error('[Final Check] This request will likely fail with context_length_exceeded error');
    } else if (estimatedTotalTokens > 700000) {
      console.warn('[Final Check] ⚠️  WARNING: High token usage -', estimatedTotalTokens.toLocaleString(), 'tokens');
    } else {
      console.log('[Final Check] ✅ Token usage looks good');
    }
    
    const result = streamText({
      model: azure(deploymentName),
      messages: limitedMessages,
      tools,
      system: fullSystemPrompt,
      maxSteps: 35, // Allow up to 35 tool call rounds for complex workflows (blog generation needs ~30 steps)
      onStepFinish: ({ toolCalls, toolResults, finishReason }) => {
        if (toolCalls && toolCalls.length > 0) {
          // Calculate tool results size for context monitoring
          const toolResultsSize = toolResults ? JSON.stringify(toolResults).length : 0;
          const estimatedToolTokens = Math.ceil(toolResultsSize / 4);
          
          console.log('Step finished:', {
            toolCalls: toolCalls.map(tc => tc.toolName),
            finishReason,
            planningEnforced: requestState.hasCalledPlan,
            toolResultsSize: `${(toolResultsSize / 1024).toFixed(2)} KB (~${estimatedToolTokens.toLocaleString()} tokens)`,
          });
          
          // Warn if tool results are getting large
          if (estimatedToolTokens > 50000) {
            console.warn(`⚠️  WARNING: Large tool results! ${estimatedToolTokens.toLocaleString()} tokens from this step`);
            console.warn('This may cause context_length_exceeded error on next AI call');
          }
        }
      },
      onFinish: ({ text, finishReason, usage }) => {
        console.log('Stream finished:', { 
          textLength: text?.length || 0,
          finishReason,
          usage,
          toolsUsed: requestState.toolCalls,
          planningCompliant: requestState.hasCalledPlan || requestState.toolCalls.length === 0
        });
      },
      onError: (error) => {
        console.error('❌ Stream error:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          name: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack : undefined,
          cause: error instanceof Error ? (error as any).cause : undefined,
          fullError: error,
        });
        // Log tool call state for debugging
        console.error('Tool call state at error:', {
          toolCalls: requestState.toolCalls,
          hasCalledPlan: requestState.hasCalledPlan,
        });
      },
    });

    console.log('Returning stream response...');
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('API Error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    return new Response(
      JSON.stringify({ 
        error: 'Server error. Please check API Key configuration or console logs.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
