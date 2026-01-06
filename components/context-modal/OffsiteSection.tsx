'use client';

import { useState, useRef } from 'react';
import type { OffsiteSectionProps, LinkItem } from './types';

// Helper component for keyword tags (inline style)
const KeywordTags = ({ 
  keywords, 
  onAdd, 
  onRemove, 
  placeholder 
}: { 
  keywords: string[]; 
  onAdd: (keyword: string) => void; 
  onRemove: (index: number) => void; 
  placeholder: string;
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      onAdd(inputValue.trim());
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && keywords.length > 0) {
      // 当输入框为空且按退格键时，删除最后一个标签
      onRemove(keywords.length - 1);
    }
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div 
      onClick={handleContainerClick}
      className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 border border-[#D1D5DB] rounded-lg bg-white cursor-text min-h-[36px] focus-within:ring-2 focus-within:ring-[#9A8FEA] focus-within:border-transparent"
    >
      {keywords.map((keyword, index) => (
        <span 
          key={index} 
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F3F4F6] text-[#374151] rounded-full text-xs shrink-0"
        >
          {keyword}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
            className="hover:text-[#EF4444] text-[#9CA3AF] transition-colors"
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={keywords.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[100px] text-xs outline-none bg-transparent"
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

// Helper component for link items
const LinkItemList = ({ 
  items, 
  onAdd, 
  onRemove, 
  addLabel 
}: { 
  items: LinkItem[]; 
  onAdd: (platform: string, url: string) => void; 
  onRemove: (index: number) => void; 
  addLabel: string;
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [platform, setPlatform] = useState('');
  const [url, setUrl] = useState('');

  const handleAdd = () => {
    if (platform.trim() && url.trim()) {
      onAdd(platform.trim(), url.trim());
      setPlatform('');
      setUrl('');
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-1.5">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2 p-2 bg-[#F9FAFB] rounded-lg">
          <span className="px-2 py-0.5 bg-[#F3F4F6] text-[#374151] rounded text-[10px] font-medium min-w-[70px] text-center">
            {item.platform}
          </span>
          <span className="flex-1 text-xs text-[#6B7280] truncate">{item.url}</span>
          <button
            onClick={() => onRemove(index)}
            className="px-2 py-0.5 text-xs text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEE2E2] rounded"
          >
            ×
          </button>
        </div>
      ))}
      
      {showAddForm ? (
        <div className="p-2 bg-[#F9FAFB] rounded-lg space-y-2">
          <input
            type="text"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="Platform (e.g., Twitter, LinkedIn)"
            className="w-full px-2.5 py-1.5 border border-[#D1D5DB] rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
          />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL (e.g., https://twitter.com/...)"
            className="w-full px-2.5 py-1.5 border border-[#D1D5DB] rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#9A8FEA]"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 px-2.5 py-1.5 bg-[#111827] text-white rounded text-xs hover:bg-[#374151]"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-2.5 py-1.5 border border-[#D1D5DB] rounded text-xs hover:bg-[#F3F4F6]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setShowAddForm(true)}
          className="w-full px-2.5 py-1.5 border border-dashed border-[#D1D5DB] rounded-lg text-xs text-[#6B7280] hover:border-[#9CA3AF] hover:text-[#374151] transition-colors"
        >
          + {addLabel}
        </button>
      )}
    </div>
  );
};

// Empty state indicator
const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-4 text-[#9CA3AF] text-xs italic">
    {message}
  </div>
);

export default function OffsiteSection({ 
  offsiteContext, 
  onOffsiteContextChange, 
  isLoading = false 
}: OffsiteSectionProps) {
  // Helper to update keywords
  const updateKeywords = (field: string, keywords: string[]) => {
    onOffsiteContextChange({ [field]: keywords });
  };

  // Helper to add keyword
  const addKeyword = (field: string, keyword: string) => {
    const current = (offsiteContext as any)?.[field] || [];
    if (!current.includes(keyword)) {
      updateKeywords(field, [...current, keyword]);
    }
  };

  // Helper to remove keyword
  const removeKeyword = (field: string, index: number) => {
    const current = (offsiteContext as any)?.[field] || [];
    updateKeywords(field, current.filter((_: string, i: number) => i !== index));
  };

  // Helper to update link items
  const updateLinkItems = (field: string, items: LinkItem[]) => {
    onOffsiteContextChange({ [field]: items });
  };

  // Helper to add link item
  const addLinkItem = (field: string, platform: string, url: string) => {
    const current = (offsiteContext as any)?.[field] || [];
    updateLinkItems(field, [...current, { platform, url }]);
  };

  // Helper to remove link item
  const removeLinkItem = (field: string, index: number) => {
    const current = (offsiteContext as any)?.[field] || [];
    updateLinkItems(field, current.filter((_: LinkItem, i: number) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#9A8FEA]"></div>
        <span className="ml-2 text-sm text-[#6B7280]">Loading offsite context...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== Monitoring Scope ===== */}
      <section id="offsite-monitoring">
        <h3 className="text-base font-semibold text-[#111827] mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Monitoring Scope
          <span className="ml-auto text-xs font-normal text-[#9CA3AF]">
            {(offsiteContext?.brand_keywords?.length || 0) + 
             (offsiteContext?.product_keywords?.length || 0) + 
             (offsiteContext?.hashtags?.length || 0)} items
          </span>
        </h3>
        <div className="space-y-3 bg-[#F9FAFB] p-3 rounded-lg">
          {/* Brand Keywords */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Brand Keywords</label>
            <KeywordTags
              keywords={offsiteContext?.brand_keywords || []}
              onAdd={(k) => addKeyword('brand_keywords', k)}
              onRemove={(i) => removeKeyword('brand_keywords', i)}
              placeholder="Press Enter to add (e.g., Brand Name, @handle)"
            />
          </div>

          {/* Product Keywords */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Product Keywords</label>
            <KeywordTags
              keywords={offsiteContext?.product_keywords || []}
              onAdd={(k) => addKeyword('product_keywords', k)}
              onRemove={(i) => removeKeyword('product_keywords', i)}
              placeholder="Press Enter to add (e.g., SEO tool, AI writing)"
            />
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Hashtags</label>
            <KeywordTags
              keywords={offsiteContext?.hashtags || []}
              onAdd={(k) => addKeyword('hashtags', k)}
              onRemove={(i) => removeKeyword('hashtags', i)}
              placeholder="Press Enter to add (e.g., #brandname)"
            />
          </div>

          {/* Key Persons */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Key Persons</label>
            <KeywordTags
              keywords={offsiteContext?.key_persons || []}
              onAdd={(k) => addKeyword('key_persons', k)}
              onRemove={(i) => removeKeyword('key_persons', i)}
              placeholder="Press Enter to add (e.g., CEO Name)"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Regions */}
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">Regions</label>
              <KeywordTags
                keywords={offsiteContext?.regions || []}
                onAdd={(k) => addKeyword('regions', k)}
                onRemove={(i) => removeKeyword('regions', i)}
                placeholder="Add region"
              />
            </div>

            {/* Languages */}
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">Languages</label>
              <KeywordTags
                keywords={offsiteContext?.languages || []}
                onAdd={(k) => addKeyword('languages', k)}
                onRemove={(i) => removeKeyword('languages', i)}
                placeholder="Add language"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Owned Presence ===== */}
      <section id="offsite-owned">
        <h3 className="text-base font-semibold text-[#111827] mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Owned Presence
          <span className="ml-auto text-xs font-normal text-[#9CA3AF]">
            {(offsiteContext?.official_channels?.length || 0) + 
             (offsiteContext?.executive_accounts?.length || 0)} channels
          </span>
        </h3>
        <div className="space-y-3">
          {/* Official Channels */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Official Channels</label>
            <LinkItemList
              items={offsiteContext?.official_channels || []}
              onAdd={(p, u) => addLinkItem('official_channels', p, u)}
              onRemove={(i) => removeLinkItem('official_channels', i)}
              addLabel="Add Official Channel"
            />
          </div>

          {/* Executive Accounts */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Executive Accounts</label>
            <LinkItemList
              items={offsiteContext?.executive_accounts || []}
              onAdd={(p, u) => addLinkItem('executive_accounts', p, u)}
              onRemove={(i) => removeLinkItem('executive_accounts', i)}
              addLabel="Add Executive Account"
            />
          </div>
        </div>
      </section>

      {/* ===== Reviews & Listings ===== */}
      <section id="offsite-reviews">
        <h3 className="text-base font-semibold text-[#111827] mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Reviews & Listings
          <span className="ml-auto text-xs font-normal text-[#9CA3AF]">
            {(offsiteContext?.review_platforms?.length || 0) + 
             (offsiteContext?.directories?.length || 0) + 
             (offsiteContext?.storefronts?.length || 0)} listings
          </span>
        </h3>
        <div className="space-y-3">
          {/* Review Platforms */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Review Platforms</label>
            <LinkItemList
              items={offsiteContext?.review_platforms || []}
              onAdd={(p, u) => addLinkItem('review_platforms', p, u)}
              onRemove={(i) => removeLinkItem('review_platforms', i)}
              addLabel="Add Review Platform"
            />
          </div>

          {/* Directories */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Directories</label>
            <LinkItemList
              items={offsiteContext?.directories || []}
              onAdd={(p, u) => addLinkItem('directories', p, u)}
              onRemove={(i) => removeLinkItem('directories', i)}
              addLabel="Add Directory"
            />
          </div>

          {/* Storefronts */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Storefronts</label>
            <LinkItemList
              items={offsiteContext?.storefronts || []}
              onAdd={(p, u) => addLinkItem('storefronts', p, u)}
              onRemove={(i) => removeLinkItem('storefronts', i)}
              addLabel="Add Storefront"
            />
          </div>
        </div>
      </section>

      {/* ===== Community ===== */}
      <section id="offsite-community">
        <h3 className="text-base font-semibold text-[#111827] mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Community
          <span className="ml-auto text-xs font-normal text-[#9CA3AF]">
            {(offsiteContext?.forums?.length || 0) + 
             (offsiteContext?.qa_platforms?.length || 0) + 
             (offsiteContext?.branded_groups?.length || 0)} communities
          </span>
        </h3>
        <div className="space-y-3">
          {/* Forums */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Forums</label>
            <LinkItemList
              items={offsiteContext?.forums || []}
              onAdd={(p, u) => addLinkItem('forums', p, u)}
              onRemove={(i) => removeLinkItem('forums', i)}
              addLabel="Add Forum"
            />
          </div>

          {/* Q&A Platforms */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Q&A Platforms</label>
            <LinkItemList
              items={offsiteContext?.qa_platforms || []}
              onAdd={(p, u) => addLinkItem('qa_platforms', p, u)}
              onRemove={(i) => removeLinkItem('qa_platforms', i)}
              addLabel="Add Q&A Platform"
            />
          </div>

          {/* Groups */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Branded Groups</label>
            <LinkItemList
              items={offsiteContext?.branded_groups || []}
              onAdd={(p, u) => addLinkItem('branded_groups', p, u)}
              onRemove={(i) => removeLinkItem('branded_groups', i)}
              addLabel="Add Group"
            />
          </div>
        </div>
      </section>

      {/* ===== Media ===== */}
      <section id="offsite-media">
        <h3 className="text-base font-semibold text-[#111827] mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Media
          <span className="ml-auto text-xs font-normal text-[#9CA3AF]">
            {(offsiteContext?.media_channels?.length || 0) + 
             (offsiteContext?.coverage?.length || 0) + 
             (offsiteContext?.events?.length || 0)} items
          </span>
        </h3>
        <div className="space-y-3">
          {/* Media Channels */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Media Channels</label>
            <LinkItemList
              items={offsiteContext?.media_channels || []}
              onAdd={(p, u) => addLinkItem('media_channels', p, u)}
              onRemove={(i) => removeLinkItem('media_channels', i)}
              addLabel="Add Media Channel"
            />
          </div>

          {/* Coverage */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Coverage</label>
            <LinkItemList
              items={offsiteContext?.coverage || []}
              onAdd={(p, u) => addLinkItem('coverage', p, u)}
              onRemove={(i) => removeLinkItem('coverage', i)}
              addLabel="Add Coverage"
            />
          </div>

          {/* Events */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Events</label>
            <LinkItemList
              items={offsiteContext?.events || []}
              onAdd={(p, u) => addLinkItem('events', p, u)}
              onRemove={(i) => removeLinkItem('events', i)}
              addLabel="Add Event"
            />
          </div>
        </div>
      </section>

      {/* ===== KOLs ===== */}
      <section id="offsite-kols">
        <h3 className="text-base font-semibold text-[#111827] mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Key Opinion Leaders (KOLs)
          <span className="ml-auto text-xs font-normal text-[#9CA3AF]">
            {(offsiteContext?.creators?.length || 0) + 
             (offsiteContext?.experts?.length || 0) + 
             (offsiteContext?.press_contacts?.length || 0)} contacts
          </span>
        </h3>
        <div className="space-y-3">
          {/* Creators */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Creators</label>
            <LinkItemList
              items={offsiteContext?.creators || []}
              onAdd={(p, u) => addLinkItem('creators', p, u)}
              onRemove={(i) => removeLinkItem('creators', i)}
              addLabel="Add Creator"
            />
          </div>

          {/* Experts */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Experts</label>
            <LinkItemList
              items={offsiteContext?.experts || []}
              onAdd={(p, u) => addLinkItem('experts', p, u)}
              onRemove={(i) => removeLinkItem('experts', i)}
              addLabel="Add Expert"
            />
          </div>

          {/* Press */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Press/Journalists</label>
            <LinkItemList
              items={offsiteContext?.press_contacts || []}
              onAdd={(p, u) => addLinkItem('press_contacts', p, u)}
              onRemove={(i) => removeLinkItem('press_contacts', i)}
              addLabel="Add Press Contact"
            />
          </div>
        </div>
      </section>

      {/* No Data State */}
      {!offsiteContext && (
        <EmptyState message="No offsite context found. Use the chat to acquire offsite information for this project." />
      )}
    </div>
  );
}
