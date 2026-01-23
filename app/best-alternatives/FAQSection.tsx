'use client';

import { useState } from 'react';

interface FAQ {
  question: string;
  answer: string;
}

export default function FAQSection({ faqs, targetProduct }: { faqs: FAQ[]; targetProduct: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-12 md:py-20 px-4 md:px-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-[#9A8FEA]/20 text-[#9A8FEA] text-xs font-semibold tracking-wide uppercase mb-3 md:mb-4">
            Questions & Answers
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3 md:mb-4" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            Frequently Asked Questions
          </h2>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
            Common questions about {targetProduct} alternatives.
          </p>
        </div>
        
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <button 
                className="w-full px-4 md:px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                onClick={() => toggleFAQ(idx)}
              >
                <span className="font-semibold text-gray-900 text-sm md:text-base pr-4">{faq.question}</span>
                <svg 
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${openIndex === idx ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div 
                className={`px-4 md:px-6 overflow-hidden transition-all duration-300 ${
                  openIndex === idx ? 'max-h-96 pb-4' : 'max-h-0'
                }`}
              >
                <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
