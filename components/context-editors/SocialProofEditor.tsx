'use client';

import { useState, useEffect } from 'react';

interface Testimonial {
  quote?: string;
  author?: string;
  company?: string;
  role?: string;
}

interface ExternalReview {
  platform: string;
  rating?: number | string;
  reviewCount?: number | string;
  url?: string;
  awards?: string[];
  topReviews?: string[];
}

interface SocialProofData {
  // From extraction tool
  testimonials?: Testimonial[] | string;
  metrics?: string;
  awards?: string;
  badges?: string;
  partners?: string;
  // External platforms
  externalReviews?: ExternalReview[];
  // Legacy fields (for backwards compatibility)
  caseStudies?: string;
  guarantees?: string;
  integrations?: string;
}

interface SocialProofEditorProps {
  initialContent?: string;
  onContentChange: (content: string) => void;
}

export default function SocialProofEditor({
  initialContent,
  onContentChange,
}: SocialProofEditorProps) {
  const [data, setData] = useState<SocialProofData>({});

  useEffect(() => {
    if (initialContent) {
      try {
        // Try to extract JSON from content that may have extra text after it
        let jsonContent = initialContent.trim();
        
        // If it starts with { but has extra content after }, extract just the JSON
        if (jsonContent.startsWith('{')) {
          // Find the matching closing brace
          let braceCount = 0;
          let endIndex = -1;
          for (let i = 0; i < jsonContent.length; i++) {
            if (jsonContent[i] === '{') braceCount++;
            if (jsonContent[i] === '}') braceCount--;
            if (braceCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
          if (endIndex > 0) {
            jsonContent = jsonContent.substring(0, endIndex);
          }
        }
        
        const parsed = JSON.parse(jsonContent);
        setData(parsed);
      } catch (e) {
        console.error('Failed to parse social proof content:', e, initialContent);
        // Try to show raw content as a fallback
        setData({ metrics: initialContent });
      }
    }
  }, [initialContent]);

  const handleChange = (field: keyof SocialProofData, value: any) => {
    const updated = { ...data, [field]: value };
    setData(updated);
    onContentChange(JSON.stringify(updated));
  };

  const handleTestimonialChange = (index: number, field: keyof Testimonial, value: string) => {
    const testimonials = Array.isArray(data.testimonials) 
      ? [...data.testimonials] 
      : [];
    if (!testimonials[index]) testimonials[index] = {};
    testimonials[index][field] = value;
    handleChange('testimonials', testimonials);
  };

  const addTestimonial = () => {
    const testimonials = Array.isArray(data.testimonials) 
      ? [...data.testimonials, { quote: '', author: '', company: '' }]
      : [{ quote: '', author: '', company: '' }];
    handleChange('testimonials', testimonials);
  };

  const removeTestimonial = (index: number) => {
    const testimonials = Array.isArray(data.testimonials)
      ? data.testimonials.filter((_, i) => i !== index)
      : [];
    handleChange('testimonials', testimonials);
  };

  // Check if we have testimonials as array
  const testimonialsArray = Array.isArray(data.testimonials) ? data.testimonials : [];
  const testimonialsText = typeof data.testimonials === 'string' ? data.testimonials : '';

  // Check if we have external reviews
  const externalReviews = data.externalReviews || [];

  return (
    <div className="space-y-5">
      {/* External Platform Reviews */}
      {externalReviews.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
          <label className="block text-xs font-semibold text-[#6B7280] mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            External Platform Reviews
          </label>
          <div className="space-y-3">
            {externalReviews.map((review, index) => (
              <div key={index} className="bg-white rounded-md p-3 shadow-sm border border-purple-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm capitalize text-purple-700">{review.platform}</span>
                  {review.rating && (
                    <span className="text-yellow-600 font-medium text-sm">
                      ★ {review.rating} {review.reviewCount && `(${review.reviewCount} reviews)`}
                    </span>
                  )}
                </div>
                {review.awards && review.awards.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {review.awards.map((award, i) => (
                      <span key={i} className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                        🏆 {award}
                      </span>
                    ))}
                  </div>
                )}
                {review.url && (
                  <a 
                    href={review.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-purple-600 hover:underline"
                  >
                    View on {review.platform} →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Testimonials */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-[#6B7280]">
            Testimonials
          </label>
          <button
            type="button"
            onClick={addTestimonial}
            className="text-xs text-[#9A8FEA] hover:text-[#8A7FDA] font-medium"
          >
            + Add Testimonial
          </button>
        </div>
        
        {testimonialsArray.length === 0 && !testimonialsText ? (
          <div className="text-sm text-[#9CA3AF] italic py-3 text-center border border-dashed border-[#E5E5E5] rounded-lg">
            No testimonials yet. Click "Add Testimonial" or run context acquisition.
          </div>
        ) : testimonialsText ? (
          // Show as text if it's a string
          <textarea
            value={testimonialsText}
            onChange={(e) => handleChange('testimonials', e.target.value)}
            placeholder="Customer testimonials and reviews"
            rows={4}
            className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] resize-none"
          />
        ) : (
          // Show as structured cards if it's an array
          <div className="space-y-3">
            {testimonialsArray.map((t, index) => (
              <div key={index} className="border border-[#E5E5E5] rounded-lg p-3 bg-[#FAFAFA]">
                <div className="flex justify-end mb-2">
                  <button
                    type="button"
                    onClick={() => removeTestimonial(index)}
                    className="text-[#9CA3AF] hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <textarea
                  value={t.quote || ''}
                  onChange={(e) => handleTestimonialChange(index, 'quote', e.target.value)}
                  placeholder="Testimonial quote..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] resize-none mb-2"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={t.author || ''}
                    onChange={(e) => handleTestimonialChange(index, 'author', e.target.value)}
                    placeholder="Author name"
                    className="flex-1 px-3 py-1.5 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF]"
                  />
                  <input
                    type="text"
                    value={t.company || ''}
                    onChange={(e) => handleTestimonialChange(index, 'company', e.target.value)}
                    placeholder="Company"
                    className="flex-1 px-3 py-1.5 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF]"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metrics */}
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Key Metrics
        </label>
        <input
          type="text"
          value={data.metrics || ''}
          onChange={(e) => handleChange('metrics', e.target.value)}
          placeholder="e.g., 10,000+ customers, 99.9% uptime, $1M+ saved"
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF]"
        />
      </div>

      {/* Awards */}
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Awards & Recognition
        </label>
        <input
          type="text"
          value={data.awards || ''}
          onChange={(e) => handleChange('awards', e.target.value)}
          placeholder="Industry awards, Product of the Day, rankings"
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF]"
        />
      </div>

      {/* Badges & Certifications */}
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Badges & Certifications
        </label>
        <input
          type="text"
          value={data.badges || ''}
          onChange={(e) => handleChange('badges', e.target.value)}
          placeholder="Security badges, SOC2, GDPR, ISO certifications"
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF]"
        />
      </div>

      {/* Partners */}
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Partners & Integrations
        </label>
        <input
          type="text"
          value={data.partners || data.integrations || ''}
          onChange={(e) => handleChange('partners', e.target.value)}
          placeholder="Partner logos, integration partners mentioned"
          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF]"
        />
      </div>

      {/* Case Studies (legacy) */}
      {data.caseStudies && (
        <div>
          <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
            Case Studies
          </label>
          <textarea
            value={data.caseStudies || ''}
            onChange={(e) => handleChange('caseStudies', e.target.value)}
            placeholder="Success stories and case studies"
            rows={3}
            className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] resize-none"
          />
        </div>
      )}

      {/* Guarantees (legacy) */}
      {data.guarantees && (
        <div>
          <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
            Guarantees
          </label>
          <input
            type="text"
            value={data.guarantees || ''}
            onChange={(e) => handleChange('guarantees', e.target.value)}
            placeholder="Money-back guarantee, warranty information"
            className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF]"
          />
        </div>
      )}
    </div>
  );
}
