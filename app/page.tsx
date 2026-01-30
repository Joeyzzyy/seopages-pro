'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import PricingModal from '@/components/PricingModal';
import { useToast } from '@/components/Toast';

export default function HomePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'pro' | null>(null);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState('free');

  // Fetch user credits
  const fetchUserCredits = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      
      const response = await fetch('/api/user/credits', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserCredits(data.credits ?? 0);
        setSubscriptionTier(data.subscription_tier ?? 'free');
      } else {
        console.error('Failed to fetch credits: HTTP', response.status);
        showToast('Failed to fetch subscription info. Please check your network connection.', 'error', 5000);
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
      showToast('Failed to fetch subscription info. Please check your network connection.', 'error', 5000);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchUserCredits();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setError(null);
      if (session?.user) {
        fetchUserCredits();
        // Only redirect to projects on intentional sign in (user clicked login button)
        // Check sessionStorage flag set before OAuth redirect
        const intentionalLogin = sessionStorage.getItem('intentional_login');
        if (event === 'SIGNED_IN' && intentionalLogin === 'true') {
          sessionStorage.removeItem('intentional_login');
          router.push('/projects');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Handle hash scrolling (e.g., /#pricing)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, []);

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please set up environment variables.');
      return;
    }

    try {
      setError(null);
      setSigningIn(true);
      // Mark this as intentional login (persists across OAuth redirect)
      sessionStorage.setItem('intentional_login', 'true');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/projects`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('OAuth error:', error);
        setError(error.message || 'Failed to sign in with Google');
        setSigningIn(false);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'An unexpected error occurred');
      setSigningIn(false);
    }
  };

  // Handle buy plan click
  const handleBuyPlan = async (plan: 'standard' | 'pro') => {
    if (!user) {
      // Not logged in - trigger Google login first
      setSelectedPlan(plan);
      await handleGoogleLogin();
      return;
    }
    // Logged in - show pricing modal
    setSelectedPlan(plan);
    setShowPricingModal(true);
  };

  // Handle payment success
  const handlePaymentSuccess = (newCredits: number, newTier: string) => {
    setUserCredits(newCredits);
    setSubscriptionTier(newTier);
    setShowPricingModal(false);
    setSelectedPlan(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden overflow-y-auto relative" style={{ height: 'auto' }}>
      {/* Background texture - subtle grid pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      {/* Noise texture overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/new-logo.png" alt="SEOPages" className="h-8 sm:h-10 w-auto" />
            <span className="text-lg sm:text-xl font-semibold tracking-tight">
              <span className="text-white">seopages</span>
              <span className="text-[#9A8FEA]">.</span>
              <span className="text-gray-400">pro</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Comparisons Mega Dropdown */}
            <div className="hidden lg:block relative group">
              <button className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1 py-2">
                50 Comparisons
                <svg className="w-3 h-3 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="fixed left-0 right-0 top-[56px] pt-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="bg-[#111111] border-b border-white/10 shadow-2xl">
                  <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-white font-semibold">SEOPages.pro vs 54 Tools</h3>
                        <p className="text-gray-500 text-sm">1v1 comparison pages — all AI-generated</p>
                      </div>
                      <a href="/seopages-pro-alternatives" className="text-sm text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
                        View All 50
                      </a>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {[
                        { name: 'Jasper AI', slug: 'jasper-ai' },
                        { name: 'Surfer SEO', slug: 'surfer-seo' },
                        { name: 'Ahrefs', slug: 'ahrefs' },
                        { name: 'SEMrush', slug: 'semrush' },
                        { name: 'Copy.ai', slug: 'copy-ai' },
                        { name: 'Frase', slug: 'frase' },
                        { name: 'Clearscope', slug: 'clearscope' },
                        { name: 'MarketMuse', slug: 'marketmuse' },
                        { name: 'Writesonic', slug: 'writesonic' },
                        { name: 'Rytr', slug: 'rytr' },
                        { name: 'Moz Pro', slug: 'moz-pro' },
                        { name: 'Unbounce', slug: 'unbounce' },
                        { name: 'Webflow', slug: 'webflow' },
                        { name: 'Rank Math', slug: 'rank-math' },
                        { name: 'Yoast SEO', slug: 'yoast-seo' },
                        { name: 'NeuronWriter', slug: 'neuronwriter' },
                        { name: 'Scalenut', slug: 'scalenut' },
                        { name: 'GrowthBar', slug: 'growthbar' },
                      ].map((item) => (
                        <a
                          key={item.slug}
                          href={`/seopages-pro-alternatives/${item.slug}`}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors group/item"
                        >
                          <div className="flex items-center gap-1">
                            <img 
                              src={`https://www.google.com/s2/favicons?domain=${item.slug.replace(/-/g, '')}.com&sz=32`}
                              alt={item.name}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-[10px] text-gray-600">vs</span>
                            <img 
                              src="/new-logo.png"
                              alt="SEOPages"
                              className="w-4 h-4 rounded"
                            />
                          </div>
                          <span className="text-sm text-gray-400 group-hover/item:text-white truncate">{item.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Listicles Mega Dropdown */}
            <div className="hidden lg:block relative group">
              <button className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1 py-2">
                63 Listicles
                <svg className="w-3 h-3 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="fixed left-0 right-0 top-[56px] pt-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="bg-[#111111] border-b border-white/10 shadow-2xl">
                  <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-white font-semibold">Best Alternatives Guides</h3>
                        <p className="text-gray-500 text-sm">Ranked listicle pages — all AI-generated</p>
                      </div>
                      <a href="/best-alternatives" className="text-sm text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
                        View All 63
                      </a>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { name: 'Jasper AI Alternatives', slug: 'jasper-ai' },
                        { name: 'Surfer SEO Alternatives', slug: 'surfer-seo' },
                        { name: 'Ahrefs Alternatives', slug: 'ahrefs' },
                        { name: 'SEMrush Alternatives', slug: 'semrush' },
                        { name: 'Best AI SEO Tools', slug: 'ai-seo-tools' },
                        { name: 'Best AI Writing Tools', slug: 'ai-writing-tools' },
                        { name: 'Keyword Research Tools', slug: 'keyword-research-tools' },
                        { name: 'Rank Tracking Tools', slug: 'rank-tracking-tools' },
                        { name: 'Content Optimization', slug: 'content-optimization-tools' },
                        { name: 'Local SEO Tools', slug: 'local-seo-tools' },
                        { name: 'SEO Chrome Extensions', slug: 'seo-chrome-extensions' },
                        { name: 'SEO for Agencies', slug: 'seo-tools-agencies' },
                        { name: 'SEO for E-commerce', slug: 'seo-tools-ecommerce' },
                        { name: 'AI Blog Writers', slug: 'ai-blog-writers' },
                        { name: 'Small Business SEO', slug: 'seo-tools-small-business' },
                      ].map((item) => (
                        <a
                          key={item.slug}
                          href={`/best-alternatives/${item.slug}`}
                          className="p-2 rounded-lg hover:bg-white/5 transition-colors group/item"
                        >
                          <span className="text-sm text-gray-400 group-hover/item:text-white">{item.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Guides Dropdown */}
            <div className="hidden lg:block relative group">
              <button className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1 py-2">
                Guides
                <svg className="w-3 h-3 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="bg-[#111111] border border-white/10 rounded-lg shadow-xl min-w-[240px]">
                  <div className="p-2">
                    <a href="/alternative-page-guide" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-[#65B4FF]/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#65B4FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">Alternative Pages</div>
                        <div className="text-xs text-gray-500">vs comparisons & 1v1</div>
                      </div>
                    </a>
                    <a href="/listicle-page-guide" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-[#9A8FEA]/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#9A8FEA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">Listicle Pages</div>
                        <div className="text-xs text-gray-500">Top 10 & Best Of guides</div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <a href="#how-it-works" className="hidden lg:block text-sm text-gray-400 hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="hidden lg:block text-sm text-gray-400 hover:text-white transition-colors">Pricing</a>
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <a
                  href="/projects"
                  className="px-3 sm:px-4 py-2 bg-gradient-to-r from-[#9A8FEA] to-[#65B4FF] text-white text-xs sm:text-sm font-semibold rounded-lg hover:opacity-90 transition-all flex items-center gap-1 sm:gap-2"
                >
                  <span className="hidden sm:inline">Go to</span> Workspace
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                
                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors">
                    {user.user_metadata?.avatar_url ? (
                      <img 
                        src={user.user_metadata.avatar_url} 
                        alt="Avatar" 
                        className="w-8 h-8 rounded-full border border-white/20"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9A8FEA] to-[#65B4FF] flex items-center justify-center text-white text-sm font-medium">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </button>
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-[#111111] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="px-3 py-2 border-b border-white/10">
                      <p className="text-white text-sm font-medium truncate">{user.user_metadata?.full_name || 'User'}</p>
                      <p className="text-gray-500 text-xs truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        setUser(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={signingIn}
                className="px-3 sm:px-4 py-2 bg-white text-black text-xs sm:text-sm font-semibold rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                {signingIn ? 'Connecting...' : 'Get Started'}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-6 sm:pb-8 px-4 sm:px-6">
        {/* Subtle background with radial gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)]" />
          <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-[radial-gradient(circle,_rgba(154,143,234,0.03)_0%,_transparent_70%)]" />
          <div className="absolute top-40 right-1/4 w-[250px] h-[250px] bg-[radial-gradient(circle,_rgba(101,180,255,0.02)_0%,_transparent_70%)]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Main Headline - BIG and clear */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 sm:mb-8 leading-[1.05]">
            <span className="text-white">Comparisons & Listicles</span>
            <br />
            <span className="bg-gradient-to-r from-[#9A8FEA] to-[#65B4FF] bg-clip-text text-transparent">
              AI Engines Love to Cite
            </span>
          </h1>

          {/* Core Value - Simple and bold */}
          <p className="text-xl sm:text-2xl text-gray-400 max-w-2xl mx-auto mb-10 sm:mb-12 leading-relaxed">
            SEO takes months. <span className="text-white font-semibold">GEO rewards you now.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            {user ? (
              <a
                href="/projects"
                className="group w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2 text-base"
              >
                <span>Go to Workspace</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={signingIn}
                className="group w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-base"
              >
                <span>{signingIn ? 'Connecting...' : 'Get Started — $4.9 for 10 Pages'}</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            <a href="#why-it-works" className="w-full sm:w-auto px-8 py-4 border border-white/20 text-white font-medium rounded-xl hover:bg-white/5 transition-all text-center text-base">
              Why SEO + GEO Love These
            </a>
          </div>

        </div>
      </section>

      {/* === PAGE GALLERY === */}
      <section className="pt-0 pb-8 sm:pb-12 px-4 sm:px-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#65B4FF]/[0.02] to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,_rgba(101,180,255,0.03)_0%,_transparent_70%)]" />
        
        <div className="relative max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-8">
            <p className="text-sm text-gray-400">
              <span className="text-[#9A8FEA] font-medium">113 Live Demo Pages</span> — A few clicks away from owning the same
            </p>
          </div>

          <div className="space-y-10">
            {/* 1v1 Comparisons */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">1v1 Comparison Pages</h3>
                  <p className="text-gray-600 text-sm">SEOPages.pro vs 50 competitors</p>
                </div>
                <a href="/seopages-pro-alternatives" className="text-sm text-gray-400 hover:text-white transition-colors">
                  View all 50 →
                </a>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { name: 'Jasper AI', slug: 'jasper-ai' },
                  { name: 'Surfer SEO', slug: 'surfer-seo' },
                  { name: 'Ahrefs', slug: 'ahrefs' },
                  { name: 'SEMrush', slug: 'semrush' },
                  { name: 'Copy.ai', slug: 'copy-ai' },
                  { name: 'Frase', slug: 'frase' },
                  { name: 'Clearscope', slug: 'clearscope' },
                  { name: 'MarketMuse', slug: 'marketmuse' },
                  { name: 'Writesonic', slug: 'writesonic' },
                  { name: 'NeuronWriter', slug: 'neuronwriter' },
                  { name: 'Webflow', slug: 'webflow' },
                  { name: 'Rank Math', slug: 'rank-math' },
                ].map((item) => (
                  <a
                    key={item.slug}
                    href={`/seopages-pro-alternatives/${item.slug}`}
                    className="group p-3 bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg hover:border-white/20 hover:from-white/[0.05] hover:to-white/[0.02] transition-all duration-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <img 
                        src={`https://www.google.com/s2/favicons?domain=${item.slug.replace(/-/g, '')}.com&sz=64`}
                        alt={item.name}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-[10px] text-gray-500">vs</span>
                      <img 
                        src="/new-logo.png"
                        alt="SEOPages"
                        className="w-4 h-4 rounded"
                      />
                    </div>
                    <div className="text-white text-sm truncate group-hover:text-gray-300">{item.name}</div>
                  </a>
                ))}
              </div>
            </div>

            {/* Best-Of Listicles */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Best-Of Listicle Pages</h3>
                  <p className="text-gray-600 text-sm">63 &quot;Best Alternatives&quot; guides</p>
                </div>
                <a href="/best-alternatives" className="text-sm text-gray-400 hover:text-white transition-colors">
                  View all 63 →
                </a>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { name: 'Jasper AI Alternatives', slug: 'jasper-ai', domain: 'jasper.ai' },
                  { name: 'Surfer SEO Alternatives', slug: 'surfer-seo', domain: 'surferseo.com' },
                  { name: 'Ahrefs Alternatives', slug: 'ahrefs', domain: 'ahrefs.com' },
                  { name: 'SEMrush Alternatives', slug: 'semrush', domain: 'semrush.com' },
                  { name: 'AI SEO Tools', slug: 'ai-seo-tools', domain: 'seopages.pro' },
                  { name: 'AI Writing Tools', slug: 'ai-writing-tools', domain: 'copy.ai' },
                  { name: 'Keyword Research', slug: 'keyword-research-tools', domain: 'semrush.com' },
                  { name: 'Rank Tracking', slug: 'rank-tracking-tools', domain: 'ahrefs.com' },
                  { name: 'Content Optimization', slug: 'content-optimization-tools', domain: 'clearscope.io' },
                  { name: 'Local SEO Tools', slug: 'local-seo-tools', domain: 'brightlocal.com' },
                  { name: 'AI Blog Writers', slug: 'ai-blog-writers', domain: 'jasper.ai' },
                  { name: 'SEO for Agencies', slug: 'seo-tools-agencies', domain: 'semrush.com' },
                ].map((item) => (
                  <a
                    key={item.slug}
                    href={`/best-alternatives/${item.slug}`}
                    className="group p-3 bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg hover:border-white/20 hover:from-white/[0.05] hover:to-white/[0.02] transition-all duration-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <img 
                        src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=64`}
                        alt={item.name}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-[10px] text-gray-600">best</span>
                    </div>
                    <div className="text-white text-sm truncate group-hover:text-gray-300">{item.name}</div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why These Page Types Work - SEO & GEO */}
      <section id="why-it-works" className="py-16 sm:py-24 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#65B4FF]/[0.02] to-transparent" />
        
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white">
              Why Comparisons & Listicles?
            </h2>
            <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto">
              These two content formats dominate both traditional search and AI-powered answers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {/* SEO Benefits */}
            <div className="p-6 sm:p-8 bg-gradient-to-br from-[#9A8FEA]/10 to-transparent border border-[#9A8FEA]/20 rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#9A8FEA]/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#9A8FEA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">SEO Power</h3>
                  <p className="text-sm text-gray-500">Traditional Search Engines</p>
                </div>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#9A8FEA] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="text-white font-medium">High-Intent Keywords</span>
                    <p className="text-sm text-gray-500">&quot;X vs Y&quot; and &quot;Best X alternatives&quot; signal buying intent</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#9A8FEA] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="text-white font-medium">Rich Snippets Ready</span>
                    <p className="text-sm text-gray-500">Schema.org markup for stars, FAQs, and featured snippets</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#9A8FEA] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="text-white font-medium">Natural Link Magnets</span>
                    <p className="text-sm text-gray-500">Comprehensive comparisons attract organic backlinks</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* GEO Benefits */}
            <div className="p-6 sm:p-8 bg-gradient-to-br from-[#65B4FF]/10 to-transparent border border-[#65B4FF]/20 rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#65B4FF]/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#65B4FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">GEO Power</h3>
                  <p className="text-sm text-gray-500">AI Search Engines (ChatGPT, Perplexity, Claude)</p>
                </div>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#65B4FF] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="text-white font-medium">AI Loves Structured Data</span>
                    <p className="text-sm text-gray-500">Tables, pros/cons, ratings — perfect for AI extraction</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#65B4FF] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="text-white font-medium">Citeable Content</span>
                    <p className="text-sm text-gray-500">Clear rankings and verdicts AI can quote directly</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#65B4FF] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="text-white font-medium">Instant Results</span>
                    <p className="text-sm text-gray-500">No waiting months — AI crawls and cites new content fast</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Summary */}
          <div className="mt-10 text-center">
            <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
              <span className="text-white font-medium">The strategy:</span> Build pages that work for both. 
              SEO compounds over time. GEO gives you traffic today.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works - Product Usage */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 relative">
        {/* Subtle background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#9A8FEA]/[0.02] to-transparent" />
        
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#9A8FEA]/10 border border-[#9A8FEA]/20 rounded-full mb-6">
              <svg className="w-4 h-4 text-[#9A8FEA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm text-[#9A8FEA]">5 Steps to Your Pages</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white">How to Use SEOPages.pro</h2>
            <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto">
              Enter your URL, pick competitors, get production-ready HTML. Deploy anywhere.
            </p>
          </div>

          {/* Timeline Steps */}
          <div className="relative">
            {/* Connecting Line */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#9A8FEA]/50 via-[#65B4FF]/50 to-[#65B4FF]/50" />
            
            <div className="space-y-8 lg:space-y-0">
              {/* Step 1 */}
              <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
                <div className="lg:text-right lg:pr-12 mb-6 lg:mb-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#9A8FEA]/10 border border-[#9A8FEA]/20 rounded-full text-xs text-[#9A8FEA] mb-3">
                    <span className="w-5 h-5 rounded-full bg-[#9A8FEA]/20 flex items-center justify-center text-[#9A8FEA] font-bold">1</span>
                    Context Gathering
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Enter Your Product URL</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">
                    Just paste your website URL. Our AI automatically crawls your site to understand your brand, products, value propositions, and unique selling points.
                  </p>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {['Logo Detection', 'Brand Colors', 'Product Features', 'Pricing Info'].map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-400">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="relative lg:pl-12">
                  <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#9A8FEA] border-4 border-[#0A0A0A] -ml-2 z-10" />
                  <div className="p-4 bg-gradient-to-br from-[#9A8FEA]/10 to-transparent border border-[#9A8FEA]/20 rounded-xl">
                    <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-white/5">
                      <div className="w-8 h-8 rounded-lg bg-[#9A8FEA]/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#9A8FEA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <input type="text" placeholder="https://your-product.com" className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 outline-none" readOnly />
                      <button className="px-3 py-1.5 bg-[#9A8FEA]/20 text-[#9A8FEA] text-xs rounded-lg">Analyze</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center lg:pt-12">
                <div className="order-2 lg:order-1 relative lg:pr-12">
                  <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#65B4FF] border-4 border-[#0A0A0A] -mr-2 z-10" />
                  <div className="p-4 bg-gradient-to-bl from-[#65B4FF]/10 to-transparent border border-[#65B4FF]/20 rounded-xl mb-6 lg:mb-0">
                    <div className="space-y-2">
                      {['Jasper AI', 'Copy.ai', 'Writesonic'].map((competitor, idx) => (
                        <div key={competitor} className="flex items-center gap-3 p-2 bg-black/30 rounded-lg border border-white/5">
                          <img src={`https://www.google.com/s2/favicons?domain=${competitor.toLowerCase().replace(/[.\s]/g, '')}.com&sz=32`} alt={competitor} className="w-5 h-5 rounded" />
                          <span className="text-sm text-white flex-1">{competitor}</span>
                          <div className={`w-4 h-4 rounded border ${idx < 2 ? 'bg-[#65B4FF]/20 border-[#65B4FF]' : 'border-white/20'} flex items-center justify-center`}>
                            {idx < 2 && <svg className="w-3 h-3 text-[#65B4FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="order-1 lg:order-2 lg:pl-12 mb-6 lg:mb-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#65B4FF]/10 border border-[#65B4FF]/20 rounded-full text-xs text-[#65B4FF] mb-3">
                    <span className="w-5 h-5 rounded-full bg-[#65B4FF]/20 flex items-center justify-center text-[#65B4FF] font-bold">2</span>
                    Competitor Selection
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Select Your Competitors</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">
                    We auto-detect competitors in your space, or you can add custom ones. Each competitor gets a dedicated comparison page with real-time research data.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Auto-Detection', 'Custom Competitors', 'Market Analysis', 'Pricing Research'].map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-400">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center lg:pt-12">
                <div className="lg:text-right lg:pr-12 mb-6 lg:mb-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#65B4FF]/10 border border-[#65B4FF]/20 rounded-full text-xs text-[#65B4FF] mb-3">
                    <span className="w-5 h-5 rounded-full bg-[#65B4FF]/20 flex items-center justify-center text-[#65B4FF] font-bold">3</span>
                    AI Research & Writing
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Deep Product Research</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">
                    Our AI uses multiple search APIs (Tavily, Perplexity, SEMrush) to gather current market data, pricing, features, and user sentiment for accurate comparisons.
                  </p>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {['Web Search', 'Perplexity AI', 'Screenshot API', 'Sentiment Analysis'].map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-400">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="relative lg:pl-12">
                  <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#65B4FF] border-4 border-[#0A0A0A] -ml-2 z-10" />
                  <div className="p-4 bg-gradient-to-br from-[#65B4FF]/10 to-transparent border border-[#65B4FF]/20 rounded-xl">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Tavily Search', status: 'done' },
                        { label: 'Perplexity AI', status: 'done' },
                        { label: 'Feature Analysis', status: 'running' },
                        { label: 'Pricing Data', status: 'pending' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2 p-2 bg-black/30 rounded-lg border border-white/5">
                          <div className="w-4 h-4 rounded bg-[#65B4FF]/20 flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-[#65B4FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          <span className="text-xs text-gray-400 flex-1">{item.label}</span>
                          {item.status === 'done' && <span className="w-2 h-2 rounded-full bg-green-500" />}
                          {item.status === 'running' && <span className="w-2 h-2 rounded-full bg-[#65B4FF] animate-pulse" />}
                          {item.status === 'pending' && <span className="w-2 h-2 rounded-full bg-gray-600" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center lg:pt-12">
                <div className="order-2 lg:order-1 relative lg:pr-12">
                  <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#9A8FEA] border-4 border-[#0A0A0A] -mr-2 z-10" />
                  <div className="p-4 bg-gradient-to-bl from-[#9A8FEA]/10 to-transparent border border-[#9A8FEA]/20 rounded-xl mb-6 lg:mb-0">
                    <div className="space-y-1.5 text-xs font-mono">
                      {['Hero Section', 'Comparison Table (12 features)', 'Pricing Section', 'Pros & Cons', 'FAQ (8 questions)', 'Schema.org Markup'].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-[#9A8FEA]">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="order-1 lg:order-2 lg:pl-12 mb-6 lg:mb-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#9A8FEA]/10 border border-[#9A8FEA]/20 rounded-full text-xs text-[#9A8FEA] mb-3">
                    <span className="w-5 h-5 rounded-full bg-[#9A8FEA]/20 flex items-center justify-center text-[#9A8FEA] font-bold">4</span>
                    Section Generation
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Modular Page Assembly</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">
                    Each section is generated independently for quality control: Hero, Verdict, Comparison Table, Pricing, Pros/Cons, Use Cases, FAQ, and CTA sections.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Hero Section', 'Comparison Table', 'FAQ + Schema', 'CTA Buttons'].map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-400">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center lg:pt-12">
                <div className="lg:text-right lg:pr-12 mb-6 lg:mb-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#65B4FF]/10 border border-[#65B4FF]/20 rounded-full text-xs text-[#65B4FF] mb-3">
                    <span className="w-5 h-5 rounded-full bg-[#65B4FF]/20 flex items-center justify-center text-[#65B4FF] font-bold">5</span>
                    Final Output
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Download &amp; Deploy</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">
                    Get self-contained HTML files with embedded Tailwind CSS. No build step needed. Upload directly to your server, Vercel, Netlify, or any static host.
                  </p>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {['Self-Contained HTML', 'Tailwind CSS', 'Mobile Responsive', 'SEO Ready'].map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-400">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="relative lg:pl-12">
                  <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#65B4FF] border-4 border-[#0A0A0A] -ml-2 z-10" />
                  <div className="p-4 bg-gradient-to-br from-[#65B4FF]/10 to-transparent border border-[#65B4FF]/20 rounded-xl">
                    <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-white/5">
                      <div className="w-10 h-10 rounded-lg bg-[#65B4FF]/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#65B4FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white font-medium">your-product-vs-competitor.html</div>
                        <div className="text-xs text-gray-500">45KB · Ready to deploy</div>
                      </div>
                      <button className="px-3 py-1.5 bg-[#65B4FF]/20 text-[#65B4FF] text-xs rounded-lg">Download</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: '~3 min', label: 'Generation Time' },
              { value: '8+', label: 'Page Sections' },
              { value: '100%', label: 'SEO Optimized' },
              { value: '0', label: 'Dependencies' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notes - After How It Works */}
      <section className="py-10 sm:py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Why No Free Trial - Highlighted */}
          <div className="relative">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-[#9A8FEA]/20 via-[#65B4FF]/20 to-[#9A8FEA]/20 rounded-2xl blur-sm" />
            <div className="relative p-6 sm:p-8 bg-[#0D0D0D] border border-[#9A8FEA]/20 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#9A8FEA]/10 border border-[#9A8FEA]/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#9A8FEA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white">Why No Free Trial?</h3>
              </div>
              <div className="space-y-4 text-sm sm:text-base text-gray-400 leading-relaxed">
                <p>
                  We&apos;re a small team. We know SEO, we built something useful, but we don&apos;t have VC money to burn.
                  Every page you generate costs us real money in AI compute.
                </p>
                <p>
                  So no, we can&apos;t give you unlimited free trials. But here&apos;s what we <span className="text-[#9A8FEA] font-medium">can</span> promise:
                </p>
                <ul className="space-y-3 pl-1">
                  <li className="flex items-start gap-3">
                    <svg className="w-4 h-4 text-[#9A8FEA] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span><span className="text-white font-medium">$4.9 for 10 pages.</span> That&apos;s less than $0.50 per page. Way cheaper than hiring any writer.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-4 h-4 text-[#9A8FEA] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span><span className="text-white font-medium">Once you pay, you&apos;re the boss.</span> Not satisfied? Email me directly. I&apos;ll personally tweak the product or your pages until you&apos;re happy.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-4 h-4 text-[#9A8FEA] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span><span className="text-white font-medium">This isn&apos;t a faceless SaaS.</span> There&apos;s a real person behind this who actually wants you to succeed.</span>
                  </li>
                </ul>
                <div className="pt-4 mt-4 border-t border-white/10">
                  <p className="text-gray-500">
                    Questions? Complaints? Feature requests? →{' '}
                    <a href="mailto:wps_zy@126.com" className="text-[#9A8FEA] hover:text-[#b5acf2] font-medium">wps_zy@126.com</a>
                    <span className="text-gray-600"> — I read every email.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* What We Actually Sell - Highlighted */}
          <div className="relative">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-[#9A8FEA]/20 via-[#65B4FF]/20 to-[#9A8FEA]/20 rounded-2xl blur-sm" />
            <div className="relative p-6 sm:p-8 bg-[#0D0D0D] border border-[#9A8FEA]/20 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#9A8FEA]/10 border border-[#9A8FEA]/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#9A8FEA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white">What We Actually Sell</h3>
              </div>
              <div className="space-y-4 text-sm sm:text-base text-gray-400 leading-relaxed">
                <p>
                  <span className="text-white font-medium">Not just AI-generated content.</span> We sell 
                  <span className="text-[#9A8FEA] font-medium"> SEO page best practices</span> — the structure, the schema, the conversion elements that actually work.
                </p>
                <p className="text-white font-medium bg-white/5 p-4 rounded-xl border border-white/10">
                  When you&apos;re staring at a blank page, not knowing where to start — look at ours. 
                  See how a professional comparison page should be structured. Then open Cursor, make it yours, and ship something world-class.
                </p>
                <p>
                  We built <span className="text-[#9A8FEA] font-medium">113 live pages</span> on this site — 50 comparisons, 63 listicles. 
                  Every one follows the same battle-tested template. Study them. Copy what works. That&apos;s the point.
                </p>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-gray-500 text-sm mb-3">What makes each page production-ready:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'SEO Structure', desc: 'Proven layouts' },
                      { label: 'Schema.org', desc: 'Rich snippets' },
                      { label: 'Conversion CTAs', desc: 'High-intent design' },
                      { label: 'Real Research', desc: 'Not hallucinated' },
                      { label: 'Tailwind CSS', desc: 'Easy to customize' },
                    ].map((item) => (
                      <div key={item.label} className="px-3 py-2 bg-[#9A8FEA]/5 border border-[#9A8FEA]/20 rounded-lg">
                        <span className="text-[#9A8FEA] text-xs font-medium">{item.label}</span>
                        <span className="text-gray-600 text-xs ml-1.5">· {item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 relative">
        {/* Subtle background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent" />
        
        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-white">Pricing</h2>
            <p className="text-gray-500 text-sm sm:text-base">
              One-time payment. No subscription. Own your pages forever.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
            {/* Standard - Featured */}
            <div className="relative p-5 sm:p-6 bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/20 rounded-xl flex flex-col h-full shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),_0_0_0_1px_rgba(255,255,255,0.05)]">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-white text-black text-[10px] font-semibold rounded-full shadow-sm">
                Most Popular
              </div>
              <div className="mb-4">
                <h3 className="text-base font-semibold text-white mb-2">Standard</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">$9.9</span>
                  <span className="text-gray-500 text-sm">20 pages</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">$0.495 per page</p>
              </div>
              <ul className="space-y-2 flex-grow text-sm">
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>AI-powered content</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Production-ready HTML</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>SEO + Schema optimized</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Priority support</span>
                </li>
              </ul>
              <button
                onClick={() => handleBuyPlan('standard')}
                className="w-full py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors text-sm mt-5"
              >
                {user ? 'Buy Now' : 'Sign in to Buy'}
              </button>
            </div>

            {/* Pro */}
            <div className="p-5 sm:p-6 bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-xl flex flex-col h-full shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-white mb-2">Pro</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">$19.9</span>
                  <span className="text-gray-500 text-sm">50 pages</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">$0.40 per page</p>
              </div>
              <ul className="space-y-2 flex-grow text-sm">
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Everything in Standard</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Best for crowded markets</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>60% cost savings</span>
                </li>
              </ul>
              <button
                onClick={() => handleBuyPlan('pro')}
                className="w-full py-2.5 border border-white/20 text-white font-medium rounded-lg hover:bg-white/5 transition-colors text-sm mt-5"
              >
                {user ? 'Buy Now' : 'Sign in to Buy'}
              </button>
            </div>
          </div>

          {/* Secure payment notice */}
          <div className="text-center mt-8">
            <p className="text-gray-600 text-xs flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure payment via PayPal
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">
            Your SEO Page Blueprint Awaits
          </h2>
          <p className="text-gray-500 text-sm sm:text-base mb-6">
            10 best-practice templates for $4.9. Customize with Cursor. Ship with confidence.
          </p>
          {user ? (
            <a
              href="/projects"
              className="inline-block px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Go to Workspace
            </a>
          ) : (
            <button
              onClick={handleGoogleLogin}
              disabled={signingIn}
              className="px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {signingIn ? 'Connecting...' : 'Get Started'}
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          {/* Main Footer Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 mb-6">
            <div className="flex items-center gap-2">
              <img src="/new-logo.png" alt="SEOPages" className="h-6 w-auto" />
              <span className="text-sm font-semibold">
                <span className="text-white">seopages</span>
                <span className="text-[#9A8FEA]">.</span>
                <span className="text-gray-400">pro</span>
              </span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-gray-500">
              <a href="/" className="hover:text-white transition-colors">Home</a>
              <a href="/alternative-page-guide" className="hover:text-white transition-colors">Alternative Guide</a>
              <a href="/listicle-page-guide" className="hover:text-white transition-colors">Listicle Guide</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            </nav>
          </div>
          
          {/* Legal & Contact Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5">
            <nav className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs text-gray-600">
              <a href="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
              <span className="text-gray-700">·</span>
              <a href="/terms" className="hover:text-gray-400 transition-colors">Terms of Service</a>
              <span className="text-gray-700">·</span>
              <a href="mailto:wps_zy@126.com" className="hover:text-gray-400 transition-colors">
                wps_zy@126.com
              </a>
            </nav>
            <p className="text-gray-600 text-xs text-center">
              © {new Date().getFullYear()} seopages.pro
            </p>
          </div>
        </div>
      </footer>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-6 right-6 px-6 py-4 bg-red-500/90 backdrop-blur-sm text-white rounded-xl shadow-2xl animate-in slide-in-from-bottom-4">
          {error}
        </div>
      )}

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => {
          setShowPricingModal(false);
          setSelectedPlan(null);
        }}
        currentCredits={userCredits ?? 0}
        currentTier={subscriptionTier}
        onPaymentSuccess={handlePaymentSuccess}
        initialPlan={selectedPlan}
      />
    </div>
  );
}
