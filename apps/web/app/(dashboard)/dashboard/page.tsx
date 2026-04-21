'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { useCurrentUser } from '@/hooks/use-user';
import { useNotifications } from '@/hooks/use-notifications';
import {
  MessageSquare,
  ClipboardCheck,
  FileText,
  Bell,
  BookOpen,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Shield,
} from 'lucide-react';

/** Quick action card data */
const quickActions = [
  {
    href: '/chat',
    label: 'ComplianceBot',
    description: 'Tanya AI tentang kewajiban hukum bisnis Anda',
    icon: MessageSquare,
    gradient: 'from-primary to-primary/70',
  },
  {
    href: '/checklist',
    label: 'Checklist',
    description: 'Lihat daftar kepatuhan yang harus dipenuhi',
    icon: ClipboardCheck,
    gradient: 'from-success to-success/70',
  },
  {
    href: '/documents',
    label: 'Dokumen Legal',
    description: 'Generate dokumen hukum dari template siap pakai',
    icon: FileText,
    gradient: 'from-accent to-accent/70',
  },
  {
    href: '/notifications',
    label: 'Notifikasi',
    description: 'Pantau perubahan regulasi terkait bisnis Anda',
    icon: Bell,
    gradient: 'from-warning to-warning/70',
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { isLoading: isUserLoading } = useCurrentUser();
  const { unreadCount } = useNotifications();

  const greeting = getGreeting();
  const displayName = user?.fullName?.split(' ')[0] ?? 'User';

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Hero greeting */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-primary">
            {greeting}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">
          {isUserLoading ? (
            <span className="inline-block w-48 h-8 bg-muted rounded-lg animate-shimmer" />
          ) : (
            <>Halo, {displayName}! 👋</>
          )}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Kelola kepatuhan hukum bisnis Anda dari satu tempat.
        </p>
      </section>

      {/* Summary stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Shield className="w-5 h-5" />}
          label="Status"
          value={user?.onboardingCompleted ? 'Aktif' : 'Setup'}
          accent="text-success"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Plan"
          value={capitalize(user?.plan ?? 'free')}
          accent="text-primary"
        />
        <StatCard
          icon={<Bell className="w-5 h-5" />}
          label="Notifikasi Baru"
          value={String(unreadCount ?? 0)}
          accent={unreadCount ? 'text-warning' : 'text-muted-foreground'}
        />
      </section>

      {/* Onboarding CTA (if not completed) */}
      {user && !user.onboardingCompleted && (
        <Link
          href="/onboarding"
          className="block p-5 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-heading font-semibold text-primary">
                Selesaikan profil bisnis Anda
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Isi data bisnis agar checklist dan rekomendasi AI lebih akurat.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-primary shrink-0" />
          </div>
        </Link>
      )}

      {/* Quick actions grid */}
      <section>
        <h2 className="text-lg font-heading font-semibold mb-4">
          Aksi Cepat
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group relative flex items-start gap-4 p-5 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <div
                  className={`shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-sm`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold group-hover:text-primary transition-colors">
                    {action.label}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Help CTA */}
      <section className="p-5 rounded-2xl glass">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-accent shrink-0" />
          <div>
            <p className="font-medium text-sm">Butuh bantuan?</p>
            <p className="text-xs text-muted-foreground">
              Buka ComplianceBot untuk bertanya langsung ke AI, atau kunjungi{' '}
              <Link
                href="/panduan"
                className="text-primary hover:underline"
              >
                panduan
              </Link>{' '}
              untuk mempelajari fitur platform.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── Helpers ─────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
      <div className={`${accent}`}>{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-lg font-heading font-bold ${accent}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
