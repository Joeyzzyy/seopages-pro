'use client';

import { useEffect } from 'react';
import { setupGlobalFetchInterceptor } from '@/lib/api-client';

/**
 * Global providers component that sets up:
 * - 401 fetch interceptor (auto logout on unauthorized)
 * - Other global client-side setup
 */
export default function GlobalProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Setup global 401 interceptor
    setupGlobalFetchInterceptor();
  }, []);

  return <>{children}</>;
}
