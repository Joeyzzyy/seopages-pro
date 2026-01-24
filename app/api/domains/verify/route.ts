import { NextResponse } from 'next/server';
import { createAuthenticatedServerClient } from '@/lib/supabase-server';
import dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);

// Helper to get user from Authorization header (with proxy support)
async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const supabase = createAuthenticatedServerClient(authHeader);
  const { data: { user } } = await supabase.auth.getUser();

  return user;
}

// POST: Verify a domain
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { domainId } = body;

    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 });
    }

    const { getServiceSupabase } = await import('@/lib/supabase');
    const serviceSupabase = getServiceSupabase();

    // Get the domain details
    const { data: domain, error: fetchError } = await serviceSupabase
      .from('user_domains')
      .select('*')
      .eq('id', domainId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    if (domain.verified) {
      return NextResponse.json({ success: true, message: 'Domain already verified' });
    }

    // Perform DNS verification
    const verificationHost = `_mini-agent-verify.${domain.domain}`;
    let verified = false;
    let verificationDetails = '';

    try {
      if (domain.verification_type === 'txt') {
        // Check TXT record
        const records = await resolveTxt(verificationHost);
        const flatRecords = records.flat();
        verified = flatRecords.some(record => record === domain.verification_token);
        verificationDetails = verified 
          ? 'TXT record found and matches!' 
          : `TXT records found: ${flatRecords.join(', ')}. Expected: ${domain.verification_token}`;
      } else {
        // Check CNAME record
        const expectedCname = `${domain.verification_token}.verify.mini-agent.app`;
        const records = await resolveCname(verificationHost);
        verified = records.some(record => record === expectedCname);
        verificationDetails = verified 
          ? 'CNAME record found and matches!' 
          : `CNAME records found: ${records.join(', ')}. Expected: ${expectedCname}`;
      }
    } catch (dnsError: any) {
      if (dnsError.code === 'ENODATA' || dnsError.code === 'ENOTFOUND') {
        verificationDetails = `No ${domain.verification_type.toUpperCase()} record found for ${verificationHost}. DNS records may take up to 48 hours to propagate.`;
      } else {
        console.error('[DNS Verification] Error:', dnsError);
        verificationDetails = `DNS lookup failed: ${dnsError.message}`;
      }
    }

    if (verified) {
      // Update domain as verified
      const { error: updateError } = await serviceSupabase
        .from('user_domains')
        .update({
          verified: true,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', domainId);

      if (updateError) {
        console.error('[Verify Domain] Update error:', updateError);
        return NextResponse.json({ error: 'Failed to update domain status' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Domain verified successfully!',
        details: verificationDetails,
      });
    } else {
      return NextResponse.json({
        success: false,
        verified: false,
        message: 'Verification failed',
        details: verificationDetails,
      });
    }
  } catch (error: any) {
    console.error('[Verify Domain] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
