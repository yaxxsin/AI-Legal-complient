'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Newspaper,
  Plus,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Loader2,
  Search,
  FileText,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  category: { id: string, name: string };
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    try {
      const res = await apiClient<ArticleItem[]>('/admin/articles?limit=100');
      setArticles(Array.isArray(res.data) ? res.data : []);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleTogglePublish = async (id: string, isPublished: boolean) => {
    setToggling(id);
    try {
      await apiClient(`/admin/articles/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPublished: !isPublished }),
      });
      await fetchArticles();
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus artikel "${title}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await apiClient(`/admin/articles/${id}`, {
        method: 'DELETE',
      });
      await fetchArticles();
    } catch {
      // silent
    }
  };

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category?.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-primary" />
            Article Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola artikel Knowledge Base — tulis, edit, dan publikasi.
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Artikel Baru
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari artikel..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {search ? 'Tidak ada artikel yang cocok.' : 'Belum ada artikel. Buat yang pertama!'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-left">
                <th className="px-4 py-3 font-medium">Judul</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((art) => (
                <tr key={art.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium line-clamp-1">{art.title}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">/{art.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      {art.category?.name ?? 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleTogglePublish(art.id, art.isPublished)}
                      disabled={toggling === art.id}
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors ${
                        art.isPublished
                          ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                      }`}
                    >
                      {toggling === art.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : art.isPublished ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3" />
                      )}
                      {art.isPublished ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/articles/${art.id}`}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(art.id, art.title)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                        title="Hapus"
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

      {/* Stats */}
      {!loading && articles.length > 0 && (
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>Total: {articles.length}</span>
          <span>Published: {articles.filter((a) => a.isPublished).length}</span>
          <span>Draft: {articles.filter((a) => !a.isPublished).length}</span>
        </div>
      )}
    </div>
  );
}
