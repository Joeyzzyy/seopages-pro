'use client';

import HeroSectionEditor from '../context-editors/HeroSectionEditor';
import type { HeroSectionProps } from './types';

export default function HeroSection({
  siteContexts,
  showDebugInfo = false,
  heroSectionContent,
  setHeroSectionContent,
  heroSectionRef,
}: HeroSectionProps) {
  const heroSectionContext = siteContexts.find(c => c.type === 'hero-section');

  return (
    <div ref={heroSectionRef} className="border-t border-[#E5E5E5] pt-8">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <h3 className="text-base font-bold text-[#111827]">Hero Section</h3>
      </div>
      <div className="pl-7">
        <HeroSectionEditor
          initialContent={heroSectionContext?.content || undefined}
          onContentChange={setHeroSectionContent}
        />
      </div>
    </div>
  );
}

