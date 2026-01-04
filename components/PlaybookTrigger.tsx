'use client';

import { useState, useEffect } from 'react';
import type { SiteContext } from '@/lib/supabase';

interface PlaybookField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'country';
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}

interface PlaybookTriggerProps {
  skill: {
    id: string;
    name: string;
    description: string;
    metadata?: {
      tags?: string[];
      playbook?: {
        trigger?: {
          type: 'form' | 'direct';
          fields?: PlaybookField[];
          initialMessage?: string;
        }
      }
    }
  };
  userId?: string;
  siteContexts?: SiteContext[];
  onCancel: () => void;
  onSubmit: (message: string, useNewConversation: boolean) => void;
}

const COUNTRIES = [
  { label: 'United States', value: 'us' },
  { label: 'United Kingdom', value: 'uk' },
  { label: 'Canada', value: 'ca' },
  { label: 'Australia', value: 'au' },
  { label: 'Germany', value: 'de' },
  { label: 'France', value: 'fr' },
  { label: 'Japan', value: 'jp' },
  { label: 'China', value: 'cn' },
  { label: 'Brazil', value: 'br' },
  { label: 'India', value: 'in' },
];

export default function PlaybookTrigger({ skill, userId, siteContexts = [], onCancel, onSubmit }: PlaybookTriggerProps) {
  const trigger = skill.metadata?.playbook?.trigger;
  const isGSCSkill = skill.metadata?.tags?.includes('gsc');
  
  // Extract site info from meta context
  const extractSiteInfo = () => {
    const metaContext = siteContexts.find(ctx => ctx.type === 'meta');
    if (!metaContext?.content) return { siteName: '', siteUrl: '' };
    
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(metaContext.content, 'text/html');
      
      const siteName = 
        doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
        doc.querySelector('title')?.textContent ||
        '';
      
      const siteUrl = 
        doc.querySelector('meta[property="og:url"]')?.getAttribute('content') ||
        doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ||
        '';
      
      return { siteName, siteUrl };
    } catch {
      return { siteName: '', siteUrl: '' };
    }
  };
  
  const { siteName, siteUrl } = extractSiteInfo();
  
  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    
    trigger?.fields?.forEach(f => {
      // Priority 1: Use field's defaultValue
      if (f.defaultValue) {
        defaults[f.id] = f.defaultValue;
      }
      // Priority 2: Auto-fill from site context
      else if (!f.defaultValue) {
        // Map field IDs to site context values
        const fieldId = f.id.toLowerCase();
        
        // Site URL fields - auto-fill all URL-related required fields
        if ([
          'my_domain', 'siteurl', 'url', 'site_url', 'target', 'site_root', 
          'page_url', 'domain', 'your_website'
        ].includes(fieldId)) {
          if (siteUrl) defaults[f.id] = siteUrl;
        }
        // Site/Product name fields
        else if ([
          'site_name', 'sitename', 'product_name', 'productname', 
          'brand_name', 'brandname', 'your_product_name'
        ].includes(fieldId)) {
          if (siteName) defaults[f.id] = siteName;
        }
      }
    });
    
    return defaults;
  });
  const [useNewConversation, setUseNewConversation] = useState(false);
  const [gscStatus, setGscStatus] = useState<{ isAuthorized: boolean; sites: string[]; loading: boolean }>({ 
    isAuthorized: false, 
    sites: [], 
    loading: userId ? true : false 
  });

  // Always fetch GSC status if userId is present to provide site suggestions
  useEffect(() => {
    if (userId) {
      fetch(`/api/auth/gsc/status?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          const gscSites = data.sites || [];
          setGscStatus({
            isAuthorized: data.isAuthorized,
            sites: gscSites,
            loading: false
          });
          
          // Auto-fill domain fields with GSC site if available and not already set
          if (gscSites.length > 0 && trigger?.fields) {
            const newDefaults: Record<string, string> = {};
            
            trigger.fields.forEach(field => {
              const isDomainField = [
                'my_domain', 'siteUrl', 'url', 'site_url', 'target', 'site_root', 
                'page_url', 'domain', 'your_website'
              ].includes(field.id);
              
              // Only auto-fill if field is empty and it's a domain field
              if (isDomainField && !values[field.id]) {
                // Try to match with siteUrl from context
                let matchedSite = gscSites[0]; // Default to first site
                
                if (siteUrl) {
                  const normalizedSiteUrl = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
                  const matched = gscSites.find((site: string) => {
                    const cleanSite = site.replace(/^sc-domain:/, '').replace(/\/$/, '');
                    return cleanSite === normalizedSiteUrl || normalizedSiteUrl.includes(cleanSite);
                  });
                  if (matched) matchedSite = matched;
                }
                
                const cleanSite = matchedSite.replace(/^sc-domain:/, '').replace(/\/$/, '');
                newDefaults[field.id] = cleanSite;
              }
            });
            
            if (Object.keys(newDefaults).length > 0) {
              setValues(prev => ({ ...prev, ...newDefaults }));
            }
          }
        })
        .catch(() => setGscStatus(prev => ({ ...prev, loading: false })));
    }
  }, [userId]); // Remove dependency on 'values' to prevent infinite loop

  if (!trigger || trigger.type !== 'form') {
    // If direct, just submit immediately
    if (trigger?.type === 'direct' && trigger.initialMessage) {
       onSubmit(trigger.initialMessage, false);
    }
    return null;
  }

  const handleAuthorize = () => {
    const conversationId = window.location.search.split('c=')[1]?.split('&')[0] || '';
    window.location.href = `/api/auth/gsc/authorize?userId=${userId}&conversationId=${conversationId}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let message = trigger.initialMessage || '';
    
    // 1. Handle Conditional Segments: [Text with {field}]
    // These segments are only included if the {field} inside them is non-empty.
    const conditionalRegex = /\[([^\]]*?\{([^}]+)\}[^\]]*?)\]/g;
    message = message.replace(conditionalRegex, (match, content, fieldId) => {
      const value = values[fieldId]?.trim();
      return value ? content : '';
    });

    // 2. Replace remaining placeholders in message for all defined fields
    trigger.fields?.forEach(field => {
      const value = values[field.id]?.trim() || '';
      message = message.split(`{${field.id}}`).join(value);
    });

    // 3. Intelligent Cleanup
    message = message
      .replace(/\s+/g, ' ')             // Remove double spaces
      .replace(/[:|,]\s*([.!?])/g, '$1') // Remove punctuation before ending punctuation (e.g., ": ." -> ".")
      .replace(/\s+([.!?])/g, '$1')      // Remove space before punctuation
      .trim();

    onSubmit(message, useNewConversation);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-[#E5E5E5] w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[#F5F5F5]">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold text-[#111827]">{skill.name}</h3>
            <button 
              onClick={onCancel}
              className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-[#6B7280]">{skill.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isGSCSkill && !gscStatus.loading && !gscStatus.isAuthorized ? (
            <div className="py-4 text-center space-y-4">
              <div className="w-12 h-12 bg-[#F9FAFB] rounded-full flex items-center justify-center mx-auto border border-[#F3F4F6]">
                <svg className="w-6 h-6 text-[#9CA3AF]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 19H6v-7h2v7zm4 0h-2V7h2v12zm4 0h-2v-4h2v4z" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#111827]">GSC Authorization Required</p>
                <p className="text-xs text-[#6B7280]">You need to connect your Google Search Console account to use this skill.</p>
              </div>
              <button
                type="button"
                onClick={handleAuthorize}
                className="w-full py-2.5 text-xs font-black uppercase tracking-[0.1em] text-white rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'linear-gradient(80deg, #FFAF40, #D194EC, #9A8FEA, #65B4FF)' }}
              >
                Authorize Now
              </button>
            </div>
          ) : (
            <>
          {trigger.fields?.map((field) => {
            const isDomainField = [
              'my_domain', 'siteUrl', 'url', 'site_url', 'target', 'site_root', 
              'page_url', 'domain', 'your_website'
            ].includes(field.id);
            const hasGSCSites = gscStatus.isAuthorized && gscStatus.sites.length > 0;

            return (
            <div key={field.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#374151] uppercase tracking-wider">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
                  {isDomainField && hasGSCSites && (
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">GSC Connected</span>
                  )}
                </div>
                
                {/* Quick Suggestions for Domain Fields */}
                {isDomainField && hasGSCSites && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {gscStatus.sites.map(site => {
                      const cleanSite = site.replace(/^sc-domain:/, '').replace(/\/$/, '');
                      const isSelected = values[field.id] === cleanSite;
                      return (
                        <button
                          key={site}
                          type="button"
                          onClick={() => setValues(prev => ({ ...prev, [field.id]: cleanSite }))}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' 
                              : 'bg-[#FAFAFA] border-[#E5E5E5] text-[#6B7280] hover:bg-blue-50 hover:border-blue-100 hover:text-blue-500'
                          }`}
                        >
                          {cleanSite}
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {field.type === 'country' ? (
                <select
                  required={field.required}
                  value={values[field.id] || ''}
                  onChange={(e) => setValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                >
                  <option value="">Select a country...</option>
                  {COUNTRIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              ) : field.type === 'select' ? (
                <select
                  required={field.required}
                  value={values[field.id] || ''}
                  onChange={(e) => setValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                >
                  <option value="">Select an option...</option>
                  {field.options?.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <textarea
                  required={field.required}
                  placeholder={field.placeholder}
                  value={values[field.id] || ''}
                  onChange={(e) => setValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#9CA3AF] resize-none"
                />
              )}
            </div>
            );
          })}

          {/* New Conversation Checkbox */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#F5F5F5]">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={useNewConversation}
                onChange={(e) => setUseNewConversation(e.target.checked)}
                className="w-4 h-4 rounded border-[#E5E5E5] text-[#111827] focus:ring-0 focus:ring-offset-0 cursor-pointer transition-all"
              />
              <span className="text-[11px] font-medium text-[#6B7280] group-hover:text-[#374151] transition-colors">
                Start in a new conversation
              </span>
            </label>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 rounded-xl border border-[#E5E5E5] text-sm font-bold text-[#6B7280] hover:bg-[#FAFAFA] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
                  disabled={isGSCSkill && !gscStatus.isAuthorized}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#111827] text-white text-sm font-bold hover:bg-black transition-all shadow-sm shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                  {gscStatus.loading ? 'Checking...' : 'Start Mission'}
            </button>
          </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

