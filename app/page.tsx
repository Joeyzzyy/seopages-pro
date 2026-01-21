'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setError(null);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden overflow-y-auto" style={{ height: 'auto' }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#9A8FEA] via-[#65B4FF] to-[#9A8FEA] rounded-full blur-md opacity-60 animate-[glow_3s_ease-in-out_infinite]" />
              <img src="/new-logo.png" alt="SEOPages" className="relative h-8 sm:h-10 w-auto drop-shadow-[0_0_8px_rgba(154,143,234,0.5)]" />
            </div>
            <span className="text-white text-lg sm:text-xl italic tracking-wide" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              seopages<span className="text-[#9A8FEA]">.</span>pro
            </span>
          </div>
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
                  <a href="/alternative-page-guide" className="block px-3 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-colors font-medium">
                    📚 Alternative Page Guide
                  </a>
                  <div className="border-t border-white/5 my-1"></div>
                  <a href="/alternative-page-guide/what-are-alternative-pages" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                    What Are Alternative Pages?
                  </a>
                  <a href="/alternative-page-guide/alternative-page-seo-best-practices" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                    SEO Best Practices
                  </a>
                  <a href="/alternative-page-guide/alternative-page-vs-landing-page" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                    Alternative vs Landing Page
                  </a>
                  <a href="/alternative-page-guide/how-to-write-alternative-page-copy" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                    How to Write Copy
                  </a>
                  <a href="/alternative-page-guide/alternative-page-examples" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                    Page Examples
                  </a>
                </div>
              </div>
            </div>
            <a href="#features" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors">Pricing</a>
            {user ? (
              <a
                href="/projects"
                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-[#FFAF40] via-[#9A8FEA] to-[#65B4FF] text-white text-xs sm:text-sm font-semibold rounded-lg hover:opacity-90 transition-all flex items-center gap-1 sm:gap-2"
              >
                <span className="hidden sm:inline">Go to</span> Workspace
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
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
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[1000px] h-[400px] sm:h-[600px] bg-gradient-to-b from-[#9A8FEA]/20 via-[#65B4FF]/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-40 left-4 sm:left-20 w-48 sm:w-72 h-48 sm:h-72 bg-[#FFAF40]/10 rounded-full blur-3xl" />
          <div className="absolute top-60 right-4 sm:right-20 w-64 sm:w-96 h-64 sm:h-96 bg-[#65B4FF]/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-full mb-6 sm:mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs sm:text-sm text-gray-300">Skip the AI drama. Get the damn pages.</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-4 sm:mb-6 leading-[1.1]">
            Stop Arguing with AI.
            <br />
            <span className="bg-gradient-to-r from-[#FFAF40] via-[#D194EC] via-[#9A8FEA] to-[#65B4FF] bg-clip-text text-transparent">
              Just Get Your Pages.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
            SEO &amp; GEO-optimized alternative pages at dirt-cheap prices.
            <br className="hidden sm:block" />
            <span className="text-gray-300"> We give you the actual code. Deploy-ready HTML.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <button
              onClick={handleGoogleLogin}
              disabled={signingIn}
              className="group relative w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="sm:hidden">{signingIn ? 'Connecting...' : 'Get My Free Page'}</span>
              <span className="hidden sm:inline">{signingIn ? 'Connecting...' : 'Shut Up and Take My Pages'}</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <a href="#pricing" className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 border border-white/20 text-white font-medium rounded-xl hover:bg-white/5 transition-all text-center text-sm sm:text-base">
              View Pricing
            </a>
          </div>

          {/* Free Trial Banner - Glowing & Highlighted */}
          <div className="relative max-w-xl mx-auto mb-12 sm:mb-16">
            {/* Animated glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#9A8FEA] via-[#65B4FF] to-[#9A8FEA] rounded-2xl blur-lg opacity-40 animate-pulse" />
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9A8FEA] via-[#65B4FF] to-[#9A8FEA] rounded-xl opacity-60" />
            
            <div className="relative border border-white/20 rounded-xl p-4 sm:p-5 bg-[#0D0D0D] backdrop-blur-sm">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#9A8FEA] to-[#65B4FF] flex items-center justify-center shrink-0 shadow-lg shadow-[#9A8FEA]/30">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base text-white leading-snug font-medium">
                    <span className="bg-gradient-to-r from-[#FFD166] via-[#B8A9F0] to-[#8ECAFF] bg-clip-text text-transparent font-bold">1 free page</span> for every Google user — full code, no watermarks, yours forever.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 mt-4 pt-4 border-t border-white/10">
                {['No credit card', 'No watermarks', 'Production-ready', 'Download instantly'].map((item) => (
                  <span key={item} className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-300 font-medium">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative max-w-4xl mx-auto hidden sm:block">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent z-10" />
            <div className="relative bg-gradient-to-br from-[#1A1A1A] to-[#111] rounded-2xl border border-white/10 p-1 shadow-2xl">
              <div className="bg-[#0D0D0D] rounded-xl p-4 sm:p-6">
                {/* Mock UI */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-red-500/80" />
                  <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-green-500/80" />
                  <span className="text-xs text-gray-500 ml-2 sm:ml-4">AltPage Generator</span>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="col-span-1 space-y-2 sm:space-y-3">
                    <div className="h-3 sm:h-4 w-16 sm:w-20 bg-white/10 rounded" />
                    <div className="space-y-1.5 sm:space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-6 sm:h-8 bg-white/5 rounded-lg flex items-center px-2 sm:px-3 gap-2">
                          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-gradient-to-r from-[#FFAF40] to-[#65B4FF]" />
                          <div className="h-1.5 sm:h-2 w-12 sm:w-16 bg-white/10 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2 bg-white/5 rounded-xl p-3 sm:p-4">
                    <div className="h-3 sm:h-4 w-32 sm:w-48 bg-white/10 rounded mb-3 sm:mb-4" />
                    <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                      <div className="h-2 sm:h-3 w-full bg-white/5 rounded" />
                      <div className="h-2 sm:h-3 w-4/5 bg-white/5 rounded" />
                      <div className="h-2 sm:h-3 w-3/4 bg-white/5 rounded" />
                    </div>
                    <div className="flex gap-2">
                      <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#FFAF40] via-[#9A8FEA] to-[#65B4FF] rounded-lg">
                        <div className="h-1.5 sm:h-2 w-12 sm:w-16 bg-white/30 rounded" />
                      </div>
                      <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 rounded-lg">
                        <div className="h-1.5 sm:h-2 w-8 sm:w-12 bg-white/20 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 px-2">Why Wrestle with ChatGPT When You Can Just... Not?</h2>
            <p className="text-gray-400 text-sm sm:text-lg max-w-2xl mx-auto px-2">
              We did the prompt engineering. You get the pages. Life is simple again.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                ),
                title: 'You Own the Code',
                description: 'Raw HTML files. No lock-in. No "premium export" BS. Download and it\'s yours forever.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'SEO + GEO Ready',
                description: 'Optimized for both Google and AI search (ChatGPT, Perplexity). Because the future is now.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Deploy in 30 Seconds',
                description: 'Literally just upload the HTML file. No frameworks. No dependencies. It just works™.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                title: 'Stupidly Cheap',
                description: 'Cheaper than your ChatGPT subscription. Cheaper than hiring a writer. Just... cheap.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'No AI Babysitting',
                description: 'Zero "please regenerate" moments. Zero "that\'s not what I meant". It just gets it right.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ),
                title: 'We\'re Not Going Anywhere',
                description: 'Worried about rug pulls? We give you the code upfront. Even if we vanish, your pages live on.',
              },
            ].map((feature, idx) => (
              <div 
                key={idx} 
                className="group p-5 sm:p-6 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl sm:rounded-2xl hover:border-white/20 transition-all"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#FFAF40]/20 via-[#9A8FEA]/20 to-[#65B4FF]/20 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <div className="text-white/80 scale-90 sm:scale-100">{feature.icon}</div>
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4">So Simple It&apos;s Almost Suspicious</h2>
            <p className="text-gray-400 text-sm sm:text-lg">Literally three steps. We counted.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-8">
            {[
              { step: '01', title: 'Tell Us Who You Are', desc: 'Drop your URL. We\'ll figure out what you sell and who your enemies are.' },
              { step: '02', title: 'Pick Your Victims', desc: 'Choose which competitors you want to steal traffic from. We don\'t judge.' },
              { step: '03', title: 'Download & Deploy', desc: 'Get your HTML files. Upload anywhere. Done. Go grab a coffee.' },
            ].map((item, idx) => (
              <div key={idx} className="relative text-center sm:text-left">
                <div className="text-5xl sm:text-7xl font-bold text-white/5 absolute -top-4 sm:-top-6 left-1/2 sm:left-0 -translate-x-1/2 sm:translate-x-0 sm:-left-2">{item.step}</div>
                <div className="relative pt-6 sm:pt-8">
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{item.title}</h3>
                  <p className="text-gray-400 text-sm sm:text-base leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4">Pricing That Won&apos;t Make You Cry</h2>
            <p className="text-gray-400 text-sm sm:text-lg">Cheaper than therapy for your AI frustrations. Pay once. Done.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Starter */}
            <div className="relative p-6 sm:p-8 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl sm:rounded-2xl">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-300 mb-2">Starter</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-bold">$9.9</span>
                  <span className="text-gray-500 text-sm">one-time</span>
                </div>
              </div>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                <li className="flex items-center gap-3 text-gray-300">
                  <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong className="text-white">10</strong> Alternative Pages</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>AI-Powered Content</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Production-Ready HTML</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>SEO Optimized</span>
                </li>
              </ul>
              <button
                disabled
                className="w-full py-2.5 sm:py-3 border border-white/10 text-gray-500 font-medium rounded-lg sm:rounded-xl cursor-not-allowed text-sm"
              >
                Coming Soon
              </button>
            </div>

            {/* Standard - Featured */}
            <div className="relative p-6 sm:p-8 bg-gradient-to-br from-[#9A8FEA]/20 via-[#65B4FF]/10 to-transparent border border-[#9A8FEA]/30 rounded-xl sm:rounded-2xl sm:scale-105 order-first sm:order-none">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1 bg-gradient-to-r from-[#FFAF40] via-[#9A8FEA] to-[#65B4FF] rounded-full text-[10px] sm:text-xs font-semibold text-white whitespace-nowrap">
                MOST POPULAR
              </div>
              <div className="mb-4 sm:mb-6 mt-2 sm:mt-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-300 mb-2">Standard</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-bold">$19.9</span>
                  <span className="text-gray-500 text-sm">one-time</span>
                </div>
              </div>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                <li className="flex items-center gap-3 text-gray-300">
                  <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong className="text-white">20</strong> Alternative Pages</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>AI-Powered Content</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Production-Ready HTML</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>SEO Optimized</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Priority Support</span>
                </li>
              </ul>
              <button
                disabled
                className="w-full py-2.5 sm:py-3 bg-white/20 text-gray-400 font-semibold rounded-lg sm:rounded-xl cursor-not-allowed text-sm"
              >
                Coming Soon
              </button>
            </div>

            {/* Pro */}
            <div className="relative p-6 sm:p-8 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl sm:rounded-2xl">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-300 mb-2">Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-bold">$39.9</span>
                  <span className="text-gray-500 text-sm">one-time</span>
                </div>
              </div>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                <li className="flex items-center gap-3 text-gray-300">
                  <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong className="text-white">50</strong> Alternative Pages</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>AI-Powered Content</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Production-Ready HTML</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>SEO Optimized</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Priority Support</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Perfect for Crowded Markets</span>
                </li>
              </ul>
              <button
                disabled
                className="w-full py-2.5 sm:py-3 border border-white/10 text-gray-500 font-medium rounded-lg sm:rounded-xl cursor-not-allowed text-sm"
              >
                Coming Soon
              </button>
            </div>
          </div>

          {/* Money back guarantee */}
          <div className="text-center mt-8 sm:mt-12">
            <p className="text-gray-500 text-xs sm:text-sm flex items-center justify-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              30-day money-back guarantee. No questions asked.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 px-2">
            Look, We Both Know You&apos;re Tired of AI Nonsense
          </h2>
          <p className="text-gray-400 text-sm sm:text-lg mb-8 sm:mb-10 px-2">
            Get deploy-ready alternative pages without the &quot;please try again&quot; dance.
            <br className="hidden sm:block" />
            <span className="text-gray-500 text-xs sm:text-base"> Your competitors are already ranking. Just saying.</span>
          </p>
          <button
            onClick={handleGoogleLogin}
            disabled={signingIn}
            className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 bg-gradient-to-r from-[#FFAF40] via-[#9A8FEA] to-[#65B4FF] text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 text-sm sm:text-lg"
          >
            {signingIn ? 'Connecting...' : 'Fine, Show Me What You Got'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9A8FEA] via-[#65B4FF] to-[#9A8FEA] rounded-full blur-sm opacity-50 animate-[glow_3s_ease-in-out_infinite]" />
              <img src="/new-logo.png" alt="SEOPages" className="relative h-6 sm:h-7 w-auto" />
            </div>
            <span className="text-white text-sm sm:text-base italic tracking-wide" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              seopages<span className="text-[#9A8FEA]">.</span>pro
            </span>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm text-center">
            © 2026 seopages.pro. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-6 right-6 px-6 py-4 bg-red-500/90 backdrop-blur-sm text-white rounded-xl shadow-2xl animate-in slide-in-from-bottom-4">
          {error}
        </div>
      )}
    </div>
  );
}
