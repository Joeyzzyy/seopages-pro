'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import ConfirmModal from '@/components/ConfirmModal';

interface TopBarProps {
  onDomainsClick?: () => void;
  user?: User | null;
  showBackToProjects?: boolean;
  credits?: number;
  subscriptionTier?: string;
}

export default function TopBar({ onDomainsClick, user: propUser, showBackToProjects, credits = 1, subscriptionTier = 'free' }: TopBarProps) {
  const [user, setUser] = useState<User | null>(propUser || null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    if (propUser !== undefined) {
      setUser(propUser);
      return;
    }

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [propUser]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex items-center justify-between px-4 py-2">
      {/* Left side logo */}
      <Link 
        href="/" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="flex items-center gap-2 hover:opacity-90 transition-opacity"
      >
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#9A8FEA] via-[#65B4FF] to-[#9A8FEA] rounded-full blur-md opacity-50 animate-[glow_3s_ease-in-out_infinite]" />
          <img src="/new-logo.png" alt="SEOPages" className="relative h-8 w-auto drop-shadow-[0_0_6px_rgba(154,143,234,0.4)]" />
        </div>
        <span className="text-lg italic text-[#111827] tracking-wide" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          seopages<span className="text-[#9A8FEA]">.</span>pro
        </span>
      </Link>

      {/* Right side function buttons and user info */}
      {user && (
        <div className="flex items-center gap-3">
          {/* Function Buttons */}
          <div className="flex items-center gap-2">
            {/* Back to Projects Button */}
            {showBackToProjects && (
              <Link
                href="/projects"
                className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-lg transition-all"
                title="Back to Projects"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-[9px] font-medium">Home</span>
              </Link>
            )}

            {/* Verified Domains Button (for Publishing) */}
            {onDomainsClick && (
              <button
                onClick={onDomainsClick}
                className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-lg transition-all cursor-pointer"
                title="Manage Verified Domains"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span className="text-[9px] font-medium">Domains</span>
              </button>
            )}

          </div>

          <div className="w-px h-8 bg-[#E5E5E5]"></div>

          {/* Plan & Credits Display */}
          <a
            href="/#pricing"
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-full hover:from-amber-100 hover:to-orange-100 transition-all"
            title="View Pricing"
          >
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
              subscriptionTier === 'pro' 
                ? 'bg-purple-100 text-purple-700' 
                : subscriptionTier === 'standard'
                ? 'bg-blue-100 text-blue-700'
                : subscriptionTier === 'starter'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {subscriptionTier}
            </span>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
              </svg>
              <span className="text-xs font-semibold text-amber-700">{credits}</span>
            </div>
          </a>

          {/* User Info */}
          <div className="flex items-center gap-2">
            {user.user_metadata.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata.full_name || 'User'}
                width={24}
                height={24}
                className="rounded-full border border-[#E5E5E5] object-cover w-6 h-6"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div 
                className="w-6 h-6 rounded-full border border-[#E5E5E5] flex items-center justify-center text-white text-[10px] font-medium"
                style={{
                  background: 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)',
                }}
              >
                {(user.user_metadata.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
              </div>
            )}
            <span className="text-xs font-medium text-[#111827] max-w-[120px] truncate">
              {user.user_metadata.full_name || user.email}
            </span>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-all text-xs font-medium cursor-pointer"
            title="Sign Out"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <ConfirmModal
          title="Sign Out"
          message="Are you sure you want to sign out? You will need to sign in again to access your projects."
          confirmText="Sign Out"
          cancelText="Cancel"
          onConfirm={handleSignOut}
          onCancel={() => setShowSignOutConfirm(false)}
          isDangerous
        />
      )}
    </div>
  );
}

