'use client';

import TextContentEditor from '../context-editors/TextContentEditor';
import type { BusinessContextSectionProps } from './types';

export default function BusinessContextSection({
  siteContexts,
  showDebugInfo = false,
  problemStatementContent,
  setProblemStatementContent,
  whoWeServeContent,
  setWhoWeServeContent,
  useCasesContent,
  setUseCasesContent,
  industriesContent,
  setIndustriesContent,
  productsServicesContent,
  setProductsServicesContent,
  problemStatementRef,
  whoWeServeRef,
  useCasesRef,
  industriesRef,
  productsServicesRef,
}: BusinessContextSectionProps) {
  const problemStatementContext = siteContexts.find(c => c.type === 'problem-statement');
  const whoWeServeContext = siteContexts.find(c => c.type === 'who-we-serve');
  const useCasesContext = siteContexts.find(c => c.type === 'use-cases');
  const industriesContext = siteContexts.find(c => c.type === 'industries');
  const productsServicesContext = siteContexts.find(c => c.type === 'products-services');

  return (
    <div className="border-t border-[#E5E5E5] pt-8">
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <h3 className="text-base font-bold text-[#111827]">Business Context</h3>
      </div>

      {/* Problem Statement */}
      <div ref={problemStatementRef} className="space-y-4 pl-7 mb-6">
        <h4 className="text-sm font-semibold text-[#111827]">Problem Statement</h4>
        <TextContentEditor
          initialContent={problemStatementContext?.content || undefined}
          onContentChange={setProblemStatementContent}
          placeholder="What problem does your product/service solve?"
          rows={4}
        />
      </div>

      {/* Who We Serve */}
      <div ref={whoWeServeRef} className="space-y-4 pl-7 mb-6 pt-6 border-t border-[#F3F4F6]">
        <h4 className="text-sm font-semibold text-[#111827]">Who We Serve</h4>
        <TextContentEditor
          initialContent={whoWeServeContext?.content || undefined}
          onContentChange={setWhoWeServeContent}
          placeholder="Describe your target audience and customer segments"
          rows={4}
        />
      </div>

      {/* Use Cases */}
      <div ref={useCasesRef} className="space-y-4 pl-7 mb-6 pt-6 border-t border-[#F3F4F6]">
        <h4 className="text-sm font-semibold text-[#111827]">Use Cases</h4>
        <TextContentEditor
          initialContent={useCasesContext?.content || undefined}
          onContentChange={setUseCasesContent}
          placeholder="List your primary use cases and applications"
          rows={4}
        />
      </div>

      {/* Industries */}
      <div ref={industriesRef} className="space-y-4 pl-7 mb-6 pt-6 border-t border-[#F3F4F6]">
        <h4 className="text-sm font-semibold text-[#111827]">Industries</h4>
        <TextContentEditor
          initialContent={industriesContext?.content || undefined}
          onContentChange={setIndustriesContent}
          placeholder="Industries you serve"
          rows={4}
        />
      </div>

      {/* Products & Services */}
      <div ref={productsServicesRef} className="space-y-4 pl-7 mb-6 pt-6 border-t border-[#F3F4F6]">
        <h4 className="text-sm font-semibold text-[#111827]">Products & Services</h4>
        <TextContentEditor
          initialContent={productsServicesContext?.content || undefined}
          onContentChange={setProductsServicesContent}
          placeholder="Describe your products and services"
          rows={4}
        />
      </div>
    </div>
  );
}

