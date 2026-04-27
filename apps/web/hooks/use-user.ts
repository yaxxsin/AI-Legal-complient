'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';

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
  lastLoginAt: string | null;
  createdAt: string;
}

async function fetchCurrentUser(): Promise<UserProfile | null> {
  // httpOnly cookies are sent automatically with credentials: 'include'
  const response = await fetch(`${API_URL}/users/me`, {
    credentials: 'include',
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
