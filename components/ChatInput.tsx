'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { FileRecord, ContentItem } from '@/lib/supabase';

// Knowledge file reference type
export interface KnowledgeFileRef {
  id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  url?: string | null;
}

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  files: FileRecord[];
  contentItems: ContentItem[];
  attachedFileIds: string[];
  attachedContentItemIds: string[];
  skills: any[];
  referenceImageUrl: string | null;
  conversationId?: string | null;
  projectId?: string | null;
  knowledgeFiles?: KnowledgeFileRef[];
  mentionedFiles?: KnowledgeFileRef[];
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStop: () => void;
  onAttachFile: (fileId: string) => void;
  onRemoveFile: (fileId: string) => void;
  onAttachContentItem: (itemId: string) => void;
  onRemoveContentItem: (itemId: string) => void;
  onPlaybookClick?: (skill: any) => void;
  onReferenceImageChange: (url: string | null) => void;
  onUploadSuccess?: () => void;
  onMentionFile?: (file: KnowledgeFileRef) => void;
  onRemoveMentionedFile?: (fileId: string) => void;
  onAutoGeneratePage?: (item: ContentItem) => void;
}

export default function ChatInput({
  input,
  isLoading,
  files,
  contentItems,
  attachedFileIds,
  attachedContentItemIds,
  skills,
  referenceImageUrl,
  conversationId,
  projectId,
  knowledgeFiles = [],
  mentionedFiles = [],
  onInputChange,
  onSubmit,
  onStop,
  onAttachFile,
  onRemoveFile,
  onAttachContentItem,
  onRemoveContentItem,
  onPlaybookClick,
  onReferenceImageChange,
  onUploadSuccess,
  onMentionFile,
  onRemoveMentionedFile,
  onAutoGeneratePage,
}: ChatInputProps) {
  const [isComposing, setIsComposing] = useState(false);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const lastRangeRef = useRef<Range | null>(null);
  
  // @ mention state
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  
  // Filter knowledge files based on search
  const filteredKnowledgeFiles = knowledgeFiles.filter(file =>
    file.file_name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  // Save current selection/range
  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      lastRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
  }, []);

  // Restore selection/range
  const restoreSelection = useCallback(() => {
    if (lastRangeRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(lastRangeRef.current);
      }
    }
  }, []);

  // Get plain text from editor (excluding file tags)
  const getEditorText = useCallback(() => {
    if (!editorRef.current) return '';
    let text = '';
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        // Skip file tag elements - they are handled separately
        if (el.dataset.fileId) return;
        if (el.tagName === 'BR') {
          text += '\n';
        } else {
          node.childNodes.forEach(walk);
        }
      }
    };
    editorRef.current.childNodes.forEach(walk);
    return text;
  }, []);

  // Sync editor content with parent input state
  const syncInputWithEditor = useCallback(() => {
    const text = getEditorText();
    // Create a synthetic event
    const syntheticEvent = {
      target: { value: text }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    onInputChange(syntheticEvent);
  }, [getEditorText, onInputChange]);

  // Handle editor input
  const handleEditorInput = useCallback(() => {
    if (!editorRef.current) return;
    
    saveSelection();
    syncInputWithEditor();
    
    // Check for @ mention trigger
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    
    if (textNode.nodeType === Node.TEXT_NODE) {
      const text = textNode.textContent || '';
      const cursorPos = range.startOffset;
      const textBeforeCursor = text.slice(0, cursorPos);
      const atMatch = textBeforeCursor.match(/@(\S*)$/);
      
      if (atMatch) {
        setMentionSearch(atMatch[1]);
        setShowMentionDropdown(true);
        setMentionIndex(0);
        
        // Calculate dropdown position
        const tempRange = document.createRange();
        tempRange.setStart(textNode, cursorPos - atMatch[0].length);
        tempRange.setEnd(textNode, cursorPos);
        const rect = tempRange.getBoundingClientRect();
        const editorRect = editorRef.current.getBoundingClientRect();
        setMentionPosition({
          top: rect.top - editorRect.top - 8,
          left: rect.left - editorRect.left
        });
      } else {
        setShowMentionDropdown(false);
        setMentionSearch('');
      }
    } else {
      setShowMentionDropdown(false);
      setMentionSearch('');
    }
  }, [saveSelection, syncInputWithEditor]);

  // Insert file tag at cursor position
  const insertFileTagAtCursor = useCallback((file: KnowledgeFileRef) => {
    if (!editorRef.current) return;
    
    restoreSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    // Find and remove the @search text
    const textNode = range.startContainer;
    if (textNode.nodeType === Node.TEXT_NODE) {
      const text = textNode.textContent || '';
      const cursorPos = range.startOffset;
      const textBeforeCursor = text.slice(0, cursorPos);
      const atMatch = textBeforeCursor.match(/@(\S*)$/);
      
      if (atMatch) {
        // Remove @search text
        const startPos = cursorPos - atMatch[0].length;
        textNode.textContent = text.slice(0, startPos) + text.slice(cursorPos);
        
        // Create file tag element
        const tag = document.createElement('span');
        tag.className = 'inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 bg-[#EEF2FF] border border-[#C7D2FE] rounded text-[11px] text-[#4338CA] align-middle select-none';
        tag.contentEditable = 'false';
        tag.dataset.fileId = file.id;
        tag.dataset.fileName = file.file_name;
        tag.dataset.fileType = file.file_type;
        tag.dataset.storagePath = file.storage_path;
        if (file.url) tag.dataset.fileUrl = file.url;
        tag.innerHTML = `<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span class="font-medium">@${file.file_name}</span>`;
        
        // Insert tag at position
        const newRange = document.createRange();
        newRange.setStart(textNode, startPos);
        newRange.setEnd(textNode, startPos);
        newRange.insertNode(tag);
        
        // Add space after tag and move cursor
        const space = document.createTextNode('\u00A0');
        tag.after(space);
        
        // Move cursor after space
        newRange.setStartAfter(space);
        newRange.setEndAfter(space);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        // Notify parent about the file
        if (onMentionFile) {
          onMentionFile(file);
        }
        
        syncInputWithEditor();
      }
    }
    
    setShowMentionDropdown(false);
    setMentionSearch('');
    editorRef.current.focus();
  }, [restoreSelection, onMentionFile, syncInputWithEditor]);

  // Handle keyboard in mention dropdown
  const handleEditorKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle mention dropdown navigation
    if (showMentionDropdown && filteredKnowledgeFiles.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredKnowledgeFiles.length);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + filteredKnowledgeFiles.length) % filteredKnowledgeFiles.length);
        return;
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        insertFileTagAtCursor(filteredKnowledgeFiles[mentionIndex]);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionDropdown(false);
        return;
      }
    }
    
    // Handle submit
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      // Extract mentioned files from editor before submit
      extractMentionedFilesAndSubmit();
    }
  }, [showMentionDropdown, filteredKnowledgeFiles, mentionIndex, insertFileTagAtCursor, isComposing]);

  // Extract all file references and submit
  const extractMentionedFilesAndSubmit = useCallback(() => {
    if (!editorRef.current) return;
    
    // Extract file tags from editor and add them to mentioned files
    const fileTags = editorRef.current.querySelectorAll('[data-file-id]');
    fileTags.forEach(tag => {
      const fileData: KnowledgeFileRef = {
        id: tag.getAttribute('data-file-id') || '',
        file_name: tag.getAttribute('data-file-name') || '',
        file_type: tag.getAttribute('data-file-type') || '',
        storage_path: tag.getAttribute('data-storage-path') || '',
        url: tag.getAttribute('data-file-url') || null
      };
      if (fileData.id && onMentionFile) {
        // Check if not already in mentionedFiles (avoid duplicates)
        if (!mentionedFiles.find(f => f.id === fileData.id)) {
          onMentionFile(fileData);
        }
      }
    });
    
    // Submit
    const submitEvent = { preventDefault: () => {} } as React.FormEvent;
    onSubmit(submitEvent);
    
    // Clear editor content after a small delay to let submit process
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    }, 10);
  }, [onSubmit, onMentionFile, mentionedFiles]);

  // Handle paste - strip formatting
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  // Sync editor when input changes externally (e.g., cleared after submit)
  useEffect(() => {
    if (editorRef.current && input === '' && editorRef.current.textContent !== '') {
      editorRef.current.innerHTML = '';
    }
  }, [input]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (conversationId) {
        formData.append('conversationId', conversationId);
      }

      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/upload-reference-image', {
        method: 'POST',
        body: formData,
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      onReferenceImageChange(data.url);
      
      // Notify parent to refresh files list
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e);
    const textarea = e.target;
    const value = textarea.value;
    const cursorPos = textarea.selectionStart;
    
    // Check for @ mention trigger
    const textBeforeCursor = value.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\S*)$/);
    
    if (atMatch) {
      setMentionSearch(atMatch[1]);
      setShowMentionDropdown(true);
      setMentionIndex(0);
    } else {
      setShowMentionDropdown(false);
      setMentionSearch('');
    }
    
    // Auto-resize textarea
    textarea.style.height = 'auto';
    const minHeight = 120;
    const maxHeight = 200;
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    textarea.style.height = newHeight + 'px';
    if (scrollHeight > maxHeight) {
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.overflowY = 'hidden';
    }
  };
  
  // Handle file selection from mention dropdown
  const handleSelectMentionFile = (file: KnowledgeFileRef) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = input.slice(0, cursorPos);
    const textAfterCursor = input.slice(cursorPos);
    
    // Find and remove the @search part
    const atMatch = textBeforeCursor.match(/@(\S*)$/);
    if (atMatch) {
      const newTextBefore = textBeforeCursor.slice(0, -atMatch[0].length);
      const newValue = newTextBefore + textAfterCursor;
      
      // Create a synthetic event to update input
      const syntheticEvent = {
        target: { value: newValue }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onInputChange(syntheticEvent);
      
      // Add file to mentioned files
      if (onMentionFile) {
        onMentionFile(file);
      }
    }
    
    setShowMentionDropdown(false);
    setMentionSearch('');
    textarea.focus();
  };
  
  // Handle keyboard navigation in mention dropdown
  const handleMentionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentionDropdown || filteredKnowledgeFiles.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionIndex(prev => (prev + 1) % filteredKnowledgeFiles.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionIndex(prev => (prev - 1 + filteredKnowledgeFiles.length) % filteredKnowledgeFiles.length);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSelectMentionFile(filteredKnowledgeFiles[mentionIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowMentionDropdown(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <footer className="bg-white relative z-10 flex-shrink-0">
      {/* Placeholder styles for contentEditable */}
      <style jsx>{`
        div[data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
      `}</style>
      <div className="w-full max-w-5xl mx-auto px-4 py-4">
        <form onSubmit={onSubmit}>
          {/* Reference image preview */}
          {referenceImageUrl && (
            <div className="mb-3">
              <div className="inline-flex items-center gap-2 bg-[#F3F4F6] border border-[#E5E5E5] rounded-lg p-2">
                <img 
                  src={referenceImageUrl} 
                  alt="Reference" 
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-[#374151]">Reference Image</span>
                  <span className="text-xs text-[#6B7280]">Will be used for image generation</span>
                </div>
                <button
                  type="button"
                  onClick={() => onReferenceImageChange(null)}
                  className="ml-2 text-[#6B7280] hover:text-[#EF4444] transition-colors cursor-pointer"
                  title="Remove reference image"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Attached files & items display */}
          {(attachedFileIds.length > 0 || attachedContentItemIds.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {files.filter(f => attachedFileIds.includes(f.id)).map(file => (
                <span key={file.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F3F4F6] border border-[#E5E5E5] rounded-lg text-xs text-[#374151]">
                  <svg className="w-3.5 h-3.5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                    <polyline points="13 2 13 9 20 9" />
                  </svg>
                  <span className="font-medium">{file.filename}</span>
                  <button type="button" onClick={() => onRemoveFile(file.id)} className="text-[#6B7280] hover:text-[#EF4444] transition-colors cursor-pointer">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </span>
              ))}
              {contentItems.filter(item => attachedContentItemIds.includes(item.id)).map(item => (
                <span key={item.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E5E5E5] rounded-lg text-xs">
                  <svg className="w-3.5 h-3.5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                  <span className="font-medium truncate max-w-[150px]" style={{ background: 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {item.title}
                  </span>
                  <button type="button" onClick={() => onRemoveContentItem(item.id)} className="text-[#6B7280] hover:text-[#EF4444] transition-colors cursor-pointer">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
          
          <div className="relative">
            {/* ContentEditable input area */}
            <div
              ref={editorRef}
              contentEditable={!isLoading}
              onInput={handleEditorInput}
              onKeyDown={handleEditorKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onPaste={handlePaste}
              onBlur={saveSelection}
              data-placeholder="How can I help with your SEO page?"
              className={`w-full px-4 text-base text-[#111827] border border-[#E5E5E5] rounded-3xl focus:outline-none resize-none thin-scrollbar leading-relaxed ${
                isLoading ? 'bg-[#F5F5F5] cursor-not-allowed opacity-60' : 'bg-white'
              }`}
              style={{ 
                minHeight: '120px', 
                paddingTop: '16px', 
                paddingBottom: '48px', 
                overflowY: 'auto',
                maxHeight: '200px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                caretColor: '#111827'
              }}
              suppressContentEditableWarning
            />
            
            {/* @ Mention Dropdown - positioned near cursor */}
            {showMentionDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMentionDropdown(false)} />
                <div 
                  className="absolute w-72 bg-white rounded-xl shadow-lg border border-[#E5E5E5] max-h-64 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
                  style={{
                    top: mentionPosition.top > 60 ? mentionPosition.top - 200 : mentionPosition.top + 24,
                    left: Math.max(16, Math.min(mentionPosition.left, 200))
                  }}
                >
                  <div className="px-3 py-2 border-b border-[#F5F5F5] bg-[#FAFAFA]">
                    <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span className="font-medium">Reference Knowledge File</span>
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-48 thin-scrollbar">
                    {knowledgeFiles.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-[#9CA3AF]">
                        No knowledge files uploaded yet.
                        <br />
                        <span className="text-[10px]">Upload files in the Knowledge section first.</span>
                      </div>
                    ) : filteredKnowledgeFiles.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-[#9CA3AF]">
                        No files match "{mentionSearch}"
                      </div>
                    ) : (
                      filteredKnowledgeFiles.map((file, index) => (
                        <button
                          key={file.id}
                          type="button"
                          onClick={() => insertFileTagAtCursor(file)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors cursor-pointer ${
                            index === mentionIndex ? 'bg-[#EEF2FF]' : 'hover:bg-[#F9FAFB]'
                          }`}
                        >
                          <div className="w-7 h-7 flex items-center justify-center bg-[#F3F4F6] rounded border border-[#E5E5E5] flex-shrink-0">
                            <svg className="w-3.5 h-3.5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-[#111827] truncate">{file.file_name}</div>
                            <div className="text-[10px] text-[#9CA3AF] uppercase">{file.file_type.split('/').pop()}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  {filteredKnowledgeFiles.length > 0 && (
                    <div className="px-3 py-1.5 border-t border-[#F5F5F5] bg-[#FAFAFA]">
                      <div className="text-[10px] text-[#9CA3AF]">
                        <span className="inline-flex items-center gap-1"><kbd className="px-1 py-0.5 bg-white border border-[#E5E5E5] rounded text-[9px]">↑↓</kbd> navigate</span>
                        <span className="mx-2">•</span>
                        <span className="inline-flex items-center gap-1"><kbd className="px-1 py-0.5 bg-white border border-[#E5E5E5] rounded text-[9px]">Enter</kbd> select</span>
                        <span className="mx-2">•</span>
                        <span className="inline-flex items-center gap-1"><kbd className="px-1 py-0.5 bg-white border border-[#E5E5E5] rounded text-[9px]">Esc</kbd> close</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {/* Left controls - Bottom side */}
            <div className="absolute left-3 bottom-4 flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFileSelector(!showFileSelector)}
                  className={`w-7 h-7 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
                    showFileSelector ? 'bg-[#111827] border-[#111827] text-white shadow-sm' : 'bg-[#FAFAFA] border-[#E5E5E5] text-[#6B7280] hover:bg-[#F3F4F6]'
                  }`}
                  title="Add file or planned content"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                
                {showFileSelector && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowFileSelector(false)} />
                    <div className="absolute bottom-full left-0 mb-1 w-80 bg-white rounded-xl shadow-lg border border-[#E5E5E5] flex flex-col max-h-80 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-bottom-left">
                      <div className="px-3 py-2.5 border-b border-[#F5F5F5] bg-[#FAFAFA]">
                        <span className="text-xs font-semibold text-[#111827]">Select a page to generate</span>
                      </div>
                      <div className="p-2 overflow-y-auto thin-scrollbar">
                        {contentItems.filter(item => !(item.status === 'generated' || item.generated_content !== null)).length === 0 ? (
                          <div className="p-4 text-center text-xs text-[#9CA3AF]">
                            No pending pages to generate.
                            <br />
                            <span className="text-[10px]">Create a page blueprint first.</span>
                          </div>
                        ) : (
                          contentItems
                            .filter(item => !(item.status === 'generated' || item.generated_content !== null))
                            .map(item => {
                              const pageTypeColor = 
                                item.page_type === 'blog' ? 'text-blue-600' :
                                item.page_type === 'landing_page' ? 'text-purple-600' :
                                item.page_type === 'comparison' ? 'text-orange-600' :
                                item.page_type === 'alternative' ? 'text-teal-600' :
                                item.page_type === 'guide' ? 'text-green-600' :
                                item.page_type === 'listicle' ? 'text-pink-600' :
                                'text-gray-600';
                              return (
                                <button 
                                  key={item.id} 
                                  type="button" 
                                  onClick={() => {
                                    setShowFileSelector(false);
                                    if (onAutoGeneratePage) {
                                      onAutoGeneratePage(item);
                                    }
                                  }} 
                                  className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg transition-colors cursor-pointer hover:bg-[#F3F4F6] text-[#374151] group"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0 group-hover:border-gray-300">
                                    <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                      <line x1="3" y1="9" x2="21" y2="9" />
                                      <line x1="9" y1="21" x2="9" y2="9" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0 text-left">
                                    <div className="text-xs font-medium truncate mb-0.5 text-[#111827]">{item.title}</div>
                                    <div className="flex items-center gap-1.5 text-[10px]">
                                      <span className={`font-semibold uppercase ${pageTypeColor}`}>{item.page_type || 'blog'}</span>
                                      {item.target_keyword && (
                                        <>
                                          <span className="text-[#D1D5DB]">•</span>
                                          <span className="text-[#9CA3AF] truncate">{item.target_keyword}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7"/>
                                  </svg>
                                </button>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

            </div>
            
            {/* Right controls - Send button */}
            <div className="absolute right-3 bottom-4 flex items-center gap-1.5">
              {isLoading ? (
                <button type="button" onClick={onStop} className="bg-[#EF4444] text-white w-9 h-9 rounded-full hover:bg-[#DC2626] transition-all hover:scale-105 flex items-center justify-center" title="Stop generation">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                </button>
              ) : (
                <button type="submit" disabled={!input.trim()} className="bg-[#000000] text-white w-9 h-9 rounded-full hover:bg-[#111827] disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 disabled:hover:scale-100 flex items-center justify-center" title="Send message">
                  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </footer>
  );
}
