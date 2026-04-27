'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Crown,
  UserX,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

/* ============================================
   Types
   ============================================ */

interface UserRow {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  plan: string;
  emailVerified: boolean;
  createdAt: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ROLES = ['user', 'admin', 'banned'] as const;
const PLANS = ['free', 'starter', 'growth', 'business'] as const;

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  admin: { label: 'Admin', color: 'text-violet-500 bg-violet-500/10', icon: ShieldCheck },
  user: { label: 'User', color: 'text-sky-500 bg-sky-500/10', icon: UserCheck },
  banned: { label: 'Banned', color: 'text-red-500 bg-red-500/10', icon: UserX },
};

const PLAN_CONFIG: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: 'text-muted-foreground bg-muted/50' },
  starter: { label: 'Starter', color: 'text-emerald-500 bg-emerald-500/10' },
  growth: { label: 'Growth', color: 'text-blue-500 bg-blue-500/10' },
  business: { label: 'Business', color: 'text-amber-500 bg-amber-500/10' },
};

/* ============================================
   Main Component
   ============================================ */

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 15, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch users
  const fetchUsers = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(meta.limit));
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res = await fetch(`${apiUrl}/users?${params}`, {
        credentials: 'include',
      });

      if (res.ok) {
        const json = await res.json();
        let data: UserRow[] = json.data ?? [];

        // Client-side role filter (backend doesn't support it)
        if (filterRole) {
          data = data.filter((u) => u.role === filterRole);
        }

        setUsers(data);
        setMeta(json.meta ?? { total: 0, page: 1, limit: 15, totalPages: 0 });
      }
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, debouncedSearch, filterRole, meta.limit]);

  useEffect(() => {
    fetchUsers(1);
  }, [debouncedSearch, filterRole]);

  // Change role
  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      const res = await fetch(`${apiUrl}/users/${userId}/role`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.message || 'Gagal mengubah role');
      }
    } catch (e) {
      console.error(e);
      alert('Gagal mengubah role');
    } finally {
      setUpdatingId(null);
    }
  };

  // Change plan
  const handlePlanChange = async (userId: string, newPlan: string) => {
    setUpdatingId(userId);
    try {
      const res = await fetch(`${apiUrl}/users/${userId}/plan`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, plan: newPlan } : u)));
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.message || 'Gagal mengubah plan');
      }
    } catch (e) {
      console.error(e);
      alert('Gagal mengubah plan');
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete user
  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`Hapus user "${email}"? Data user akan dihapus permanen.`)) return;
    setUpdatingId(userId);
    try {
      const res = await fetch(`${apiUrl}/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setMeta((prev) => ({ ...prev, total: prev.total - 1 }));
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.message || 'Gagal menghapus user');
      }
    } catch (e) {
      console.error(e);
      alert('Gagal menghapus user');
    } finally {
      setUpdatingId(null);
    }
  };

  // Stats
  const totalUsers = meta.total;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const bannedCount = users.filter((u) => u.role === 'banned').length;

  const formatDate = (iso: string): string => {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">
              Kelola semua user — ubah role, plan, atau hapus akun.
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchUsers(meta.page)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10">
              <Users className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalUsers}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10">
              <Crown className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{adminCount}</p>
              <p className="text-xs text-muted-foreground">Admins (page ini)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10">
              <ShieldAlert className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{bannedCount}</p>
              <p className="text-xs text-muted-foreground">Banned (page ini)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar: Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-input bg-background text-sm"
        >
          <option value="">Semua Role</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_CONFIG[r]?.label ?? r}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Tidak ada user ditemukan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">User</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Role</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Plan</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Verified</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                    <th className="text-right px-5 py-3 font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const roleConf = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.user;
                    const planConf = PLAN_CONFIG[user.plan] ?? PLAN_CONFIG.free;
                    const isUpdating = updatingId === user.id;
                    const RoleIcon = roleConf.icon;

                    return (
                      <tr
                        key={user.id}
                        className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        {/* User info */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                              {user.fullName?.[0]?.toUpperCase() ?? '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">{user.fullName || '-'}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role dropdown */}
                        <td className="px-4 py-4 text-center">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${roleConf.color}`}
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_CONFIG[r]?.label ?? r}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Plan dropdown */}
                        <td className="px-4 py-4 text-center">
                          <select
                            value={user.plan}
                            onChange={(e) => handlePlanChange(user.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${planConf.color}`}
                          >
                            {PLANS.map((p) => (
                              <option key={p} value={p}>
                                {PLAN_CONFIG[p]?.label ?? p}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Verified */}
                        <td className="px-4 py-4 text-center">
                          {user.emailVerified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                              <UserCheck className="w-3 h-3" /> Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500">
                              No
                            </span>
                          )}
                        </td>

                        {/* Joined */}
                        <td className="px-4 py-4 text-muted-foreground text-xs">
                          {formatDate(user.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleDelete(user.id, user.email)}
                            className="inline-flex items-center justify-center p-2 rounded-lg bg-surface hover:bg-red-500/10 hover:text-red-500 transition-colors text-muted-foreground border border-border"
                            title="Hapus user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Halaman {meta.page} dari {meta.totalPages} ({meta.total} users)
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fetchUsers(meta.page - 1)}
                  disabled={meta.page <= 1}
                  className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, meta.page - 2);
                  const pageNum = start + i;
                  if (pageNum > meta.totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => fetchUsers(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                        pageNum === meta.page
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => fetchUsers(meta.page + 1)}
                  disabled={meta.page >= meta.totalPages}
                  className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
