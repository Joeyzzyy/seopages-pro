'use client';

import { useState, useEffect } from 'react';

interface TextContentEditorProps {
  initialContent?: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
}

export default function TextContentEditor({
  initialContent,
  onContentChange,
  placeholder = 'Enter content here...',
  rows = 6,
  label,
}: TextContentEditorProps) {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
    }
  }, [initialContent]);

  const handleChange = (value: string) => {
    setContent(value);
    onContentChange(value);
  };

  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          {label}
        </label>
      )}
      <textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] resize-none"
      />
    </div>
  );
}

