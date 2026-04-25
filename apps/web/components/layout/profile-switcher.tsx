'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Building2, ChevronDown, Plus, Check, Trash2 } from 'lucide-react';
import { useProfiles } from '@/hooks/use-profiles';
import { useAuthStore } from '@/stores/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  starter: 1,
  growth: 3,
  business: 10,
};

interface ContextMenu {
  x: number;
  y: number;
  profileId: string;
  profileName: string;
}

export function ProfileSwitcher() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    profiles, activeProfile, activeProfileId,
    setActiveProfileId, refetch,
  } = useProfiles();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ContextMenu | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const nonDraftProfiles = profiles.filter((p) => !p.isDraft);
  const planLimit = PLAN_LIMITS[user?.plan ?? 'free'] ?? 1;
  const canCreate = nonDraftProfiles.length < planLimit;

  // Close context menu on outside click / scroll
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [contextMenu]);

  // Don't render if user has 0 or 1 profile and can't create more
  if (nonDraftProfiles.length <= 1 && !canCreate) {
    return null;
  }

  function handleContextMenu(
    e: React.MouseEvent, profileId: string, profileName: string,
  ) {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, profileId, profileName });
  }

  async function handleDeleteProfile(profileId: string) {
    setDeleting(profileId);
    try {
      const res = await fetch(`${API_URL}/business-profiles/${profileId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok || res.status === 204) {
        if (profileId === activeProfileId) {
          const remaining = nonDraftProfiles.filter((p) => p.id !== profileId);
          if (remaining.length > 0) {
            setActiveProfileId(remaining[0].id);
          }
        }
        await refetch();
      }
    } catch {
      // Silent fail
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
      setContextMenu(null);
    }
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
                  onContextMenu={(e) => handleContextMenu(
                    e, profile.id, profile.businessName || 'Tanpa Nama',
                  )}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 transition-colors text-left ${
                    deleting === profile.id ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-3 h-3 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {profile.businessName || 'Tanpa Nama'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {profile.entityType}
                    </p>
                  </div>
                  {deleting === profile.id ? (
                    <span className="text-[10px] text-destructive animate-pulse">
                      Menghapus...
                    </span>
                  ) : profile.id === activeProfileId ? (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  ) : null}
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
                  Batas {planLimit} profil ({user?.plan}).{' '}
                  <a href="/pricing" className="text-primary font-medium">Upgrade</a>
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Right-click context menu — portal to body */}
      {contextMenu && !confirmDelete && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] bg-card border border-border rounded-lg shadow-xl py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setConfirmDelete(contextMenu);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus Profil
          </button>
        </div>,
        document.body,
      )}

      {/* Delete confirmation dialog — portal to body */}
      {confirmDelete && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-[340px] bg-card border border-border rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <h3 className="text-sm font-bold text-center mb-1">
              Hapus Profil Bisnis?
            </h3>
            <p className="text-xs text-muted-foreground text-center mb-5">
              <strong>&ldquo;{confirmDelete.profileName}&rdquo;</strong> akan
              dihapus permanen beserta semua data compliance-nya.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 h-9 rounded-lg border border-border text-xs font-medium hover:bg-muted/50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteProfile(confirmDelete.profileId)}
                disabled={!!deleting}
                className="flex-1 h-9 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
