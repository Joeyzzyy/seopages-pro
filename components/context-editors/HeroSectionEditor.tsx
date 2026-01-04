'use client';

import { useState, useEffect } from 'react';
import type { HeroSectionContent } from '@/lib/supabase';

interface HeroSectionEditorProps {
  initialContent?: string;
  onContentChange: (content: string) => void;
}

export default function HeroSectionEditor({
  initialContent,
  onContentChange,
}: HeroSectionEditorProps) {
  const [heroData, setHeroData] = useState<HeroSectionContent>({
    headline: '',
    subheadline: '',
    callToAction: '',
    media: '',
    metrics: '',
  });

  useEffect(() => {
    if (initialContent) {
      try {
        const parsed = JSON.parse(initialContent);
        setHeroData(parsed);
      } catch (e) {
        console.error('Failed to parse hero section content:', e);
      }
    }
  }, [initialContent]);

  const handleChange = (field: keyof HeroSectionContent, value: string) => {
    const updated = { ...heroData, [field]: value };
    setHeroData(updated);
    onContentChange(JSON.stringify(updated));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Headline
        </label>
        <input
          type="text"
          value={heroData.headline || ''}
          onChange={(e) => handleChange('headline', e.target.value)}
          placeholder="Your main headline"
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF]"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Subheadline
        </label>
        <input
          type="text"
          value={heroData.subheadline || ''}
          onChange={(e) => handleChange('subheadline', e.target.value)}
          placeholder="Supporting text or value proposition"
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF]"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Call to Action
        </label>
        <input
          type="text"
          value={heroData.callToAction || ''}
          onChange={(e) => handleChange('callToAction', e.target.value)}
          placeholder="e.g., Get Started, Learn More"
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF]"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Media (URL)
        </label>
        <input
          type="text"
          value={heroData.media || ''}
          onChange={(e) => handleChange('media', e.target.value)}
          placeholder="Image or video URL"
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF]"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Metrics
        </label>
        <textarea
          value={heroData.metrics || ''}
          onChange={(e) => handleChange('metrics', e.target.value)}
          placeholder="e.g., 10,000+ customers, 99.9% uptime"
          rows={2}
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] resize-none"
        />
      </div>
    </div>
  );
}

