import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// PayPal API configuration
// Use PAYPAL_MODE env var to explicitly set mode, defaults to 'live' in production
const PAYPAL_MODE = process.env.PAYPAL_MODE || (process.env.NODE_ENV === 'production' ? 'live' : 'sandbox');
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_API_BASE = PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Pricing configuration (USD)
const PRICING_PLANS = {
  starter: { price: '1.00', credits: 10, name: 'Starter Plan (Limited Time Offer)' },
  standard: { price: '19.90', credits: 20, name: 'Standard Plan' },
  pro: { price: '39.90', credits: 50, name: 'Pro Plan' },
} as const;

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to create authenticated Supabase client
function createAuthenticatedClient(request: NextRequest) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: request.headers.get('Authorization') || '',
        },
      },
    }
  );
}

// Get PayPal Access Token
async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  console.log('[PayPal] Getting access token, mode:', PAYPAL_MODE, 'api:', PAYPAL_API_BASE);
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[PayPal] Failed to get access token:', response.status, error);
    throw new Error(`PayPal auth failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log('[PayPal] Got access token successfully');
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[PayPal Create Order] Starting...');
    
    // Verify user identity
    const supabase = createAuthenticatedClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('[PayPal Create Order] Auth failed:', authError?.message);
      return NextResponse.json(
        { error: 'Please sign in first' },
        { status: 401 }
      );
    }

    console.log('[PayPal Create Order] User verified:', user.id);

    // Parse request body
    const body = await request.json();
    const { plan } = body as { plan: keyof typeof PRICING_PLANS };

    if (!plan || !PRICING_PLANS[plan]) {
      console.log('[PayPal Create Order] Invalid plan:', plan);
      return NextResponse.json(
        { error: 'Invalid subscription plan' },
        { status: 400 }
      );
    }

    const selectedPlan = PRICING_PLANS[plan];
    console.log('[PayPal Create Order] Plan selected:', plan, selectedPlan);

    // Get PayPal Access Token
    let accessToken: string;
    try {
      accessToken = await getPayPalAccessToken();
    } catch (tokenError: any) {
      console.error('[PayPal Create Order] Token error:', tokenError.message);
      return NextResponse.json(
        { error: `PayPal authentication failed. Please check configuration.` },
        { status: 500 }
      );
    }

    // Create PayPal order
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seopages.pro';
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: `${user.id}_${plan}_${Date.now()}`,
          description: `SEOPages Pro - ${selectedPlan.name}`,
          custom_id: JSON.stringify({
            user_id: user.id,
            plan: plan,
            credits: selectedPlan.credits,
          }),
          amount: {
            currency_code: 'USD',
            value: selectedPlan.price,
          },
        },
      ],
      application_context: {
        brand_name: 'SEOPages Pro',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${appUrl}/payment/success`,
        cancel_url: `${appUrl}/payment/cancel`,
      },
    };

    console.log('[PayPal Create Order] Creating order with payload...');
    
    const orderResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const responseText = await orderResponse.text();
    
    if (!orderResponse.ok) {
      console.error('[PayPal Create Order] Failed:', orderResponse.status, responseText);
      return NextResponse.json(
        { error: `PayPal order creation failed: ${orderResponse.status}` },
        { status: 500 }
      );
    }

    const orderData = JSON.parse(responseText);
    console.log('[PayPal Create Order] Order created:', orderData.id, orderData.status);

    // Optional: Record order to database
    try {
      await supabaseAdmin.from('payment_orders').insert({
        id: orderData.id,
        user_id: user.id,
        plan: plan,
        amount: selectedPlan.price,
        currency: 'USD',
        credits: selectedPlan.credits,
        status: 'CREATED',
        provider: 'paypal',
        created_at: new Date().toISOString(),
      });
      console.log('[PayPal Create Order] Order saved to database');
    } catch (err: any) {
      // If table doesn't exist, ignore error (optional feature)
      console.log('[PayPal Create Order] Note: payment_orders table may not exist:', err?.message);
    }

    return NextResponse.json({
      orderID: orderData.id,
      status: orderData.status,
    });

  } catch (error: any) {
    console.error('[PayPal Create Order] Unexpected error:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Server error. Please try again later.' },
      { status: 500 }
    );
  }
}
