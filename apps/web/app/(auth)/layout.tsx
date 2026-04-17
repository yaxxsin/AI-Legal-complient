import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Masuk — LocalCompliance',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4 py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
