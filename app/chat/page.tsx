'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/projects');
  }, [router]);

  return (
    <div className="h-screen bg-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
  );
}
