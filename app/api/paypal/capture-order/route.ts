import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAdmin, createAuthenticatedServerClient } from '@/lib/supabase-server';

// PayPal API configuration
// Use PAYPAL_MODE env var to explicitly set mode, defaults to 'live' in production
const PAYPAL_MODE = process.env.PAYPAL_MODE || (process.env.NODE_ENV === 'production' ? 'live' : 'sandbox');
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_API_BASE = PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Pricing configuration
const PRICING_PLANS = {
  starter: { price: '1.00', credits: 10, tier: 'starter' },
  standard: { price: '19.90', credits: 20, tier: 'standard' },
  pro: { price: '39.90', credits: 50, tier: 'pro' },
} as const;

// Supabase admin client (with proxy support)
const supabaseAdmin = createServerSupabaseAdmin();

// Get PayPal Access Token
async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to authenticate with PayPal');
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    // Verify user identity
    const supabase = createAuthenticatedServerClient(request.headers.get('Authorization'));
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Please sign in first' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { orderID } = body as { orderID: string };

    if (!orderID) {
      return NextResponse.json(
        { error: 'Order ID is missing' },
        { status: 400 }
      );
    }

    // Get PayPal Access Token
    const accessToken = await getPayPalAccessToken();

    // Capture (complete) PayPal order
    const captureResponse = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!captureResponse.ok) {
      const errorData = await captureResponse.text();
      console.error('Failed to capture PayPal order:', errorData);
      return NextResponse.json(
        { error: 'Payment confirmation failed' },
        { status: 500 }
      );
    }

    const captureData = await captureResponse.json();

    // Check payment status
    if (captureData.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Payment not completed', status: captureData.status },
        { status: 400 }
      );
    }

    // Extract plan info from order
    const purchaseUnit = captureData.purchase_units?.[0];
    let planInfo: { user_id: string; plan: keyof typeof PRICING_PLANS; credits: number } | null = null;
    
    try {
      if (purchaseUnit?.payments?.captures?.[0]?.custom_id) {
        planInfo = JSON.parse(purchaseUnit.payments.captures[0].custom_id);
      } else if (purchaseUnit?.custom_id) {
        planInfo = JSON.parse(purchaseUnit.custom_id);
      }
    } catch (e) {
      console.error('Failed to parse custom_id:', e);
    }

    // Verify user match
    if (planInfo && planInfo.user_id !== user.id) {
      console.error('User mismatch:', { expected: planInfo.user_id, actual: user.id });
      return NextResponse.json(
        { error: 'Order user mismatch' },
        { status: 403 }
      );
    }

    // Determine credits to add
    const plan = planInfo?.plan || 'starter';
    const creditsToAdd = PRICING_PLANS[plan]?.credits || 10;
    const newTier = PRICING_PLANS[plan]?.tier || 'starter';

    // Update user credits - use database function
    const { data: newCredits, error: updateError } = await supabaseAdmin.rpc(
      'add_user_credits',
      {
        user_id: user.id,
        credits_to_add: creditsToAdd,
        new_tier: newTier,
      }
    );

    if (updateError) {
      console.error('Failed to add credits:', updateError);
      // Fallback: direct table update
      const { error: directError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          credits: supabaseAdmin.rpc('get_user_credits', { user_id: user.id }) as unknown as number + creditsToAdd,
          subscription_tier: newTier,
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (directError) {
        console.error('Direct update also failed:', directError);
        return NextResponse.json(
          { error: 'Failed to update credits. Please contact support.' },
          { status: 500 }
        );
      }
    }

    // Update order status (if table exists)
    try {
      await supabaseAdmin.from('payment_orders').update({
        status: 'COMPLETED',
        paypal_capture_id: captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id,
        completed_at: new Date().toISOString(),
      }).eq('id', orderID);
    } catch {
      // Ignore if table doesn't exist
    }

    // Get updated user profile
    const { data: updatedProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('credits, subscription_tier, subscription_status')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Payment successful!',
      credits_added: creditsToAdd,
      new_total: updatedProfile?.credits || newCredits,
      subscription_tier: updatedProfile?.subscription_tier || newTier,
      order_id: orderID,
      capture_id: captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id,
    });

  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    return NextResponse.json(
      { error: 'Server error. Please try again later.' },
      { status: 500 }
    );
  }
}
