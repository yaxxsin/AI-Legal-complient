'use client';

import './knowledge-base.css';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useArticles, type Article, type ArticleCategory } from '@/hooks/use-articles';

/** Skeleton card for loading state */
function ArticleSkeleton() {
  return (
    <div className="kb-card kb-skeleton">
      <div className="kb-skeleton-badge" />
      <div className="kb-skeleton-title" />
      <div className="kb-skeleton-text" />
      <div className="kb-skeleton-text kb-skeleton-text--short" />
      <div className="kb-skeleton-footer" />
    </div>
  );
}

/** Category pill filter */
function CategoryFilter({
  categories,
  activeSlug,
  onSelect,
}: {
  categories: ArticleCategory[];
  activeSlug: string | null;
  onSelect: (slug: string | null) => void;
}) {
  return (
    <div className="kb-categories">
      <button
        className={`kb-category-pill ${!activeSlug ? 'kb-category-pill--active' : ''}`}
        onClick={() => onSelect(null)}
      >
        Semua
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          className={`kb-category-pill ${activeSlug === cat.slug ? 'kb-category-pill--active' : ''}`}
          onClick={() => onSelect(cat.slug)}
        >
          {cat.name}
          <span className="kb-category-count">{cat._count.articles}</span>
        </button>
      ))}
    </div>
  );
}

/** Single article card */
function ArticleCard({ article }: { article: Article }) {
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <Link href={`/knowledge-base/${article.slug}`} className="kb-card">
      <span className="kb-card-badge">{article.category.name}</span>
      <h3 className="kb-card-title">{article.title}</h3>
      <p className="kb-card-desc">{article.metaDescription}</p>
      <div className="kb-card-footer">
        <span className="kb-card-meta">
          {article.readTimeMinutes ?? 5} menit baca
        </span>
        <span className="kb-card-meta">{date}</span>
      </div>
    </Link>
  );
}

/** Pagination controls */
function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="kb-pagination">
      <button
        className="kb-pagination-btn"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        ← Sebelumnya
      </button>
      <span className="kb-pagination-info">
        Halaman {page} dari {totalPages}
      </span>
      <button
        className="kb-pagination-btn"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Selanjutnya →
      </button>
    </div>
  );
}

export default function KnowledgeBasePage() {
  const {
    articles,
    categories,
    meta,
    isLoading,
    activeCategory,
    filterByCategory,
    search,
    goToPage,
  } = useArticles();

  const [searchInput, setSearchInput] = useState('');

  /** Debounced search */
  useEffect(() => {
    const timer = setTimeout(() => search(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  return (
    <div className="kb-page">
      {/* Header */}
      <div className="kb-header">
        <h1 className="kb-title">Pusat Pengetahuan</h1>
        <p className="kb-subtitle">
          Artikel, panduan, dan FAQ seputar kepatuhan hukum bisnis di Indonesia
        </p>

        {/* Search */}
        <div className="kb-search-wrapper">
          <svg
            className="kb-search-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="kb-search-input"
            placeholder="Cari artikel... contoh: BPJS, NIB, pajak"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {/* Category filters */}
      <CategoryFilter
        categories={categories}
        activeSlug={activeCategory}
        onSelect={filterByCategory}
      />

      {/* Articles grid */}
      {isLoading ? (
        <div className="kb-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <ArticleSkeleton key={i} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="kb-empty">
          <p className="kb-empty-text">Tidak ada artikel ditemukan</p>
          <button className="kb-empty-btn" onClick={() => { setSearchInput(''); search(''); filterByCategory(null); }}>
            Reset filter
          </button>
        </div>
      ) : (
        <>
          <div className="kb-grid">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {meta && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPage={goToPage}
            />
          )}
        </>
      )}

      {/* CTA box to ComplianceBot */}
      <div className="kb-cta">
        <h3 className="kb-cta-title">Butuh bantuan lebih lanjut?</h3>
        <p className="kb-cta-text">
          Tanyakan langsung ke ComplianceBot — asisten AI kami yang siap membantu
          menjawab pertanyaan hukum bisnis Anda.
        </p>
        <Link href="/chat" className="kb-cta-btn">
          💬 Tanya ComplianceBot
        </Link>
      </div>
    </div>
  );
}
