'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { SiteContext } from '@/lib/supabase';
import CompetitorsEditor from './context-editors/CompetitorsEditor';

interface CompetitorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteContexts: SiteContext[];
  onSave: (data: { type: 'competitors'; content: string }) => Promise<void>;
  onRefresh?: () => Promise<void>;
  projectId?: string;
  onPlanPages?: (competitors: Array<{ name: string; url: string; description?: string }>) => Promise<void>;
}

// Crawl status type
interface CrawlStatus {
  isRunning: boolean;
  currentStep: string;
  progress: number;
  competitors: Array<{ name: string; url: string; description?: string }>;
  pagesCreated?: number;
  pagesSkipped?: number;
  error?: string;
}

export default function CompetitorsModal({
  isOpen,
  onClose,
  siteContexts,
  onSave,
  onRefresh,
  projectId,
  onPlanPages,
}: CompetitorsModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [competitorsContent, setCompetitorsContent] = useState('');
  
  // Auto-fetch states
  const [showCrawlPanel, setShowCrawlPanel] = useState(false);
  const [crawlUrl, setCrawlUrl] = useState('');
  const [crawlStatus, setCrawlStatus] = useState<CrawlStatus>({
    isRunning: false,
    currentStep: '',
    progress: 0,
    competitors: [],
  });

  // Get domain from logo context for default URL
  const logoContext = siteContexts.find(c => c.type === 'logo');
  const domainName = (logoContext as any)?.domain_name || '';

  // Initialize states when modal opens
  useEffect(() => {
    if (isOpen) {
      const competitorsContext = siteContexts.find(c => c.type === 'competitors');
      setCompetitorsContent(competitorsContext?.content || '');
      
      // Set default crawl URL from domain
      if (domainName && !crawlUrl) {
        setCrawlUrl(domainName.startsWith('http') ? domainName : `https://${domainName}`);
      }
    }
  }, [isOpen, siteContexts, domainName]);

  // Auto-fetch competitors handler
  const handleFetchCompetitors = async () => {
    if (!crawlUrl) {
      alert('Please enter your website URL');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      alert('Please log in to use this feature');
      return;
    }

    setCrawlStatus({
      isRunning: true,
      currentStep: 'Analyzing your website...',
      progress: 20,
      competitors: [],
    });

    try {
      // Call the competitor discovery API
      const response = await fetch('/api/context-acquisition/competitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          url: crawlUrl,
          userId: session.user.id,
          projectId,
        }),
      });

      setCrawlStatus(prev => ({ ...prev, currentStep: 'Discovering competitors...', progress: 50 }));

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch competitors');
      }

      const fetchedCompetitors = result.competitors || [];
      
      // Merge with existing competitors - keep old ones, add new ones incrementally
      let existing: any[] = [];
      try {
        existing = competitorsContent ? JSON.parse(competitorsContent) : [];
      } catch {}
      
      // Normalize URLs for comparison (lowercase, remove trailing slashes, remove www)
      const normalizeUrl = (url: string) => {
        try {
          const u = new URL(url.toLowerCase());
          return u.hostname.replace('www.', '') + u.pathname.replace(/\/$/, '');
        } catch {
          return url.toLowerCase().replace('www.', '').replace(/\/$/, '');
        }
      };
      
      // Create a set of existing URLs for quick lookup
      const existingUrls = new Set(existing.map((c: any) => normalizeUrl(c.url || '')));
      
      // Filter out duplicates - only add truly new competitors
      const newCompetitors = fetchedCompetitors.filter(
        (c: any) => !existingUrls.has(normalizeUrl(c.url || ''))
      );
      
      // Keep all existing competitors, append only new ones
      const merged = [...existing, ...newCompetitors];
      
      setCrawlStatus({
        isRunning: false,
        currentStep: 'Complete!',
        progress: 100,
        competitors: newCompetitors, // Show only newly added ones in result
      });

      // Update content with merged list
      setCompetitorsContent(JSON.stringify(merged));
      
      // Show helpful message if no new competitors
      if (newCompetitors.length === 0 && fetchedCompetitors.length > 0) {
        setCrawlStatus(prev => ({
          ...prev,
          currentStep: 'No new competitors found (all already exist)',
        }));
      } else if (newCompetitors.length > 0 && projectId) {
        // Auto-create page plans for new competitors
        setCrawlStatus(prev => ({
          ...prev,
          currentStep: 'Creating page plans...',
          progress: 80,
        }));

        try {
          // Get brand name from context
          const brandName = domainName.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split('.')[0];
          const capitalizedBrandName = brandName.charAt(0).toUpperCase() + brandName.slice(1);

          const pagesResponse = await fetch('/api/context-acquisition/competitors/create-pages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              projectId,
              brandName: capitalizedBrandName,
              competitors: newCompetitors,
            }),
          });

          const pagesResult = await pagesResponse.json();

          setCrawlStatus(prev => ({
            ...prev,
            currentStep: 'Complete!',
            progress: 100,
            pagesCreated: pagesResult.created || 0,
            pagesSkipped: pagesResult.skipped || 0,
          }));
        } catch (pageError) {
          console.error('Failed to create pages:', pageError);
          // Don't fail the whole operation, competitors are still saved
          setCrawlStatus(prev => ({
            ...prev,
            currentStep: 'Competitors saved (page creation failed)',
            progress: 100,
          }));
        }
      }

    } catch (error: any) {
      console.error('[handleFetchCompetitors] Error:', error);
      setCrawlStatus({
        isRunning: false,
        currentStep: '',
        progress: 0,
        competitors: [],
        error: error.message || 'Failed to fetch competitors',
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save competitors
      if (competitorsContent && competitorsContent.trim()) {
        await onSave({ type: 'competitors', content: competitorsContent });
      }
      
      // Parse all competitors
      let allCompetitors: any[] = [];
      try {
        allCompetitors = competitorsContent ? JSON.parse(competitorsContent) : [];
      } catch {}
      
      // Close modal
      onClose();
      
      // If there are competitors and onPlanPages is provided, trigger page planning
      // The API will automatically skip pages that already exist
      if (allCompetitors.length > 0 && onPlanPages) {
        console.log(`[CompetitorsModal] Triggering page planning for ${allCompetitors.length} competitors...`);
        await onPlanPages(allCompetitors);
      }
    } catch (error) {
      console.error('Error saving competitors:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Get competitor count
  const getCompetitorCount = (): number => {
    try {
      const parsed = JSON.parse(competitorsContent || '[]');
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#EF4444] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#111827]">Competitors</h2>
              <p className="text-xs text-[#6B7280]">
                {getCompetitorCount()} competitor{getCompetitorCount() !== 1 ? 's' : ''} configured
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCrawlPanel(!showCrawlPanel)}
              className={`py-1.5 px-3 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                showCrawlPanel 
                  ? 'bg-[#111827] text-white' 
                  : 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Auto-Fetch
            </button>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="py-1.5 px-4 bg-[#111827] text-white text-xs font-medium rounded-lg hover:bg-[#1F2937] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    <polyline points="17,21 17,13 7,13 7,21" />
                    <polyline points="7,3 7,8 15,8" />
                  </svg>
                  Save
                </>
              )}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Auto-Fetch Panel */}
          {showCrawlPanel && (
            <div className="mb-6 p-4 bg-[#FAFAFA] rounded-xl border border-[#E5E5E5]">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <h3 className="text-sm font-bold text-[#111827]">Auto-Discover Competitors</h3>
              </div>
              
              <p className="text-xs text-[#6B7280] mb-3">
                Enter your website URL to automatically discover and add competitors in your industry.
              </p>
              
              {/* URL Input */}
              <div className="flex gap-2 mb-3">
                <input
                  type="url"
                  value={crawlUrl}
                  onChange={(e) => setCrawlUrl(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="flex-1 px-3 py-2 text-sm border border-[#D1D5DB] rounded-lg focus:ring-2 focus:ring-[#111827] focus:border-transparent outline-none"
                  disabled={crawlStatus.isRunning}
                />
              </div>
              
              {/* Fetch Button */}
              <button
                type="button"
                onClick={handleFetchCompetitors}
                disabled={crawlStatus.isRunning || !crawlUrl}
                className="w-full py-2.5 px-4 bg-[#111827] text-white text-sm font-medium rounded-lg hover:bg-[#1F2937] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {crawlStatus.isRunning ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{crawlStatus.currentStep}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <span>Discover Competitors</span>
                  </>
                )}
              </button>
              
              {/* Progress Bar */}
              {crawlStatus.isRunning && (
                <div className="mt-3">
                  <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#111827] transition-all duration-300"
                      style={{ width: `${crawlStatus.progress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Results */}
              {!crawlStatus.isRunning && crawlStatus.currentStep && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-[#E5E7EB] space-y-2">
                  {crawlStatus.competitors.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-[#10B981]">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Added {crawlStatus.competitors.length} new competitors</span>
                    </div>
                  )}
                  {crawlStatus.pagesCreated !== undefined && crawlStatus.pagesCreated > 0 && (
                    <div className="flex items-center gap-2 text-xs text-[#3B82F6]">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Created {crawlStatus.pagesCreated} new page plans</span>
                    </div>
                  )}
                  {crawlStatus.pagesSkipped !== undefined && crawlStatus.pagesSkipped > 0 && (
                    <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>{crawlStatus.pagesSkipped} competitors already have pages</span>
                    </div>
                  )}
                  {crawlStatus.competitors.length === 0 && !crawlStatus.pagesCreated && (
                    <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{crawlStatus.currentStep}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Error */}
              {crawlStatus.error && (
                <div className="mt-3 p-3 bg-[#FEF2F2] rounded-lg border border-[#FECACA]">
                  <div className="flex items-center gap-2 text-[#DC2626] text-xs">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                    <span>{crawlStatus.error}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Competitors Editor */}
          <div>
            <p className="text-sm text-[#6B7280] mb-4">
              Add your competitors to generate comparison pages. Include their name, website URL, and optionally a brief description.
            </p>
            <CompetitorsEditor
              initialContent={competitorsContent}
              onContentChange={setCompetitorsContent}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
