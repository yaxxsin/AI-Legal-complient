'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Upload,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Bookmark,
  Eye,
  X,
  CalendarClock,
  TrendingUp,
  FileCheck,
  Receipt,
  CalendarDays,
  ClipboardCheck,
} from 'lucide-react';
import { useProfileStore } from '@/stores/profile-store';
import { useProfiles } from '@/hooks/use-profiles';
import './oss-wizard.css';

/* ────── Types ────── */
interface OssStep {
  id: string;
  stepNumber: number;
  category: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  isRecurring: boolean;
  deadlineDay: number | null;
  deadlineMonth: number | null;
  currentPeriod: string | null;
  evidenceUrl: string | null;
  evidenceFileName: string | null;
  notes: string | null;
  completedAt: string | null;
}

interface OssRegistration {
  id: string;
  businessProfileId: string;
  status: string;
  complianceScore: number;
  nibNumber: string | null;
  nibIssuedDate: string | null;
  skNumber: string | null;
  steps: OssStep[];
  businessProfile?: {
    businessName: string;
    entityType: string;
  };
}

interface ScoreBreakdown {
  score: number;
  total: number;
  completed: number;
  breakdown: Array<{
    category: string;
    label: string;
    completed: number;
    total: number;
    percentage: number;
  }>;
}

interface Deadline {
  stepId: string;
  title: string;
  category: string;
  deadlineDate: string;
  daysUntil: number;
  status: string;
}

interface BusinessProfile {
  id: string;
  businessName: string;
  hasNib: boolean;
  nibNumber: string | null;
}

/* ────── Helpers ────── */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function isImageFile(url: string): boolean {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof FileCheck; color: string }> = {
  dokumen: { label: 'Kelengkapan Dokumen', icon: FileCheck, color: 'text-primary' },
  pajak_bulanan: { label: 'Pajak Bulanan', icon: Receipt, color: 'text-amber-500' },
  pajak_tahunan: { label: 'Pajak Tahunan', icon: CalendarDays, color: 'text-violet-500' },
};

/* ────── Main Component ────── */
export default function OssWizardClient() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [registration, setRegistration] = useState<OssRegistration | null>(null);
  const [scoreData, setScoreData] = useState<ScoreBreakdown | null>(null);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'checklist' | 'deadlines' | 'evidence'>('roadmap');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingStep, setUploadingStep] = useState<string | null>(null);

  // NIB activation form
  const [showActivation, setShowActivation] = useState(false);
  const [nibForm, setNibForm] = useState({ nibNumber: '', nibIssuedDate: '', skNumber: '' });
  const [isActivating, setIsActivating] = useState(false);

  // Use global profile store instead of hardcoded profiles[0]
  const { activeProfile: storeProfile, activeProfileId: storeProfileId } = useProfiles();

  const fetchRegistration = useCallback(async (profileId: string) => {
    const res = await fetch(`${API_URL}/oss-wizard/registration/${profileId}`, { credentials: 'include' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  }, []);

  const fetchScore = useCallback(async (profileId: string) => {
    const res = await fetch(`${API_URL}/oss-wizard/score/${profileId}`, { credentials: 'include' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  }, []);

  const fetchDeadlines = useCallback(async (profileId: string) => {
    const res = await fetch(`${API_URL}/oss-wizard/deadlines/${profileId}`, { credentials: 'include' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  }, []);

  const loadData = useCallback(async (profileId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Use profile from store
      const res = await fetch(`${API_URL}/business-profiles/${profileId}`, { credentials: 'include' });
      if (!res.ok) { setIsLoading(false); return; }
      const profJson = await res.json();
      const prof = profJson.data ?? profJson;
      setProfile(prof);

      const reg = await fetchRegistration(prof.id);
      setRegistration(reg);

      if (reg) {
        const [sc, dl] = await Promise.all([fetchScore(prof.id), fetchDeadlines(prof.id)]);
        setScoreData(sc);
        setDeadlines(dl);
      } else {
        setShowActivation(true);
      }
    } catch {
      setError('Gagal memuat data. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchRegistration, fetchScore, fetchDeadlines]);

  // Reload when active profile changes
  useEffect(() => {
    if (storeProfileId) {
      loadData(storeProfileId);
    }
  }, [storeProfileId, loadData]);

  /* ── Activate NIB ── */
  async function handleActivate() {
    if (!profile || !nibForm.nibNumber || !nibForm.nibIssuedDate) return;
    setIsActivating(true);
    try {
      const res = await fetch(`${API_URL}/oss-wizard/activate/${profile.id}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nibForm),
      });
      if (!res.ok) throw new Error('Aktivasi gagal');
      setShowActivation(false);
      if (storeProfileId) await loadData(storeProfileId);
    } catch {
      setError('Gagal mengaktivasi NIB. Periksa data dan coba lagi.');
    } finally {
      setIsActivating(false);
    }
  }

  /* ── Step actions ── */
  async function handleUpdateStep(stepId: string, payload: { status?: string; notes?: string }) {
    try {
      const res = await fetch(`${API_URL}/oss-wizard/step/${stepId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Update gagal');
      if (profile && storeProfileId) await loadData(storeProfileId);
    } catch {
      setError('Gagal memperbarui langkah.');
    }
  }

  async function handleUploadEvidence(stepId: string, file: File) {
    setUploadingStep(stepId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/oss-wizard/step/${stepId}/evidence`, {
        method: 'POST', credentials: 'include', body: formData,
      });
      if (!res.ok) throw new Error('Upload gagal');
      if (profile && storeProfileId) await loadData(storeProfileId);
    } catch {
      setError('Upload gagal. Pastikan file PDF/gambar dan max 5MB.');
    } finally {
      setUploadingStep(null);
    }
  }

  /* ── Render ── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24 animate-fade-in">
        <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
        <h2 className="text-xl font-heading font-bold mb-2">Profil Bisnis Belum Ada</h2>
        <p className="text-sm text-muted-foreground">
          Silakan lengkapi Onboarding terlebih dahulu untuk memulai roadmap kepatuhan.
        </p>
      </div>
    );
  }

  // NIB Activation Form
  if (showActivation || !registration) {
    return (
      <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Aktivasi NIB</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Masukkan data NIB dan SK Pengesahan dari Kemenkumham untuk memulai roadmap kepatuhan.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm text-primary font-medium flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              Sudah punya NIB dan SK Pengesahan?
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Platform ini akan memandu Anda langkah selanjutnya setelah mendapat NIB — mulai dari kelengkapan dokumen hingga kewajiban pajak berkala.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Nomor Induk Berusaha (NIB) *
              </label>
              <input
                type="text"
                placeholder="Contoh: 1234567890123"
                value={nibForm.nibNumber}
                onChange={(e) => setNibForm({ ...nibForm, nibNumber: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Tanggal Terbit NIB *
              </label>
              <input
                type="date"
                value={nibForm.nibIssuedDate}
                onChange={(e) => setNibForm({ ...nibForm, nibIssuedDate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Nomor SK Pengesahan Kemenkumham
              </label>
              <input
                type="text"
                placeholder="Contoh: AHU-0012345.AH.01.01.TAHUN 2026"
                value={nibForm.skNumber}
                onChange={(e) => setNibForm({ ...nibForm, skNumber: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleActivate}
            disabled={!nibForm.nibNumber || !nibForm.nibIssuedDate || isActivating}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {isActivating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Mulai Roadmap Kepatuhan
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </div>
    );
  }

  // ── Main Dashboard ──
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Roadmap Kepatuhan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Panduan pasca-NIB: kelengkapan dokumen, kewajiban pajak bulanan &amp; tahunan.
        </p>
      </div>

      {/* Score + NIB Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Compliance Score */}
        <div className="p-5 rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Compliance Score
            </h3>
            <span className={`text-2xl font-heading font-bold ${
              (scoreData?.score ?? 0) >= 80 ? 'text-emerald-500' :
              (scoreData?.score ?? 0) >= 50 ? 'text-amber-500' : 'text-destructive'
            }`}>
              {scoreData?.score ?? 0}%
            </span>
          </div>

          {/* Category breakdown */}
          <div className="space-y-2">
            {scoreData?.breakdown.map((b) => {
              const config = CATEGORY_CONFIG[b.category];
              return (
                <div key={b.category}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{b.label}</span>
                    <span className="font-medium">{b.completed}/{b.total}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${b.percentage}%`,
                        background: b.category === 'dokumen' ? 'hsl(var(--primary))' :
                          b.category === 'pajak_bulanan' ? 'hsl(36, 100%, 50%)' : 'hsl(262, 83%, 58%)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* NIB Info */}
        <div className="p-5 rounded-2xl border border-border bg-card">
          <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
            <Bookmark className="w-4 h-4 text-emerald-500" /> Data NIB
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Nomor NIB</span>
              <span className="font-mono font-medium">{registration.nibNumber ?? '-'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tanggal Terbit</span>
              <span>{registration.nibIssuedDate ? new Date(registration.nibIssuedDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</span>
            </div>
            {registration.skNumber && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">SK Kemenkumham</span>
                <span className="font-mono text-xs">{registration.skNumber}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={registration.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming deadlines alert */}
      {deadlines.length > 0 && (
        <DeadlineAlert deadlines={deadlines.filter((d) => d.daysUntil <= 14)} />
      )}

      {/* Tabs */}
      <div className="flex border-b border-border">
        {([
          { key: 'roadmap', label: 'Roadmap' },
          { key: 'checklist', label: 'Checklist KBLI' },
          { key: 'deadlines', label: `Deadline Pajak (${deadlines.length})` },
          { key: 'evidence', label: 'Galeri Bukti' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'oss-tab--active' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-destructive/20 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'roadmap' && (
        <>
          {/* Category filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {[{ key: 'all', label: 'Semua' }, ...Object.entries(CATEGORY_CONFIG).map(([k, v]) => ({ key: k, label: v.label }))].map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveCategory(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeCategory === f.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <RoadmapSteps
            steps={registration.steps.filter((s) => activeCategory === 'all' || s.category === activeCategory)}
            expandedStep={expandedStep}
            uploadingStep={uploadingStep}
            onToggle={(id) => setExpandedStep((prev) => (prev === id ? null : id))}
            onUpdateStep={handleUpdateStep}
            onUpload={handleUploadEvidence}
            onPreview={setPreviewUrl}
          />
        </>
      )}

      {activeTab === 'checklist' && (
        <ChecklistTab profileId={profile.id} />
      )}

      {activeTab === 'deadlines' && (
        <DeadlinesTab deadlines={deadlines} />
      )}

      {activeTab === 'evidence' && (
        <EvidenceGallery
          profileId={profile.id}
          onPreview={setPreviewUrl}
        />
      )}

      {/* Preview modal */}
      {previewUrl && <PreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}
    </div>
  );
}

/* ────── Sub-components ────── */

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    not_started: { label: 'Belum Mulai', cls: 'bg-muted text-muted-foreground' },
    in_progress: { label: 'Dalam Proses', cls: 'bg-primary/10 text-primary' },
    completed: { label: 'Selesai', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  };
  const c = config[status] ?? config.not_started;
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${c.cls}`}>{c.label}</span>;
}

/** Deadline alert banner for items due within 14 days */
function DeadlineAlert({ deadlines }: { deadlines: Deadline[] }) {
  if (deadlines.length === 0) return null;
  const urgent = deadlines.filter((d) => d.daysUntil <= 3);
  const soon = deadlines.filter((d) => d.daysUntil > 3);

  return (
    <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5">
      <h4 className="text-sm font-heading font-bold flex items-center gap-2 mb-2">
        <CalendarClock className="w-4 h-4 text-amber-500" />
        Deadline Mendatang ({deadlines.length})
      </h4>
      <div className="space-y-1.5">
        {urgent.map((d) => (
          <div key={d.stepId} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
            <span className="font-medium text-destructive">{d.title}</span>
            <span className="text-xs text-destructive/70 ml-auto">
              {d.daysUntil <= 0 ? 'JATUH TEMPO!' : `${d.daysUntil} hari lagi`}
            </span>
          </div>
        ))}
        {soon.map((d) => (
          <div key={d.stepId} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>{d.title}</span>
            <span className="text-xs text-muted-foreground ml-auto">{d.daysUntil} hari lagi</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Roadmap steps list, grouped by category */
function RoadmapSteps({
  steps,
  expandedStep,
  uploadingStep,
  onToggle,
  onUpdateStep,
  onUpload,
  onPreview,
}: {
  steps: OssStep[];
  expandedStep: string | null;
  uploadingStep: string | null;
  onToggle: (id: string) => void;
  onUpdateStep: (id: string, p: { status?: string; notes?: string }) => void;
  onUpload: (id: string, file: File) => void;
  onPreview: (url: string) => void;
}) {
  // Group by category
  const groups: Record<string, OssStep[]> = {};
  for (const step of steps) {
    if (!groups[step.category]) groups[step.category] = [];
    groups[step.category].push(step);
  }

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([cat, catSteps]) => {
        const config = CATEGORY_CONFIG[cat];
        const Icon = config?.icon ?? FileCheck;
        const completed = catSteps.filter((s) => s.status === 'completed').length;

        return (
          <div key={cat}>
            {/* Category header */}
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`w-4 h-4 ${config?.color ?? 'text-primary'}`} />
              <h3 className="text-sm font-heading font-bold">{config?.label ?? cat}</h3>
              <span className="text-xs text-muted-foreground ml-auto">
                {completed}/{catSteps.length} selesai
              </span>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              {catSteps.map((step) => (
                <StepCard
                  key={step.id}
                  step={step}
                  isExpanded={expandedStep === step.id}
                  isUploading={uploadingStep === step.id}
                  onToggle={() => onToggle(step.id)}
                  onUpdate={onUpdateStep}
                  onUpload={onUpload}
                  onPreview={onPreview}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Single step card */
function StepCard({
  step,
  isExpanded,
  isUploading,
  onToggle,
  onUpdate,
  onUpload,
  onPreview,
}: {
  step: OssStep;
  isExpanded: boolean;
  isUploading: boolean;
  onToggle: () => void;
  onUpdate: (id: string, p: { status?: string }) => void;
  onUpload: (id: string, file: File) => void;
  onPreview: (url: string) => void;
}) {
  return (
    <div className={`rounded-xl border bg-card transition-all ${
      step.status === 'completed' ? 'border-emerald-500/20' : 'border-border hover:border-primary/20'
    }`}>
      <button onClick={onToggle} className="w-full text-left p-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            step.status === 'completed'
              ? 'bg-emerald-500 text-white'
              : 'bg-muted border-2 border-border text-muted-foreground'
          }`}>
            {step.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{step.stepNumber}</span>}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`text-sm font-medium ${step.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                {step.title}
              </p>
              {step.isRecurring && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                  Berkala
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{step.description}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {step.evidenceUrl && <FileText className="w-3.5 h-3.5 text-emerald-500" />}
            {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 oss-preview-enter">
          <div className="flex flex-wrap items-center gap-2">
            {step.status !== 'completed' ? (
              <button
                onClick={() => onUpdate(step.id, { status: 'completed' })}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-medium transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Tandai Selesai
              </button>
            ) : (
              <button
                onClick={() => onUpdate(step.id, { status: 'pending' })}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 font-medium transition-colors"
              >
                <Circle className="w-3.5 h-3.5" /> Batal Selesai
              </button>
            )}

            <label className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border bg-muted/50 cursor-pointer hover:bg-muted font-medium transition-colors">
              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Upload Bukti
              <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" disabled={isUploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(step.id, f); }}
              />
            </label>

            {step.deadlineDay && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                <CalendarClock className="w-3 h-3" />
                Deadline: Tgl {step.deadlineDay}{step.deadlineMonth ? ` bulan ${step.deadlineMonth}` : ' /bulan'}
              </span>
            )}
          </div>

          {step.evidenceUrl && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
              {isImageFile(step.evidenceUrl) ? (
                <img src={step.evidenceUrl} alt="Evidence" className="oss-evidence-thumb" onClick={() => onPreview(step.evidenceUrl!)} />
              ) : (
                <div className="oss-evidence-thumb flex items-center justify-center bg-muted cursor-pointer" onClick={() => onPreview(step.evidenceUrl!)}>
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{step.evidenceFileName ?? 'Dokumen'}</p>
                <p className="text-xs text-muted-foreground">
                  {step.completedAt ? new Date(step.completedAt).toLocaleDateString('id-ID') : '-'}
                </p>
              </div>
              <button onClick={() => onPreview(step.evidenceUrl!)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Eye className="w-4 h-4 text-primary" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Deadlines tab — Calendar view */
function DeadlinesTab({ deadlines }: { deadlines: Deadline[] }) {
  if (deadlines.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <CalendarClock className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
        <p className="font-medium">Tidak Ada Deadline Mendatang</p>
        <p className="text-sm mt-1">Semua kewajiban pajak sudah dilunasi 🎉</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {deadlines.map((d) => {
        const isUrgent = d.daysUntil <= 7;
        const isOverdue = d.daysUntil <= 0;

        return (
          <div key={d.stepId} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
            isOverdue ? 'border-destructive/30 bg-destructive/5' :
            isUrgent ? 'border-amber-500/30 bg-amber-500/5' :
            'border-border bg-card'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isOverdue ? 'bg-destructive/10 text-destructive' :
              isUrgent ? 'bg-amber-500/10 text-amber-500' :
              'bg-muted text-muted-foreground'
            }`}>
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{d.title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(d.deadlineDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-heading font-bold ${
                isOverdue ? 'text-destructive' : isUrgent ? 'text-amber-500' : 'text-muted-foreground'
              }`}>
                {isOverdue ? 'JATUH TEMPO' : `${d.daysUntil} hari`}
              </p>
              {d.status === 'completed' && (
                <span className="text-[10px] text-emerald-500 flex items-center gap-1 justify-end">
                  <CheckCircle2 className="w-3 h-3" /> Lunas
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Evidence gallery tab */
function EvidenceGallery({ profileId, onPreview }: { profileId: string; onPreview: (url: string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/oss-wizard/evidence/${profileId}`, { credentials: 'include' });
        if (res.ok) { const json = await res.json(); setItems(json.data ?? []); }
      } finally { setLoading(false); }
    })();
  }, [profileId]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <ImageIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
        <p className="font-medium">Belum Ada Bukti</p>
        <p className="text-sm mt-1">Upload bukti dokumen pada setiap langkah roadmap.</p>
      </div>
    );
  }

  return (
    <div className="oss-gallery-grid">
      {items.map((item: any) => (
        <div
          key={item.id}
          className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all cursor-pointer"
          onClick={() => onPreview(item.evidenceUrl)}
        >
          <div className="h-36 bg-muted/50 flex items-center justify-center overflow-hidden">
            {isImageFile(item.evidenceUrl) ? (
              <img src={item.evidenceUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
            ) : (
              <FileText className="w-10 h-10 text-muted-foreground/50" />
            )}
          </div>
          <div className="p-3">
            <p className="text-xs font-medium truncate">{item.title}</p>
            <p className="text-[11px] text-muted-foreground truncate">{item.evidenceFileName}</p>
            <div className="flex items-center gap-1 mt-1.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">{item.completedAt ? new Date(item.completedAt).toLocaleDateString('id-ID') : '-'}</span>
            </div>
          </div>
          <div className="absolute top-2 left-2 bg-background/80 backdrop-blur text-[10px] font-bold px-2 py-0.5 rounded-full border border-border">
            {CATEGORY_CONFIG[item.category]?.label.split(' ')[0] ?? 'Dokumen'}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Full-screen preview modal */
function PreviewModal({ url, onClose }: { url: string; onClose: () => void }) {
  const isImg = isImageFile(url);
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="relative max-w-4xl w-full max-h-[90vh] bg-card rounded-2xl overflow-hidden border border-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b border-border">
          <span className="text-sm font-medium">Preview Dokumen</span>
          <div className="flex items-center gap-2">
            <a href={url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
              <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        </div>
        <div className="p-4 max-h-[calc(90vh-60px)] overflow-auto">
          {isImg ? (
            <img src={url} alt="Preview" className="max-w-full h-auto mx-auto rounded-lg" />
          ) : (
            <iframe src={url} className="w-full h-[70vh] rounded-lg border-0" title="Document Preview" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ────── Checklist KBLI Tab (merged from /checklist) ────── */

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'pending' | 'completed';
  evidenceUrl: string | null;
  notes: string | null;
  rule: { category: { name: string } };
}

function ChecklistTab({ profileId }: { profileId: string }) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [checklistFilter, setChecklistFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchChecklist();
  }, [profileId]);

  async function fetchChecklist() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/compliance-items/business-profile/${profileId}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        setItems(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function generateChecklist() {
    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/compliance-items/generate/${profileId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        setItems(json.data ?? []);
      }
    } finally {
      setGenerating(false);
    }
  }

  async function uploadChecklistEvidence(itemId: string, file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/compliance-items/${itemId}/evidence`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (res.ok) {
        const json = await res.json();
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? { ...item, status: 'completed', evidenceUrl: json.data.evidenceUrl }
              : item,
          ),
        );
      }
    } catch {
      alert('Upload gagal. Pastikan file PDF/gambar dan max 5MB.');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <ClipboardCheck className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
        <p className="font-medium">Checklist KBLI Belum Di-generate</p>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Generate checklist kewajiban hukum berdasarkan KBLI bisnis Anda.
        </p>
        <button
          onClick={generateChecklist}
          disabled={generating}
          className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2 mx-auto"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
          Generate by KBLI
        </button>
      </div>
    );
  }

  const completedCount = items.filter((i) => i.status === 'completed').length;
  const progress = Math.round((completedCount / items.length) * 100);
  const filtered = checklistFilter === 'ALL' ? items : items.filter((i) => i.status === checklistFilter);

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progress Checklist</span>
          <span className="text-sm font-heading font-bold text-primary">
            {completedCount}/{items.length} ({progress}%)
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {[
          { key: 'ALL', label: 'Semua' },
          { key: 'pending', label: 'Tertunda' },
          { key: 'completed', label: 'Selesai' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setChecklistFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              checklistFilter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-2">
        {filtered.map((item) => (
          <ChecklistItemCard key={item.id} item={item} onUpload={uploadChecklistEvidence} />
        ))}
      </div>
    </div>
  );
}

/** Single KBLI checklist item card */
function ChecklistItemCard({
  item,
  onUpload,
}: {
  item: ChecklistItem;
  onUpload: (id: string, file: File) => void;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const ext = item.evidenceUrl?.split('?')[0].split('.').pop()?.toLowerCase();
  const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '');
  const isPdf = ext === 'pdf';

  const priorityStyles: Record<string, string> = {
    HIGH: 'bg-destructive/10 text-destructive',
    MEDIUM: 'bg-amber-500/10 text-amber-500',
    LOW: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {item.status === 'completed' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <Clock className="w-5 h-5 text-amber-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm ${item.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
            {item.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-lg">{item.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${priorityStyles[item.priority] ?? priorityStyles.LOW}`}>
              {item.priority}
            </span>
            <label className="text-xs px-3 py-1.5 rounded-lg border border-border bg-muted/50 cursor-pointer hover:bg-muted font-medium flex items-center gap-1.5 transition-colors">
              <UploadCloud className="w-3.5 h-3.5" />
              Upload Bukti
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUpload(item.id, f);
                }}
              />
            </label>
            {item.evidenceUrl && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-primary flex items-center gap-1 hover:bg-primary/10 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> {showPreview ? 'Tutup' : 'Lihat Bukti'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showPreview && item.evidenceUrl && (
        <div className="w-full pt-3 border-t border-border animate-fade-in">
          <div className="bg-muted/30 rounded-lg p-2 border border-border">
            {isImg ? (
              <img src={item.evidenceUrl} alt="Evidence" className="max-w-full h-auto max-h-[400px] object-contain rounded-md mx-auto" loading="lazy" />
            ) : isPdf ? (
              <iframe src={item.evidenceUrl} className="w-full h-[400px] rounded-md border-0" title="Evidence PDF" />
            ) : (
              <div className="py-6 text-center text-muted-foreground text-sm">
                <FileText className="w-8 h-8 opacity-50 mx-auto mb-2" />
                <a href={item.evidenceUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Download File</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
