'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft, Save, Plus, ArrowUp, ArrowDown, Trash2, LayoutPanelTop, Loader2 } from 'lucide-react';

interface CmsSection {
  id?: string;
  type: string;
  sortOrder: number;
  content: any;
  isActive: boolean;
}

interface CmsPage {
  id: string;
  title: string;
  slug: string;
  metaDescription: string;
  isPublished: boolean;
  sections: CmsSection[];
}

export default function AdminCmsEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();

  const [page, setPage] = useState<CmsPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
  const getToken = () => document.cookie.split('; ').find(r => r.startsWith('access_token='))?.split('=')[1];

  const fetchPage = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch(`${apiUrl}/cms/pages/${id}`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
      if (res.ok) {
        const data = await res.json();
        setPage(data);
      } else {
        router.push('/admin/cms');
      }
    } catch (e) {
      console.error(e);
      router.push('/admin/cms');
    } finally {
      setIsLoading(false);
    }
  }, [id, apiUrl, router]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const handleSave = async () => {
    if (!page) return;
    setIsSaving(true);
    try {
      const token = getToken();
      // Update page settings
      await fetch(`${apiUrl}/cms/pages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          title: page.title,
          slug: page.slug,
          metaDescription: page.metaDescription,
          isPublished: page.isPublished,
        }),
      });

      // Update sections
      await fetch(`${apiUrl}/cms/pages/${id}/sections`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          sections: page.sections.map((s, i) => ({ ...s, sortOrder: i + 1 })),
        }),
      });

      alert('Berhasil menyimpan perubahan CMS');
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan');
    } finally {
      setIsSaving(false);
    }
  };

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

  const updateContent = (index: number, key: string, value: any) => {
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
              Edit Halaman: {page.title}
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
          {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
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
                  onChange={(e) => setPage({ ...page, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background/50 text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Slug (URL)</label>
                <input
                  type="text"
                  value={page.slug}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-input bg-muted/50 text-sm opacity-70 cursor-not-allowed"
                />
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
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-surface border-b border-l border-border rounded-bl-lg">
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
                  {/* Basic content map */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Title</label>
                    <input
                      type="text"
                      value={section.content?.title || ''}
                      onChange={(e) => updateContent(index, 'title', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-surface text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Subtitle / Paragraph</label>
                    <textarea
                      value={section.content?.subtitle || ''}
                      onChange={(e) => updateContent(index, 'subtitle', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-surface text-sm"
                    />
                  </div>

                  {/* Render extra fields based on type */}
                  {(section.type === 'hero' || section.type === 'cta') && (
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-primary">Primary Button Text</label>
                          <input type="text" value={section.content?.ctaText || ''} onChange={(e) => updateContent(index, 'ctaText', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-primary/20 bg-primary/5 text-sm" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-primary">Primary URL</label>
                          <input type="text" value={section.content?.ctaUrl || ''} onChange={(e) => updateContent(index, 'ctaUrl', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-primary/20 bg-primary/5 text-sm font-mono" />
                       </div>
                    </div>
                  )}

                  {(section.type === 'features' || section.type === 'testimonials' || section.type === 'faq') && (
                    <div className="space-y-2 mt-4 p-4 rounded-xl border border-input bg-background/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold">List Items (Raw JSON Edit)</span>
                      </div>
                      <textarea
                        value={JSON.stringify(section.content?.items || [], null, 2)}
                        onChange={(e) => {
                          try {
                            updateContent(index, 'items', JSON.parse(e.target.value));
                          } catch (err) {
                            // ignore parsing error while typing
                          }
                        }}
                        rows={10}
                        className="w-full font-mono text-xs p-3 rounded-lg border border-border bg-[#1e1e1e] text-[#d4d4d4]"
                        placeholder='[{"title":"Feature 1", "description":"Desc..."}]'
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        * Gunakan format JSON murni. Pastikan valid untuk menghindari error saat render.
                      </p>
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          ))}

          {page.sections.length === 0 && (
             <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                <LayoutPanelTop className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Belum ada block terpasang.</p>
                <button onClick={handleAddSection} className="mt-4 text-primary text-sm font-semibold">Tambah Block Pertama</button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
