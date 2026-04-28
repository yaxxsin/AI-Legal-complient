'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Users,
  Shield,
  Database,
  LayoutDashboard,
  FileText,
  Newspaper,
  LayoutPanelTop,
  Loader2,
  ArrowUpRight,
  Crown,
  UserX,
  TrendingUp,
} from 'lucide-react';

/* ============================================
   Types
   ============================================ */

interface DashboardStats {
  totalUsers: number;
  adminUsers: number;
  bannedUsers: number;
  totalArticles: number;
  totalRegulations: number;
  totalTemplates: number;
  totalCmsPages: number;
  totalRules: number;
}

interface RecentUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  plan: string;
  createdAt: string;
}

const INITIAL_STATS: DashboardStats = {
  totalUsers: 0,
  adminUsers: 0,
  bannedUsers: 0,
  totalArticles: 0,
  totalRegulations: 0,
  totalTemplates: 0,
  totalCmsPages: 0,
  totalRules: 0,
};

/* ============================================
   Main Component
   ============================================ */

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const opts: RequestInit = { credentials: 'include' };

      // Fetch all stats in parallel
      const [usersRes, articlesRes, regulationsRes, templatesRes, cmsRes, rulesRes] = await Promise.allSettled([
        fetch(`${apiUrl}/users?limit=5`, opts),
        fetch(`${apiUrl}/admin/articles?limit=1`, opts),
        fetch(`${apiUrl}/regulations?limit=1`, opts),
        fetch(`${apiUrl}/documents/admin/templates`, opts),
        fetch(`${apiUrl}/cms/pages`, opts),
        fetch(`${apiUrl}/compliance-rules`, opts),
      ]);

      const newStats = { ...INITIAL_STATS };
      const recent: RecentUser[] = [];

      // Users
      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const json = await usersRes.value.json();
        newStats.totalUsers = json.meta?.total ?? 0;
        // Count roles from the fetched page
        const users = json.data ?? [];
        recent.push(...users);
      }

      // Articles
      if (articlesRes.status === 'fulfilled' && articlesRes.value.ok) {
        const json = await articlesRes.value.json();
        newStats.totalArticles = json.meta?.total ?? 0;
      }

      // Regulations
      if (regulationsRes.status === 'fulfilled' && regulationsRes.value.ok) {
        const json = await regulationsRes.value.json();
        newStats.totalRegulations = json.meta?.total ?? 0;
      }

      // Templates (array response — count length)
      if (templatesRes.status === 'fulfilled' && templatesRes.value.ok) {
        const json = await templatesRes.value.json();
        newStats.totalTemplates = Array.isArray(json) ? json.length : 0;
      }

      // CMS Pages (array response — count length)
      if (cmsRes.status === 'fulfilled' && cmsRes.value.ok) {
        const json = await cmsRes.value.json();
        newStats.totalCmsPages = Array.isArray(json) ? json.length : 0;
      }

      // Compliance Rules (array response)
      if (rulesRes.status === 'fulfilled' && rulesRes.value.ok) {
        const json = await rulesRes.value.json();
        newStats.totalRules = Array.isArray(json) ? json.length : 0;
      }

      setStats(newStats);
      setRecentUsers(recent);
    } catch (e) {
      console.error('Failed to fetch dashboard stats:', e);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatDate = (iso: string): string => {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const PLAN_COLORS: Record<string, string> = {
    free: 'text-muted-foreground bg-muted/50',
    starter: 'text-emerald-500 bg-emerald-500/10',
    growth: 'text-blue-500 bg-blue-500/10',
    business: 'text-amber-500 bg-amber-500/10',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <div className="p-3 bg-primary/10 rounded-xl">
          <LayoutDashboard className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold">Admin Overview</h1>
          <p className="text-muted-foreground mt-1">Statistik platform secara real-time.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Primary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={Users}
              color="text-sky-500 bg-sky-500/10"
              href="/admin/users"
            />
            <StatCard
              title="Artikel"
              value={stats.totalArticles}
              icon={Newspaper}
              color="text-violet-500 bg-violet-500/10"
              href="/admin/articles"
            />
            <StatCard
              title="Regulasi"
              value={stats.totalRegulations}
              icon={Database}
              color="text-emerald-500 bg-emerald-500/10"
              href="/admin/regulations"
            />
            <StatCard
              title="Templates"
              value={stats.totalTemplates}
              icon={FileText}
              color="text-amber-500 bg-amber-500/10"
              href="/admin/templates"
            />
            <StatCard
              title="Compliance Rules"
              value={stats.totalRules}
              icon={Shield}
              color="text-rose-500 bg-rose-500/10"
              href="/admin/rules"
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="CMS Pages"
              value={stats.totalCmsPages}
              icon={LayoutPanelTop}
              color="text-pink-500 bg-pink-500/10"
              href="/admin/cms"
            />
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-500/10">
                  <Crown className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {recentUsers.filter((u) => u.role === 'admin').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Admins (recent)</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/10">
                  <UserX className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {recentUsers.filter((u) => u.role === 'banned').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Banned (recent)</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Users */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-heading">User Terbaru</CardTitle>
              <Link
                href="/admin/users"
                className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
              >
                Lihat Semua <ArrowUpRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {recentUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Belum ada user.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-border bg-muted/30">
                        <th className="text-left px-5 py-2.5 font-medium text-muted-foreground">User</th>
                        <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Role</th>
                        <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Plan</th>
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((user) => {
                        const planColor = PLAN_COLORS[user.plan] ?? PLAN_COLORS.free;
                        return (
                          <tr key={user.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                  {user.fullName?.[0]?.toUpperCase() ?? '?'}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-foreground truncate text-sm">{user.fullName || '-'}</p>
                                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                user.role === 'admin'
                                  ? 'text-violet-500 bg-violet-500/10'
                                  : user.role === 'banned'
                                    ? 'text-red-500 bg-red-500/10'
                                    : 'text-sky-500 bg-sky-500/10'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${planColor}`}>
                                {user.plan}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {formatDate(user.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickLink href="/admin/users" label="Kelola Users" icon={Users} />
            <QuickLink href="/admin/articles" label="Kelola Artikel" icon={Newspaper} />
            <QuickLink href="/admin/templates" label="Kelola Templates" icon={FileText} />
            <QuickLink href="/admin/cms" label="CMS Builder" icon={LayoutPanelTop} />
            <QuickLink href="/admin/rules" label="Compliance Rules" icon={Shield} />
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================
   Sub-components
   ============================================ */

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  href,
}: {
  title: string;
  value: number;
  icon: typeof Users;
  color: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:shadow-md transition-all group cursor-pointer">
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground/0 group-hover:text-primary group-hover:text-muted-foreground transition-colors" />
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof Users;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card/50 hover:bg-muted/50 hover:border-primary/30 transition-all text-sm font-medium group"
    >
      <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
