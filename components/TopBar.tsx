'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import ConfirmModal from '@/components/ConfirmModal';
import PricingModal from '@/components/PricingModal';

interface TopBarProps {
  onDomainsClick?: () => void;
  user?: User | null;
  credits?: number | null;
  subscriptionTier?: string | null;
  onCreditsUpdate?: (newCredits: number, newTier: string) => void;
}

export default function TopBar({ onDomainsClick, user: propUser, credits, subscriptionTier, onCreditsUpdate }: TopBarProps) {
  const isLoadingCredits = credits === null || credits === undefined || subscriptionTier === null || subscriptionTier === undefined;
  const [user, setUser] = useState<User | null>(propUser || null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

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
        <span className="text-lg font-semibold tracking-tight text-[#111827]">
          seopages<span className="text-[#9A8FEA]">.</span><span className="text-[#6B7280]">pro</span>
        </span>
      </Link>

      {/* Right side function buttons and user info */}
      {user && (
        <div className="flex items-center gap-3">
          {/* Plan & Credits Display */}
          <button
            onClick={() => !isLoadingCredits && setShowPricingModal(true)}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg transition-all ${
              isLoadingCredits 
                ? 'text-[#9CA3AF] cursor-default' 
                : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] cursor-pointer'
            }`}
            title={isLoadingCredits ? 'Loading...' : 'Upgrade Plan'}
            disabled={isLoadingCredits}
          >
            {isLoadingCredits ? (
              <>
                <svg className="w-3 h-3 animate-spin text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span className="text-[10px] text-[#9CA3AF]">Loading subscription...</span>
              </>
            ) : (
              <>
                <span className="text-[10px] text-[#9CA3AF]">Your Subscription:</span>
                <span className="text-[10px] font-medium uppercase text-[#374151]">
                  {subscriptionTier}
                </span>
                <span className="text-[10px] text-[#D1D5DB]">·</span>
                <span className="text-xs font-medium text-[#374151]">{credits} pages</span>
                <svg className="w-3 h-3 text-[#9A8FEA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </>
            )}
          </button>

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

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        currentCredits={credits}
        currentTier={subscriptionTier}
        onPaymentSuccess={(newCredits, newTier) => {
          setShowPricingModal(false);
          onCreditsUpdate?.(newCredits, newTier);
        }}
      />
    </div>
  );
}

