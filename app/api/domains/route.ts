import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Generate a unique verification token
function generateVerificationToken(): string {
  return `mini-agent-verify-${crypto.randomBytes(16).toString('hex')}`;
}

// Helper to get user from Authorization header
async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const { data: { user } } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: authHeader } }
    }
  ).auth.getUser();

  return user;
}

// GET: List user's domains
export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role to bypass RLS
    const { getServiceSupabase } = await import('@/lib/supabase');
    const serviceSupabase = getServiceSupabase();

    const { data: domains, error } = await serviceSupabase
      .from('user_domains')
      .select(`
        *,
        subdirectories:domain_subdirectories(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Domains GET] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ domains: domains || [] });
  } catch (error: any) {
    console.error('[Domains GET] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Add a new domain
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { domain, verificationType = 'txt' } = body;

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // Clean the domain (remove protocol, trailing slashes, etc.)
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '')
      .toLowerCase();

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Use service role to bypass RLS for insert
    const { getServiceSupabase } = await import('@/lib/supabase');
    const serviceSupabase = getServiceSupabase();

    const { data, error } = await serviceSupabase
      .from('user_domains')
      .upsert({
        user_id: user.id,
        domain: cleanDomain,
        verification_type: verificationType,
        verification_token: verificationToken,
        verified: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,domain' })
      .select()
      .single();

    if (error) {
      console.error('[Domains POST] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      domain: data,
      verificationInstructions: getVerificationInstructions(cleanDomain, verificationToken, verificationType),
    });
  } catch (error: any) {
    console.error('[Domains POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a domain
export async function DELETE(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const domainId = searchParams.get('id');

    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 });
    }

    const { getServiceSupabase } = await import('@/lib/supabase');
    const serviceSupabase = getServiceSupabase();

    // First verify ownership
    const { data: domain } = await serviceSupabase
      .from('user_domains')
      .select('user_id')
      .eq('id', domainId)
      .single();

    if (!domain || domain.user_id !== user.id) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const { error } = await serviceSupabase
      .from('user_domains')
      .delete()
      .eq('id', domainId);

    if (error) {
      console.error('[Domains DELETE] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Domains DELETE] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getVerificationInstructions(domain: string, token: string, type: string) {
  if (type === 'txt') {
    return {
      type: 'TXT',
      host: `_mini-agent-verify.${domain}`,
      value: token,
      instructions: `Add a TXT record to your DNS settings:
- Host/Name: _mini-agent-verify
- Value: ${token}
- TTL: 300 (or default)

After adding the record, click "Verify" to confirm ownership.`,
    };
  } else {
    return {
      type: 'CNAME',
      host: `_mini-agent-verify.${domain}`,
      value: `${token}.verify.mini-agent.app`,
      instructions: `Add a CNAME record to your DNS settings:
- Host/Name: _mini-agent-verify
- Points to: ${token}.verify.mini-agent.app
- TTL: 300 (or default)

After adding the record, click "Verify" to confirm ownership.`,
    };
  }
}
