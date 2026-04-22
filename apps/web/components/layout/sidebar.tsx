'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  ClipboardCheck,
  FileText,
  Bell,
  CreditCard,
  BookOpen,
  Settings,
  LayoutPanelTop,
  Shield,
  Users,
  Database,
  FileCode,
  Newspaper,
  LogOut,
  Flag,
  BriefcaseBusiness,
  RefreshCw,
  Stamp,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentUser } from '@/hooks/use-user';
import { useFeatureFlags } from '@/hooks/use-feature-flags';

interface SidebarProps {
  variant?: 'dashboard' | 'admin';
}

const dashboardLinks = [
  { featureKey: 'menu-dashboard', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { featureKey: 'menu-chat', href: '/chat', label: 'ComplianceBot', icon: MessageSquare },
  { featureKey: 'menu-oss-wizard', href: '/oss-wizard', label: 'Roadmap Kepatuhan', icon: Stamp },
  { featureKey: 'menu-documents', href: '/documents', label: 'Dokumen', icon: FileText },
  { featureKey: 'menu-doc-review', href: '/document-review', label: 'Review Dokumen AI', icon: FileCode },
  { featureKey: 'menu-hr', href: '/hr', label: 'Kalkulator HR', icon: BriefcaseBusiness },
  { featureKey: 'menu-notifications', href: '/notifications', label: 'Notifikasi', icon: Bell },
  { featureKey: 'menu-knowledge', href: '/knowledge-base', label: 'Pusat Pengetahuan', icon: BookOpen },
  { featureKey: 'menu-billing', href: '/billing', label: 'Langganan', icon: CreditCard },
  { featureKey: 'menu-settings', href: '/settings', label: 'Pengaturan', icon: Settings },
];

const adminLinks = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/rules', label: 'Compliance Rules', icon: Shield },
  { href: '/admin/regulations', label: 'Regulasi', icon: Database },
  { href: '/admin/regulation-sync', label: 'Sync Regulasi', icon: RefreshCw },
  { href: '/admin/templates', label: 'Templates', icon: FileCode },
  { href: '/admin/articles', label: 'Artikel', icon: Newspaper },
  { href: '/admin/feature-flags', label: 'Target & Feature', icon: Flag },
  { href: '/admin/cms', label: 'CMS Builder', icon: LayoutPanelTop },
];

export function Sidebar({ variant = 'dashboard' }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  
  const { data: user } = useCurrentUser();
  const { isFeatureEnabled } = useFeatureFlags();

  let links = variant === 'admin' ? adminLinks : dashboardLinks;
  
  // Filter features if we are in dashboard mode
  if (variant === 'dashboard') {
    links = (links as any[]).filter(link => isFeatureEnabled(link.featureKey, user?.plan));
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-sm">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-white font-bold text-sm">LC</span>
        </div>
        <span className="font-heading font-bold text-lg">
          {variant === 'admin' ? 'Admin' : 'LocalCompliance'}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Premium Upgrade Banner for Free Accounts */}
      {variant === 'dashboard' && user?.plan === 'free' && (
        <div className="px-4 py-2 mt-auto">
          <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 border border-primary/20 relative overflow-hidden group shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <div className="relative z-10">
              <h4 className="font-heading font-bold text-sm text-primary mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Upgrade Paket
              </h4>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">Kembangkan bisnis dengan profil tanpa batas & fitur AI tingkat lanjut.</p>
              <Link 
                href="/pricing"
                className="block text-center w-full py-2 rounded-lg bg-primary/90 hover:bg-primary text-primary-foreground text-xs font-semibold shadow-sm transition-all hover:shadow-primary/25"
              >
                Lihat Penawaran
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-4">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Keluar
        </button>
        <div className="text-xs text-muted-foreground text-center">
          LocalCompliance v0.1.0
        </div>
      </div>
    </aside>
  );
}
