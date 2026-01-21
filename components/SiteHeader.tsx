'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface SiteHeaderProps {
  variant?: 'default' | 'transparent';
}

export default function SiteHeader({ variant = 'default' }: SiteHeaderProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${variant === 'transparent' ? 'bg-[#0A0A0A]/80' : 'bg-[#0A0A0A]/80'} backdrop-blur-xl border-b border-white/5`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#9A8FEA] via-[#65B4FF] to-[#9A8FEA] rounded-full blur-md opacity-60 animate-[glow_3s_ease-in-out_infinite]" />
            <img src="/new-logo.png" alt="SEOPages" className="relative h-8 sm:h-10 w-auto drop-shadow-[0_0_8px_rgba(154,143,234,0.5)]" />
          </div>
          <span className="text-white text-lg sm:text-xl italic tracking-wide" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            seopages<span className="text-[#9A8FEA]">.</span>pro
          </span>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Guide Dropdown */}
          <div className="hidden sm:block relative group">
            <button className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              Guide
              <svg className="w-3 h-3 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-2 min-w-[280px] shadow-xl">
                <Link href="/alternative-page-guide" className="block px-3 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-colors font-medium">
                  📚 Alternative Page Guide
                </Link>
                <div className="border-t border-white/5 my-1"></div>
                <Link href="/alternative-page-guide/what-are-alternative-pages" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  What Are Alternative Pages?
                </Link>
                <Link href="/alternative-page-guide/alternative-page-seo-best-practices" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  SEO Best Practices
                </Link>
                <Link href="/alternative-page-guide/alternative-page-vs-landing-page" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  Alternative vs Landing Page
                </Link>
                <Link href="/alternative-page-guide/how-to-write-alternative-page-copy" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  How to Write Copy
                </Link>
                <Link href="/alternative-page-guide/alternative-page-examples" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  Page Examples
                </Link>
              </div>
            </div>
          </div>
          
          <Link href="/#features" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors">
            Features
          </Link>
          <Link href="/#pricing" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors">
            Pricing
          </Link>
          
          {user ? (
            <Link
              href="/projects"
              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-[#FFAF40] via-[#9A8FEA] to-[#65B4FF] text-white text-xs sm:text-sm font-semibold rounded-lg hover:opacity-90 transition-all flex items-center gap-1 sm:gap-2"
            >
              <span className="hidden sm:inline">Go to</span> Workspace
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <Link
              href="/projects"
              className="px-3 sm:px-4 py-2 bg-white text-black text-xs sm:text-sm font-semibold rounded-lg hover:bg-gray-100 transition-all"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
