import {
  MessageSquare,
  ClipboardCheck,
  FileText,
  Bell,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Dashboard',
};

const quickActions = [
  {
    href: '/chat',
    label: 'ComplianceBot',
    desc: 'Tanya AI tentang regulasi',
    icon: MessageSquare,
    color: 'from-blue-500 to-indigo-600',
  },
  {
    href: '/checklist',
    label: 'Checklist',
    desc: 'Cek kepatuhan bisnis',
    icon: ClipboardCheck,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    href: '/documents',
    label: 'Dokumen',
    desc: 'Generate dokumen legal',
    icon: FileText,
    color: 'from-amber-500 to-orange-600',
  },
  {
    href: '/notifications',
    label: 'Notifikasi',
    desc: 'Alert regulasi terbaru',
    icon: Bell,
    color: 'from-rose-500 to-pink-600',
  },
];

const stats = [
  { label: 'Skor Compliance', value: '—', icon: TrendingUp, trend: 'neutral' },
  { label: 'Item Selesai', value: '0 / 0', icon: CheckCircle2, trend: 'neutral' },
  { label: 'Perlu Tindakan', value: '0', icon: AlertTriangle, trend: 'neutral' },
  { label: 'Percakapan AI', value: '0', icon: MessageSquare, trend: 'neutral' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Selamat datang di LocalCompliance. Kelola compliance bisnis Anda dari sini.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="p-5 rounded-2xl bg-card border border-border hover:border-primary/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-2xl font-heading font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-heading font-semibold mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group relative p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm">{action.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{action.desc}</p>
                <ArrowRight className="absolute top-5 right-5 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Dev Mode Notice */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-sm">
        <p className="font-medium text-amber-700 dark:text-amber-400">⚠️ Mode Development</p>
        <p className="text-amber-600 dark:text-amber-500 mt-1">
          Supabase dan Database belum dikonfigurasi. Data ditampilkan dalam mock mode.
          Lihat <code className="px-1.5 py-0.5 rounded bg-amber-500/10 font-mono text-xs">.env.example</code> untuk setup.
        </p>
      </div>
    </div>
  );
}
