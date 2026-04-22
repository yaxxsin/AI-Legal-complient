import type { Metadata } from 'next';
import OssWizardClient from './client';

export const metadata: Metadata = {
  title: 'Roadmap Kepatuhan — Pasca NIB',
  description:
    'Panduan pasca-NIB: kelengkapan dokumen, kewajiban pajak bulanan & tahunan dengan scoring kepatuhan.',
};

export default function OssWizardPage() {
  return <OssWizardClient />;
}
