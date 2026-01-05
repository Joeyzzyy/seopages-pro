'use client';

import { useState, useEffect } from 'react';

interface ContactData {
  // From extraction tool
  emails?: string[];
  phones?: string[];
  social?: Record<string, string>;
  address?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  // Legacy fields
  primaryContact?: string;
  locationHours?: string;
  supportChannels?: string;
  additional?: string;
}

interface ContactInformationEditorProps {
  initialContent?: string;
  onContentChange: (content: string) => void;
}

export default function ContactInformationEditor({
  initialContent,
  onContentChange,
}: ContactInformationEditorProps) {
  const [contactData, setContactData] = useState<ContactData>({});

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

  const handleChange = (field: keyof ContactData, value: any) => {
    const updated = { ...contactData, [field]: value };
    setContactData(updated);
    onContentChange(JSON.stringify(updated));
  };

  const handleEmailChange = (index: number, value: string) => {
    const emails = [...(contactData.emails || [])];
    emails[index] = value;
    handleChange('emails', emails);
    if (index === 0) handleChange('primaryEmail', value);
  };

  const handlePhoneChange = (index: number, value: string) => {
    const phones = [...(contactData.phones || [])];
    phones[index] = value;
    handleChange('phones', phones);
    if (index === 0) handleChange('primaryPhone', value);
  };

  const handleSocialChange = (platform: string, value: string) => {
    const social = { ...(contactData.social || {}), [platform]: value };
    handleChange('social', social);
  };

  const addEmail = () => {
    const emails = [...(contactData.emails || []), ''];
    handleChange('emails', emails);
  };

  const addPhone = () => {
    const phones = [...(contactData.phones || []), ''];
    handleChange('phones', phones);
  };

  const removeEmail = (index: number) => {
    const emails = (contactData.emails || []).filter((_, i) => i !== index);
    handleChange('emails', emails);
  };

  const removePhone = (index: number) => {
    const phones = (contactData.phones || []).filter((_, i) => i !== index);
    handleChange('phones', phones);
  };

  const socialPlatforms = ['twitter', 'linkedin', 'facebook', 'instagram', 'youtube', 'github'];

  return (
    <div className="space-y-4">
      {/* Emails */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-[#6B7280]">
            Email Addresses
          </label>
          <button
            type="button"
            onClick={addEmail}
            className="text-xs text-[#9A8FEA] hover:text-[#8A7FDA] font-medium"
          >
            + Add Email
          </button>
        </div>
        {(contactData.emails?.length || 0) === 0 ? (
          <div className="text-sm text-[#9CA3AF] italic py-2">No emails found</div>
        ) : (
          <div className="space-y-2">
            {contactData.emails?.map((email, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  placeholder="email@example.com"
                  className="flex-1 px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF]"
                />
                <button
                  type="button"
                  onClick={() => removeEmail(index)}
                  className="px-2 text-[#9CA3AF] hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phones */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-[#6B7280]">
            Phone Numbers
          </label>
          <button
            type="button"
            onClick={addPhone}
            className="text-xs text-[#9A8FEA] hover:text-[#8A7FDA] font-medium"
          >
            + Add Phone
          </button>
        </div>
        {(contactData.phones?.length || 0) === 0 ? (
          <div className="text-sm text-[#9CA3AF] italic py-2">No phone numbers found</div>
        ) : (
          <div className="space-y-2">
            {contactData.phones?.map((phone, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(index, e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="flex-1 px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF]"
                />
                <button
                  type="button"
                  onClick={() => removePhone(index)}
                  className="px-2 text-[#9CA3AF] hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Address */}
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Address
        </label>
        <textarea
          value={contactData.address || ''}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="Physical address, city, country"
          rows={2}
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] resize-none"
        />
      </div>

      {/* Social Links */}
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Social Media
        </label>
        <div className="space-y-2">
          {socialPlatforms.map((platform) => {
            const value = contactData.social?.[platform] || '';
            const hasValue = !!value;
            
            return (
              <div key={platform} className="flex items-center gap-2">
                <span className={`w-20 text-xs font-medium capitalize ${hasValue ? 'text-[#374151]' : 'text-[#9CA3AF]'}`}>
                  {platform}
                </span>
                <input
                  type="url"
                  value={value}
                  onChange={(e) => handleSocialChange(platform, e.target.value)}
                  placeholder={`https://${platform}.com/...`}
                  className="flex-1 px-3 py-1.5 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF]"
                />
                {hasValue && (
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#9A8FEA] hover:text-[#8A7FDA]"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
