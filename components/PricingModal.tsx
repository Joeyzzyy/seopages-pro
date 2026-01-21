'use client';

import { useState, useEffect, useRef } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { supabase } from '@/lib/supabase';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits: number;
  currentTier: string;
  onPaymentSuccess: (newCredits: number, newTier: string) => void;
}

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 9.9,
    credits: 10,
    description: 'Perfect to get started',
    features: ['10 page credits', 'Basic support', '30-day validity'],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 19.9,
    credits: 20,
    description: 'Most popular',
    popular: true,
    features: ['20 page credits', 'Priority support', '60-day validity', 'Batch generation'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 39.9,
    credits: 50,
    description: 'For power users',
    features: ['50 page credits', 'Dedicated support', '90-day validity', 'Batch generation', 'API access'],
  },
];

export default function PricingModal({
  isOpen,
  onClose,
  currentCredits,
  currentTier,
  onPaymentSuccess,
}: PricingModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);

  // Get session token when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPlan(null);
      setIsProcessing(false);
      setError(null);
      
      // Get access token
      supabase.auth.getSession().then(({ data: { session } }) => {
        accessTokenRef.current = session?.access_token || null;
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setError(null);
  };

  const getAuthHeaders = async (): Promise<HeadersInit> => {
    // Refresh token if needed
    if (!accessTokenRef.current) {
      const { data: { session } } = await supabase.auth.getSession();
      accessTokenRef.current = session?.access_token || null;
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessTokenRef.current) {
      headers['Authorization'] = `Bearer ${accessTokenRef.current}`;
    }
    
    return headers;
  };

  const createOrder = async () => {
    if (!selectedPlan) {
      setError('Please select a plan first');
      throw new Error('No plan selected');
    }

    setError(null);
    
    const headers = await getAuthHeaders();
    
    const response = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ plan: selectedPlan }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      setError(data.error || 'Failed to create order');
      throw new Error(data.error);
    }

    return data.orderID;
  };

  const onApprove = async (data: { orderID: string }) => {
    setIsProcessing(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ orderID: data.orderID }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Payment confirmation failed');
        return;
      }

      // Payment successful
      onPaymentSuccess(result.new_total, result.subscription_tier);
      onClose();
      
    } catch (err) {
      console.error('Payment error:', err);
      setError('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onError = (err: any) => {
    console.error('PayPal error:', err);
    setError('PayPal payment error. Please try again.');
    setIsProcessing(false);
  };

  const onCancel = () => {
    setError('Payment cancelled');
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#1a1a2e] border border-[#2d2d44] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a2e] border-b border-[#2d2d44] px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Upgrade Your Plan</h2>
            <p className="text-gray-400 text-sm mt-1">
              Current: {currentCredits} credits · {currentTier} plan
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                onClick={() => handlePlanSelect(plan.id)}
                className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 ${
                  selectedPlan === plan.id
                    ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
                    : 'border-[#2d2d44] hover:border-[#3d3d54] bg-[#0d0d1a]'
                } ${plan.popular ? 'ring-2 ring-yellow-500/50' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-gray-400 text-sm">{plan.description}</p>
                </div>
                
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-gray-400 ml-1">USD</span>
                </div>
                
                <div className="text-center mb-6">
                  <span className="inline-block bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                    {plan.credits} credits
                  </span>
                </div>
                
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-300">
                      <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                {selectedPlan === plan.id && (
                  <div className="absolute top-4 right-4">
                    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* PayPal Button */}
          {selectedPlan && (
            <div className="max-w-md mx-auto">
              <PayPalScriptProvider
                options={{
                  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
                  currency: 'USD',
                  intent: 'capture',
                }}
              >
                <div className={isProcessing ? 'opacity-50 pointer-events-none' : ''}>
                  <PayPalButtons
                    style={{
                      layout: 'vertical',
                      color: 'blue',
                      shape: 'rect',
                      label: 'paypal',
                      height: 50,
                    }}
                    createOrder={createOrder}
                    onApprove={onApprove}
                    onError={onError}
                    onCancel={onCancel}
                    disabled={isProcessing}
                  />
                </div>
              </PayPalScriptProvider>
              
              {isProcessing && (
                <div className="text-center mt-4">
                  <div className="inline-flex items-center text-blue-400">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing payment...
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-8 text-center text-gray-500 text-xs">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure payment powered by PayPal
            </div>
            <p>Credits will be added instantly after payment</p>
          </div>
        </div>
      </div>
    </div>
  );
}
