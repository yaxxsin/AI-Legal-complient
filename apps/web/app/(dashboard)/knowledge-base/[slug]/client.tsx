'use client';

import '../knowledge-base.css';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Article } from '@/hooks/use-articles';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';

function renderBody(body: string): string {
  // If it's HTML from Tiptap, just return it
  if (body.startsWith('<') && (body.includes('<p>') || body.includes('<h1>') || body.includes('<h2>'))) {
    return body;
  }

  return body
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\- \[x\] (.+)$/gm, '<div class="kb-checklist kb-checklist--done">✅ $1</div>')
    .replace(/^\- \[ \] (.+)$/gm, '<div class="kb-checklist">☐ $1</div>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/^\| (.+) \|$/gm, (match) => {
      const cells = match.split('|').filter(Boolean).map((c) => c.trim());
      return `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
    })
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    async function load() {
      try {
        const res = await fetch(`${API_URL}/articles/${slug}`);
        if (!res.ok) {
          setError('Artikel tidak ditemukan');
          return;
        }
        const json = await res.json();
        setArticle(json.data);
      } catch {
        setError('Gagal memuat artikel');
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="kb-detail">
        <div className="kb-detail-skeleton">
          <div className="kb-skeleton-badge" />
          <div className="kb-skeleton-title" style={{ width: '80%', height: '2rem' }} />
          <div className="kb-skeleton-text" style={{ width: '60%' }} />
          <div className="kb-skeleton-text" />
          <div className="kb-skeleton-text" />
          <div className="kb-skeleton-text" style={{ width: '90%' }} />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="kb-detail">
        <div className="kb-empty">
          <p className="kb-empty-text">{error ?? 'Artikel tidak ditemukan'}</p>
          <button className="kb-empty-btn" onClick={() => router.push('/knowledge-base')}>
            ← Kembali ke Knowledge Base
          </button>
        </div>
      </div>
    );
  }

  const publishDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="kb-detail">
      {/* Breadcrumb */}
      <nav className="kb-breadcrumb">
        <Link href="/knowledge-base" className="kb-breadcrumb-link">
          Pusat Pengetahuan
        </Link>
        <span className="kb-breadcrumb-sep">/</span>
        <Link
          href={`/knowledge-base?category=${article.category.slug}`}
          className="kb-breadcrumb-link"
        >
          {article.category.name}
        </Link>
        <span className="kb-breadcrumb-sep">/</span>
        <span className="kb-breadcrumb-current">{article.title}</span>
      </nav>

      {/* Article header */}
      <header className="kb-detail-header">
        <span className="kb-card-badge">{article.category.name}</span>
        <h1 className="kb-detail-title">{article.title}</h1>
        <div className="kb-detail-meta">
          <span>{article.author}</span>
          <span>•</span>
          <span>{publishDate}</span>
          <span>•</span>
          <span>{article.readTimeMinutes ?? 5} menit baca</span>
        </div>
      </header>

      {/* Article body */}
      <article
        className="kb-detail-body"
        dangerouslySetInnerHTML={{ __html: renderBody(article.body) }}
      />

      {/* Tags */}
      {article.tags && Array.isArray(article.tags) && article.tags.length > 0 && (
        <div className="kb-detail-tags">
          {(article.tags as string[]).map((tag) => (
            <span key={tag} className="kb-tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="kb-cta">
        <h3 className="kb-cta-title">Ada pertanyaan tentang topik ini?</h3>
        <p className="kb-cta-text">
          ComplianceBot siap membantu menjelaskan lebih detail dan menjawab pertanyaan spesifik Anda.
        </p>
        <Link href="/chat" className="kb-cta-btn">
          💬 Tanya ComplianceBot
        </Link>
      </div>

      {/* Back link */}
      <Link href="/knowledge-base" className="kb-back-link">
        ← Kembali ke Pusat Pengetahuan
      </Link>
    </div>
  );
}
