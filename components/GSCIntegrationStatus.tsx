'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';

interface GSCIntegrationStatusProps {
  user: User | null;
  conversationId?: string | null;
  onClose: () => void;
}

export default function GSCIntegrationStatus({ user, conversationId, onClose }: GSCIntegrationStatusProps) {
  const [gscStatus, setGscStatus] = useState<{ isAuthorized: boolean; sites: string[] }>({ isAuthorized: false, sites: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkStatus();
    }
  }, [user]);

  const checkStatus = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/gsc/status?userId=${user.id}`);
      const data = await response.json();
      if (data.isAuthorized) {
        setGscStatus({ isAuthorized: true, sites: data.sites || [] });
      } else {
        setGscStatus({ isAuthorized: false, sites: [] });
      }
    } catch (error) {
      console.error('Failed to check GSC status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!user || !confirm('Are you sure you want to disconnect Google Search Console?')) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/auth/gsc/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      
      if (response.ok) {
        setGscStatus({ isAuthorized: false, sites: [] });
      }
    } catch (error) {
      console.error('Revoke error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = () => {
    if (!user) return;
    window.location.href = `/api/auth/gsc/authorize?userId=${user.id}${conversationId ? `&conversationId=${conversationId}` : ''}`;
  };

  if (!user) return null;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
          </svg>
          <div>
            <h2 className="text-lg font-bold text-[#111827]">Google Search Console</h2>
            <p className="text-xs text-[#6B7280]">Connect your search data for AI-powered insights</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827] transition-colors"
          title="Close"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#E5E5E5] border-t-[#9A8FEA] rounded-full animate-spin"></div>
          </div>
        ) : gscStatus.isAuthorized ? (
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-emerald-900">Connected</div>
                  <div className="text-xs text-emerald-600">GSC integration is active</div>
                </div>
              </div>
              <button
                onClick={handleRevoke}
                className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Disconnect
              </button>
            </div>

            {/* Authorized Sites */}
            <div>
              <h3 className="text-sm font-bold text-[#111827] mb-3">Authorized Sites</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto border border-[#E5E5E5] rounded-lg">
                {gscStatus.sites.length > 0 ? (
                  gscStatus.sites.map((site, index) => (
                    <div key={site} className={`px-4 py-3 flex items-center gap-3 hover:bg-[#FAFAFA] transition-colors ${index !== gscStatus.sites.length - 1 ? 'border-b border-[#F5F5F5]' : ''}`}>
                      <svg className="w-4 h-4 text-[#6B7280] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <span className="text-sm text-[#111827] truncate">{site}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-[#9CA3AF] italic">
                    No sites found in your GSC account
                  </div>
                )}
              </div>
            </div>

            {/* What AI Can Do */}
            <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg p-4">
              <h3 className="text-sm font-bold text-[#111827] mb-3">What the AI Can Do</h3>
              <ul className="space-y-2 text-xs text-[#6B7280]">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#9A8FEA] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Track keyword rankings and search performance across all your sites</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#9A8FEA] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Analyze click-through rates, impressions, and position changes</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#9A8FEA] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Identify optimization opportunities based on search console data</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#9A8FEA] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Generate insights and recommendations to improve search visibility</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Not Connected State */}
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                <svg className="w-8 h-8 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#111827] mb-2">Not Connected</h3>
              <p className="text-sm text-[#6B7280] mb-6 max-w-md mx-auto">
                Connect your Google Search Console to enable AI-powered search performance analysis and optimization
              </p>
              <button
                onClick={handleAuthorize}
                className="px-6 py-3 text-sm font-bold text-white rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg"
                style={{ background: 'linear-gradient(80deg, #FFAF40, #D194EC, #9A8FEA, #65B4FF)' }}
              >
                Authorize Google Search Console
              </button>
            </div>

            {/* What AI Can Do */}
            <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg p-4">
              <h3 className="text-sm font-bold text-[#111827] mb-3">What the AI Can Do After Authorization</h3>
              <ul className="space-y-2 text-xs text-[#6B7280]">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#9A8FEA] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Track keyword rankings and search performance across all your sites</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#9A8FEA] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Analyze click-through rates, impressions, and position changes</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#9A8FEA] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Identify optimization opportunities based on search console data</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#9A8FEA] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Generate insights and recommendations to improve search visibility</span>
                </li>
              </ul>
            </div>

            {/* Security Note */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <svg className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <p className="text-xs text-blue-900">
                Your data is secure. We only request read-only access to your Search Console data. You can revoke access at any time.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-between bg-[#FAFAFA]">
        <span className="text-xs text-[#9CA3AF]">Powered by Google Cloud</span>
        <button
          onClick={checkStatus}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:text-[#111827] hover:bg-white rounded-lg transition-colors disabled:opacity-50"
        >
          Refresh Status
        </button>
      </div>
    </div>
  );
}
