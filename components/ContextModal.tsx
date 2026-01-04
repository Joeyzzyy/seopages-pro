'use client';

import { useState, useEffect } from 'react';
import type { SiteContext } from '@/lib/supabase';

interface ContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteContexts: SiteContext[];
  onSave: (updates: { [key: string]: string }) => Promise<void>;
}

type TabType = 'onsite' | 'offsite' | 'knowledge';

export default function ContextModal({
  isOpen,
  onClose,
  siteContexts,
  onSave,
}: ContextModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('onsite');
  const [isSaving, setIsSaving] = useState(false);
  
  // Form states for all fields
  const [formData, setFormData] = useState({
    logo: '',
    url: '',
    colors: '',
    typography: '',
    tone: '',
    languages: '',
    header: '',
    footer: '',
    meta: '',
    sitemap: '',
  });

  // Initialize form data from siteContexts
  useEffect(() => {
    if (isOpen) {
      const logoContext = siteContexts.find(c => c.type === 'logo');
      const headerContext = siteContexts.find(c => c.type === 'header');
      const footerContext = siteContexts.find(c => c.type === 'footer');
      const metaContext = siteContexts.find(c => c.type === 'meta');
      const sitemapContext = siteContexts.find(c => c.type === 'sitemap');

      setFormData({
        logo: logoContext?.file_url || logoContext?.content || '',
        url: '', // TODO: Add URL field to database
        colors: '', // TODO: Add colors field
        typography: '', // TODO: Add typography field
        tone: '', // TODO: Add tone field
        languages: '', // TODO: Add languages field
        header: headerContext?.content || '',
        footer: footerContext?.content || '',
        meta: metaContext?.content || '',
        sitemap: sitemapContext?.content || '',
      });
    }
  }, [isOpen, siteContexts]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save context:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[800px] h-[700px] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-[#E5E5E5] shrink-0">
          <button
            onClick={() => setActiveTab('onsite')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'onsite'
                ? 'text-[#111827] border-b-2 border-[#111827]'
                : 'text-[#9CA3AF] hover:text-[#6B7280]'
            }`}
          >
            On Site
          </button>
          <button
            onClick={() => setActiveTab('offsite')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'offsite'
                ? 'text-[#111827] border-b-2 border-[#111827]'
                : 'text-[#9CA3AF] hover:text-[#6B7280]'
            }`}
          >
            Off Site
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'knowledge'
                ? 'text-[#111827] border-b-2 border-[#111827]'
                : 'text-[#9CA3AF] hover:text-[#6B7280]'
            }`}
          >
            Knowledge
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6">
          {activeTab === 'onsite' && (
            <div className="space-y-6">
              {/* Brand Assets Section */}
              <div>
                <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider mb-3">Brand Assets</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Logo URL</label>
                    <input
                      type="text"
                      value={formData.logo}
                      onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Website URL</label>
                    <input
                      type="text"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Brand Colors</label>
                    <input
                      type="text"
                      value={formData.colors}
                      onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                      placeholder="Primary: #9A8FEA, Secondary: #FF5733"
                      className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Typography</label>
                    <input
                      type="text"
                      value={formData.typography}
                      onChange={(e) => setFormData({ ...formData, typography: e.target.value })}
                      placeholder="Heading: Inter, Body: Roboto"
                      className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Tone & Voice</label>
                    <textarea
                      value={formData.tone}
                      onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                      placeholder="Professional, friendly, conversational..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA] focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Languages</label>
                    <input
                      type="text"
                      value={formData.languages}
                      onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                      placeholder="English, Chinese, Spanish"
                      className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Meta Info Section */}
              <div>
                <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider mb-3">Meta Info</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Header</label>
                    <textarea
                      value={formData.header}
                      onChange={(e) => setFormData({ ...formData, header: e.target.value })}
                      placeholder="Header content..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA] focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Footer</label>
                    <textarea
                      value={formData.footer}
                      onChange={(e) => setFormData({ ...formData, footer: e.target.value })}
                      placeholder="Footer content..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA] focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Meta Tags</label>
                    <textarea
                      value={formData.meta}
                      onChange={(e) => setFormData({ ...formData, meta: e.target.value })}
                      placeholder="Meta tags..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA] focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Sitemap</label>
                    <textarea
                      value={formData.sitemap}
                      onChange={(e) => setFormData({ ...formData, sitemap: e.target.value })}
                      placeholder="Sitemap content..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA] focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'offsite' && (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-[#9CA3AF] italic">Coming soon</p>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-[#9CA3AF] italic">Coming soon</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#E5E5E5] p-4 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-[#9A8FEA] hover:bg-[#8B7FD9] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
}

