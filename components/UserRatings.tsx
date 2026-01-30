'use client';

import { useState } from 'react';

interface RatingData {
  overall: number;
  easeOfUse: number;
  features: number;
  value: number;
  support: number;
  reviewCount: number;
}

interface UserRatingsProps {
  productName: string;
  brandRating: RatingData;
  competitorRating: RatingData;
}

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= fullStars;
        const isHalf = star === fullStars + 1 && hasHalf;
        
        return (
          <svg
            key={star}
            className={`${sizeClasses[size]} ${isFilled ? 'text-yellow-400' : isHalf ? 'text-yellow-400' : 'text-gray-200'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            {isHalf ? (
              <defs>
                <linearGradient id={`half-${star}`}>
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="#E5E7EB" />
                </linearGradient>
              </defs>
            ) : null}
            <path
              fill={isHalf ? `url(#half-${star})` : 'currentColor'}
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        );
      })}
    </div>
  );
}

function RatingBar({ label, brandValue, competitorValue, brandName, competitorName }: {
  label: string;
  brandValue: number;
  competitorValue: number;
  brandName: string;
  competitorName: string;
}) {
  const maxValue = Math.max(brandValue, competitorValue, 5);
  const brandPercent = (brandValue / maxValue) * 100;
  const competitorPercent = (competitorValue / maxValue) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-gray-600">
        <span>{label}</span>
      </div>
      <div className="space-y-1.5">
        {/* Brand bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-16 truncate">{brandName}</span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${brandPercent}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-700 w-6">{brandValue.toFixed(1)}</span>
        </div>
        {/* Competitor bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-16 truncate">{competitorName}</span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-400 rounded-full transition-all duration-500"
              style={{ width: `${competitorPercent}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-700 w-6">{competitorValue.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

export function UserRatings({ productName, brandRating, competitorRating }: UserRatingsProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">User Ratings</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          {showDetails ? 'Hide details' : 'Show details'}
        </button>
      </div>

      {/* Overall Rating Comparison */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="text-3xl font-bold text-blue-600 mb-1">{brandRating.overall.toFixed(1)}</div>
          <StarRating rating={brandRating.overall} size="sm" />
          <div className="text-xs text-gray-600 mt-2">{productName}</div>
          <div className="text-xs text-gray-500">({brandRating.reviewCount} reviews)</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-3xl font-bold text-gray-700 mb-1">{competitorRating.overall.toFixed(1)}</div>
          <StarRating rating={competitorRating.overall} size="sm" />
          <div className="text-xs text-gray-600 mt-2">Competitor</div>
          <div className="text-xs text-gray-500">({competitorRating.reviewCount} reviews)</div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {showDetails && (
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <RatingBar
            label="Ease of Use"
            brandValue={brandRating.easeOfUse}
            competitorValue={competitorRating.easeOfUse}
            brandName={productName}
            competitorName="Competitor"
          />
          <RatingBar
            label="Features"
            brandValue={brandRating.features}
            competitorValue={competitorRating.features}
            brandName={productName}
            competitorName="Competitor"
          />
          <RatingBar
            label="Value for Money"
            brandValue={brandRating.value}
            competitorValue={competitorRating.value}
            brandName={productName}
            competitorName="Competitor"
          />
          <RatingBar
            label="Customer Support"
            brandValue={brandRating.support}
            competitorValue={competitorRating.support}
            brandName={productName}
            competitorName="Competitor"
          />
        </div>
      )}

      {/* Trust Badge */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500">
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>
        <span>Ratings based on verified user reviews</span>
      </div>
    </div>
  );
}
