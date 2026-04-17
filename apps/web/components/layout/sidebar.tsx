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
  Shield,
  Users,
  Database,
  FileCode,
  Newspaper,
} from 'lucide-react';

interface SidebarProps {
  variant?: 'dashboard' | 'admin';
}

const dashboardLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat', label: 'ComplianceBot', icon: MessageSquare },
  { href: '/checklist', label: 'Checklist', icon: ClipboardCheck },
  { href: '/documents', label: 'Dokumen', icon: FileText },
  { href: '/notifications', label: 'Notifikasi', icon: Bell },
  { href: '/panduan', label: 'Panduan', icon: BookOpen },
  { href: '/billing', label: 'Langganan', icon: CreditCard },
  { href: '/settings', label: 'Pengaturan', icon: Settings },
];

const adminLinks = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/rules', label: 'Compliance Rules', icon: Shield },
  { href: '/admin/regulations', label: 'Regulasi', icon: Database },
  { href: '/admin/templates', label: 'Templates', icon: FileCode },
  { href: '/admin/articles', label: 'Artikel', icon: Newspaper },
];

export function Sidebar({ variant = 'dashboard' }: SidebarProps) {
  const pathname = usePathname();
  const links = variant === 'admin' ? adminLinks : dashboardLinks;

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

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          LocalCompliance v0.1.0
        </div>
      </div>
    </aside>
  );
}
