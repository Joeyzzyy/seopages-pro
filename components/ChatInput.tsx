'use client';

import { useState, useRef } from 'react';
import ActionHints from './ActionHints';
import { supabase } from '@/lib/supabase';
import type { FileRecord, ContentItem } from '@/lib/supabase';

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
  tokenStats: { inputTokens: number; outputTokens: number };
  apiStats: { tavilyCalls: number; semrushCalls: number; serperCalls: number };
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStop: () => void;
  onAttachFile: (fileId: string) => void;
  onRemoveFile: (fileId: string) => void;
  onAttachContentItem: (itemId: string) => void;
  onRemoveContentItem: (itemId: string) => void;
  onPlaybookClick: (skill: any) => void;
  onReferenceImageChange: (url: string | null) => void;
  onUploadSuccess?: () => void;
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
  tokenStats,
  apiStats,
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
}: ChatInputProps) {
  const [isComposing, setIsComposing] = useState(false);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [selectorTab, setSelectorTab] = useState<'files' | 'content'>('content');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            <textarea
              value={input}
              onChange={handleTextareaChange}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
                  e.preventDefault();
                  onSubmit(e as any);
                }
              }}
              placeholder="Ask me anything about SEO & GEO..."
              disabled={isLoading}
              rows={1}
              className="w-full px-4 text-base border border-[#E5E5E5] rounded-3xl focus:outline-none disabled:bg-[#F5F5F5] disabled:cursor-not-allowed resize-none placeholder:text-[#9CA3AF] thin-scrollbar"
              style={{ minHeight: '120px', paddingTop: '16px', paddingBottom: '48px', overflowY: 'hidden' }}
            />
            
            {/* Left controls - Bottom side */}
            <div className="absolute left-3 bottom-4 flex items-center gap-2">
              {/* Image upload button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage || isLoading}
                  className={`w-7 h-7 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
                    uploadingImage
                      ? 'bg-[#F3F4F6] border-[#E5E5E5] text-[#9CA3AF]'
                      : referenceImageUrl
                      ? 'bg-[#10B981] border-[#10B981] text-white shadow-sm'
                      : 'bg-[#FAFAFA] border-[#E5E5E5] text-[#6B7280] hover:bg-[#F3F4F6]'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title="Upload reference image for generation"
                >
                  {uploadingImage ? (
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  )}
                </button>
              </div>

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
                    <div className="absolute bottom-full left-0 mb-1 w-72 bg-white rounded-xl shadow-lg border border-[#E5E5E5] flex flex-col max-h-80 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-bottom-left">
                      <div className="flex border-b border-[#F5F5F5] bg-[#FAFAFA]">
                        <button type="button" onClick={() => setSelectorTab('content')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${selectorTab === 'content' ? 'text-[#111827] bg-white' : 'text-[#9CA3AF] hover:text-[#6B7280]'}`}>Planned Content</button>
                        <button type="button" onClick={() => setSelectorTab('files')} className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-wider transition-colors ${selectorTab === 'files' ? 'text-[#111827] bg-white' : 'text-[#9CA3AF] hover:text-[#6B7280]'}`}>Artifacts</button>
                      </div>
                      <div className="p-2 overflow-y-auto thin-scrollbar">
                        {selectorTab === 'files' ? (
                          files.length === 0 ? <div className="p-4 text-center text-xs text-[#9CA3AF] italic">No artifacts available</div> :
                          files.map(file => {
                            const isAttached = attachedFileIds.includes(file.id);
                            return (
                              <button key={file.id} type="button" onClick={() => onAttachFile(file.id)} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors cursor-pointer hover:bg-[#F3F4F6] text-[#374151]">
                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${isAttached ? 'bg-[#111827] border-[#111827]' : 'border-[#E5E5E5]'}`}>
                                  {isAttached && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                  <div className="text-xs font-medium truncate">{file.filename}</div>
                                  <div className="text-[10px] text-[#9CA3AF]">{formatDate(file.created_at)}</div>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          contentItems.length === 0 ? <div className="p-4 text-center text-xs text-[#9CA3AF] italic">No planned content yet</div> :
                          contentItems.map(item => {
                            const isAttached = attachedContentItemIds.includes(item.id);
                            const isGenerated = item.status === 'generated' || item.generated_content !== null;
                            const pageTypeColor = 
                              item.page_type === 'blog' ? 'text-blue-600' :
                              item.page_type === 'landing_page' ? 'text-purple-600' :
                              item.page_type === 'comparison' ? 'text-orange-600' :
                              item.page_type === 'guide' ? 'text-green-600' :
                              item.page_type === 'listicle' ? 'text-pink-600' :
                              'text-gray-600';
                            return (
                              <button key={item.id} type="button" onClick={() => onAttachContentItem(item.id)} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors cursor-pointer hover:bg-[#F3F4F6] text-[#374151]">
                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${isAttached ? 'bg-blue-600 border-blue-600' : 'border-[#E5E5E5]'}`}>
                                  {isAttached && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <div className="text-xs font-medium truncate">{item.title}</div>
                                    {isGenerated && (
                                      <span className="flex-shrink-0 px-1.5 py-0.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded text-[9px] font-bold text-green-700">
                                        ✓ Generated
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    <span className={`font-medium ${pageTypeColor}`}>{item.page_type || 'blog'}</span>
                                    <span className="text-[#D1D5DB]">•</span>
                                    <span className="text-[#9CA3AF]">{item.target_keyword}</span>
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action Hints Dropdown */}
              <ActionHints skills={skills} onPlaybookClick={onPlaybookClick} />
              
              {/* Conversation Stats */}
              {conversationId && (
                <div className="flex items-center gap-3 ml-3 text-[10px] text-[#6B7280] border-l border-[#E5E5E5] pl-3">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-[#9CA3AF]">Input Tokens:</span>
                    <span className="font-bold text-[#111827]">{tokenStats.inputTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-[#9CA3AF]">Output Tokens:</span>
                    <span className="font-bold text-[#111827]">{tokenStats.outputTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-[#9CA3AF]">Tavily:</span>
                    <span className="font-bold text-[#111827]">{apiStats.tavilyCalls}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-[#9CA3AF]">Semrush:</span>
                    <span className="font-bold text-[#111827]">{apiStats.semrushCalls}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-[#9CA3AF]">Serper:</span>
                    <span className="font-bold text-[#111827]">{apiStats.serperCalls}</span>
                  </div>
                </div>
              )}
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
