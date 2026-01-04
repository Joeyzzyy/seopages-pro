'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface TopBarProps {
  onDomainsClick?: () => void;
  onGSCClick?: () => void;
  user?: User | null;
}

export default function TopBar({ onDomainsClick, onGSCClick, user: propUser }: TopBarProps) {
  const [user, setUser] = useState<User | null>(propUser || null);

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
      {/* 左侧 Logo */}
      <Link 
        href="/" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <Image 
          src="/product-logo.webp" 
          alt="Mini Seenos Logo" 
          width={24} 
          height={24}
          className="rounded-lg"
        />
        <span className="text-base font-bold text-[#111827]">Mini Seenos</span>
      </Link>

      {/* 右侧功能按钮和用户信息 */}
      {user && (
        <div className="flex items-center gap-3">
          {/* Function Buttons */}
          <div className="flex items-center gap-2">
            {/* Domains Button */}
            {onDomainsClick && (
              <button
                onClick={onDomainsClick}
                className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-lg transition-all cursor-pointer"
                title="Manage domains"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span className="text-[9px] font-medium">Domains</span>
              </button>
            )}

            {/* GSC Button - Google icon */}
            {onGSCClick && (
              <button
                onClick={onGSCClick}
                className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-lg transition-all cursor-pointer"
                title="Google Search Console"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
                <span className="text-[9px] font-medium">GSC</span>
              </button>
            )}

            {/* Skills Link */}
            <Link
              href="/skills"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-lg transition-all"
              title="AI Skills & Tools"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <span className="text-[9px] font-medium">Skills</span>
            </Link>

            {/* Feedbacks Link - Document/clipboard icon */}
            <Link
              href="/feedbacks"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-lg transition-all"
              title="Message Feedbacks"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span className="text-[9px] font-medium">Feedback</span>
            </Link>
          </div>

          <div className="w-px h-8 bg-[#E5E5E5]"></div>

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
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-all text-xs font-medium"
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
    </div>
  );
}

