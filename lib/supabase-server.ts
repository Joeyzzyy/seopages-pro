/**
 * Server-side Supabase client with proxy support.
 * Use this in API routes instead of the regular supabase client.
 */
import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';
import { fetch as undiciFetch, ProxyAgent, type RequestInit } from 'undici';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Get proxy agent if proxy is configured
function getProxyAgent(): ProxyAgent | undefined {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (proxyUrl) {
    console.log('[Supabase] Using proxy:', proxyUrl);
    return new ProxyAgent(proxyUrl);
  }
  return undefined;
}

// Create proxy-enabled fetch function
function createProxyFetch() {
  const proxyAgent = getProxyAgent();
  if (!proxyAgent) {
    return undefined;
  }

  return (url: string | URL | Request, init?: RequestInit) => {
    // Convert Request to string URL if needed (undici doesn't accept Next.js Request type)
    const urlString = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
    return undiciFetch(urlString, {
      ...init,
      dispatcher: proxyAgent,
    } as RequestInit);
  };
}

const proxyFetch = createProxyFetch();

/**
 * Creates a Supabase client with proxy support for server-side use.
 */
export function createServerSupabaseClient(
  key: string = supabaseAnonKey,
  options: SupabaseClientOptions<'public'> = {}
) {
  return createClient(supabaseUrl, key, {
    ...options,
    global: {
      ...options.global,
      ...(proxyFetch && {
        fetch: proxyFetch as unknown as typeof fetch,
      }),
    },
  });
}

/**
 * Creates an authenticated Supabase client with proxy support for API routes.
 */
export function createAuthenticatedServerClient(authHeader: string | null) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: authHeader || '',
      },
      ...(proxyFetch && {
        fetch: proxyFetch as unknown as typeof fetch,
      }),
    },
  });
}

/**
 * Creates a Supabase admin client with service role key and proxy support.
 */
export function createServerSupabaseAdmin() {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }
  return createServerSupabaseClient(supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
