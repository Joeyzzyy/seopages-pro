import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAdmin, createAuthenticatedServerClient } from '@/lib/supabase-server';

// Creem API configuration
const CREEM_API_KEY = process.env.CREEM_API_KEY!;
const CREEM_API_BASE = 'https://api.creem.io';

// Pricing configuration (USD) - Maps to Creem Product IDs (One-time purchase)
const PRICING_PLANS = {
  standard: { 
    price: 9.90, 
    credits: 20, 
    name: 'Standard Plan',
    productId: process.env.CREEM_PRODUCT_ID_STANDARD,
  },
  pro: { 
    price: 19.90, 
    credits: 50, 
    name: 'Pro Plan',
    productId: process.env.CREEM_PRODUCT_ID_PRO,
  },
} as const;

// Supabase admin client
const supabaseAdmin = createServerSupabaseAdmin();

export async function POST(request: NextRequest) {
  try {
    console.log('[Creem Create Checkout] Starting...');
    
    // Verify user identity
    const supabase = createAuthenticatedServerClient(request.headers.get('Authorization'));
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('[Creem Create Checkout] Auth failed:', authError?.message);
      return NextResponse.json(
        { error: 'Please sign in first' },
        { status: 401 }
      );
    }

    console.log('[Creem Create Checkout] User verified:', user.id);

    // Parse request body
    const body = await request.json();
    const { plan } = body as { plan: keyof typeof PRICING_PLANS };

    if (!plan || !PRICING_PLANS[plan]) {
      console.log('[Creem Create Checkout] Invalid plan:', plan);
      return NextResponse.json(
        { error: 'Invalid subscription plan' },
        { status: 400 }
      );
    }

    const selectedPlan = PRICING_PLANS[plan];
    
    if (!selectedPlan.productId) {
      console.error('[Creem Create Checkout] Product ID not configured for plan:', plan);
      return NextResponse.json(
        { error: 'Payment configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    console.log('[Creem Create Checkout] Plan selected:', plan, selectedPlan);

    // Get user profile for customer info
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seopages.pro';

    // Create Creem checkout session
    // Note: Creem API doesn't accept cancel_url and customer.name in live mode
    const checkoutPayload = {
      product_id: selectedPlan.productId,
      customer: {
        email: user.email,
      },
      metadata: {
        user_id: user.id,
        plan: plan,
        credits: selectedPlan.credits,
        email: user.email,
      },
      success_url: `${appUrl}/payment/success?provider=creem`,
    };

    console.log('[Creem Create Checkout] Creating checkout with payload:', checkoutPayload);

    const checkoutResponse = await fetch(`${CREEM_API_BASE}/v1/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CREEM_API_KEY,
      },
      body: JSON.stringify(checkoutPayload),
    });

    const responseText = await checkoutResponse.text();
    
    if (!checkoutResponse.ok) {
      console.error('[Creem Create Checkout] Failed:', checkoutResponse.status, responseText);
      return NextResponse.json(
        { error: `Checkout creation failed: ${checkoutResponse.status}` },
        { status: 500 }
      );
    }

    const checkoutData = JSON.parse(responseText);
    console.log('[Creem Create Checkout] Checkout created:', checkoutData.id);

    // Record checkout to database
    try {
      await supabaseAdmin.from('creem_checkouts').insert({
        id: checkoutData.id,
        user_id: user.id,
        plan: plan,
        product_id: selectedPlan.productId,
        amount: selectedPlan.price,
        currency: 'USD',
        credits: selectedPlan.credits,
        status: 'pending',
        checkout_url: checkoutData.checkout_url,
        created_at: new Date().toISOString(),
      });
      console.log('[Creem Create Checkout] Checkout saved to database');
    } catch (err: any) {
      console.log('[Creem Create Checkout] Note: creem_checkouts table may not exist:', err?.message);
    }

    return NextResponse.json({
      checkoutId: checkoutData.id,
      checkoutUrl: checkoutData.checkout_url,
      status: checkoutData.status,
    });

  } catch (error: any) {
    console.error('[Creem Create Checkout] Unexpected error:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Server error. Please try again later.' },
      { status: 500 }
    );
  }
}
