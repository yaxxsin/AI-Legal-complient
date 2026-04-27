'use client';

import { useEffect } from 'react';
import { useProfileStore } from '@/stores/profile-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';

/** Fetches business profiles and syncs to Zustand store */
export function useProfiles() {
  const { profiles, activeProfileId, isLoading, setProfiles, setActiveProfileId, setLoading } = useProfileStore();

  useEffect(() => {
    let cancelled = false;

    async function fetchProfiles() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/business-profiles`, {
          credentials: 'include',
        });
        if (!res.ok) return;

        const body = await res.json();
        const list = Array.isArray(body) ? body : body.data || [];
        if (!cancelled) {
          setProfiles(list);
        }
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProfiles();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;

  return {
    profiles,
    activeProfile,
    activeProfileId,
    isLoading,
    setActiveProfileId,
    /** Refetch profiles from API */
    refetch: async () => {
      try {
        const res = await fetch(`${API_URL}/business-profiles`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const body = await res.json();
        setProfiles(Array.isArray(body) ? body : body.data || []);
      } catch { /* */ }
    },
  };
}
