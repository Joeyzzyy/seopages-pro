'use client';

import { useState, useEffect } from 'react';

interface UrlListEditorProps {
  initialContent?: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  label?: string;
  emptyMessage?: string;
}

export default function UrlListEditor({
  initialContent,
  onContentChange,
  placeholder = 'Enter URLs, one per line...',
  label,
  emptyMessage = 'No pages found',
}: UrlListEditorProps) {
  const [urls, setUrls] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (initialContent) {
      try {
        const parsed = JSON.parse(initialContent);
        if (Array.isArray(parsed)) {
          setUrls(parsed);
        } else if (typeof parsed === 'object' && parsed.urls) {
          setUrls(parsed.urls);
        }
      } catch {
        // If not JSON, treat as newline-separated URLs
        const lines = initialContent.split('\n').filter(l => l.trim());
        setUrls(lines);
      }
    }
  }, [initialContent]);

  const handleSaveEdit = () => {
    const newUrls = editText.split('\n').filter(l => l.trim());
    setUrls(newUrls);
    onContentChange(JSON.stringify(newUrls));
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setEditText(urls.join('\n'));
    setIsEditing(true);
  };

  const displayLimit = 5;
  const hasMore = urls.length > displayLimit;
  const displayUrls = isExpanded ? urls : urls.slice(0, displayLimit);

  // Extract path from URL for cleaner display
  const getDisplayPath = (url: string): string => {
    try {
      const parsed = new URL(url);
      return parsed.pathname === '/' ? '/' : parsed.pathname;
    } catch {
      return url;
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-xs font-medium text-[#6B7280]">
            {label}
          </label>
        )}
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          placeholder={placeholder}
          rows={8}
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] resize-none font-mono"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSaveEdit}
            className="px-3 py-1.5 text-xs font-medium text-white bg-[#9A8FEA] rounded-lg hover:bg-[#8A7FDA] transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:text-[#374151] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-medium text-[#6B7280]">
          {label}
        </label>
      )}
      
      <div className="border border-[#E5E5E5] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#F9FAFB] border-b border-[#E5E5E5]">
          <span className="text-xs font-medium text-[#6B7280]">
            {urls.length} {urls.length === 1 ? 'page' : 'pages'}
          </span>
          <button
            type="button"
            onClick={handleStartEdit}
            className="text-xs text-[#9A8FEA] hover:text-[#8A7FDA] font-medium transition-colors"
          >
            Edit
          </button>
        </div>

        {/* URL List */}
        {urls.length === 0 ? (
          <div className="px-3 py-4 text-sm text-[#9CA3AF] italic text-center">
            {emptyMessage}
          </div>
        ) : (
          <div className="divide-y divide-[#F3F4F6]">
            {displayUrls.map((url, index) => (
              <div
                key={index}
                className="px-3 py-2 hover:bg-[#F9FAFB] transition-colors group flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5 text-[#9CA3AF] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#374151] hover:text-[#9A8FEA] truncate flex-1"
                  title={url}
                >
                  {getDisplayPath(url)}
                </a>
                <svg 
                  className="w-3.5 h-3.5 text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </div>
            ))}
          </div>
        )}

        {/* Show More/Less */}
        {hasMore && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-3 py-2 text-xs font-medium text-[#6B7280] hover:text-[#374151] bg-[#F9FAFB] border-t border-[#E5E5E5] transition-colors"
          >
            {isExpanded 
              ? 'Show less' 
              : `Show ${urls.length - displayLimit} more...`}
          </button>
        )}
      </div>
    </div>
  );
}

