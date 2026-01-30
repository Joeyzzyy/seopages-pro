import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAdmin } from '@/lib/supabase-server';
import { createHash, createHmac } from 'crypto';

// Creem configuration
const CREEM_WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET!;

// Supabase admin client
const supabaseAdmin = createServerSupabaseAdmin();

// Pricing configuration for credit mapping (One-time purchase)
const PRICING_PLANS = {
  standard: { credits: 20 },
  pro: { credits: 50 },
} as const;

/**
 * Verify Creem webhook signature
 * Creem uses HMAC-SHA256 signature verification
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  try {
    if (!CREEM_WEBHOOK_SECRET) {
      console.error('[Creem Webhook] Webhook secret not configured');
      return false;
    }

    const expectedSignature = createHmac('sha256', CREEM_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return createHash('sha256').update(expectedSignature).digest('hex') === 
           createHash('sha256').update(signature).digest('hex');
  } catch (error) {
    console.error('[Creem Webhook] Signature verification error:', error);
    return false;
  }
}

/**
 * Handle checkout.completed event
 * One-time payment successful
 */
async function handleCheckoutCompleted(event: any) {
  const { checkout, customer, product, order } = event.data;
  
  console.log('[Creem Webhook] Processing checkout.completed:', checkout.id);

  // Extract metadata
  const metadata = checkout.metadata || {};
  const userId = metadata.user_id;
  const plan = metadata.plan;

  if (!userId || !plan) {
    console.error('[Creem Webhook] Missing metadata:', metadata);
    return;
  }

  const planConfig = PRICING_PLANS[plan as keyof typeof PRICING_PLANS];
  if (!planConfig) {
    console.error('[Creem Webhook] Unknown plan:', plan);
    return;
  }

  // Update checkout record
  await supabaseAdmin
    .from('creem_checkouts')
    .update({
      status: 'completed',
      order_id: order?.id,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', checkout.id);

  // Get current user credits
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('credits, subscription_tier')
    .eq('id', userId)
    .single();

  const currentCredits = profile?.credits || 0;
  const newCredits = currentCredits + planConfig.credits;

  // Update user credits
  await supabaseAdmin
    .from('profiles')
    .update({
      credits: newCredits,
      subscription_tier: plan === 'single' ? (profile?.subscription_tier || 'free') : plan,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  // Record transaction
  await supabaseAdmin.from('creem_transactions').insert({
    checkout_id: checkout.id,
    order_id: order?.id,
    user_id: userId,
    plan: plan,
    product_id: product?.id,
    amount: checkout.amount,
    currency: checkout.currency || 'USD',
    credits_added: planConfig.credits,
    customer_email: customer?.email,
    status: 'completed',
    created_at: new Date().toISOString(),
  });

  console.log('[Creem Webhook] Checkout completed processed. Credits added:', planConfig.credits);
}

/**
 * Handle subscription events
 */
async function handleSubscriptionEvent(event: any, eventType: string) {
  const { subscription, customer, product } = event.data;
  
  console.log(`[Creem Webhook] Processing ${eventType}:`, subscription?.id);

  // Extract metadata from subscription
  const metadata = subscription?.metadata || {};
  const userId = metadata.user_id;
  const plan = metadata.plan;

  if (!userId) {
    console.error('[Creem Webhook] Missing user_id in subscription metadata');
    return;
  }

  // Update or insert subscription record
  await supabaseAdmin.from('creem_subscriptions').upsert({
    id: subscription.id,
    user_id: userId,
    plan: plan,
    product_id: product?.id,
    status: subscription.status,
    current_period_start: subscription.current_period_start,
    current_period_end: subscription.current_period_end,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    customer_email: customer?.email,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'id',
  });

  // Handle specific events
  if (eventType === 'subscription.canceled') {
    await supabaseAdmin
      .from('profiles')
      .update({
        subscription_tier: 'free',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  }

  console.log(`[Creem Webhook] ${eventType} processed`);
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-creem-signature');

    console.log('[Creem Webhook] Received webhook');

    // Verify signature in production
    if (process.env.NODE_ENV === 'production') {
      if (!signature) {
        console.error('[Creem Webhook] Missing signature');
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }

      const isValid = verifyWebhookSignature(payload, signature);
      if (!isValid) {
        console.error('[Creem Webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(payload);
    const eventType = event.type;

    console.log('[Creem Webhook] Event type:', eventType);

    // Handle different event types
    switch (eventType) {
      case 'checkout.completed':
        await handleCheckoutCompleted(event);
        break;

      case 'subscription.active':
      case 'subscription.trialing':
        await handleSubscriptionEvent(event, eventType);
        break;

      case 'subscription.canceled':
      case 'subscription.expired':
        await handleSubscriptionEvent(event, eventType);
        break;

      default:
        console.log('[Creem Webhook] Unhandled event type:', eventType);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('[Creem Webhook] Error:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
