'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  Loader2,
  UploadCloud,
  FileText,
  Lightbulb,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface BusinessProfile {
  id: string;
  businessName: string;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'pending' | 'completed';
  evidenceUrl: string | null;
  notes: string | null;
  rule: {
    category: {
      name: string;
    }
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

export default function ChecklistPage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const token = getCookie('access_token');
      // 1. Fetch profile
      const profRes = await fetch(`${API_URL}/business-profiles`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!profRes.ok) throw new Error('Gagal memuat profil bisnis');
      const profData = await profRes.json();
      
      const profiles = Array.isArray(profData) ? profData : profData.data || [];
      const bp = profiles?.[0];
      if (!bp) {
        setItems([]);
        setIsLoading(false);
        return;
      }
      setProfile(bp);

      // 2. Fetch checklist items
      const itemRes = await fetch(`${API_URL}/compliance-items/business-profile/${bp.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!itemRes.ok) throw new Error('Gagal memuat checklist kepatuhan');
      
      const itemData = await itemRes.json();
      setItems(itemData.data ?? []);
    } catch {
      setError('Gagal mengambil data sistem.');
    } finally {
      setIsLoading(false);
    }
  }

  async function generateChecklist() {
    if (!profile) return;
    setIsLoading(true);
    try {
      const token = getCookie('access_token');
      const res = await fetch(`${API_URL}/compliance-items/generate/${profile.id}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Gagal generate checklist');
      const data = await res.json();
      setItems(data.data ?? []);
    } catch {
      setError('Gagal di-generate.');
    } finally {
      setIsLoading(false);
    }
  }

  async function uploadEvidence(itemId: string, file: File) {
    if (!file) return;
    try {
      const token = getCookie('access_token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/compliance-items/${itemId}/evidence`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload gagal');
      }

      const resData = await res.json();
      
      // Update local state
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, status: 'completed', evidenceUrl: resData.data.evidenceUrl } : item,
        ),
      );
    } catch (err) {
      alert('Upload failed. Must be PDF/Image and max 5MB.');
    }
  }

  const filtered = filter === 'ALL' ? items : items.filter((i) => i.status === filter);
  const completedCount = items.filter((i) => i.status === 'completed').length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">
            Checklist Kewajiban Hukum (OSS/NIB)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mendukung semua paket (termasuk Free). Upload NIB, NPWP, dan KBLI-based checklist.
          </p>
        </div>
        {items.length === 0 && profile && !isLoading && (
          <button
            onClick={generateChecklist}
            className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90"
          >
            Generate by KBLI
          </button>
        )}
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
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
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {['ALL', 'pending', 'completed'].map((f) => (
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

      {/* Analysis Summary & Suggestions */}
      {items.length > 0 && (
        <AnalysisSummary items={items} />
      )}

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
      ) : !profile ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardCheck className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-medium">Profil Bisnis Belum Ada</p>
          <p className="text-sm mt-1">
            Silakan siapkan profil bisnis Anda (Onboarding) untuk memunculkan Checklist Kewajiban Hukum.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardCheck className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-medium">Tidak ada item</p>
          <p className="text-sm mt-1">
            {filter === 'ALL'
              ? 'Checklist belum di-generate. Silahkan klik Generate by KBLI.'
              : 'Tidak ada item dengan filter ini.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <ChecklistCard
              key={item.id}
              item={item}
              onUpload={uploadEvidence}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Analysis Summary — shows onboarding results + next steps */
function AnalysisSummary({ items }: { items: ChecklistItem[] }) {
  const autoVerified = items.filter(i => i.notes?.startsWith('Auto-verified'));
  const pendingItems = items.filter(i => i.status === 'pending');
  const highPrioPending = pendingItems.filter(i => i.priority === 'HIGH');

  if (autoVerified.length === 0 && pendingItems.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Detected Documents Summary */}
      {autoVerified.length > 0 && (
        <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
          <h3 className="text-sm font-heading font-bold flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Hasil Analisis Onboarding
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {autoVerified.map(item => (
              <div key={item.id} className="flex items-center gap-2 text-sm bg-emerald-500/10 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">{item.title}</span>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground truncate">{item.notes.replace('Auto-verified dari onboarding. ', '')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps Suggestions */}
      {pendingItems.length > 0 && (
        <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5">
          <h3 className="text-sm font-heading font-bold flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Langkah Selanjutnya ({highPrioPending.length > 0 ? `${highPrioPending.length} prioritas tinggi` : `${pendingItems.length} item tersisa`})
          </h3>
          <div className="space-y-2">
            {(highPrioPending.length > 0 ? highPrioPending : pendingItems).slice(0, 4).map(item => (
              <div key={item.id} className="flex items-start gap-2 text-sm bg-amber-500/10 rounded-lg px-3 py-2">
                <ArrowRight className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">{item.title}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description.substring(0, 120)}{item.description.length > 120 ? '...' : ''}</p>
                </div>
              </div>
            ))}
            {pendingItems.length > 4 && (
              <p className="text-xs text-muted-foreground pl-6">...dan {pendingItems.length - 4} item lainnya</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Single checklist card */
function ChecklistCard({
  item,
  onUpload,
}: {
  item: ChecklistItem;
  onUpload: (id: string, file: File) => void;
}) {
  const [showPreview, setShowPreview] = useState(false);
  
  const ext = item.evidenceUrl?.split('?')[0].split('.').pop()?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '');
  const isPdf = ext === 'pdf';

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl border border-border bg-card overscroll-contain hover:border-primary/20 transition-colors">
      <div className="flex items-start gap-4">
        <div className="mt-0.5 shrink-0">
          {item.status === 'completed' ? (
            <CheckCircle2 className="w-5 h-5 text-success" />
          ) : (
            <Clock className="w-5 h-5 text-warning" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <p className={`font-medium text-sm ${item.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                {item.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-lg">
                {item.description}
              </p>
            </div>
            {item.status === 'completed' && item.evidenceUrl && (
              <div className="flex flex-col gap-2 shrink-0">
                 <button 
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs text-primary flex items-center justify-center gap-1 hover:bg-primary/20 bg-primary/10 px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> {showPreview ? 'Tutup Bukti' : 'Lihat Bukti'}
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <PriorityBadge priority={item.priority} />
            </div>

            <label className="text-xs px-3 py-1.5 flex-shrink-0 rounded-lg border border-border bg-muted/50 cursor-pointer hover:bg-muted font-medium flex items-center gap-1.5 transition-colors">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Bukti</span>
              <input 
                type="file" 
                className="hidden" 
                accept=".pdf,.png,.jpg,.jpeg" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(item.id, file);
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Inline Preview Section */}
      {showPreview && item.evidenceUrl && (
        <div className="w-full mt-2 pt-4 border-t border-border animate-fade-in">
          <div className="bg-muted/30 rounded-lg p-2 border border-border">
            {isImage ? (
              <img 
                src={item.evidenceUrl} 
                alt="Evidence Preview" 
                className="max-w-full h-auto max-h-[500px] object-contain rounded-md mx-auto"
                loading="lazy"
              />
            ) : isPdf ? (
              <iframe 
                src={item.evidenceUrl} 
                className="w-full h-[500px] rounded-md border-0"
                title="Evidence PDF Preview"
              />
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm flex flex-col items-center">
                 <FileText className="w-8 h-8 opacity-50 mb-2" />
                 <p>Format file ini tidak dapat di-preview secara langsung.</p>
                 <a href={item.evidenceUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline mt-2 inline-block">Download File</a>
              </div>
            )}
          </div>
        </div>
      )}
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
    pending: 'Tertunda',
    completed: 'Selesai',
  };
  return labels[f] ?? f;
}
