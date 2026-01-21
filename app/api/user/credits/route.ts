import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper to create authenticated Supabase client
async function createAuthenticatedClient(request: NextRequest) {
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

// Create a Supabase client with the service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      // Return default credits for unauthenticated users
      return NextResponse.json({
        credits: 1,
        subscription_tier: 'free',
        subscription_status: 'inactive',
      });
    }

    // Try to get user profile with credits
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('credits, subscription_tier, subscription_status')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // Profile doesn't exist yet, return default
      console.log('Profile not found, returning default credits:', profileError.message);
      return NextResponse.json({
        credits: 1,
        subscription_tier: 'free',
        subscription_status: 'inactive',
        user_id: user.id,
        email: user.email,
      });
    }

    return NextResponse.json({
      credits: profile.credits ?? 1,
      subscription_tier: profile.subscription_tier ?? 'free',
      subscription_status: profile.subscription_status ?? 'inactive',
      user_id: user.id,
      email: user.email,
    });

  } catch (error) {
    console.error('Error fetching user credits:', error);
    return NextResponse.json({
      credits: 1,
      subscription_tier: 'free',
      subscription_status: 'inactive',
      error: 'Failed to fetch credits',
    });
  }
}
