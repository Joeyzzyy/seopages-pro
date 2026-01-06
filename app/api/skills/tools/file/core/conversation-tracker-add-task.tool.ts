import { tool } from 'ai';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

export const add_task_to_tracker = tool({
  description: `Add a new task to the conversation tracker file.

Call this when the user starts a NEW task in the same conversation.
This appends the new task to the existing tracker, maintaining conversation continuity.

WHEN TO CALL:
- After create_plan is called for a subsequent task (not the first one)
- When user requests a completely different task in the same conversation

DO NOT CALL:
- For the first task (use create_conversation_tracker instead)
- For updates to existing tasks (use update_task_status instead)

IMPORTANT: This tool will automatically find the existing tracker file for this conversation.`,
  parameters: z.object({
    conversation_id: z.string().describe('The current conversation ID'),
    task_number: z.number().describe('The task number (e.g., 2 for the second task)'),
    task_summary: z.string().describe('Brief summary of the new task'),
    plan_steps: z.array(z.string()).describe('The steps from the plan for this task'),
  }),
  execute: async ({ conversation_id, task_number, task_summary, plan_steps }) => {
    try {
      // Automatically find the existing tracker file
      // Try precise filename first, then try a more flexible search if that fails
      const trackerFilename = `conversation-tracker-${conversation_id.slice(0, 8)}.md`;
      
      let { data: files, error: filesError } = await supabase
        .from('files')
        .select('*')
        .eq('conversation_id', conversation_id)
        .eq('filename', trackerFilename)
        .order('created_at', { ascending: false })
        .limit(1);

      // Robustness: If precise filename fails, search for any tracker file in this conversation
      if (!files || files.length === 0) {
        console.log(`[add_task_to_tracker] Precise match failed for ${trackerFilename}, trying flexible search...`);
        const { data: altFiles, error: altError } = await supabase
          .from('files')
          .select('*')
          .eq('conversation_id', conversation_id)
          .ilike('filename', 'conversation-tracker-%.md')
          .order('created_at', { ascending: false })
          .limit(1);
        
        files = altFiles;
        filesError = altError;
      }

      // If no tracker file exists, create a new one instead of failing
      if (filesError || !files || files.length === 0) {
        console.log(`[add_task_to_tracker] No existing tracker found, creating new tracker for task #${task_number}`);
        
        const displayTime = new Date().toLocaleString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        const newTrackerContent = `# Conversation Tracker

**Conversation ID:** ${conversation_id.slice(0, 8)}...  
**Created:** ${displayTime}  
**Last Updated:** ${displayTime}

---

## Task #${task_number}: ${task_summary}

**Status:** 🟡 In Progress  
**Created:** ${displayTime}  
**Updated:** ${displayTime}

### Execution Plan

${plan_steps.map((step, idx) => `${idx + 1}. [ ] ${step}`).join('\n')}

### Progress Log

- [${displayTime}] Task initiated
- [${displayTime}] Plan created with ${plan_steps.length} steps

### Notes

_Task execution in progress..._

---

## Summary

- **Total Tasks:** 1
- **Completed:** 0
- **In Progress:** 1
- **Failed:** 0
`;

        return {
          success: true,
          filename: trackerFilename,
          content: newTrackerContent,
          mimeType: 'text/markdown',
          size: newTrackerContent.length,
          needsUpload: true,
          created: true,
          taskNumber: task_number,
          message: `Created new tracker with Task #${task_number}`,
          metadata: {
            conversationId: conversation_id,
            createdAt: new Date().toISOString(),
            taskCount: 1,
            isTracker: true,
          }
        };
      }

      const trackerFile = files[0];

      // Download current content from storage
      const { data: fileData, error: storageError } = await supabase.storage
        .from('files')
        .download(trackerFile.storage_path);

      if (storageError || !fileData) {
        return {
          success: false,
          error: 'Failed to read tracker file',
          message: 'Could not read the existing tracker file content.'
        };
      }

      const current_tracker_content = await fileData.text();
    const displayTime = new Date().toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Parse current content to extract summary section
    const summaryMatch = current_tracker_content.match(/## Summary\n\n([\s\S]*?)$/);
    const currentStats = {
      total: task_number - 1,
      completed: 0,
      inProgress: 1,
      failed: 0,
    };

    if (summaryMatch) {
      const summaryText = summaryMatch[1];
      const totalMatch = summaryText.match(/Total Tasks:\*\* (\d+)/);
      const completedMatch = summaryText.match(/Completed:\*\* (\d+)/);
      const inProgressMatch = summaryText.match(/In Progress:\*\* (\d+)/);
      const failedMatch = summaryText.match(/Failed:\*\* (\d+)/);

      if (totalMatch) currentStats.total = parseInt(totalMatch[1]);
      if (completedMatch) currentStats.completed = parseInt(completedMatch[1]);
      if (inProgressMatch) currentStats.inProgress = parseInt(inProgressMatch[1]);
      if (failedMatch) currentStats.failed = parseInt(failedMatch[1]);
    }

    const newTaskSection = `

---

## Task #${task_number}: ${task_summary}

**Status:** 🟡 In Progress  
**Created:** ${displayTime}  
**Updated:** ${displayTime}

### Execution Plan

${plan_steps.map((step, idx) => `${idx + 1}. [ ] ${step}`).join('\n')}

### Progress Log

- [${displayTime}] Task initiated
- [${displayTime}] Plan created with ${plan_steps.length} steps

### Notes

_Task execution in progress..._
`;

    // Update summary
    const newSummary = `

---

## Summary

- **Total Tasks:** ${task_number}
- **Completed:** ${currentStats.completed}
- **In Progress:** ${currentStats.inProgress + 1}
- **Failed:** ${currentStats.failed}
`;

    // Remove old summary and append new task + new summary
    const contentWithoutSummary = current_tracker_content.replace(/\n---\n\n## Summary[\s\S]*$/, '');
    const updatedContent = contentWithoutSummary + newTaskSection + newSummary;

    // Update the "Last Updated" timestamp in header
    const finalContent = updatedContent.replace(
      /\*\*Last Updated:\*\* [^\n]+/,
      `**Last Updated:** ${displayTime}`
    );

      return {
        success: true,
        fileId: trackerFile.id,
        filename: trackerFile.filename,
        content: finalContent, // Return raw string
        mimeType: 'text/markdown',
        size: finalContent.length,
        needsUpload: true,
        updated: true,
        taskNumber: task_number,
        message: `Added Task #${task_number} to tracker`,
        metadata: {
          conversationId: conversation_id,
          updatedAt: new Date().toISOString(),
          taskCount: task_number,
          isTracker: true,
        }
      };
    } catch (error) {
      console.error('[add_task_to_tracker] Unexpected error:', error);
      return {
        success: false,
        error: 'Unexpected error adding task to tracker',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

