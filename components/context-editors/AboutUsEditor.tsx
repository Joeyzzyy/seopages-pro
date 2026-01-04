'use client';

import { useState, useEffect } from 'react';
import type { AboutUsContent } from '@/lib/supabase';

interface AboutUsEditorProps {
  initialContent?: string;
  onContentChange: (content: string) => void;
}

export default function AboutUsEditor({
  initialContent,
  onContentChange,
}: AboutUsEditorProps) {
  const [aboutData, setAboutData] = useState<AboutUsContent>({
    companyStory: '',
    missionVision: '',
    coreValues: '',
  });

  useEffect(() => {
    if (initialContent) {
      try {
        const parsed = JSON.parse(initialContent);
        setAboutData(parsed);
      } catch (e) {
        console.error('Failed to parse about us content:', e);
      }
    }
  }, [initialContent]);

  const handleChange = (field: keyof AboutUsContent, value: string) => {
    const updated = { ...aboutData, [field]: value };
    setAboutData(updated);
    onContentChange(JSON.stringify(updated));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Company Story
        </label>
        <textarea
          value={aboutData.companyStory || ''}
          onChange={(e) => handleChange('companyStory', e.target.value)}
          placeholder="Your company's origin story and journey"
          rows={4}
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Mission & Vision
        </label>
        <textarea
          value={aboutData.missionVision || ''}
          onChange={(e) => handleChange('missionVision', e.target.value)}
          placeholder="Company mission statement and vision for the future"
          rows={3}
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Core Values
        </label>
        <textarea
          value={aboutData.coreValues || ''}
          onChange={(e) => handleChange('coreValues', e.target.value)}
          placeholder="Company values and principles"
          rows={3}
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] resize-none"
        />
      </div>
    </div>
  );
}

