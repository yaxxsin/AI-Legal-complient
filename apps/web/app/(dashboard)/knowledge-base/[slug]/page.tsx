import type { Metadata } from 'next';
import ArticleDetailClient from './client';

// Get API URL based on context (server-side vs client-side)
const getApiUrl = () => {
  if (typeof window === 'undefined') {
    return process.env.INTERNAL_API_URL || 'http://api:3002/api/v1';
  }
  return process.env.NEXT_PUBLIC_API_URL || '/api/v1';
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const res = await fetch(`${getApiUrl()}/articles/${params.slug}`);
    if (!res.ok) {
      return { title: 'Artikel Tidak Ditemukan | LocalCompliance' };
    }
    const json = await res.json();
    const article = json.data;

    return {
      title: `${article.title} | Pusat Pengetahuan LocalCompliance`,
      description: article.metaDescription,
      alternates: {
        canonical: `/knowledge-base/${article.slug}`,
      },
      openGraph: {
        title: article.title,
        description: article.metaDescription,
        type: 'article',
        publishedTime: article.publishedAt,
        authors: [article.author],
      }
    };
  } catch (error) {
    return { title: 'Pusat Pengetahuan | LocalCompliance' };
  }
}

export default function ArticleDetailPage() {
  return <ArticleDetailClient />;
}
