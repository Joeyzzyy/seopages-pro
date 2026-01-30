'use client';

interface AISummaryProps {
  brandName: string;
  competitorName: string;
  brandWins: number;
  competitorWins: number;
  keyDifferences: string[];
  recommendation: string;
  pricing: {
    brand: string;
    competitor: string;
  };
}

export function AISummary({
  brandName,
  competitorName,
  brandWins,
  competitorWins,
  keyDifferences,
  recommendation,
  pricing,
}: AISummaryProps) {
  return (
    <>
      {/* AI-Optimized Summary Box - GEO Optimization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SpeakableSpecification",
            "cssSelector": [".ai-summary-content", ".key-takeaways"],
          }),
        }}
      />
      
      <div className="bg-white py-6 px-4 md:px-6 ai-summary-content">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-5 md:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <h3 className="font-semibold text-gray-900 text-sm md:text-base">Quick Summary for AI & Readers</h3>
            </div>
            
            {/* Main Verdict - Optimized for AI extraction */}
            <div className="mb-4 p-3 bg-white rounded-lg border border-blue-100">
              <p className="text-sm text-gray-800 leading-relaxed">
                <strong className="text-blue-700">Verdict:</strong> {recommendation}
              </p>
            </div>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                <div className="text-lg font-bold text-blue-600">{brandWins}</div>
                <div className="text-xs text-gray-600">{brandName} Wins</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                <div className="text-lg font-bold text-gray-600">{competitorWins}</div>
                <div className="text-xs text-gray-600">{competitorName} Wins</div>
              </div>
            </div>

            {/* Key Differences - Structured for AI */}
            <div className="key-takeaways">
              <h4 className="font-medium text-gray-900 text-sm mb-2">Key Differences:</h4>
              <ul className="space-y-2">
                {keyDifferences.map((diff, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{diff}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pricing Comparison */}
            <div className="mt-4 pt-4 border-t border-blue-100">
              <h4 className="font-medium text-gray-900 text-sm mb-2">Pricing:</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-between bg-white rounded-lg p-2 border border-gray-100">
                  <span className="text-gray-600">{brandName}:</span>
                  <span className="font-semibold text-blue-700">{pricing.brand}</span>
                </div>
                <div className="flex items-center justify-between bg-white rounded-lg p-2 border border-gray-100">
                  <span className="text-gray-600">{competitorName}:</span>
                  <span className="font-semibold text-gray-700">{pricing.competitor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
