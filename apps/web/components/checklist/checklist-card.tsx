'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Loader2,
  MinusCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import type { ComplianceItem } from '@/hooks/use-checklist';

interface ChecklistCardProps {
  item: ComplianceItem;
  isUpdating: boolean;
  onStatusChange: (
    itemId: string,
    status: ComplianceItem['status'],
    notes?: string,
  ) => void;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Belum Dikerjakan',
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
  },
  in_progress: {
    label: 'Sedang Proses',
    icon: Clock,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
  },
  completed: {
    label: 'Selesai',
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  not_applicable: {
    label: 'Tidak Berlaku',
    icon: MinusCircle,
    color: 'text-gray-500 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
  },
};

const PRIORITY_BADGE = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const STATUS_OPTIONS: ComplianceItem['status'][] = [
  'pending',
  'in_progress',
  'completed',
  'not_applicable',
];

export function ChecklistCard({
  item,
  isUpdating,
  onStatusChange,
}: ChecklistCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const config = STATUS_CONFIG[item.status];
  const StatusIcon = config.icon;

  return (
    <div
      className={`rounded-xl border ${config.border} ${config.bg} transition-all hover:shadow-sm`}
    >
      {/* Main row */}
      <div className="flex items-start gap-3 p-4">
        {/* Status icon */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={isUpdating}
          className={`mt-0.5 flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${config.color}`}
          title="Ubah status"
        >
          {isUpdating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <StatusIcon className="w-5 h-5" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`text-sm font-medium ${
                item.status === 'completed'
                  ? 'line-through text-muted-foreground'
                  : 'text-foreground'
              }`}
            >
              {item.title}
            </h4>
            <span
              className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                PRIORITY_BADGE[item.priority]
              }`}
            >
              {item.priority}
            </span>
          </div>

          {/* Legal basis */}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {item.legalBasis.map((ref, i) => (
              <span
                key={i}
                className="text-[11px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-muted-foreground"
              >
                {ref.name}
              </span>
            ))}
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" /> Sembunyikan
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" /> Detail
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status dropdown */}
      {showMenu && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((status) => {
              const opt = STATUS_CONFIG[status];
              const OptIcon = opt.icon;
              return (
                <button
                  key={status}
                  onClick={() => {
                    onStatusChange(item.id, status);
                    setShowMenu(false);
                  }}
                  disabled={item.status === status}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    item.status === status
                      ? 'bg-primary/10 text-primary cursor-default'
                      : 'bg-background border border-border hover:bg-muted'
                  }`}
                >
                  <OptIcon className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-border/50 pt-3 mx-4">
          <p className="text-sm text-muted-foreground">{item.description}</p>

          {item.rule?.guidanceText && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
              <MessageSquare className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-foreground">{item.rule.guidanceText}</p>
            </div>
          )}

          {item.notes && (
            <p className="text-xs text-muted-foreground italic">
              Catatan: {item.notes}
            </p>
          )}

          {item.legalBasis.some((r) => r.url) && (
            <div className="flex gap-2">
              {item.legalBasis
                .filter((r) => r.url)
                .map((ref, i) => (
                  <a
                    key={i}
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {ref.name}
                  </a>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
