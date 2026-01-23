'use client';

import { supabase } from './supabase';

/**
 * Global API client with 401 interception.
 * When any API returns 401, automatically signs out and redirects to home.
 */

let isHandling401 = false; // Prevent multiple 401 handlers

async function handle401() {
  if (isHandling401) return;
  isHandling401 = true;
  
  console.warn('[API Client] 401 Unauthorized - signing out and redirecting to home');
  
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.error('[API Client] Error signing out:', e);
  }
  
  // Redirect to home page
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
  
  // Reset flag after a delay (in case redirect fails)
  setTimeout(() => {
    isHandling401 = false;
  }, 3000);
}

/**
 * Fetch wrapper that automatically handles 401 responses.
 * Use this instead of native fetch for API calls.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init);
  
  if (response.status === 401) {
    handle401();
    // Still throw/return the response so caller can handle if needed
    throw new Error('Unauthorized - session expired');
  }
  
  return response;
}

/**
 * JSON API helper - fetches and parses JSON, handles 401.
 */
export async function apiJson<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await apiFetch(input, init);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || `API Error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Setup global fetch interceptor (optional - patches native fetch).
 * Call this once at app initialization if you want ALL fetches intercepted.
 */
export function setupGlobalFetchInterceptor() {
  if (typeof window === 'undefined') return;
  
  const originalFetch = window.fetch;
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const response = await originalFetch(input, init);
    
    // Only intercept API routes (not external requests)
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    const isApiRoute = url.startsWith('/api/') || url.includes('/api/');
    
    if (isApiRoute && response.status === 401) {
      handle401();
    }
    
    return response;
  };
  
  console.log('[API Client] Global fetch interceptor installed');
}
