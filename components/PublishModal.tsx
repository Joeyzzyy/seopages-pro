'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Domain {
  id: string;
  domain: string;
  verified: boolean;
  subdirectories: Subdirectory[];
}

interface Subdirectory {
  id: string;
  domain_id: string;
  path: string;
}

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (config: { domainId: string; subdirectoryPath: string; slug: string }) => Promise<void>;
  currentSlug: string;
  pageTitle: string;
  isPublishing: boolean;
}

export default function PublishModal({
  isOpen,
  onClose,
  onPublish,
  currentSlug,
  pageTitle,
  isPublishing
}: PublishModalProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [slug, setSlug] = useState(currentSlug);
  const [error, setError] = useState<string | null>(null);

  const brandGradient = 'linear-gradient(80deg, #FFAF40, #D194EC, #9A8FEA, #65B4FF)';

  useEffect(() => {
    if (isOpen) {
      fetchDomains();
      setSlug(currentSlug);
      setError(null);
    }
  }, [isOpen, currentSlug]);

  const getAuthHeaders = async (): Promise<HeadersInit> => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const res = await fetch('/api/domains', { headers });
      const data = await res.json();
      
      // Filter only verified domains
      const verifiedDomains = (data.domains || []).filter((d: Domain) => d.verified);
      setDomains(verifiedDomains);
      
      // Auto-select first domain if available
      if (verifiedDomains.length > 0 && !selectedDomainId) {
        const firstDomain = verifiedDomains[0];
        setSelectedDomainId(firstDomain.id);
        // Auto-select first subdirectory if available
        if (firstDomain.subdirectories && firstDomain.subdirectories.length > 0) {
          setSelectedPath(firstDomain.subdirectories[0].path);
        } else {
          setSelectedPath('');
        }
      }
    } catch (error) {
      console.error('Failed to fetch domains:', error);
      setError('Failed to load domains');
    } finally {
      setLoading(false);
    }
  };

  const selectedDomain = domains.find(d => d.id === selectedDomainId);
  
  // Get available paths: subdirectories only (no root)
  const availablePaths = selectedDomain 
    ? (selectedDomain.subdirectories || []).map(s => ({ 
        path: s.path, 
        label: s.path 
      }))
    : [];

  const handleDomainChange = (domainId: string) => {
    setSelectedDomainId(domainId);
    // Reset to first subdirectory when domain changes
    const domain = domains.find(d => d.id === domainId);
    if (domain?.subdirectories && domain.subdirectories.length > 0) {
      setSelectedPath(domain.subdirectories[0].path);
    } else {
      setSelectedPath('');
    }
  };

  const handlePublish = async () => {
    if (!selectedDomainId) {
      setError('Please select a domain');
      return;
    }
    if (!selectedPath) {
      setError('Please select a subdirectory path');
      return;
    }
    if (!slug.trim()) {
      setError('Slug cannot be empty');
      return;
    }
    
    // Validate slug format
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugPattern.test(slug)) {
      setError('Slug can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    setError(null);
    await onPublish({
      domainId: selectedDomainId,
      subdirectoryPath: selectedPath,
      slug: slug.trim()
    });
  };

  // Generate preview URL
  const previewUrl = selectedDomain 
    ? `https://${selectedDomain.domain}${selectedPath === '/' ? '' : selectedPath}/${slug}`
    : '';

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-[#FAFAFA] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#E5E5E5]" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E5E5E5]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#111827] tracking-tight">Publish Page</h2>
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest mt-1">
                {pageTitle}
              </p>
            </div>
            <button 
              onClick={onClose} 
              disabled={isPublishing}
              className="text-[#9CA3AF] hover:text-[#111827] transition-colors text-xl font-light disabled:opacity-50"
            >
              x
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 mx-auto mb-3 rounded-full border-2 border-[#E5E5E5] border-t-[#9A8FEA] animate-spin" />
              <p className="text-[#9CA3AF] text-xs">Loading domains...</p>
            </div>
          ) : domains.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                <svg className="w-6 h-6 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <p className="text-[#374151] text-sm font-medium">No verified domains</p>
              <p className="text-[#9CA3AF] text-xs mt-1">Add and verify a domain first to publish content</p>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Domain Selection */}
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-2">
                  Select Domain
                </label>
                <select
                  value={selectedDomainId}
                  onChange={(e) => handleDomainChange(e.target.value)}
                  disabled={isPublishing}
                  className="w-full px-4 py-3 bg-white border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:border-[#9A8FEA] transition-colors disabled:opacity-50"
                >
                  {domains.map(domain => (
                    <option key={domain.id} value={domain.id}>
                      {domain.domain}
                    </option>
                  ))}
                </select>
              </div>

              {/* Path Selection */}
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-2">
                  Select Path
                </label>
                <select
                  value={selectedPath}
                  onChange={(e) => setSelectedPath(e.target.value)}
                  disabled={isPublishing}
                  className="w-full px-4 py-3 bg-white border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:border-[#9A8FEA] transition-colors disabled:opacity-50"
                >
                  {availablePaths.map(p => (
                    <option key={p.path} value={p.path}>
                      {p.label}
                    </option>
                  ))}
                </select>
                {availablePaths.length === 0 && (
                  <p className="text-[10px] text-[#EF4444] mt-1 font-medium">
                    No subdirectories configured. Add a subdirectory in Domain Management first.
                  </p>
                )}
              </div>

              {/* Slug Input */}
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-2">
                  Page Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  disabled={isPublishing}
                  placeholder="my-awesome-page"
                  className="w-full px-4 py-3 bg-white border border-[#E5E5E5] rounded-xl text-sm font-mono focus:outline-none focus:border-[#9A8FEA] transition-colors disabled:opacity-50"
                />
                <p className="text-[10px] text-[#9CA3AF] mt-1">
                  URL-friendly identifier for this page
                </p>
              </div>

              {/* Preview URL */}
              {previewUrl && (
                <div className="p-4 bg-[#111827] rounded-xl">
                  <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-2">
                    Published URL Preview
                  </div>
                  <code className="text-sm text-[#9A8FEA] font-mono break-all">
                    {previewUrl}
                  </code>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {domains.length > 0 && (
          <div className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isPublishing}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#6B7280] hover:text-[#111827] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              disabled={isPublishing || !selectedDomainId || !selectedPath || !slug.trim()}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40 transition-all hover:opacity-90 flex items-center gap-2"
              style={{ background: brandGradient }}
            >
              {isPublishing ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Publishing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                  Publish
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

