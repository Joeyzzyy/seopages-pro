import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedServerClient, createServerSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAuthenticatedServerClient(request.headers.get('Authorization'));
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      // Return default credits for unauthenticated users
      return NextResponse.json({
        credits: 0,
        subscription_tier: 'free',
        subscription_status: 'inactive',
        max_projects: 3,
      });
    }

    // Try to get user profile with credits
    const supabaseAdmin = createServerSupabaseAdmin();
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('credits, subscription_tier, subscription_status, max_projects')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // Profile doesn't exist yet, return default (3 credits for new users)
      console.log('Profile not found, returning default credits:', profileError.message);
      return NextResponse.json({
        credits: 3,
        subscription_tier: 'free',
        subscription_status: 'inactive',
        max_projects: 3,
        user_id: user.id,
        email: user.email,
      });
    }

    return NextResponse.json({
      credits: profile.credits ?? 3,
      subscription_tier: profile.subscription_tier ?? 'free',
      subscription_status: profile.subscription_status ?? 'inactive',
      max_projects: profile.max_projects ?? 3,
      user_id: user.id,
      email: user.email,
    });

  } catch (error) {
    console.error('Error fetching user credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}
