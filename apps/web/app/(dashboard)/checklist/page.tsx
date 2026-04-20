'use client';

import { useState } from 'react';
import {
  ClipboardCheck,
  Filter,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useChecklist } from '@/hooks/use-checklist';
import { ChecklistCard } from '@/components/checklist/checklist-card';
import { ScoreOverview } from '@/components/checklist/score-overview';
import type { ComplianceItem } from '@/hooks/use-checklist';

type FilterStatus = 'all' | ComplianceItem['status'];
type FilterPriority = 'all' | ComplianceItem['priority'];

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Belum Dikerjakan' },
  { value: 'in_progress', label: 'Sedang Proses' },
  { value: 'completed', label: 'Selesai' },
  { value: 'not_applicable', label: 'Tidak Berlaku' },
];

const PRIORITY_FILTERS: { value: FilterPriority; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export default function ChecklistPage() {
  const { groups, score, loading, updating, updateStatus, refresh } =
    useChecklist(); // No profileId = mock mode
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Apply filters
  const filteredGroups = groups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        if (statusFilter !== 'all' && item.status !== statusFilter)
          return false;
        if (priorityFilter !== 'all' && item.priority !== priorityFilter)
          return false;
        return true;
      }),
    }))
    .filter((g) => g.items.length > 0);

  // Count stats
  const totalItems = groups.reduce((acc, g) => acc + g.items.length, 0);
  const pendingCount = groups.reduce(
    (acc, g) => acc + g.items.filter((i) => i.status === 'pending').length,
    0,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-primary" />
            Compliance Checklist
          </h1>
          <p className="text-muted-foreground mt-1">
            {totalItems} item · {pendingCount} perlu tindakan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
              showFilters
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'border-border hover:bg-muted'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 rounded-xl border border-border bg-card space-y-3 animate-in slide-in-from-top-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Status
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === f.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Prioritas
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITY_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setPriorityFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    priorityFilter === f.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Score Overview */}
      {score && <ScoreOverview score={score} />}

      {/* Grouped Checklist */}
      <div className="space-y-6">
        {filteredGroups.map((group) => (
          <div key={group.category.id}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{group.category.icon}</span>
              <h2 className="font-heading font-semibold">
                {group.category.name}
              </h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {group.items.length}
              </span>
            </div>
            <div className="space-y-2">
              {group.items.map((item) => (
                <ChecklistCard
                  key={item.id}
                  item={item}
                  isUpdating={updating === item.id}
                  onStatusChange={updateStatus}
                />
              ))}
            </div>
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Tidak ada item yang cocok</p>
            <p className="text-sm mt-1">Coba ubah filter untuk melihat item lainnya.</p>
          </div>
        )}
      </div>
    </div>
  );
}
