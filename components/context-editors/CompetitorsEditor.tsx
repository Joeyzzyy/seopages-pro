'use client';

import { useState, useEffect } from 'react';

interface Competitor {
  name: string;
  url: string;
  logo_url?: string;
  description?: string;
  pricing_start?: string;
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
    updateCompetitors([...competitors, { name: '', url: '', logo_url: '', description: '', pricing_start: '' }]);
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
            <div key={index} className="border border-[#E5E5E5] rounded-md overflow-hidden bg-white hover:border-[#D1D5DB] transition-colors">
              {/* Ultra Compact Row */}
              <div className="flex items-center gap-2 px-2 py-1.5">
                {/* Logo Preview */}
                <div className="w-6 h-6 rounded bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                </div>
                
                {/* Name & URL inline */}
                <input
                  type="text"
                  value={competitor.name}
                  onChange={(e) => updateCompetitor(index, 'name', e.target.value)}
                  placeholder="Name"
                  className="w-28 px-2 py-1 text-xs bg-transparent text-[#111827] placeholder:text-[#D1D5DB] border-0 focus:outline-none focus:ring-0"
                />
                <input
                  type="url"
                  value={competitor.url}
                  onChange={(e) => updateCompetitor(index, 'url', e.target.value)}
                  placeholder="https://..."
                  className="flex-1 min-w-0 px-2 py-1 text-xs bg-transparent text-[#6B7280] placeholder:text-[#D1D5DB] border-0 focus:outline-none focus:ring-0 truncate"
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
                <div className="px-2 pb-2 pt-1 bg-gray-50 border-t border-[#F3F4F6] space-y-1.5">
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
                  
                  {/* Description */}
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-gray-400 w-16 shrink-0">Description</label>
                    <input
                      type="text"
                      value={competitor.description || ''}
                      onChange={(e) => updateCompetitor(index, 'description', e.target.value)}
                      placeholder="Brief description"
                      className="flex-1 px-2 py-0.5 text-[10px] bg-white text-[#111827] placeholder:text-[#D1D5DB] border border-[#E5E5E5] rounded focus:outline-none focus:ring-1 focus:ring-[#9AD6FF]"
                    />
                  </div>
                  
                  {/* Pricing */}
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-gray-400 w-16 shrink-0">Pricing</label>
                    <input
                      type="text"
                      value={competitor.pricing_start || ''}
                      onChange={(e) => updateCompetitor(index, 'pricing_start', e.target.value)}
                      placeholder="e.g. $29/mo"
                      className="flex-1 px-2 py-0.5 text-[10px] bg-white text-[#111827] placeholder:text-[#D1D5DB] border border-[#E5E5E5] rounded focus:outline-none focus:ring-1 focus:ring-[#9AD6FF]"
                    />
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
