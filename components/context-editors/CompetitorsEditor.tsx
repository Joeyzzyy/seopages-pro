'use client';

import { useState, useEffect } from 'react';

interface Competitor {
  name: string;
  url: string;
  logo_url?: string;
  description?: string;
  pricing_start?: string;
  logo_fetch_failed?: boolean; // True if website validation failed
  url_corrected?: boolean; // True if URL was auto-corrected
}

interface CompetitorsEditorProps {
  initialContent?: string;
  onContentChange: (content: string) => void;
}

// Helper to get favicon/logo URL from a domain
function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    // Use Google's favicon service as fallback
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return '';
  }
}

export default function CompetitorsEditor({
  initialContent,
  onContentChange,
}: CompetitorsEditorProps) {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialContent) {
      try {
        const parsed = JSON.parse(initialContent);
        if (Array.isArray(parsed)) {
          setCompetitors(parsed);
        }
      } catch {
        setCompetitors([]);
      }
    }
  }, [initialContent]);

  const updateCompetitors = (newCompetitors: Competitor[]) => {
    setCompetitors(newCompetitors);
    onContentChange(JSON.stringify(newCompetitors));
  };

  const addCompetitor = () => {
    updateCompetitors([...competitors, { name: '', url: '', logo_url: '' }]);
    setExpandedIndex(competitors.length);
  };

  const updateCompetitor = (index: number, field: keyof Competitor, value: string) => {
    const updated = [...competitors];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-fetch logo when URL changes
    if (field === 'url' && value && !updated[index].logo_url) {
      updated[index].logo_url = getFaviconUrl(value);
    }
    
    updateCompetitors(updated);
  };

  const removeCompetitor = (index: number) => {
    updateCompetitors(competitors.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const fetchLogo = async (index: number) => {
    const competitor = competitors[index];
    if (!competitor.url) return;
    
    const logoUrl = getFaviconUrl(competitor.url);
    updateCompetitor(index, 'logo_url', logoUrl);
  };

  return (
    <div className="space-y-1">
      {competitors.length === 0 ? (
        <p className="text-xs text-[#9CA3AF] py-2 text-center">No competitors added yet</p>
      ) : (
        <div className="space-y-1">
          {competitors.map((competitor, index) => (
            <div key={index} className={`border rounded-md overflow-hidden bg-white transition-colors ${competitor.logo_fetch_failed ? 'border-amber-300 bg-amber-50/30' : 'border-[#E5E5E5] hover:border-[#D1D5DB]'}`}>
              {/* Ultra Compact Row */}
              <div className="flex items-center gap-2 px-2 py-1.5">
                {/* Logo Preview with Warning Badge */}
                <div className="relative w-6 h-6 rounded bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {competitor.logo_url ? (
                    <img 
                      src={competitor.logo_url} 
                      alt={competitor.name || 'Logo'} 
                      className="w-4 h-4 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-[10px] text-gray-300">?</span>
                  )}
                  {/* Warning indicator for unreachable website */}
                  {competitor.logo_fetch_failed && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full flex items-center justify-center" title="Website unreachable - URL may be invalid">
                      <span className="text-[8px] text-white font-bold">!</span>
                    </div>
                  )}
                  {/* Success indicator for auto-corrected URL */}
                  {competitor.url_corrected && !competitor.logo_fetch_failed && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center" title="URL was auto-corrected">
                      <span className="text-[8px] text-white font-bold">✓</span>
                    </div>
                  )}
                </div>
                
                {/* Name & URL inline */}
                <input
                  type="text"
                  value={competitor.name}
                  onChange={(e) => updateCompetitor(index, 'name', e.target.value)}
                  placeholder="Name"
                  className={`w-28 px-2 py-1 text-xs bg-transparent placeholder:text-[#D1D5DB] border-0 focus:outline-none focus:ring-0 ${competitor.logo_fetch_failed ? 'text-amber-700' : 'text-[#111827]'}`}
                />
                <input
                  type="url"
                  value={competitor.url}
                  onChange={(e) => updateCompetitor(index, 'url', e.target.value)}
                  placeholder="https://..."
                  className={`flex-1 min-w-0 px-2 py-1 text-xs bg-transparent placeholder:text-[#D1D5DB] border-0 focus:outline-none focus:ring-0 truncate ${competitor.logo_fetch_failed ? 'text-amber-600' : 'text-[#6B7280]'}`}
                />
                
                {/* Expand/Collapse */}
                <button
                  type="button"
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  className="p-1 text-[#D1D5DB] hover:text-[#9CA3AF] rounded transition-colors"
                  title="More details"
                >
                  <svg className={`w-3 h-3 transition-transform ${expandedIndex === index ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeCompetitor(index)}
                  className="p-1 text-[#D1D5DB] hover:text-[#EF4444] rounded transition-colors"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Expanded Details */}
              {expandedIndex === index && (
                <div className={`px-2 pb-2 pt-1 border-t space-y-1.5 ${competitor.logo_fetch_failed ? 'bg-amber-50/50 border-amber-200' : 'bg-gray-50 border-[#F3F4F6]'}`}>
                  {/* Warning Banner */}
                  {competitor.logo_fetch_failed && (
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-amber-100 border border-amber-200 rounded text-[10px] text-amber-700">
                      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Website unreachable - this URL may be invalid, please verify manually</span>
                    </div>
                  )}
                  {/* Success Banner for corrected URL */}
                  {competitor.url_corrected && !competitor.logo_fetch_failed && (
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-green-100 border border-green-200 rounded text-[10px] text-green-700">
                      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>URL was auto-corrected (original URL was suspicious or invalid)</span>
                    </div>
                  )}
                  
                  {/* Logo URL */}
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-gray-400 w-16 shrink-0">Logo URL</label>
                    <input
                      type="url"
                      value={competitor.logo_url || ''}
                      onChange={(e) => updateCompetitor(index, 'logo_url', e.target.value)}
                      placeholder="Auto-detected"
                      className="flex-1 px-2 py-0.5 text-[10px] bg-white text-[#111827] placeholder:text-[#D1D5DB] border border-[#E5E5E5] rounded focus:outline-none focus:ring-1 focus:ring-[#9AD6FF]"
                    />
                    <button
                      type="button"
                      onClick={() => fetchLogo(index)}
                      className="px-1.5 py-0.5 text-[10px] text-[#9CA3AF] hover:text-[#6B7280] hover:bg-white border border-[#E5E5E5] rounded transition-colors"
                      title="Auto-fetch logo"
                    >
                      ↻
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <button
        type="button"
        onClick={addCompetitor}
        className="flex items-center gap-1 px-2 py-1 text-xs text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#F9FAFB] rounded transition-colors"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add
      </button>
    </div>
  );
}
