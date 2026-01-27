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
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('credits, subscription_tier, subscription_status, max_projects')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // Profile doesn't exist yet, create one with 3 free credits
      console.log('Profile not found, creating new profile for user:', user.id);
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          credits: 3,
          subscription_tier: 'free',
          subscription_status: 'inactive',
          max_projects: 3,
        })
        .select('credits, subscription_tier, subscription_status, max_projects')
        .single();
      
      if (createError) {
        console.error('Failed to create user profile:', createError);
        return NextResponse.json({
          credits: 3,
          subscription_tier: 'free',
          subscription_status: 'inactive',
          max_projects: 3,
          user_id: user.id,
          email: user.email,
        });
      }
      
      profile = newProfile;
    }

    return NextResponse.json({
      credits: profile?.credits ?? 3,
      subscription_tier: profile?.subscription_tier ?? 'free',
      subscription_status: profile?.subscription_status ?? 'inactive',
      max_projects: profile?.max_projects ?? 3,
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
