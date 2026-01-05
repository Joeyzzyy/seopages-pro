'use client';

import TextContentEditor from '../context-editors/TextContentEditor';
import SocialProofEditor from '../context-editors/SocialProofEditor';
import AboutUsEditor from '../context-editors/AboutUsEditor';
import ContactInformationEditor from '../context-editors/ContactInformationEditor';
import FaqEditor from '../context-editors/FaqEditor';
import type { TrustCompanySectionProps } from './types';

export default function TrustCompanySection({
  siteContexts,
  showDebugInfo = false,
  socialProofContent,
  setSocialProofContent,
  leadershipTeamContent,
  setLeadershipTeamContent,
  aboutUsContent,
  setAboutUsContent,
  faqContent,
  setFaqContent,
  contactInfoContent,
  setContactInfoContent,
  socialProofRef,
  leadershipTeamRef,
  aboutUsRef,
  faqRef,
  contactInfoRef,
}: TrustCompanySectionProps) {
  const socialProofContext = siteContexts.find(c => c.type === 'social-proof-trust');
  const leadershipTeamContext = siteContexts.find(c => c.type === 'leadership-team');
  const aboutUsContext = siteContexts.find(c => c.type === 'about-us');
  const faqContext = siteContexts.find(c => c.type === 'faq');
  const contactInfoContext = siteContexts.find(c => c.type === 'contact-information');

  return (
    <div className="border-t border-[#E5E5E5] pt-8">
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <h3 className="text-base font-bold text-[#111827]">Trust & Company</h3>
      </div>

      {/* Social Proof */}
      <div ref={socialProofRef} className="space-y-4 pl-7 mb-6">
        <h4 className="text-sm font-semibold text-[#111827]">Social Proof</h4>
        <SocialProofEditor
          initialContent={socialProofContext?.content || undefined}
          onContentChange={setSocialProofContent}
        />
      </div>

      {/* Leadership Team */}
      <div ref={leadershipTeamRef} className="space-y-4 pl-7 mb-6 pt-6 border-t border-[#F3F4F6]">
        <h4 className="text-sm font-semibold text-[#111827]">Leadership Team</h4>
        <TextContentEditor
          initialContent={leadershipTeamContext?.content || undefined}
          onContentChange={setLeadershipTeamContent}
          placeholder="Describe your leadership team"
          rows={4}
        />
      </div>

      {/* About Us */}
      <div ref={aboutUsRef} className="space-y-4 pl-7 mb-6 pt-6 border-t border-[#F3F4F6]">
        <h4 className="text-sm font-semibold text-[#111827]">About Us</h4>
        <AboutUsEditor
          initialContent={aboutUsContext?.content || undefined}
          onContentChange={setAboutUsContent}
        />
      </div>

      {/* FAQ */}
      <div ref={faqRef} className="space-y-4 pl-7 mb-6 pt-6 border-t border-[#F3F4F6]">
        <h4 className="text-sm font-semibold text-[#111827]">FAQ</h4>
        <FaqEditor
          initialContent={faqContext?.content || undefined}
          onContentChange={setFaqContent}
        />
      </div>

      {/* Contact Info */}
      <div ref={contactInfoRef} className="space-y-4 pl-7 mb-6 pt-6 border-t border-[#F3F4F6]">
        <h4 className="text-sm font-semibold text-[#111827]">Contact Info</h4>
        <ContactInformationEditor
          initialContent={contactInfoContext?.content || undefined}
          onContentChange={setContactInfoContent}
        />
      </div>
    </div>
  );
}

