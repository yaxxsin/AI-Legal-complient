'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft, Save, Plus, ArrowUp, ArrowDown, Trash2, LayoutPanelTop, Loader2, GripVertical } from 'lucide-react';

/* ============================================
   Types
   ============================================ */

interface FeatureItem {
  title: string;
  description: string;
  icon: string;
}

interface TestimonialItem {
  name: string;
  role: string;
  quote: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

type ListItem = FeatureItem | TestimonialItem | FaqItem;

interface CmsSection {
  id?: string;
  type: string;
  sortOrder: number;
  content: Record<string, unknown>;
  isActive: boolean;
}

interface CmsPageData {
  id: string;
  title: string;
  slug: string;
  metaDescription: string;
  isPublished: boolean;
  sections: CmsSection[];
}

/* ============================================
   Helpers — default items per type
   ============================================ */

const DEFAULT_ITEMS: Record<string, () => ListItem> = {
  features: () => ({ title: '', description: '', icon: 'Star' }),
  testimonials: () => ({ name: '', role: '', quote: '' }),
  faq: () => ({ question: '', answer: '' }),
};

const ITEM_LABELS: Record<string, string> = {
  features: 'Feature',
  testimonials: 'Testimonial',
  faq: 'FAQ',
};

/* ============================================
   Sub-component: Structured Item Editor
   ============================================ */

function ItemEditor({
  type,
  items,
  onChange,
}: {
  type: string;
  items: ListItem[];
  onChange: (items: ListItem[]) => void;
}) {
  const addItem = () => {
    const factory = DEFAULT_ITEMS[type];
    if (!factory) return;
    onChange([...items, factory()]);
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, key: string, value: string) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [key]: value };
    onChange(updated);
  };

  const moveItem = (idx: number, dir: 'up' | 'down') => {
    const updated = [...items];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= updated.length) return;
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    onChange(updated);
  };

  const label = ITEM_LABELS[type] ?? 'Item';

  return (
    <div className="space-y-3 mt-4 p-4 rounded-xl border border-input bg-background/50">
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold">{label}s ({items.length})</span>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-3 h-3" /> Tambah {label}
        </button>
      </div>

      {items.map((item, idx) => (
        <div
          key={idx}
          className="relative p-4 rounded-lg border border-border/60 bg-card/60 space-y-3 group/item"
        >
          {/* Item toolbar */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <GripVertical className="w-3 h-3" />
              {label} #{idx + 1}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => moveItem(idx, 'up')}
                disabled={idx === 0}
                className="p-1 hover:bg-primary/10 rounded text-muted-foreground disabled:opacity-30"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => moveItem(idx, 'down')}
                disabled={idx === items.length - 1}
                className="p-1 hover:bg-primary/10 rounded text-muted-foreground disabled:opacity-30"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="p-1 hover:bg-red-500/10 text-red-500 rounded"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Feature fields */}
          {type === 'features' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Title</label>
                  <input
                    type="text"
                    value={(item as FeatureItem).title}
                    onChange={(e) => updateItem(idx, 'title', e.target.value)}
                    placeholder="Nama fitur"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-surface text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Icon (Lucide)</label>
                  <input
                    type="text"
                    value={(item as FeatureItem).icon}
                    onChange={(e) => updateItem(idx, 'icon', e.target.value)}
                    placeholder="FileText, Activity, Bell..."
                    className="w-full px-3 py-2 rounded-lg border border-input bg-surface text-sm font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                <textarea
                  value={(item as FeatureItem).description}
                  onChange={(e) => updateItem(idx, 'description', e.target.value)}
                  rows={2}
                  placeholder="Deskripsi singkat fitur..."
                  className="w-full px-3 py-2 rounded-lg border border-input bg-surface text-sm"
                />
              </div>
            </>
          )}

          {/* Testimonial fields */}
          {type === 'testimonials' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Nama</label>
                  <input
                    type="text"
                    value={(item as TestimonialItem).name}
                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                    placeholder="Nama orang"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-surface text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Role / Jabatan</label>
                  <input
                    type="text"
                    value={(item as TestimonialItem).role}
                    onChange={(e) => updateItem(idx, 'role', e.target.value)}
                    placeholder="CEO StartupXYZ"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-surface text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Quote</label>
                <textarea
                  value={(item as TestimonialItem).quote}
                  onChange={(e) => updateItem(idx, 'quote', e.target.value)}
                  rows={2}
                  placeholder="Testimoni dari pengguna..."
                  className="w-full px-3 py-2 rounded-lg border border-input bg-surface text-sm"
                />
              </div>
            </>
          )}

          {/* FAQ fields */}
          {type === 'faq' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Pertanyaan</label>
                <input
                  type="text"
                  value={(item as FaqItem).question}
                  onChange={(e) => updateItem(idx, 'question', e.target.value)}
                  placeholder="Apa itu LocalCompliance?"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-surface text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Jawaban</label>
                <textarea
                  value={(item as FaqItem).answer}
                  onChange={(e) => updateItem(idx, 'answer', e.target.value)}
                  rows={3}
                  placeholder="Jawaban lengkap..."
                  className="w-full px-3 py-2 rounded-lg border border-input bg-surface text-sm"
                />
              </div>
            </>
          )}
        </div>
      ))}

      {items.length === 0 && (
        <p className="text-center text-xs text-muted-foreground py-4">
          Belum ada {label.toLowerCase()}. Klik &quot;Tambah {label}&quot; untuk mulai.
        </p>
      )}
    </div>
  );
}

/* ============================================
   Main Page Component
   ============================================ */

export default function AdminCmsEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id: paramId } = resolvedParams;
  const isNew = paramId === 'new';
  const router = useRouter();

  const [pageId, setPageId] = useState<string>(isNew ? '' : paramId);
  const [page, setPage] = useState<CmsPageData | null>(
    isNew
      ? {
          id: '',
          title: 'Halaman Baru',
          slug: '',
          metaDescription: '',
          isPublished: false,
          sections: [],
        }
      : null,
  );
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

  /* --- Fetch existing page --- */
  const fetchPage = useCallback(async () => {
    if (isNew) return;
    try {
      const res = await fetch(`${apiUrl}/cms/pages/${paramId}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setPage(data);
        setPageId(data.id);
      } else {
        router.push('/admin/cms');
      }
    } catch (e) {
      console.error(e);
      router.push('/admin/cms');
    } finally {
      setIsLoading(false);
    }
  }, [paramId, apiUrl, router, isNew]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  /* --- Save handler (create or update) --- */
  const handleSave = async () => {
    if (!page) return;
    if (!page.title.trim()) { alert('Judul halaman wajib diisi'); return; }
    if (!page.slug.trim()) { alert('Slug wajib diisi'); return; }

    setIsSaving(true);
    try {
      let currentId = pageId;

      if (isNew && !currentId) {
        // Create new page first
        const createRes = await fetch(`${apiUrl}/cms/pages`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: page.title,
            slug: page.slug,
            metaDescription: page.metaDescription,
            isPublished: page.isPublished,
          }),
        });

        if (!createRes.ok) {
          const err = await createRes.json().catch(() => null);
          alert(err?.message || 'Gagal membuat halaman');
          setIsSaving(false);
          return;
        }

        const created = await createRes.json();
        currentId = created.id;
        setPageId(currentId);
      } else {
        // Update existing page settings
        const updateRes = await fetch(`${apiUrl}/cms/pages/${currentId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: page.title,
            slug: page.slug,
            metaDescription: page.metaDescription,
            isPublished: page.isPublished,
          }),
        });

        if (!updateRes.ok) {
          const err = await updateRes.json().catch(() => null);
          alert(err?.message || 'Gagal menyimpan pengaturan halaman');
          setIsSaving(false);
          return;
        }
      }

      // Save sections
      if (page.sections.length > 0) {
        await fetch(`${apiUrl}/cms/pages/${currentId}/sections`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sections: page.sections.map((s, i) => ({ ...s, sortOrder: i + 1 })),
          }),
        });
      }

      alert('Berhasil menyimpan perubahan CMS');

      // If was new, redirect to the real edit URL
      if (isNew) {
        router.replace(`/admin/cms/${currentId}`);
      }
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan');
    } finally {
      setIsSaving(false);
    }
  };

  /* --- Section CRUD helpers --- */
  const handleAddSection = () => {
    if (!page) return;
    const newSection: CmsSection = {
      type: 'hero',
      sortOrder: page.sections.length + 1,
      isActive: true,
      content: { title: 'Judul Baru', subtitle: 'Deskripsi pendek' },
    };
    setPage({ ...page, sections: [...page.sections, newSection] });
  };

  const updateSection = (index: number, updates: Partial<CmsSection>) => {
    if (!page) return;
    const newSections = [...page.sections];
    newSections[index] = { ...newSections[index], ...updates };
    setPage({ ...page, sections: newSections });
  };

  const updateContent = (index: number, key: string, value: unknown) => {
    if (!page) return;
    const newSections = [...page.sections];
    newSections[index].content = { ...newSections[index].content, [key]: value };
    setPage({ ...page, sections: newSections });
  };

  const moveSection = (index: number, dir: 'up' | 'down') => {
    if (!page) return;
    const newSections = [...page.sections];
    if (dir === 'up' && index > 0) {
      [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
    } else if (dir === 'down' && index < newSections.length - 1) {
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    }
    setPage({ ...page, sections: newSections });
  };

  const removeSection = (index: number) => {
    if (!page) return;
    const newSections = page.sections.filter((_, i) => i !== index);
    setPage({ ...page, sections: newSections });
  };

  /* --- Render --- */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!page) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/cms')}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
              <LayoutPanelTop className="w-5 h-5 text-primary" />
              {isNew ? 'Buat Halaman Baru' : `Edit Halaman: ${page.title}`}
            </h1>
            <p className="text-muted-foreground text-sm font-mono mt-1">/{page.slug}</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Menyimpan...' : isNew ? 'Buat & Simpan' : 'Simpan Perubahan'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Settings */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="bg-card/50 backdrop-blur-sm shadow-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg">Pengaturan Halaman</CardTitle>
              <CardDescription>SEO dan Status Publikasi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Judul Halaman (Internal)</label>
                <input
                  type="text"
                  value={page.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    const updates: Partial<CmsPageData> = { title: newTitle };
                    // Auto-generate slug from title for new pages with empty slug
                    if (isNew && !page.slug) {
                      updates.slug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                    }
                    setPage({ ...page, ...updates });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background/50 text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Slug (URL)</label>
                <input
                  type="text"
                  value={page.slug}
                  onChange={(e) => setPage({ ...page, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background/50 text-sm focus:ring-2 focus:ring-primary/20 font-mono"
                  placeholder="contoh: about-us"
                />
                <p className="text-xs text-muted-foreground">Hanya huruf kecil, angka, dan tanda hubung (-)</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Meta Description (SEO)</label>
                <textarea
                  value={page.metaDescription}
                  onChange={(e) => setPage({ ...page, metaDescription: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background/50 text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-semibold">Status Publikasi</span>
                <button
                  type="button"
                  onClick={() => setPage({ ...page, isPublished: !page.isPublished })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    page.isPublished ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                      page.isPublished ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sections Editor */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-bold">Blocks (Sections)</h2>
            <button
              onClick={handleAddSection}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-muted border border-border text-sm font-medium transition-colors"
            >
              <Plus className="w-3 h-3" /> Tambah Block
            </button>
          </div>

          {page.sections.map((section, index) => (
            <Card key={index} className="border border-border/50 bg-card/40 shadow-sm relative overflow-hidden group">
              {/* Toolbar */}
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-surface border-b border-l border-border rounded-bl-lg z-10">
                <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="p-1.5 hover:bg-primary/10 rounded-md text-muted-foreground disabled:opacity-30">
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button onClick={() => moveSection(index, 'down')} disabled={index === page.sections.length - 1} className="p-1.5 hover:bg-primary/10 rounded-md text-muted-foreground disabled:opacity-30">
                  <ArrowDown className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-border mx-1" />
                <button onClick={() => removeSection(index)} className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-md">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Block Type</label>
                    <select
                      value={section.type}
                      onChange={(e) => updateSection(index, { type: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-input text-sm bg-background/50"
                    >
                      <option value="hero">Hero</option>
                      <option value="features">Features / Value Props</option>
                      <option value="testimonials">Testimonials</option>
                      <option value="cta">Call-to-Action</option>
                      <option value="faq">FAQ</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-end pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={section.isActive}
                        onChange={(e) => updateSection(index, { isActive: e.target.checked })}
                        className="rounded border-input"
                      />
                      Aktif (Muncul di publik)
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-4">
                  {/* Basic content: title + subtitle */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Title</label>
                    <input
                      type="text"
                      value={(section.content?.title as string) || ''}
                      onChange={(e) => updateContent(index, 'title', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-surface text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Subtitle / Paragraph</label>
                    <textarea
                      value={(section.content?.subtitle as string) || ''}
                      onChange={(e) => updateContent(index, 'subtitle', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-surface text-sm"
                    />
                  </div>

                  {/* Hero / CTA extra fields */}
                  {(section.type === 'hero' || section.type === 'cta') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-primary">Primary Button Text</label>
                        <input
                          type="text"
                          value={(section.content?.ctaText as string) || ''}
                          onChange={(e) => updateContent(index, 'ctaText', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-primary/20 bg-primary/5 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-primary">Primary URL</label>
                        <input
                          type="text"
                          value={(section.content?.ctaUrl as string) || ''}
                          onChange={(e) => updateContent(index, 'ctaUrl', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-primary/20 bg-primary/5 text-sm font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Hero secondary CTA */}
                  {section.type === 'hero' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Secondary Button Text</label>
                        <input
                          type="text"
                          value={(section.content?.secondaryCtaText as string) || ''}
                          onChange={(e) => updateContent(index, 'secondaryCtaText', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-input bg-surface text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Secondary URL</label>
                        <input
                          type="text"
                          value={(section.content?.secondaryCtaUrl as string) || ''}
                          onChange={(e) => updateContent(index, 'secondaryCtaUrl', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-input bg-surface text-sm font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Structured item editors for features / testimonials / faq */}
                  {(section.type === 'features' || section.type === 'testimonials' || section.type === 'faq') && (
                    <ItemEditor
                      type={section.type}
                      items={(section.content?.items as ListItem[]) || []}
                      onChange={(items) => updateContent(index, 'items', items)}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {page.sections.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
              <LayoutPanelTop className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Belum ada block terpasang.</p>
              <button onClick={handleAddSection} className="mt-4 text-primary text-sm font-semibold">
                Tambah Block Pertama
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
