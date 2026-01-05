'use client';

import { useState, useEffect } from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqEditorProps {
  initialContent?: string;
  onContentChange: (content: string) => void;
}

export default function FaqEditor({ initialContent, onContentChange }: FaqEditorProps) {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);

  useEffect(() => {
    if (initialContent) {
      try {
        const parsed = JSON.parse(initialContent);
        if (Array.isArray(parsed)) {
          setFaqs(parsed);
        }
      } catch {
        // If not valid JSON, try to parse as plain text
        if (initialContent.trim()) {
          setFaqs([{ question: '', answer: initialContent }]);
        }
      }
    }
  }, [initialContent]);

  const updateFaqs = (newFaqs: FaqItem[]) => {
    setFaqs(newFaqs);
    onContentChange(JSON.stringify(newFaqs));
  };

  const addFaq = () => {
    updateFaqs([...faqs, { question: '', answer: '' }]);
  };

  const removeFaq = (index: number) => {
    const newFaqs = faqs.filter((_, i) => i !== index);
    updateFaqs(newFaqs);
  };

  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...faqs];
    newFaqs[index] = { ...newFaqs[index], [field]: value };
    updateFaqs(newFaqs);
  };

  return (
    <div className="space-y-4">
      {faqs.length === 0 ? (
        <div className="text-center py-8 bg-[#F9FAFB] rounded-lg border border-dashed border-[#E5E5E5]">
          <svg className="w-10 h-10 mx-auto text-[#9CA3AF] mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-sm text-[#6B7280] mb-3">No FAQs added yet</p>
          <button
            type="button"
            onClick={addFaq}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors"
            style={{
              background: 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)',
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add First FAQ
          </button>
        </div>
      ) : (
        <>
          {faqs.map((faq, index) => (
            <div key={index} className="bg-[#F9FAFB] rounded-lg p-4 border border-[#E5E5E5]">
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-[#9A8FEA] text-white text-xs font-bold rounded-full shrink-0">
                  {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeFaq(index)}
                  className="p-1 text-[#9CA3AF] hover:text-red-500 transition-colors shrink-0"
                  title="Remove FAQ"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">
                    Question
                  </label>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFaq(index, 'question', e.target.value)}
                    placeholder="Enter the question..."
                    className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA] focus:border-transparent bg-white"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">
                    Answer
                  </label>
                  <textarea
                    value={faq.answer}
                    onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                    placeholder="Enter the answer..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8FEA] focus:border-transparent resize-none bg-white"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addFaq}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#6B7280] hover:text-[#374151] border border-dashed border-[#E5E5E5] hover:border-[#9A8FEA] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Another FAQ
          </button>
        </>
      )}
      
      {faqs.length > 0 && (
        <p className="text-xs text-[#9CA3AF] text-center">
          {faqs.length} FAQ{faqs.length !== 1 ? 's' : ''} added
        </p>
      )}
    </div>
  );
}

