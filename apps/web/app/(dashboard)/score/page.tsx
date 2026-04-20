'use client';

import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ClipboardCheck,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { useChecklist } from '@/hooks/use-checklist';
import { ScoreOverview } from '@/components/checklist/score-overview';
import type { ComplianceItem } from '@/hooks/use-checklist';

/** Weighted score: critical=4x, high=3x, medium=2x, low=1x */
function calcWeightedScore(items: ComplianceItem[]): number {
  const weights: Record<string, number> = {
    critical: 4, high: 3, medium: 2, low: 1,
  };
  let totalWeight = 0;
  let completedWeight = 0;

  for (const item of items) {
    if (item.status === 'not_applicable') continue;
    const w = weights[item.priority] ?? 1;
    totalWeight += w;
    if (item.status === 'completed') completedWeight += w;
  }

  return totalWeight > 0
    ? Math.round((completedWeight / totalWeight) * 1000) / 10
    : 0;
}

function getScoreColor(score: number) {
  if (score >= 91) return { label: 'Excellent', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' };
  if (score >= 71) return { label: 'Baik', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' };
  if (score >= 41) return { label: 'Perlu Perbaikan', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' };
  return { label: 'Kritis', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' };
}

// Mock trend data (30 days)
const TREND_DATA = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const base = 15 + i * 0.5;
  return {
    date: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
    score: Math.min(100, Math.round(base + Math.random() * 5)),
  };
});

function TrendChart({ data }: { data: typeof TREND_DATA }) {
  const max = Math.max(...data.map((d) => d.score), 100);
  const min = Math.min(...data.map((d) => d.score), 0);
  const range = max - min || 1;
  const h = 120;
  const w = 100;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d.score - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');

  // Fill area
  const areaPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <div className="relative">
      <svg viewBox={`-2 -5 ${w + 4} ${h + 15}`} className="w-full h-40">
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <polygon
          points={areaPoints}
          fill="url(#trendGrad)"
          className="text-primary"
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        />
        {/* Latest dot */}
        {data.length > 0 && (
          <circle
            cx={(w).toString()}
            cy={(h - ((data[data.length - 1].score - min) / range) * h).toString()}
            r="3"
            fill="currentColor"
            className="text-primary"
          />
        )}
      </svg>
      {/* X-axis labels */}
      <div className="flex justify-between px-1 text-[10px] text-muted-foreground -mt-1">
        <span>{data[0]?.date}</span>
        <span>{data[Math.floor(data.length / 2)]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export default function ScoreDashboardPage() {
  const { groups, score, loading } = useChecklist();

  // Flatten all items
  const allItems = groups.flatMap((g) => g.items);
  const weightedScore = calcWeightedScore(allItems);
  const scoreInfo = getScoreColor(weightedScore);

  // Priority actions: top 5 pending critical/high items
  const priorityActions = allItems
    .filter((i) => i.status === 'pending' || i.status === 'in_progress')
    .sort((a, b) => {
      const w: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (w[a.priority] ?? 9) - (w[b.priority] ?? 9);
    })
    .slice(0, 5);

  // Status summary
  const statusSummary = {
    completed: allItems.filter((i) => i.status === 'completed').length,
    in_progress: allItems.filter((i) => i.status === 'in_progress').length,
    pending: allItems.filter((i) => i.status === 'pending').length,
    not_applicable: allItems.filter((i) => i.status === 'not_applicable').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Compliance Score Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Pantau skor kepatuhan dan tindakan prioritas bisnis Anda.
        </p>
      </div>

      {/* Top row: Weighted Score + Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weighted Score Card */}
        <div className={`rounded-2xl border ${scoreInfo.border} ${scoreInfo.bg} p-6`}>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            Skor Tertimbang (Weighted)
          </h2>
          <div className="flex items-end gap-3">
            <span className={`text-5xl font-heading font-bold ${scoreInfo.color}`}>
              {weightedScore}%
            </span>
            <span className={`text-sm font-medium ${scoreInfo.color} pb-2`}>
              {scoreInfo.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Critical (4×) · High (3×) · Medium (2×) · Low (1×)
          </p>

          {/* Status bars */}
          <div className="grid grid-cols-4 gap-3 mt-5">
            {[
              { label: 'Selesai', count: statusSummary.completed, color: 'bg-emerald-500', icon: CheckCircle2 },
              { label: 'Proses', count: statusSummary.in_progress, color: 'bg-blue-500', icon: Clock },
              { label: 'Pending', count: statusSummary.pending, color: 'bg-amber-500', icon: AlertTriangle },
              { label: 'N/A', count: statusSummary.not_applicable, color: 'bg-gray-400', icon: ClipboardCheck },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="text-center">
                  <div className={`w-8 h-8 mx-auto rounded-lg ${s.color} flex items-center justify-center mb-1`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-lg font-bold">{s.count}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Score Overview (reuse from Phase 09) */}
        {score && <ScoreOverview score={score} />}
      </div>

      {/* Trend Chart */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-semibold">Tren Skor 30 Hari</h2>
          </div>
          <span className="text-xs text-muted-foreground">Mock data</span>
        </div>
        <TrendChart data={TREND_DATA} />
      </div>

      {/* Priority Actions */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="font-heading font-semibold">Priority Actions</h2>
          </div>
          <Link
            href="/checklist"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Lihat semua <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {priorityActions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-medium text-sm">Semua item sudah selesai!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {priorityActions.map((item, idx) => {
              const prioColor: Record<string, string> = {
                critical: 'text-red-600 bg-red-100 dark:bg-red-900/30',
                high: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
                medium: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
                low: 'text-gray-600 bg-gray-100 dark:bg-gray-800',
              };
              return (
                <Link
                  key={item.id}
                  href="/checklist"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                >
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.category.icon} {item.category.name}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      prioColor[item.priority]
                    }`}
                  >
                    {item.priority}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Dev Mode Notice */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-sm">
        <p className="font-medium text-amber-700 dark:text-amber-400">⚠️ Mode Development</p>
        <p className="text-amber-600 dark:text-amber-500 mt-1">
          Data menggunakan mock. Skor trend dan history akan tersedia setelah database terhubung.
        </p>
      </div>
    </div>
  );
}
