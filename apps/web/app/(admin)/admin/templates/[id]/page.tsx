'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';

// ── Types ──────────────────────────────────

interface FormFieldDef {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

interface TemplateData {
  id?: string;
  name: string;
  description: string;
  category: string;
  templateHtml: string;
  formSchema: FormFieldDef[];
  isPublished: boolean;
  version?: number;
}

const EMPTY_TEMPLATE: TemplateData = {
  name: '',
  description: '',
  category: 'Kontrak',
  templateHtml: '<div style="font-family:serif;max-width:700px;margin:0 auto;padding:40px;line-height:1.8">\n<h1 style="text-align:center;font-size:18px">JUDUL DOKUMEN</h1>\n<p>Isi template di sini. Gunakan {{namaField}} untuk placeholder.</p>\n</div>',
  formSchema: [],
  isPublished: false,
};

const FIELD_TYPES = ['text', 'date', 'number', 'textarea', 'select'];
const CATEGORIES = ['Ketenagakerjaan', 'Kontrak', 'Perizinan', 'Pajak', 'Lainnya'];

// ── Helper: render preview ─────────────────

function renderPreview(
  html: string,
  schema: FormFieldDef[],
): string {
  let result = html;
  for (const field of schema) {
    const placeholder = field.placeholder || field.label;
    result = result.replace(
      new RegExp(`\\{\\{${field.name}\\}\\}`, 'g'),
      `<span style="background:#e8f5e9;padding:0 4px;border-radius:3px">[${placeholder}]</span>`,
    );
  }
  return result;
}

// ── Field Editor Row Component ─────────────

function FieldRow({
  field,
  onUpdate,
  onRemove,
}: {
  field: FormFieldDef;
  onUpdate: (updated: FormFieldDef) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/30 border border-border/50 group">
      <GripVertical className="w-4 h-4 text-muted-foreground/30 mt-2.5 shrink-0 cursor-grab" />
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
        <input
          value={field.name}
          onChange={(e) => onUpdate({ ...field, name: e.target.value })}
          placeholder="fieldName"
          className="px-2 py-1.5 rounded-lg border border-input bg-background text-xs font-mono"
        />
        <input
          value={field.label}
          onChange={(e) => onUpdate({ ...field, label: e.target.value })}
          placeholder="Label"
          className="px-2 py-1.5 rounded-lg border border-input bg-background text-xs"
        />
        <select
          value={field.type}
          onChange={(e) => onUpdate({ ...field, type: e.target.value })}
          className="px-2 py-1.5 rounded-lg border border-input bg-background text-xs"
        >
          {FIELD_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={field.required ?? false}
              onChange={(e) => onUpdate({ ...field, required: e.target.checked })}
              className="rounded"
            />
            Wajib
          </label>
          <button
            onClick={onRemove}
            className="p-1 rounded hover:bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Editor Page ───────────────────────

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params?.id as string | undefined;
  const isNew = templateId === 'new';

  const [data, setData] = useState<TemplateData>(EMPTY_TEMPLATE);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');

  // Fetch existing template
  useEffect(() => {
    if (isNew || !templateId) return;
    let cancelled = false;
    async function load(): Promise<void> {
      try {
        const res = await fetch(`${API_BASE}/documents/templates/${templateId}`);
        if (!res.ok) throw new Error('Not found');
        const tpl = await res.json();
        if (!cancelled) {
          setData({
            id: tpl.id,
            name: tpl.name,
            description: tpl.description,
            category: tpl.category,
            templateHtml: tpl.templateHtml,
            formSchema: Array.isArray(tpl.formSchema) ? tpl.formSchema : [],
            isPublished: tpl.isPublished,
            version: tpl.version,
          });
        }
      } catch {
        if (!cancelled) setError('Template tidak ditemukan.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [templateId, isNew]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!data.name.trim()) { setError('Nama template wajib diisi.'); return; }
    setSaving(true);
    setError('');
    try {
      const body = {
        name: data.name,
        description: data.description,
        category: data.category,
        templateHtml: data.templateHtml,
        formSchema: data.formSchema,
        isPublished: data.isPublished,
      };
      const url = isNew
        ? `${API_BASE}/documents/admin/templates`
        : `${API_BASE}/documents/admin/templates/${templateId}`;
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Save failed');
      router.push('/admin/templates');
    } catch {
      setError('Gagal menyimpan template.');
    } finally {
      setSaving(false);
    }
  }, [data, isNew, templateId, router]);

  // Add field
  const addField = () => {
    setData((prev) => ({
      ...prev,
      formSchema: [
        ...prev.formSchema,
        { name: `field${prev.formSchema.length + 1}`, label: '', type: 'text', required: false },
      ],
    }));
  };

  // Update field
  const updateField = (index: number, updated: FormFieldDef) => {
    setData((prev) => ({
      ...prev,
      formSchema: prev.formSchema.map((f, i) => (i === index ? updated : f)),
    }));
  };

  // Remove field
  const removeField = (index: number) => {
    setData((prev) => ({
      ...prev,
      formSchema: prev.formSchema.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/admin/templates')}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-heading font-bold">
            {isNew ? 'Template Baru' : `Edit: ${data.name}`}
          </h1>
          {data.version && (
            <span className="text-xs text-muted-foreground font-mono">v{data.version}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
              showPreview
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'border-border hover:bg-muted'
            }`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className={`grid gap-6 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Editor Column */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Informasi Template
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Template *</label>
                <input
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi</label>
                <textarea
                  value={data.description}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Kategori</label>
                  <select
                    value={data.category}
                    onChange={(e) => setData({ ...data, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm pb-2.5">
                    <input
                      type="checkbox"
                      checked={data.isPublished}
                      onChange={(e) => setData({ ...data, isPublished: e.target.checked })}
                      className="rounded"
                    />
                    Published (visible to users)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* HTML Template Editor */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Template HTML (Handlebars)
            </h2>
            <p className="text-xs text-muted-foreground">
              {'Gunakan {{namaField}} untuk placeholder yang akan diisi user.'}
            </p>
            <textarea
              value={data.templateHtml}
              onChange={(e) => setData({ ...data, templateHtml: e.target.value })}
              rows={14}
              className="w-full px-3 py-2.5 rounded-lg border border-input bg-gray-950 text-green-400 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              spellCheck={false}
            />
          </div>

          {/* Form Schema Builder */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Form Fields ({data.formSchema.length})
              </h2>
              <button
                onClick={addField}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Field
              </button>
            </div>

            {data.formSchema.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Belum ada field. Klik &quot;Tambah Field&quot; untuk mulai.
              </p>
            ) : (
              <div className="space-y-2">
                {data.formSchema.map((field, idx) => (
                  <FieldRow
                    key={idx}
                    field={field}
                    onUpdate={(updated) => updateField(idx, updated)}
                    onRemove={() => removeField(idx)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview Column */}
        {showPreview && (
          <div className="rounded-2xl border border-border bg-white dark:bg-gray-950 p-1 overflow-auto max-h-[85vh] sticky top-6">
            <div
              className="prose prose-sm max-w-none p-4"
              dangerouslySetInnerHTML={{
                __html: renderPreview(data.templateHtml, data.formSchema),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
