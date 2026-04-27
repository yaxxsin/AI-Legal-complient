import type { Metadata } from 'next';
import KnowledgeBaseClient from './client';

export const metadata: Metadata = {
  title: 'Pusat Pengetahuan | LocalCompliance',
  description: 'Artikel, panduan, dan FAQ seputar kepatuhan hukum bisnis di Indonesia',
  alternates: {
    canonical: '/knowledge-base',
  },
};

export default function KnowledgeBasePage() {
  return <KnowledgeBaseClient />;
}
