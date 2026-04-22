'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronDown, Plus, Check } from 'lucide-react';
import { useProfiles } from '@/hooks/use-profiles';
import { useAuthStore } from '@/stores/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  starter: 1,
  growth: 3,
  business: 10,
};

export function ProfileSwitcher() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profiles, activeProfile, activeProfileId, setActiveProfileId, refetch } = useProfiles();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const nonDraftProfiles = profiles.filter((p) => !p.isDraft);
  const planLimit = PLAN_LIMITS[user?.plan ?? 'free'] ?? 1;
  const canCreate = nonDraftProfiles.length < planLimit;

  // Don't render if user has 0 or 1 profile and can't create more
  if (nonDraftProfiles.length <= 1 && !canCreate) {
    return null;
  }

  async function handleCreateProfile() {
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/business-profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ entityType: 'PT' }),
      });

      if (res.ok) {
        const body = await res.json();
        const newId = body.data?.id ?? body.id;
        if (newId) {
          await refetch();
          setActiveProfileId(newId);
          router.push('/onboarding');
        }
      }
    } catch {
      // Silently fail
    } finally {
      setCreating(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative px-3 mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">
            {activeProfile?.businessName || 'Pilih Profil'}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            {activeProfile?.entityType} {activeProfile?.city ? `- ${activeProfile.city}` : ''}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            <div className="max-h-48 overflow-y-auto py-1">
              {nonDraftProfiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => {
                    setActiveProfileId(profile.id);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-3 h-3 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{profile.businessName || 'Tanpa Nama'}</p>
                    <p className="text-[10px] text-muted-foreground">{profile.entityType}</p>
                  </div>
                  {profile.id === activeProfileId && (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Add new profile */}
            {canCreate ? (
              <button
                onClick={handleCreateProfile}
                disabled={creating}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 border-t border-border hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-6 h-6 rounded-md border border-dashed border-primary/40 flex items-center justify-center shrink-0">
                  <Plus className="w-3 h-3 text-primary" />
                </div>
                <span className="text-xs font-medium text-primary">
                  {creating ? 'Membuat...' : 'Tambah Profil Bisnis'}
                </span>
              </button>
            ) : (
              <div className="px-3 py-2.5 border-t border-border">
                <p className="text-[10px] text-muted-foreground text-center">
                  Batas {planLimit} profil ({user?.plan}). <a href="/pricing" className="text-primary font-medium">Upgrade</a>
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
