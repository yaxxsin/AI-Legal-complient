'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const isDevMode = !SUPABASE_URL || SUPABASE_URL.includes('your-project') || SUPABASE_URL.includes('placeholder');

/** Initializes auth state — injects mock user in dev mode */
function AuthInitializer({ children }: { children: ReactNode }) {
  const { setUser, user, isLoading } = useAuthStore();

  useEffect(() => {
    if (isDevMode && !user) {
      setUser({
        id: 'dev-user-001',
        email: 'dev@local.test',
        fullName: 'Dev User',
        phone: null,
        avatarUrl: null,
        role: 'user',
        plan: 'free',
        emailVerified: true,
        onboardingCompleted: true,
      });
    }
  }, [setUser, user]);

  return <>{children}</>;
}

/**
 * Root providers wrapper — wraps the entire app with:
 * - TanStack Query (server state)
 * - Auth initializer (dev mode mock user)
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>{children}</AuthInitializer>
    </QueryClientProvider>
  );
}

