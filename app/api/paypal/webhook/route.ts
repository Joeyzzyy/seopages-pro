import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAdmin } from '@/lib/supabase-server';

// PayPal 配置
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID!;
const PAYPAL_API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// 定价配置
const PRICING_PLANS = {
  starter: { credits: 10, tier: 'starter' },
  standard: { credits: 20, tier: 'standard' },
  pro: { credits: 50, tier: 'pro' },
} as const;

// Supabase admin client (with proxy support)
const supabaseAdmin = createServerSupabaseAdmin();

// 获取 PayPal Access Token
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

// 验证 PayPal Webhook 签名
async function verifyWebhookSignature(
  request: NextRequest,
  body: string
): Promise<boolean> {
  try {
    const accessToken = await getPayPalAccessToken();
    
    const verifyResponse = await fetch(
      `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          auth_algo: request.headers.get('paypal-auth-algo'),
          cert_url: request.headers.get('paypal-cert-url'),
          transmission_id: request.headers.get('paypal-transmission-id'),
          transmission_sig: request.headers.get('paypal-transmission-sig'),
          transmission_time: request.headers.get('paypal-transmission-time'),
          webhook_id: PAYPAL_WEBHOOK_ID,
          webhook_event: JSON.parse(body),
        }),
      }
    );

    if (!verifyResponse.ok) {
      console.error('Webhook verification request failed');
      return false;
    }

    const verifyData = await verifyResponse.json();
    return verifyData.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('Error verifying webhook:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // 验证 Webhook 签名（生产环境必须）
    if (process.env.NODE_ENV === 'production') {
      const isValid = await verifyWebhookSignature(request, body);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const event = JSON.parse(body);
    const eventType = event.event_type;
    
    console.log('PayPal Webhook received:', eventType);

    // 处理不同的事件类型
    switch (eventType) {
      case 'CHECKOUT.ORDER.APPROVED':
        // 订单被批准，通常前端会处理捕获
        console.log('Order approved:', event.resource?.id);
        break;

      case 'PAYMENT.CAPTURE.COMPLETED':
        // 支付捕获完成 - 这是最重要的事件
        await handlePaymentCompleted(event.resource);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        // 支付被拒绝
        console.log('Payment denied:', event.resource?.id);
        await handlePaymentFailed(event.resource, 'DENIED');
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        // 退款 - 需要扣除积分
        await handlePaymentRefunded(event.resource);
        break;

      default:
        console.log('Unhandled event type:', eventType);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// 处理支付完成
async function handlePaymentCompleted(resource: any) {
  try {
    const captureId = resource?.id;
    const customId = resource?.custom_id;
    
    if (!customId) {
      console.log('No custom_id found in payment, skipping credit update');
      return;
    }

    let planInfo: { user_id: string; plan: keyof typeof PRICING_PLANS; credits: number };
    try {
      planInfo = JSON.parse(customId);
    } catch {
      console.error('Failed to parse custom_id:', customId);
      return;
    }

    const { user_id, plan } = planInfo;
    const creditsToAdd = PRICING_PLANS[plan]?.credits || 10;
    const newTier = PRICING_PLANS[plan]?.tier || 'starter';

    // 检查是否已经处理过这个支付
    const { data: existingOrder } = await supabaseAdmin
      .from('payment_orders')
      .select('status')
      .eq('paypal_capture_id', captureId)
      .single();

    if (existingOrder?.status === 'COMPLETED') {
      console.log('Payment already processed:', captureId);
      return;
    }

    // 添加积分
    const { error: updateError } = await supabaseAdmin.rpc(
      'add_user_credits',
      {
        user_id: user_id,
        credits_to_add: creditsToAdd,
        new_tier: newTier,
      }
    );

    if (updateError) {
      console.error('Failed to add credits via webhook:', updateError);
      // 尝试直接更新
      await supabaseAdmin
        .from('user_profiles')
        .update({
          subscription_tier: newTier,
          subscription_status: 'active',
        })
        .eq('id', user_id);
    }

    console.log(`Added ${creditsToAdd} credits to user ${user_id} via webhook`);

  } catch (error) {
    console.error('Error handling payment completed:', error);
  }
}

// 处理支付失败
async function handlePaymentFailed(resource: any, reason: string) {
  try {
    const orderId = resource?.supplementary_data?.related_ids?.order_id;
    
    if (orderId) {
      await supabaseAdmin
        .from('payment_orders')
        .update({
          status: 'FAILED',
          error_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// 处理退款
async function handlePaymentRefunded(resource: any) {
  try {
    const captureId = resource?.id;
    const customId = resource?.custom_id;
    
    if (!customId) {
      console.log('No custom_id found in refund');
      return;
    }

    let planInfo: { user_id: string; plan: keyof typeof PRICING_PLANS; credits: number };
    try {
      planInfo = JSON.parse(customId);
    } catch {
      console.error('Failed to parse custom_id for refund:', customId);
      return;
    }

    const { user_id, plan } = planInfo;
    const creditsToRemove = PRICING_PLANS[plan]?.credits || 10;

    // 扣除积分
    const { data: currentProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('credits')
      .eq('id', user_id)
      .single();

    const newCredits = Math.max(0, (currentProfile?.credits || 0) - creditsToRemove);

    await supabaseAdmin
      .from('user_profiles')
      .update({
        credits: newCredits,
        subscription_status: newCredits > 0 ? 'active' : 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user_id);

    console.log(`Removed ${creditsToRemove} credits from user ${user_id} due to refund`);

    // 更新订单状态
    await supabaseAdmin
      .from('payment_orders')
      .update({
        status: 'REFUNDED',
        refunded_at: new Date().toISOString(),
      })
      .eq('paypal_capture_id', captureId);

  } catch (error) {
    console.error('Error handling refund:', error);
  }
}
