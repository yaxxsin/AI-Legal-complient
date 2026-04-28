'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Plus, Pencil, Trash2, Loader2, Search,
  ChevronDown, X, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/* ============================================
   Types
   ============================================ */

interface ComplianceCategory {
  id: string;
  name: string;
  icon: string | null;
  sortOrder: number;
}

interface ComplianceRule {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  priority: string;
  conditions: Record<string, unknown>;
  legalReferences: unknown[];
  dueDateLogic: Record<string, unknown> | null;
  guidanceText: string | null;
  isPublished: boolean;
  category?: ComplianceCategory;
  createdAt: string;
}

interface RuleFormData {
  title: string;
  description: string;
  categoryId: string;
  priority: string;
  guidanceText: string;
  isPublished: boolean;
  legalReferences: string;
}

const EMPTY_FORM: RuleFormData = {
  title: '',
  description: '',
  categoryId: '',
  priority: 'medium',
  guidanceText: '',
  isPublished: false,
  legalReferences: '',
};

const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical', color: 'text-red-500 bg-red-500/10' },
  { value: 'high', label: 'High', color: 'text-orange-500 bg-orange-500/10' },
  { value: 'medium', label: 'Medium', color: 'text-amber-500 bg-amber-500/10' },
  { value: 'low', label: 'Low', color: 'text-sky-500 bg-sky-500/10' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

/* ============================================
   Main Component
   ============================================ */

export default function AdminRulesPage() {
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [categories, setCategories] = useState<ComplianceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ComplianceRule | null>(null);
  const [form, setForm] = useState<RuleFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const opts: RequestInit = { credentials: 'include' };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rulesRes, catsRes] = await Promise.all([
        fetch(`${API_URL}/compliance-rules`, opts),
        fetch(`${API_URL}/compliance-rules/categories`, opts),
      ]);
      if (rulesRes.ok) setRules(await rulesRes.json());
      if (catsRes.ok) setCategories(await catsRes.json());
    } catch (e) {
      console.error('Failed to fetch rules:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Filters ── */
  const filtered = rules.filter((r) => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory && r.categoryId !== filterCategory) return false;
    if (filterPriority && r.priority !== filterPriority) return false;
    return true;
  });

  /* ── CRUD Handlers ── */
  function openCreate() {
    setEditingRule(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(rule: ComplianceRule) {
    setEditingRule(rule);
    setForm({
      title: rule.title,
      description: rule.description,
      categoryId: rule.categoryId,
      priority: rule.priority,
      guidanceText: rule.guidanceText ?? '',
      isPublished: rule.isPublished,
      legalReferences: Array.isArray(rule.legalReferences)
        ? rule.legalReferences.join(', ')
        : '',
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title || !form.description || !form.categoryId) return;
    setIsSaving(true);
    try {
      const body = {
        title: form.title,
        description: form.description,
        categoryId: form.categoryId,
        priority: form.priority,
        guidanceText: form.guidanceText || null,
        isPublished: form.isPublished,
        legalReferences: form.legalReferences
          ? form.legalReferences.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        conditions: {},
      };

      const url = editingRule
        ? `${API_URL}/compliance-rules/${editingRule.id}`
        : `${API_URL}/compliance-rules`;
      const method = editingRule ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        ...opts,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowModal(false);
        await fetchData();
      }
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteId(id);
    try {
      await fetch(`${API_URL}/compliance-rules/${id}`, {
        method: 'DELETE',
        ...opts,
      });
      await fetchData();
    } catch (e) {
      console.error('Delete failed:', e);
    } finally {
      setDeleteId(null);
    }
  }

  function updateForm(field: keyof RuleFormData, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? '-';

  const getPriorityStyle = (p: string) =>
    PRIORITY_OPTIONS.find((o) => o.value === p)?.color ?? 'text-muted-foreground bg-muted/50';

  /* ============================================
     Render
     ============================================ */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold">Compliance Rules</h1>
            <p className="text-muted-foreground mt-1">
              Kelola aturan kepatuhan hukum ({rules.length} rules)
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tambah Rule
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari rule..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-card text-sm min-w-[160px]"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-card text-sm min-w-[130px]"
        >
          <option value="">Semua Prioritas</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-6 text-center text-muted-foreground py-12">
            {rules.length === 0
              ? 'Belum ada compliance rules. Klik "Tambah Rule" untuk membuat.'
              : 'Tidak ada rule yang cocok dengan filter.'}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Rule</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kategori</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Prioritas</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground w-[100px]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rule) => (
                  <tr key={rule.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-foreground line-clamp-1">{rule.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{rule.description}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        {getCategoryName(rule.categoryId)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${getPriorityStyle(rule.priority)}`}>
                        {rule.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {rule.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(rule)}
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          disabled={deleteId === rule.id}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Hapus"
                        >
                          {deleteId === rule.id ? (
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
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-heading font-bold">
                {editingRule ? 'Edit Rule' : 'Tambah Rule Baru'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <FormField label="Judul Rule *">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                  placeholder="Contoh: Wajib memiliki NIB"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </FormField>

              <FormField label="Deskripsi *">
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  placeholder="Penjelasan detail tentang aturan ini..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Kategori *">
                  <select
                    value={form.categoryId}
                    onChange={(e) => updateForm('categoryId', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                  >
                    <option value="">Pilih kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Prioritas">
                  <select
                    value={form.priority}
                    onChange={(e) => updateForm('priority', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField label="Referensi Hukum (pisahkan dengan koma)">
                <input
                  type="text"
                  value={form.legalReferences}
                  onChange={(e) => updateForm('legalReferences', e.target.value)}
                  placeholder="UU No. 11/2020, PP No. 5/2021"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </FormField>

              <FormField label="Panduan (Guidance)">
                <textarea
                  value={form.guidanceText}
                  onChange={(e) => updateForm('guidanceText', e.target.value)}
                  placeholder="Langkah-langkah untuk memenuhi aturan ini..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </FormField>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => updateForm('isPublished', e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                />
                <span className="text-sm font-medium">Publish (aktifkan rule ini)</span>
              </label>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !form.title || !form.description || !form.categoryId}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                ) : (
                  editingRule ? 'Simpan Perubahan' : 'Buat Rule'
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
