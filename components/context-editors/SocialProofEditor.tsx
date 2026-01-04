'use client';

import { useState, useEffect } from 'react';
import type { SocialProofContent } from '@/lib/supabase';

interface SocialProofEditorProps {
  initialContent?: string;
  onContentChange: (content: string) => void;
}

export default function SocialProofEditor({
  initialContent,
  onContentChange,
}: SocialProofEditorProps) {
  const [socialProofData, setSocialProofData] = useState<SocialProofContent>({
    testimonials: '',
    caseStudies: '',
    badges: '',
    awards: '',
    guarantees: '',
    integrations: '',
  });

  useEffect(() => {
    if (initialContent) {
      try {
        const parsed = JSON.parse(initialContent);
        setSocialProofData(parsed);
      } catch (e) {
        console.error('Failed to parse social proof content:', e);
      }
    }
  }, [initialContent]);

  const handleChange = (field: keyof SocialProofContent, value: string) => {
    const updated = { ...socialProofData, [field]: value };
    setSocialProofData(updated);
    onContentChange(JSON.stringify(updated));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Testimonials
        </label>
        <textarea
          value={socialProofData.testimonials || ''}
          onChange={(e) => handleChange('testimonials', e.target.value)}
          placeholder="Customer testimonials and reviews"
          rows={3}
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Case Studies
        </label>
        <textarea
          value={socialProofData.caseStudies || ''}
          onChange={(e) => handleChange('caseStudies', e.target.value)}
          placeholder="Success stories and case studies"
          rows={3}
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Badges & Certifications
        </label>
        <input
          type="text"
          value={socialProofData.badges || ''}
          onChange={(e) => handleChange('badges', e.target.value)}
          placeholder="Security badges, certifications"
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF]"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Awards
        </label>
        <input
          type="text"
          value={socialProofData.awards || ''}
          onChange={(e) => handleChange('awards', e.target.value)}
          placeholder="Industry awards and recognition"
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF]"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Guarantees
        </label>
        <input
          type="text"
          value={socialProofData.guarantees || ''}
          onChange={(e) => handleChange('guarantees', e.target.value)}
          placeholder="Money-back guarantee, warranty information"
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF]"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Integrations
        </label>
        <input
          type="text"
          value={socialProofData.integrations || ''}
          onChange={(e) => handleChange('integrations', e.target.value)}
          placeholder="Partner logos and integrations"
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF]"
        />
      </div>
    </div>
  );
}

