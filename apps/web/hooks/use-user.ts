'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { useEffect } from 'react';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  plan: string;
  emailVerified: boolean;
  onboardingCompleted: boolean;
}

async function fetchCurrentUser(): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return null;

  const response = await fetch(`${apiUrl}/users/me`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!response.ok) return null;

  const result = await response.json();
  return result.data ?? result;
}

/** TanStack Query hook — fetches + caches current user profile */
export function useCurrentUser() {
  const { setUser, clearUser } = useAuthStore();

  const query = useQuery({
    queryKey: ['current-user'],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Sync to Zustand store
  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    } else if (!query.isLoading && !query.data) {
      clearUser();
    }
  }, [query.data, query.isLoading, setUser, clearUser]);

  return query;
}
