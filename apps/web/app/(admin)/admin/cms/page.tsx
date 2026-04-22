'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutPanelTop, Search, Plus, Edit3, Globe, EyeOff, Loader2, Trash2 } from 'lucide-react';

interface CmsPage {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  updatedAt: string;
  _count?: { sections: number };
}

export default function AdminCmsListPage() {
  const router = useRouter();
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

  const fetchPages = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/cms/pages`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setPages(data);
      }
    } catch (e) {
      console.error('Failed to fetch CMS pages:', e);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  const handleCreatePage = () => {
    router.push('/admin/cms/new');
  };

  const handleDeletePage = async (id: string, title: string) => {
    if (!confirm(`Hapus halaman "${title}"? Semua sections akan ikut terhapus.`)) return;
    try {
      const res = await fetch(`${apiUrl}/cms/pages/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setPages((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert('Gagal menghapus halaman');
      }
    } catch (e) {
      console.error('Failed to delete page:', e);
      alert('Gagal menghapus halaman');
    }
  };

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const filteredPages = pages.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const hasHomePage = pages.some(p => p.slug === 'home');

  const handleCreateHomePage = async () => {
    try {
      const res = await fetch(`${apiUrl}/cms/pages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Landing Page',
          slug: 'home',
          metaDescription: 'LocalCompliance — AI-Powered Legal Compliance untuk bisnis Indonesia.',
          isPublished: true,
        }),
      });
      if (res.ok) {
        const newPage = await res.json();
        router.push(`/admin/cms/${newPage.id}`);
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.message || 'Gagal membuat halaman home');
      }
    } catch (e) {
      console.error('Failed to create home page:', e);
      alert('Gagal membuat halaman home');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <LayoutPanelTop className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold">CMS Builder</h1>
            <p className="text-muted-foreground mt-1">
              Atur konten Landing Page secara dinamis, tanpa coding.
            </p>
          </div>
        </div>
      </div>

      {/* Warning: no home page */}
      {!isLoading && !hasHomePage && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <div>
            <p className="text-sm font-semibold text-amber-600">Landing Page (home) belum ada</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Halaman publik di / membutuhkan CMS page dengan slug &quot;home&quot;. Buat sekarang agar bisa diedit.
            </p>
          </div>
          <button
            onClick={handleCreateHomePage}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium text-sm hover:bg-amber-600 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Buat Home Page
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari title atau slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
          />
        </div>
        
        <button
          onClick={handleCreatePage}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-md shadow-primary/20 hover:-translate-y-0.5 hover:shadow-lg transition-all md:w-auto w-full justify-center"
        >
          <Plus className="w-4 h-4" /> Tambah Page
        </button>
      </div>

      {/* Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Belum ada halaman.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Page Title</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Slug / URL</th>
                    <th className="text-center px-5 py-3 font-medium text-muted-foreground">Sections</th>
                    <th className="text-center px-5 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-5 py-3 font-medium text-muted-foreground">Opsi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPages.map((page) => (
                    <tr key={page.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4 font-semibold text-foreground">
                        {page.title}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                        /{page.slug}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="bg-secondary px-2.5 py-1 rounded-full text-xs font-semibold">
                          {page._count?.sections ?? 0} Blocks
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {page.isPublished ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                            <Globe className="w-3 h-3" /> Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500">
                            <EyeOff className="w-3 h-3" /> Draft
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/cms/${page.id}`}
                            className="inline-flex items-center justify-center p-2 rounded-lg bg-surface hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground border border-border"
                            title="Edit page"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeletePage(page.id, page.title)}
                            className="inline-flex items-center justify-center p-2 rounded-lg bg-surface hover:bg-red-500/10 hover:text-red-500 transition-colors text-muted-foreground border border-border"
                            title="Hapus page"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
