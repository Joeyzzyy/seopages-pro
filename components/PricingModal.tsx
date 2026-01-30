'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits: number;
  currentTier: string;
  onPaymentSuccess: (newCredits: number, newTier: string) => void;
  initialPlan?: 'standard' | 'pro' | null;
  uncloseable?: boolean;
}

const PLANS = [
  {
    id: 'standard',
    name: 'Standard',
    price: 9.9,
    credits: 20,
    perPage: 0.495,
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
    price: 19.9,
    credits: 50,
    perPage: 0.40,
    features: [
      { text: '50', highlight: true, suffix: ' Alternative Pages' },
      { text: 'AI-Powered Content' },
      { text: 'Production-Ready HTML' },
      { text: 'SEO Optimized' },
      { text: 'Priority Support' },
      { text: 'Best for Crowded Markets' },
    ],
  },
];

function FullScreenLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 flex flex-col items-center">
        <div className="relative mb-4">
          <div className="w-12 h-12 border-2 border-white/10 rounded-full" />
          <div className="absolute top-0 left-0 w-12 h-12 border-2 border-[#9A8FEA] border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-white font-medium">Loading payment options...</p>
        <p className="text-gray-500 text-sm mt-1">Please wait a moment</p>
      </div>
    </div>
  );
}

// PayPal Buttons Wrapper Component
function PayPalPaymentButtons({
  planId,
  isProcessing,
  setIsProcessing,
  setError,
  onPaymentSuccess,
  onClose,
}: {
  planId: string;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
  setError: (v: string | null) => void;
  onPaymentSuccess: (newCredits: number, newTier: string) => void;
  onClose: () => void;
}) {
  const accessTokenRef = useRef<string | null>(null);

  const getAuthHeaders = useCallback(async (): Promise<HeadersInit> => {
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
  }, []);

  const createOrder = useCallback(async () => {
    setError(null);
    
    const headers = await getAuthHeaders();
    
    const response = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ plan: planId }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      setError(data.error || 'Failed to create order');
      throw new Error(data.error);
    }

    return data.orderID;
  }, [planId, setError, getAuthHeaders]);

  const onApprove = useCallback(async (data: { orderID: string }) => {
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

      onPaymentSuccess(result.new_total, result.subscription_tier);
      onClose();
      
    } catch (err) {
      console.error('Payment error:', err);
      setError('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [setIsProcessing, setError, onPaymentSuccess, onClose, getAuthHeaders]);

  const onError = useCallback((err: any) => {
    console.error('PayPal error:', err);
    setError('PayPal payment error. Please try again.');
    setIsProcessing(false);
  }, [setError, setIsProcessing]);

  const onCancel = useCallback(() => {
    setError('Payment cancelled');
    setIsProcessing(false);
  }, [setError, setIsProcessing]);

  return (
    <div className={isProcessing ? 'opacity-50 pointer-events-none' : ''}>
      <PayPalButtons
        style={{
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'pay',
          height: 40,
        }}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onError}
        onCancel={onCancel}
        disabled={isProcessing}
      />
    </div>
  );
}

// Individual Plan Card with embedded payment
function PlanCard({
  plan,
  globalIsProcessing,
  setGlobalIsProcessing,
  globalError,
  setGlobalError,
  onPaymentSuccess,
  onClose,
}: {
  plan: typeof PLANS[0];
  globalIsProcessing: boolean;
  setGlobalIsProcessing: (v: boolean) => void;
  globalError: string | null;
  setGlobalError: (v: string | null) => void;
  onPaymentSuccess: (newCredits: number, newTier: string) => void;
  onClose: () => void;
}) {
  const [paymentProvider, setPaymentProvider] = useState<'paypal' | 'creem' | null>(null);
  const [localIsProcessing, setLocalIsProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const [{ isPending }] = usePayPalScriptReducer();

  const isProcessing = globalIsProcessing || localIsProcessing;
  const error = globalError || localError;

  const getAuthHeaders = async (): Promise<HeadersInit> => {
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

  const handleCreemCheckout = async () => {
    setLocalIsProcessing(true);
    setLocalError(null);
    setGlobalError(null);

    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch('/api/creem/create-checkout', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ plan: plan.id }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setLocalError(data.error || 'Failed to create checkout');
        setLocalIsProcessing(false);
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setLocalError('Checkout URL not received');
        setLocalIsProcessing(false);
      }
    } catch (err: any) {
      console.error('Creem checkout error:', err);
      setLocalError('Payment initialization failed. Please try again.');
      setLocalIsProcessing(false);
    }
  };

  return (
    <div className={`relative p-5 sm:p-6 rounded-xl flex flex-col h-full ${
      plan.popular
        ? 'bg-gradient-to-br from-[#9A8FEA]/20 via-[#65B4FF]/10 to-transparent border-2 border-[#9A8FEA]/50'
        : 'bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10'
    }`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#FFAF40] via-[#9A8FEA] to-[#65B4FF] rounded-full text-[10px] font-semibold text-white">
          MOST POPULAR
        </div>
      )}

      {/* Plan Info */}
      <div className={`mb-4 ${plan.popular ? 'mt-2' : ''}`}>
        <h3 className="text-lg font-semibold text-white mb-2">{plan.name}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">${plan.price}</span>
          <span className="text-gray-500 text-sm">{plan.credits} pages</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">${plan.perPage} per page</p>
      </div>

      {/* Features */}
      <ul className="space-y-2 flex-grow text-sm mb-5">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="flex items-center gap-2 text-gray-300">
            <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Payment Provider Selection */}
      <div className="mb-4">
        <p className="text-gray-400 text-xs mb-2 text-center">Pay with</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setPaymentProvider('paypal')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all ${
              paymentProvider === 'paypal'
                ? 'border-[#0070BA] bg-[#0070BA]/10'
                : 'border-white/10 hover:border-white/30 bg-white/5'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path fill="#0070BA" d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.63l-1.496 9.478h2.79c.457 0 .85-.334.922-.788l.04-.19.73-4.627.047-.255a.933.933 0 0 1 .922-.788h.58c3.76 0 6.704-1.528 7.565-5.621.355-1.818.196-3.328-.507-4.614z"/>
            </svg>
            <span className="text-white text-xs">PayPal</span>
          </button>

          <button
            onClick={() => setPaymentProvider('creem')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all ${
              paymentProvider === 'creem'
                ? 'border-[#9A8FEA] bg-[#9A8FEA]/10'
                : 'border-white/10 hover:border-white/30 bg-white/5'
            }`}
          >
            <div className="w-4 h-4 rounded bg-gradient-to-br from-[#9A8FEA] to-[#65B4FF] flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">C</span>
            </div>
            <span className="text-white text-xs">Creem</span>
          </button>
        </div>
      </div>

      {/* Payment Button */}
      {paymentProvider === 'paypal' && (
        <div>
          {isPending ? (
            <div className="flex items-center justify-center py-3">
              <svg className="animate-spin h-5 w-5 text-[#9A8FEA]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <PayPalPaymentButtons
              planId={plan.id}
              isProcessing={isProcessing}
              setIsProcessing={setGlobalIsProcessing}
              setError={setGlobalError}
              onPaymentSuccess={onPaymentSuccess}
              onClose={onClose}
            />
          )}
        </div>
      )}

      {paymentProvider === 'creem' && (
        <button
          onClick={handleCreemCheckout}
          disabled={isProcessing}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-[#9A8FEA] to-[#65B4FF] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Pay ${plan.price}
            </>
          )}
        </button>
      )}

      {!paymentProvider && (
        <div className="py-2.5 text-center text-gray-500 text-xs border border-white/10 rounded-lg">
          Select a payment method above
        </div>
      )}

      {error && (
        <p className="text-red-400 text-xs text-center mt-2">{error}</p>
      )}
    </div>
  );
}

function ModalContent({
  onClose,
  currentCredits,
  currentTier,
  onPaymentSuccess,
  initialPlan,
  uncloseable = false,
}: Omit<PricingModalProps, 'isOpen'>) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [{ isPending }] = usePayPalScriptReducer();

  if (isPending) {
    return <FullScreenLoading />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={uncloseable ? undefined : onClose}
      />
      
      <div className="relative bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4 dark-scrollbar">
        <div className="sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5 px-6 py-5 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">{uncloseable ? 'Choose a Plan to Continue' : 'Upgrade Your Plan'}</h2>
            <p className="text-gray-400 text-sm mt-1">
              {uncloseable ? (
                'Select a plan to start creating alternative pages'
              ) : (
                <>Current: <span className="text-white font-medium">{currentCredits} pages</span> · {currentTier} plan</>
              )}
            </p>
          </div>
          {!uncloseable && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Two Plan Cards with embedded payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                globalIsProcessing={isProcessing}
                setGlobalIsProcessing={setIsProcessing}
                globalError={error}
                setGlobalError={setError}
                onPaymentSuccess={onPaymentSuccess}
                onClose={onClose}
              />
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-500 text-xs flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure payment powered by PayPal & Creem · Pages added instantly
            </p>
            
            {uncloseable && (
              <Link
                href="/"
                className="inline-flex items-center gap-2 mt-4 text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PricingModal({
  isOpen,
  onClose,
  currentCredits,
  currentTier,
  onPaymentSuccess,
  initialPlan = null,
  uncloseable = false,
}: PricingModalProps) {
  if (!isOpen) return null;

  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
        currency: 'USD',
        intent: 'capture',
        disableFunding: 'paylater,credit',
      }}
    >
      <ModalContent
        onClose={onClose}
        currentCredits={currentCredits}
        currentTier={currentTier}
        onPaymentSuccess={onPaymentSuccess}
        initialPlan={initialPlan}
        uncloseable={uncloseable}
      />
    </PayPalScriptProvider>
  );
}
