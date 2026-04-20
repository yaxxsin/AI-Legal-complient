'use client';

import type { ComplianceScore } from '@/hooks/use-checklist';
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Target,
} from 'lucide-react';

interface ScoreOverviewProps {
  score: ComplianceScore;
}

function ScoreRing({ value }: { value: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color =
    value >= 80
      ? 'text-emerald-500'
      : value >= 50
        ? 'text-amber-500'
        : 'text-red-500';

  return (
    <div className="relative w-28 h-28">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-muted/20"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${color} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${color}`}>
          {value}%
        </span>
        <span className="text-[10px] text-muted-foreground">Skor</span>
      </div>
    </div>
  );
}

export function ScoreOverview({ score }: ScoreOverviewProps) {
  const stats = [
    {
      label: 'Item Selesai',
      value: `${score.completedItems} / ${score.totalItems}`,
      icon: CheckCircle2,
      color: 'text-emerald-600',
    },
    {
      label: 'Perlu Tindakan',
      value: String(score.totalItems - score.completedItems),
      icon: Target,
      color: 'text-blue-600',
    },
    {
      label: 'Critical Pending',
      value: String(score.criticalPending),
      icon: AlertTriangle,
      color: score.criticalPending > 0 ? 'text-red-600' : 'text-emerald-600',
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="font-heading font-semibold">Skor Compliance</h2>
      </div>

      <div className="flex items-center gap-8">
        <ScoreRing value={score.overallScore} />

        <div className="flex-1 space-y-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                </div>
                <span className="text-sm font-semibold">{s.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category bars */}
      <div className="mt-5 pt-4 border-t border-border space-y-2.5">
        {score.categoryScores.map((cat) => (
          <div key={cat.categoryId}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">{cat.name}</span>
              <span className="font-medium">
                {cat.completed}/{cat.total} ({cat.score}%)
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  cat.score >= 80
                    ? 'bg-emerald-500'
                    : cat.score >= 50
                      ? 'bg-amber-500'
                      : 'bg-red-400'
                }`}
                style={{ width: `${cat.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
