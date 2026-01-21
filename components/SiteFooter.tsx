'use client';

import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 py-12 px-4 sm:px-6 bg-[#0A0A0A]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2">
            <img src="/new-logo.png" alt="seopages.pro" className="h-6 w-auto" />
            <span className="text-white text-sm italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              seopages<span className="text-[#9A8FEA]">.</span>pro
            </span>
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/alternative-page-guide" className="hover:text-white transition-colors">Guide</Link>
            <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link>
          </nav>
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} seopages.pro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
