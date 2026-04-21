'use client';

import { useQuery } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export interface FeatureFlag {
  key: string;
  enabled?: boolean;
  targetPlans?: string[];
  targetUsers?: string[];
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

async function fetchFeatureFlags(): Promise<FeatureFlag[]> {
  const token = getCookie('access_token');
  const res = await fetch(`${API_URL}/feature-flags/public`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data;
}

export function useFeatureFlags() {
  const query = useQuery({
    queryKey: ['feature-flags', 'public'],
    queryFn: fetchFeatureFlags,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1,
  });

  const isFeatureEnabled = (key: string, userPlan?: string) => {
    // Default to true if not loaded yet or offline, so we don't flash-hide everything
    // But if we have data, we check
    if (!query.data) return true;

    const flag = query.data.find(f => f.key === key);
    
    // If flag is not explicitly defined in DB, fallback to enabled (true)
    if (!flag) return true;

    // If explicitly disabled
    if (flag.enabled === false) return false;

    // Check plan overrides
    if (flag.targetPlans && flag.targetPlans.length > 0) {
      if (!userPlan) return false; // plan is required to access restricted features
      if (!flag.targetPlans.includes(userPlan)) return false;
    }

    return true;
  };

  return {
    flags: query.data ?? [],
    isLoading: query.isLoading,
    isFeatureEnabled,
  };
}
