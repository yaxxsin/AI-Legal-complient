'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Database, Plus, Pencil, Trash2, Loader2, Search,
  X, ExternalLink, Zap, CheckCircle2, Clock,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/* ============================================
   Types
   ============================================ */

interface Regulation {
  id: string;
  title: string;
  regulationNumber: string;
  type: string;
  issuedBy: string;
  issuedDate: string;
  effectiveDate: string;
  status: string;
  sectorTags: string[];
  sourceUrl: string;
  contentRaw: string;
  pineconeIndexed: boolean;
  chunkCount: number | null;
  createdAt: string;
}

interface PaginatedResponse {
  data: Regulation[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface RegFormData {
  title: string;
  regulationNumber: string;
  type: string;
  issuedBy: string;
  issuedDate: string;
  effectiveDate: string;
  status: string;
  sectorTags: string;
  sourceUrl: string;
  contentRaw: string;
}

const EMPTY_FORM: RegFormData = {
  title: '',
  regulationNumber: '',
  type: 'UU',
  issuedBy: '',
  issuedDate: '',
  effectiveDate: '',
  status: 'Active',
  sectorTags: '',
  sourceUrl: '',
  contentRaw: '',
};

const REG_TYPES = [
  'UU', 'PP', 'Perpres', 'Permen', 'Perda', 'SE', 'Kepmen', 'Inpres', 'Peraturan',
];

const STATUS_OPTIONS = ['Active', 'Amended', 'Revoked'];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
const PAGE_SIZE = 10;

/* ============================================
   Main Component
   ============================================ */

export default function AdminRegulationsPage() {
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingReg, setEditingReg] = useState<Regulation | null>(null);
  const [form, setForm] = useState<RegFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [indexingId, setIndexingId] = useState<string | null>(null);

  const opts: RequestInit = { credentials: 'include' };

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (searchDebounced) params.set('search', searchDebounced);

      const res = await fetch(`${API_URL}/regulations?${params}`, opts);
      if (res.ok) {
        const json: PaginatedResponse = await res.json();
        setRegulations(json.data);
        setMeta({ total: json.meta.total, page: json.meta.page, totalPages: json.meta.totalPages });
      }
    } catch (e) {
      console.error('Failed to fetch regulations:', e);
    } finally {
      setIsLoading(false);
    }
  }, [searchDebounced]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  /* ── Helpers ── */
  function formatDate(iso: string): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  function openCreate() {
    setEditingReg(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(reg: Regulation) {
    setEditingReg(reg);
    setForm({
      title: reg.title,
      regulationNumber: reg.regulationNumber,
      type: reg.type,
      issuedBy: reg.issuedBy,
      issuedDate: reg.issuedDate ? reg.issuedDate.substring(0, 10) : '',
      effectiveDate: reg.effectiveDate ? reg.effectiveDate.substring(0, 10) : '',
      status: reg.status,
      sectorTags: Array.isArray(reg.sectorTags) ? reg.sectorTags.join(', ') : '',
      sourceUrl: reg.sourceUrl,
      contentRaw: reg.contentRaw,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title || !form.regulationNumber || !form.issuedBy) return;
    setIsSaving(true);
    try {
      const body = {
        title: form.title,
        regulationNumber: form.regulationNumber,
        type: form.type,
        issuedBy: form.issuedBy,
        issuedDate: form.issuedDate,
        effectiveDate: form.effectiveDate,
        status: form.status,
        sectorTags: form.sectorTags
          ? form.sectorTags.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        sourceUrl: form.sourceUrl,
        contentRaw: form.contentRaw,
      };

      const url = editingReg
        ? `${API_URL}/regulations/${editingReg.id}`
        : `${API_URL}/regulations`;
      const method = editingReg ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        ...opts,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowModal(false);
        await fetchData(meta.page);
      }
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus regulasi ini? Tindakan tidak bisa dibatalkan.')) return;
    setDeleteId(id);
    try {
      await fetch(`${API_URL}/regulations/${id}`, { method: 'DELETE', ...opts });
      await fetchData(meta.page);
    } catch (e) {
      console.error('Delete failed:', e);
    } finally {
      setDeleteId(null);
    }
  }

  async function handleIndex(id: string) {
    setIndexingId(id);
    try {
      await fetch(`${API_URL}/regulations/${id}/index`, { method: 'POST', ...opts });
      await fetchData(meta.page);
    } catch (e) {
      console.error('Index failed:', e);
    } finally {
      setIndexingId(null);
    }
  }

  function updateForm(field: keyof RegFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const statusColor = (s: string) => {
    if (s === 'Active') return 'text-emerald-500 bg-emerald-500/10';
    if (s === 'Amended') return 'text-amber-500 bg-amber-500/10';
    return 'text-red-500 bg-red-500/10';
  };

  /* ============================================
     Render
     ============================================ */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Database className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold">Regulations DB</h1>
            <p className="text-muted-foreground mt-1">
              Kelola database regulasi hukum ({meta.total} regulasi)
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tambah Regulasi
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari judul atau nomor regulasi..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : regulations.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-6 text-center text-muted-foreground py-12">
            {meta.total === 0
              ? 'Belum ada regulasi. Klik "Tambah Regulasi" untuk membuat.'
              : 'Tidak ada regulasi yang cocok dengan pencarian.'}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Regulasi</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipe</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Penerbit</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Index</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground w-[120px]">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {regulations.map((reg) => (
                    <tr key={reg.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5 max-w-[300px]">
                        <p className="font-semibold text-foreground line-clamp-1">{reg.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">{reg.regulationNumber}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary">
                          {reg.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-[150px] truncate">
                        {reg.issuedBy}
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs text-muted-foreground">
                        {formatDate(reg.issuedDate)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor(reg.status)}`}>
                          {reg.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {reg.pineconeIndexed ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Indexed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleIndex(reg.id)}
                            disabled={indexingId === reg.id}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors disabled:opacity-50"
                            title="Trigger Pinecone indexing"
                          >
                            {indexingId === reg.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Zap className="w-3.5 h-3.5" />
                            )}
                            Index
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {reg.sourceUrl && (
                            <a
                              href={reg.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg hover:bg-sky-500/10 text-muted-foreground hover:text-sky-500 transition-colors"
                              title="Buka sumber"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => openEdit(reg)}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(reg.id)}
                            disabled={deleteId === reg.id}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                            title="Hapus"
                          >
                            {deleteId === reg.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Menampilkan {(meta.page - 1) * PAGE_SIZE + 1}–{Math.min(meta.page * PAGE_SIZE, meta.total)} dari {meta.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchData(meta.page - 1)}
                  disabled={meta.page <= 1}
                  className="p-2 rounded-lg border border-border hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium px-2">
                  {meta.page} / {meta.totalPages}
                </span>
                <button
                  onClick={() => fetchData(meta.page + 1)}
                  disabled={meta.page >= meta.totalPages}
                  className="p-2 rounded-lg border border-border hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-heading font-bold">
                {editingReg ? 'Edit Regulasi' : 'Tambah Regulasi Baru'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <FormField label="Judul Regulasi *">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                  placeholder="Contoh: Undang-Undang Cipta Kerja"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Nomor Regulasi *">
                  <input
                    type="text"
                    value={form.regulationNumber}
                    onChange={(e) => updateForm('regulationNumber', e.target.value)}
                    placeholder="UU No. 11 Tahun 2020"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </FormField>

                <FormField label="Tipe">
                  <select
                    value={form.type}
                    onChange={(e) => updateForm('type', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                  >
                    {REG_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField label="Diterbitkan Oleh *">
                <input
                  type="text"
                  value={form.issuedBy}
                  onChange={(e) => updateForm('issuedBy', e.target.value)}
                  placeholder="Presiden Republik Indonesia"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </FormField>

              <div className="grid grid-cols-3 gap-4">
                <FormField label="Tanggal Terbit">
                  <input
                    type="date"
                    value={form.issuedDate}
                    onChange={(e) => updateForm('issuedDate', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                  />
                </FormField>

                <FormField label="Tanggal Berlaku">
                  <input
                    type="date"
                    value={form.effectiveDate}
                    onChange={(e) => updateForm('effectiveDate', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                  />
                </FormField>

                <FormField label="Status">
                  <select
                    value={form.status}
                    onChange={(e) => updateForm('status', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField label="Sektor Tags (pisahkan dengan koma)">
                <input
                  type="text"
                  value={form.sectorTags}
                  onChange={(e) => updateForm('sectorTags', e.target.value)}
                  placeholder="Ketenagakerjaan, Perpajakan, Perizinan"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </FormField>

              <FormField label="URL Sumber">
                <input
                  type="url"
                  value={form.sourceUrl}
                  onChange={(e) => updateForm('sourceUrl', e.target.value)}
                  placeholder="https://peraturan.go.id/..."
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </FormField>

              <FormField label="Konten Mentah (opsional)">
                <textarea
                  value={form.contentRaw}
                  onChange={(e) => updateForm('contentRaw', e.target.value)}
                  placeholder="Paste isi regulasi di sini untuk indexing AI..."
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono text-xs"
                />
              </FormField>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !form.title || !form.regulationNumber || !form.issuedBy}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                ) : (
                  editingReg ? 'Simpan Perubahan' : 'Buat Regulasi'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================
   Sub-components
   ============================================ */

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}
