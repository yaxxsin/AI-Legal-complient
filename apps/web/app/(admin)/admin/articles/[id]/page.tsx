'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Newspaper } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { TiptapEditor } from '@/components/ui/tiptap-editor';

// Basic slugify helper
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export default function AdminArticleEditorPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const isNew = params.id === 'new';
  
  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? match[2] : null;
  };
  const token = getCookie('access_token') ?? undefined;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    categoryId: '',
    body: '',
    metaDescription: '',
    tags: '',
    readTimeMinutes: 5,
    isPublished: false,
  });

  useEffect(() => {
    if (!token) return;

    // Load categories
    apiClient<{ id: string; name: string }[]>('/articles/categories', { token })
      .then((res) => {
        if (Array.isArray(res.data)) {
          setCategories(res.data);
          if (isNew && res.data.length > 0) {
            setFormData((prev) => ({ ...prev, categoryId: res.data[0].id }));
          }
        }
      })
      .catch(console.error);

    // Load existing article
    if (!isNew) {
      apiClient<any>(`/admin/articles/${params.id}`, { token })
        .then((res) => {
          const art = res.data;
          setFormData({
            title: art.title,
            slug: art.slug,
            categoryId: art.category?.id || '',
            body: art.body,
            metaDescription: art.metaDescription || '',
            tags: art.tags?.join(', ') || '',
            readTimeMinutes: art.readTimeMinutes || 5,
            isPublished: art.isPublished,
          });
        })
        .catch(() => router.push('/admin/articles'))
        .finally(() => setLoading(false));
    }
  }, [token, isNew, params.id, router]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug: slugify(title), // auto sync slug
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.categoryId || !formData.body) {
      alert('Judul, kategori, dan konten wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        slug: formData.slug,
        categoryId: formData.categoryId,
        body: formData.body,
        metaDescription: formData.metaDescription,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        readTimeMinutes: Number(formData.readTimeMinutes),
        isPublished: formData.isPublished,
        author: user?.fullName || 'Admin',
      };

      if (isNew) {
        await apiClient('/admin/articles', {
          method: 'POST',
          token,
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient(`/admin/articles/${params.id}`, {
          method: 'PUT',
          token,
          body: JSON.stringify(payload),
        });
      }

      router.push('/admin/articles');
      router.refresh();
    } catch (err: any) {
      alert(err?.error?.message || 'Gagal menyimpan artikel');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/articles"
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
              <Newspaper className="w-6 h-6 text-primary" />
              {isNew ? 'Tulis Artikel Baru' : 'Edit Artikel'}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Gunakan editor rich text untuk memformat konten artikel Anda.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublished"
              className="rounded border-input text-primary focus:ring-primary w-4 h-4"
              checked={formData.isPublished}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isPublished: e.target.checked }))
              }
            />
            <label htmlFor="isPublished" className="text-sm font-medium">
              Publish langsung
            </label>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Artikel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="space-y-4 p-6 border rounded-2xl bg-card">
            <div>
              <label className="block text-sm font-medium mb-1.5">Judul Artikel</label>
              <input
                type="text"
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                placeholder="Contoh: Panduan Mendirikan PT Perorangan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Konten Artikel</label>
              <TiptapEditor
                value={formData.body}
                onChange={(html) => setFormData((prev) => ({ ...prev, body: html }))}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 border rounded-2xl bg-card space-y-4">
            <h3 className="font-semibold text-sm">Pengaturan Metadata</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Kategori</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm"
              >
                <option value="" disabled>Pilih Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Slug (URL)</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Deskripsi Singkat (SEO)</label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) => setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm"
                placeholder="Deskripsi singkat untuk pencarian Google..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Tags (Pisahkan koma)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm"
                placeholder="OSS, PT, NIB"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Waktu Baca (Menit)</label>
              <input
                type="number"
                value={formData.readTimeMinutes}
                onChange={(e) => setFormData((prev) => ({ ...prev, readTimeMinutes: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm"
                min={1}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
