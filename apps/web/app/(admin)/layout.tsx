import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { AdminGuard } from '@/components/guards/admin-guard';

export const metadata: Metadata = {
  title: {
    default: 'Admin Panel',
    template: '%s | Admin — LocalCompliance',
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="h-screen flex bg-background overflow-hidden">
        <Sidebar variant="admin" />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar />
          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}
