import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import '@/styles/globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'LocalCompliance — AI Legal Compliance untuk Bisnis Indonesia',
    template: '%s | LocalCompliance',
  },
  description:
    'Platform AI yang membantu UMKM dan startup Indonesia memenuhi kewajiban hukum bisnis. Checklist compliance, chatbot AI, dan generator dokumen legal.',
  keywords: [
    'compliance',
    'hukum bisnis',
    'UMKM',
    'legalitas',
    'perizinan',
    'Indonesia',
    'AI',
    'chatbot hukum',
  ],
  authors: [{ name: 'LocalCompliance' }],
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'LocalCompliance',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="font-body antialiased bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
