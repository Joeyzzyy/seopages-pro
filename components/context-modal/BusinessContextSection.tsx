'use client';

import { useMemo } from 'react';
import TextContentEditor from '../context-editors/TextContentEditor';
import type { BusinessContextSectionProps } from './types';

// Helper function to extract text from JSON content
function extractTextFromJSON(jsonString: string | null | undefined): string {
  if (!jsonString) return '';
  
  try {
    const parsed = JSON.parse(jsonString);
    
    // Handle different JSON structures
    if (typeof parsed === 'string') return parsed;
    
    // For problem_statement or single field objects
    if (parsed.problem_statement) return parsed.problem_statement;
    if (parsed.audience) return parsed.audience;
    if (parsed.content) return parsed.content;
    
    // For arrays (like industries)
    if (Array.isArray(parsed)) {
      return parsed.map((item, index) => {
        if (typeof item === 'string') return `${index + 1}. ${item}`;
        if (item.Industry && item.Description) {
          return `${item.Industry}: ${item.Description}`;
        }
        return JSON.stringify(item);
      }).join('\n\n');
    }
    
    // For use_cases object with arrays
    if (parsed.use_cases && Array.isArray(parsed.use_cases)) {
      return parsed.use_cases.map((useCase: string, index: number) => 
        `${index + 1}. ${useCase}`
      ).join('\n\n');
    }
    
    // Fallback: try to extract all string values
    const allText = Object.values(parsed)
      .filter(v => typeof v === 'string')
      .join('\n\n');
    
    return allText || jsonString;
  } catch {
    // If not JSON, return as is
    return jsonString;
  }
}

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

  // Extract readable text from JSON
  const problemStatementText = useMemo(() => 
    extractTextFromJSON(problemStatementContext?.content), 
    [problemStatementContext]
  );
  
  const whoWeServeText = useMemo(() => 
    extractTextFromJSON(whoWeServeContext?.content), 
    [whoWeServeContext]
  );
  
  const useCasesText = useMemo(() => 
    extractTextFromJSON(useCasesContext?.content), 
    [useCasesContext]
  );
  
  const industriesText = useMemo(() => 
    extractTextFromJSON(industriesContext?.content), 
    [industriesContext]
  );
  
  const productsServicesText = useMemo(() => 
    extractTextFromJSON(productsServicesContext?.content), 
    [productsServicesContext]
  );

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
          initialContent={problemStatementText || undefined}
          onContentChange={setProblemStatementContent}
          placeholder="What problem does your product/service solve?"
          rows={6}
        />
      </div>

      {/* Who We Serve */}
      <div ref={whoWeServeRef} className="space-y-4 pl-7 mb-6 pt-6 border-t border-[#F3F4F6]">
        <h4 className="text-sm font-semibold text-[#111827]">Who We Serve</h4>
        <TextContentEditor
          initialContent={whoWeServeText || undefined}
          onContentChange={setWhoWeServeContent}
          placeholder="Describe your target audience and customer segments"
          rows={6}
        />
      </div>

      {/* Use Cases */}
      <div ref={useCasesRef} className="space-y-4 pl-7 mb-6 pt-6 border-t border-[#F3F4F6]">
        <h4 className="text-sm font-semibold text-[#111827]">Use Cases</h4>
        <TextContentEditor
          initialContent={useCasesText || undefined}
          onContentChange={setUseCasesContent}
          placeholder="List your primary use cases and applications"
          rows={8}
        />
      </div>

      {/* Industries */}
      <div ref={industriesRef} className="space-y-4 pl-7 mb-6 pt-6 border-t border-[#F3F4F6]">
        <h4 className="text-sm font-semibold text-[#111827]">Industries</h4>
        <TextContentEditor
          initialContent={industriesText || undefined}
          onContentChange={setIndustriesContent}
          placeholder="Industries you serve"
          rows={8}
        />
      </div>

      {/* Products & Services */}
      <div ref={productsServicesRef} className="space-y-4 pl-7 mb-6 pt-6 border-t border-[#F3F4F6]">
        <h4 className="text-sm font-semibold text-[#111827]">Products & Services</h4>
        <TextContentEditor
          initialContent={productsServicesText || undefined}
          onContentChange={setProductsServicesContent}
          placeholder="Describe your products and services"
          rows={8}
        />
      </div>
    </div>
  );
}

