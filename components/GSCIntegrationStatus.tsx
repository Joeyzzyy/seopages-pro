'use client';

import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';

interface GSCIntegrationStatusProps {
  user: User | null;
  conversationId?: string | null;
}

export default function GSCIntegrationStatus({ user, conversationId }: GSCIntegrationStatusProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [gscStatus, setGscStatus] = useState<{ isAuthorized: boolean; sites: string[] }>({ isAuthorized: false, sites: [] });
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      checkStatus();
    }
  }, [user]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        setIsOpen(false);
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
          gscStatus.isAuthorized 
            ? 'bg-white border-[#E5E5E5] text-[#111827] hover:bg-[#F3F4F6]' 
            : 'bg-white border-[#E5E5E5] text-[#9CA3AF] hover:bg-[#F3F4F6]'
        }`}
        title="Google Search Console Integration"
      >
        <svg className="w-3.5 h-3.5 text-[#6B7280]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 19H6v-7h2v7zm4 0h-2V7h2v12zm4 0h-2v-4h2v4z" />
        </svg>
        <span className="text-xs font-bold whitespace-nowrap">GSC</span>
        {gscStatus.isAuthorized && (
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E5E5] rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-[#F3F4F6] bg-[#FAFAFA]">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#111827]">GSC Integration</h3>
              {loading && <span className="w-3 h-3 border-2 border-[#E5E5E5] border-t-[#111827] rounded-full animate-spin" />}
            </div>
            <p className="text-[10px] text-[#6B7280]">Connect your search data to enable rank tracking.</p>
          </div>

          <div className="p-4">
            {gscStatus.isAuthorized ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Connected
                  </span>
                  <button 
                    onClick={handleRevoke}
                    className="text-[10px] font-bold text-[#9CA3AF] hover:text-red-500 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
                
                <div className="space-y-1">
                  <p className="text-[9px] text-[#9CA3AF] font-black uppercase tracking-widest">Authorized Sites:</p>
                  <div className="max-h-32 overflow-y-auto thin-scrollbar pr-1">
                    {gscStatus.sites.length > 0 ? (
                      gscStatus.sites.map(site => (
                        <div key={site} className="text-[10px] text-[#111827] truncate py-1 border-b border-[#F3F4F6] last:border-0">
                          {site}
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-[#6B7280] italic">No sites found.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-[11px] text-[#6B7280] mb-3">Google Search Console is not connected.</p>
                <button
                  onClick={handleAuthorize}
                  className="w-full py-2 text-[10px] font-black uppercase tracking-[0.1em] text-white rounded-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(80deg, #FFAF40, #D194EC, #9A8FEA, #65B4FF)' }}
                >
                  Authorize Now
                </button>
              </div>
            )}
          </div>
          
          <div className="px-4 py-3 bg-[#F9FAFB] border-t border-[#F3F4F6] flex justify-between items-center">
            <span className="text-[9px] text-[#9CA3AF] font-bold">Powered by Google Cloud</span>
            <button 
              onClick={checkStatus}
              className="text-[9px] text-[#111827] font-black hover:underline"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

