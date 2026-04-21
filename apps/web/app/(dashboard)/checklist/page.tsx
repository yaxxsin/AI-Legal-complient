'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
  ClipboardCheck,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  Filter,
  Loader2,
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';
  dueDate: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

export default function ChecklistPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchChecklist();
  }, []);

  async function fetchChecklist() {
    setIsLoading(true);
    try {
      const token = getCookie('access_token');
      const res = await fetch(`${API_URL}/compliance/checklist`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error('Gagal memuat checklist');

      const data = await res.json();
      setItems(data.data ?? []);
    } catch {
      setError('Gagal memuat checklist kepatuhan.');
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleStatus(id: string, newStatus: string) {
    try {
      const token = getCookie('access_token');
      await fetch(`${API_URL}/compliance/checklist/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: newStatus as ChecklistItem['status'] } : item,
        ),
      );
    } catch {
      // Silently fail — optimistic update will revert on refresh
    }
  }

  const filtered = filter === 'ALL' ? items : items.filter((i) => i.status === filter);
  const completedCount = items.filter((i) => i.status === 'COMPLETED').length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">
            Checklist Kepatuhan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Daftar kewajiban hukum yang harus dipenuhi bisnis Anda
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="p-5 rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Progress Kepatuhan</span>
          <span className="text-sm font-heading font-bold text-primary">
            {completedCount}/{items.length} ({progress}%)
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {['ALL', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {filterLabel(f)}
          </button>
        ))}
      </div>

      {/* Items */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-muted-foreground">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-warning" />
          <p>{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardCheck className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-medium">Tidak ada item</p>
          <p className="text-sm mt-1">
            {filter === 'ALL'
              ? 'Checklist belum tersedia. Selesaikan onboarding terlebih dahulu.'
              : 'Tidak ada item dengan filter ini.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <ChecklistCard
              key={item.id}
              item={item}
              onToggle={toggleStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Single checklist card */
function ChecklistCard({
  item,
  onToggle,
}: {
  item: ChecklistItem;
  onToggle: (id: string, status: string) => void;
}) {
  const nextStatus = item.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
      <button
        onClick={() => onToggle(item.id, nextStatus)}
        className="mt-0.5 shrink-0"
      >
        {item.status === 'COMPLETED' ? (
          <CheckCircle2 className="w-5 h-5 text-success" />
        ) : item.status === 'IN_PROGRESS' ? (
          <Clock className="w-5 h-5 text-warning" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${item.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''}`}>
          {item.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {item.description}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {item.category}
          </span>
          <PriorityBadge priority={item.priority} />
        </div>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    HIGH: 'bg-destructive/10 text-destructive',
    MEDIUM: 'bg-warning/10 text-warning',
    LOW: 'bg-muted text-muted-foreground',
  };

  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full ${styles[priority] ?? styles.LOW}`}>
      {priority}
    </span>
  );
}

function filterLabel(f: string): string {
  const labels: Record<string, string> = {
    ALL: 'Semua',
    NOT_STARTED: 'Belum',
    IN_PROGRESS: 'Proses',
    COMPLETED: 'Selesai',
  };
  return labels[f] ?? f;
}
