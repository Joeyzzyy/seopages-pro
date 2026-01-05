'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  const brandGradient = 'linear-gradient(80deg, #FFAF40, #D194EC, #9A8FEA, #65B4FF)';

  const navItems = [
    {
      title: 'Start Seenos Mini',
      subtitle: 'Start your smart SEO and content production journey',
      href: '/projects',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    },
    {
      title: 'Check Skills We Have',
      subtitle: 'Explore our powerful AI skill library',
      href: '/skills',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    },
    {
      title: 'How to Build a Project Like This',
      subtitle: 'Understand the technical architecture and implementation',
      href: '/build-guide',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-purple-50/50 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-50/50 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl px-8 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-16 animate-fade-in-bottom opacity-0">
          <Link href="/" target="_blank" rel="noopener noreferrer" className="w-20 h-20 rounded-[28px] bg-white shadow-xl border border-[#F3F4F6] flex items-center justify-center group hover:scale-105 transition-transform duration-500 overflow-hidden">
            <Image src="/product-logo.webp" alt="Logo" width={48} height={48} className="group-hover:rotate-12 transition-transform duration-500 rounded-xl" />
          </Link>
        </div>

        {/* Title */}
        <div className="text-center mb-16 space-y-4 animate-fade-in-bottom animation-delay-200 opacity-0">
          <h1 className="text-5xl md:text-6xl font-medium text-[#111827] tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
            Mini Seenos
          </h1>
          <div className="h-0.5 w-16 mx-auto rounded-full opacity-60" style={{ background: brandGradient }} />
        </div>

        {/* Navigation Grid */}
        <nav className="w-full space-y-4 animate-fade-in-bottom animation-delay-400 opacity-0">
          {navItems.map((item, idx) => (
            <Link 
              key={idx}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-6 rounded-[24px] bg-white border border-[#F3F4F6] shadow-sm hover:shadow-xl hover:border-transparent transition-all duration-500 relative overflow-hidden"
            >
              {/* Hover Background */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500" style={{ background: brandGradient }} />
              
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-[#FAFAFA] flex items-center justify-center text-[#9CA3AF] group-hover:text-[#111827] group-hover:bg-white transition-all duration-500">
                  {item.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black text-[#111827] tracking-tight group-hover:translate-x-1 transition-transform duration-500">
                    {item.title}
                  </span>
                  <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mt-0.5">
                    {item.subtitle}
                  </span>
                </div>
              </div>

              <div className="relative z-10 w-10 h-10 rounded-full border border-[#F3F4F6] flex items-center justify-center text-[#D1D5DB] group-hover:text-[#111827] group-hover:border-[#111827] group-hover:rotate-[-45deg] transition-all duration-500">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <footer className="mt-20 text-[11px] font-medium text-[#9CA3AF] italic tracking-wide animate-fade-in-bottom animation-delay-700 opacity-0" style={{ fontFamily: '"Playfair Display", serif' }}>
          created by yuezhu
        </footer>
      </div>
    </div>
  );
}
