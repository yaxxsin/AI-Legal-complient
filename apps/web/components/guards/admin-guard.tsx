'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useCurrentUser } from '@/hooks/use-user';

/**
 * Client-side admin guard — defense-in-depth layer.
 * Middleware handles the edge check; this handles the client hydration case.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && user && user.role !== 'admin' && user.role !== 'super_admin') {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  // Still loading user data
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not admin — will redirect via useEffect
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return null;
  }

  return <>{children}</>;
}
