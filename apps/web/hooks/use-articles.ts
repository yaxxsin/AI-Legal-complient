'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';

export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  _count: { articles: number };
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  body: string;
  tags: string[] | null;
  metaDescription: string;
  readTimeMinutes: number | null;
  isPublished: boolean;
  publishedAt: string | null;
  author: string;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Hook for public Knowledge Base — articles + categories */
export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  /** Fetch articles with optional filters */
  const fetchArticles = useCallback(
    async (page = 1, category?: string | null, search?: string) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '9' });
        if (category) params.set('category', category);
        if (search) params.set('search', search);

        const res = await fetch(`${API_URL}/articles?${params}`);
        if (!res.ok) throw new Error('Failed to fetch articles');

        const json = await res.json();
        setArticles(json.data);
        setMeta(json.meta);
      } catch {
        setArticles([]);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /** Fetch categories */
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/articles/categories`);
      if (!res.ok) return;
      const json = await res.json();
      setCategories(json.data);
    } catch {
      // silent
    }
  }, []);

  /** Initial load */
  useEffect(() => {
    fetchCategories();
    fetchArticles(1, null, '');
  }, [fetchCategories, fetchArticles]);

  /** Filter by category */
  const filterByCategory = useCallback(
    (slug: string | null) => {
      setActiveCategory(slug);
      fetchArticles(1, slug, searchQuery);
    },
    [fetchArticles, searchQuery],
  );

  /** Search articles */
  const search = useCallback(
    (q: string) => {
      setSearchQuery(q);
      fetchArticles(1, activeCategory, q);
    },
    [fetchArticles, activeCategory],
  );

  /** Go to page */
  const goToPage = useCallback(
    (page: number) => {
      fetchArticles(page, activeCategory, searchQuery);
    },
    [fetchArticles, activeCategory, searchQuery],
  );

  return {
    articles,
    categories,
    meta,
    isLoading,
    activeCategory,
    searchQuery,
    filterByCategory,
    search,
    goToPage,
  };
}
