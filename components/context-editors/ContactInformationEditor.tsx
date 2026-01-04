'use client';

import { useState, useEffect } from 'react';
import type { ContactInformationContent } from '@/lib/supabase';

interface ContactInformationEditorProps {
  initialContent?: string;
  onContentChange: (content: string) => void;
}

export default function ContactInformationEditor({
  initialContent,
  onContentChange,
}: ContactInformationEditorProps) {
  const [contactData, setContactData] = useState<ContactInformationContent>({
    primaryContact: '',
    locationHours: '',
    supportChannels: '',
    additional: '',
  });

  useEffect(() => {
    if (initialContent) {
      try {
        const parsed = JSON.parse(initialContent);
        setContactData(parsed);
      } catch (e) {
        console.error('Failed to parse contact information content:', e);
      }
    }
  }, [initialContent]);

  const handleChange = (field: keyof ContactInformationContent, value: string) => {
    const updated = { ...contactData, [field]: value };
    setContactData(updated);
    onContentChange(JSON.stringify(updated));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Primary Contact
        </label>
        <textarea
          value={contactData.primaryContact || ''}
          onChange={(e) => handleChange('primaryContact', e.target.value)}
          placeholder="Email, phone number, contact form URL"
          rows={2}
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Location & Hours
        </label>
        <textarea
          value={contactData.locationHours || ''}
          onChange={(e) => handleChange('locationHours', e.target.value)}
          placeholder="Physical address, business hours, timezone"
          rows={3}
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Support Channels
        </label>
        <textarea
          value={contactData.supportChannels || ''}
          onChange={(e) => handleChange('supportChannels', e.target.value)}
          placeholder="Live chat, support email, helpdesk URL, social media"
          rows={2}
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Additional Information
        </label>
        <textarea
          value={contactData.additional || ''}
          onChange={(e) => handleChange('additional', e.target.value)}
          placeholder="Emergency contact, media inquiries, partnerships"
          rows={2}
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] resize-none"
        />
      </div>
    </div>
  );
}

