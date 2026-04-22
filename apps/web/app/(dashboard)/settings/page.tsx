'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentUser } from '@/hooks/use-user';

type SettingsTab = 'profile' | 'team' | 'security' | 'account';

import { TeamTab } from './team-components';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)/;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'profile', label: 'Profil', icon: '👤' },
    { id: 'team', label: 'Tim', icon: '👥' },
    { id: 'security', label: 'Keamanan', icon: '🔐' },
    { id: 'account', label: 'Akun', icon: '⚙️' },
  ];

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-heading font-bold mb-6">Pengaturan</h1>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/30 border border-border mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && <ProfileTab />}
      {activeTab === 'team' && <TeamTab />}
      {activeTab === 'security' && <SecurityTab />}
      {activeTab === 'account' && <AccountTab />}
    </div>
  );
}

/** Profile Tab — edit name, phone, avatar */
function ProfileTab() {
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize form with user data once loaded
  if (user && !isInitialized) {
    setFullName(user.fullName ?? '');
    setPhone(user.phone ?? '');
    setIsInitialized(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
      const response = await fetch(`${apiUrl}/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fullName, phone }),
      });

      if (response.ok) {
        setMessage('Profil berhasil diperbarui');
      } else {
        setMessage('Gagal menyimpan perubahan');
      }
    } catch {
      setMessage('Terjadi kesalahan');
    } finally {
      setIsSaving(false);
    }
  }

  if (isUserLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <SettingsCard title="Informasi Profil" description="Data yang ditampilkan pada akun Anda">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="settings-email" className="text-sm font-medium text-muted-foreground">
              Email
            </label>
            <input
              id="settings-email"
              type="email"
              value={user?.email ?? ''}
              disabled
              className="settings-input opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="settings-name" className="text-sm font-medium">
              Nama Lengkap
            </label>
            <input
              id="settings-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              minLength={2}
              maxLength={100}
              className="settings-input"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="settings-phone" className="text-sm font-medium">
              Nomor Telepon
            </label>
            <input
              id="settings-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="settings-input"
            />
          </div>
        </div>
      </SettingsCard>

      {message && (
        <div className={`p-3 rounded-xl text-sm text-center border ${
          message.includes('berhasil')
            ? 'bg-success/10 text-success border-success/20'
            : 'bg-destructive/10 text-destructive border-destructive/20'
        }`}>
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
      </button>
    </form>
  );
}

/** Security Tab — change password + session management */
function SecurityTab() {
  const { changePassword, isLoading, signOut } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      setError('Password baru harus mengandung minimal 1 huruf besar dan 1 angka');
      return;
    }

    const result = await changePassword(oldPassword, newPassword);

    if (result) {
      setSuccess('Password berhasil diubah');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setError('Password lama salah');
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <SettingsCard title="Ubah Password" description="Pastikan password baru Anda kuat dan unik">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="settings-old-password" className="text-sm font-medium">
                Password Lama
              </label>
              <input
                id="settings-old-password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="settings-input"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="settings-new-password" className="text-sm font-medium">
                Password Baru
              </label>
              <input
                id="settings-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="settings-input"
              />
              <p className="text-xs text-muted-foreground">
                Min. 8 karakter, 1 huruf besar, 1 angka
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="settings-confirm-password" className="text-sm font-medium">
                Konfirmasi Password Baru
              </label>
              <input
                id="settings-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="settings-input"
              />
            </div>
          </div>
        </SettingsCard>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center border border-destructive/20">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-success/10 text-success text-sm text-center border border-success/20">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Mengubah...' : 'Ubah Password'}
        </button>
      </form>

      {/* Active Sessions */}
      <SessionManager onForceLogout={signOut} />
    </div>
  );
}

/** Session Manager — list and revoke active sessions */
function SessionManager({ onForceLogout }: { onForceLogout: () => void }) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

  interface SessionItem {
    id: string;
    ipAddress: string | null;
    deviceName: string | null;
    lastActiveAt: string;
    createdAt: string;
  }

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/auth/sessions`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.data || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  async function handleRevoke(sessionId: string) {
    setRevoking(sessionId);
    try {
      const res = await fetch(`${API_URL}/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } catch {
      // Silently fail
    } finally {
      setRevoking(null);
    }
  }

  async function handleRevokeAll() {
    if (!confirm('Yakin ingin logout dari semua perangkat? Anda akan diminta login ulang.')) return;

    setRevokingAll(true);
    try {
      const res = await fetch(`${API_URL}/auth/sessions/revoke-all`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        onForceLogout();
      }
    } catch {
      // Silently fail
    } finally {
      setRevokingAll(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <SettingsCard title="Sesi Aktif" description="Perangkat yang sedang login ke akun Anda">
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Tidak ada sesi aktif ditemukan.
        </p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, idx) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">
                    {session.deviceName || 'Perangkat Tidak Dikenal'}
                  </p>
                  {idx === 0 && (
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      Sesi Ini
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  IP: {session.ipAddress || '-'} &middot; Aktif: {formatDate(session.lastActiveAt)}
                </p>
              </div>

              {idx !== 0 && (
                <button
                  onClick={() => handleRevoke(session.id)}
                  disabled={revoking === session.id}
                  className="ml-3 px-3 py-1.5 text-xs font-medium rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                >
                  {revoking === session.id ? '...' : 'Logout'}
                </button>
              )}
            </div>
          ))}

          {sessions.length > 1 && (
            <button
              onClick={handleRevokeAll}
              disabled={revokingAll}
              className="w-full mt-2 py-2.5 text-sm font-medium rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              {revokingAll ? 'Memproses...' : 'Logout Semua Perangkat'}
            </button>
          )}
        </div>
      )}
    </SettingsCard>
  );
}

/** Account Tab — delete account */
function AccountTab() {
  const { signOut } = useAuth();
  const { data: user } = useCurrentUser();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    if (confirmText !== 'HAPUS AKUN') return;

    setIsDeleting(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
      const response = await fetch(`${apiUrl}/users/me`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok || response.status === 204) {
        await signOut();
      } else {
        setError('Gagal menghapus akun. Coba lagi.');
      }
    } catch {
      setError('Terjadi kesalahan');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <SettingsCard title="Informasi Akun" description="Detail paket dan status akun">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Paket</p>
            <p className="font-medium capitalize">{user?.plan ?? 'free'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Role</p>
            <p className="font-medium capitalize">{user?.role ?? 'user'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email Terverifikasi</p>
            <p className="font-medium">{user?.emailVerified ? '✅ Ya' : '❌ Belum'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Bergabung Sejak</p>
            <p className="font-medium">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '-'}
            </p>
          </div>
        </div>
      </SettingsCard>

      {/* Danger Zone */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h3 className="text-lg font-semibold text-destructive mb-2">Zona Bahaya</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Menghapus akun akan menonaktifkan seluruh akses Anda. Tindakan ini tidak dapat dibatalkan setelah 30 hari.
        </p>

        {!showConfirm ? (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="px-6 py-2.5 rounded-xl border border-destructive text-destructive text-sm font-medium hover:bg-destructive hover:text-white transition-all duration-200"
          >
            Hapus Akun Saya
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-destructive">
              Ketik <strong>HAPUS AKUN</strong> untuk konfirmasi:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="HAPUS AKUN"
              className="settings-input border-destructive/50 focus:ring-destructive/30"
            />

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={confirmText !== 'HAPUS AKUN' || isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Akun'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Reusable settings card wrapper */
function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
      {children}
    </div>
  );
}

/** Skeleton loading state */
function SettingsSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
      <div className="h-5 bg-muted rounded w-1/3 mb-2" />
      <div className="h-4 bg-muted rounded w-2/3 mb-6" />
      <div className="space-y-4">
        <div className="h-11 bg-muted rounded-xl" />
        <div className="h-11 bg-muted rounded-xl" />
        <div className="h-11 bg-muted rounded-xl" />
      </div>
    </div>
  );
}
