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
    features: [
      { text: '10', highlight: true, suffix: ' Alternative Pages' },
      { text: 'AI-Powered Content' },
      { text: 'Production-Ready HTML' },
      { text: 'SEO Optimized' },
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 19.9,
    credits: 20,
    popular: true,
    features: [
      { text: '20', highlight: true, suffix: ' Alternative Pages' },
      { text: 'AI-Powered Content' },
      { text: 'Production-Ready HTML' },
      { text: 'SEO Optimized' },
      { text: 'Priority Support' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 39.9,
    credits: 50,
    features: [
      { text: '50', highlight: true, suffix: ' Alternative Pages' },
      { text: 'AI-Powered Content' },
      { text: 'Production-Ready HTML' },
      { text: 'SEO Optimized' },
      { text: 'Priority Support' },
      { text: 'Perfect for Crowded Markets' },
    ],
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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5 px-6 py-5 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">Upgrade Your Plan</h2>
            <p className="text-gray-400 text-sm mt-1">
              Current: <span className="text-white font-medium">{currentCredits} credits</span> · {currentTier} plan
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
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Plans Grid - Same as homepage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                onClick={() => handlePlanSelect(plan.id)}
                className={`relative p-6 sm:p-8 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-[#9A8FEA]/20 via-[#65B4FF]/10 to-transparent border-[#9A8FEA]/30 sm:scale-105 order-first sm:order-none'
                    : 'bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10'
                } ${
                  selectedPlan === plan.id
                    ? 'border-2 border-[#9A8FEA] ring-2 ring-[#9A8FEA]/30'
                    : 'border hover:border-white/20'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1 bg-gradient-to-r from-[#FFAF40] via-[#9A8FEA] to-[#65B4FF] rounded-full text-[10px] sm:text-xs font-semibold text-white whitespace-nowrap">
                    MOST POPULAR
                  </div>
                )}

                {/* Selected Indicator */}
                {selectedPlan === plan.id && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#9A8FEA] to-[#65B4FF] flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Plan Name & Price */}
                <div className={`mb-4 sm:mb-6 ${plan.popular ? 'mt-2 sm:mt-0' : ''}`}>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-300 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-bold text-white">${plan.price}</span>
                    <span className="text-gray-500 text-sm">one-time</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-gray-300">
                      <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>
                        {feature.highlight ? (
                          <><strong className="text-white">{feature.text}</strong>{feature.suffix}</>
                        ) : (
                          feature.text
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Select Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlanSelect(plan.id);
                  }}
                  className={`w-full py-2.5 sm:py-3 font-medium rounded-lg sm:rounded-xl transition-all text-sm ${
                    plan.popular
                      ? 'bg-gradient-to-r from-[#FFAF40] via-[#9A8FEA] to-[#65B4FF] text-white font-semibold hover:opacity-90'
                      : selectedPlan === plan.id
                      ? 'bg-white text-black'
                      : 'border border-white/20 text-white hover:bg-white/10'
                  }`}
                >
                  {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>

          {/* PayPal Button Section */}
          {selectedPlan && (
            <div className="max-w-md mx-auto">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                <div className="text-center mb-4">
                  <p className="text-gray-400 text-sm">
                    Selected: <span className="text-white font-semibold">{PLANS.find(p => p.id === selectedPlan)?.name} Plan</span>
                  </p>
                  <p className="text-2xl font-bold text-white mt-1">
                    ${PLANS.find(p => p.id === selectedPlan)?.price} USD
                  </p>
                </div>
                
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
                    <div className="inline-flex items-center text-[#9A8FEA]">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing payment...
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="text-center">
            <p className="text-gray-500 text-xs flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure payment powered by PayPal · Credits added instantly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
