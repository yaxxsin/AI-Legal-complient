'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, CreditCard, Receipt, Loader2, ArrowRight, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

export default function BillingDashboardPage() {
  const { user } = useAuthStore();
  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? match[2] : null;
  };
  const token = getCookie('access_token');
  const [subscription, setSubscription] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!token) return;

    Promise.all([
      apiClient<any>('/billing/subscription', { token }),
      apiClient<any[]>('/billing/invoices', { token }),
      apiClient<any[]>('/billing/plans'),
    ])
      .then(([subRes, invRes, plansRes]) => {
        setSubscription(subRes.data);
        setInvoices(invRes.data || []);
        setPlans(plansRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const handleCancel = async () => {
    if (!confirm('Yakin ingin membatalkan langganan? Plan kamu akan tetap aktif hingga akhir periode.')) return;
    
    setCancelling(true);
    try {
      await apiClient('/billing/cancel', { method: 'POST', token: token! });
      alert('Berhasil dibatalkan. Langganan tidak akan diperpanjang.');
      window.location.reload();
    } catch (err) {
      alert('Gagal membatalkan langganan');
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/billing/invoices/${invoiceId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal mendownload invoice');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch {
      alert('Gagal mendownload invoice');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activePlan = plans.find(p => p.id === subscription?.plan) || { name: 'Free', price_monthly: 0 };
  const isPaid = subscription && subscription.plan !== 'free';

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
          <CreditCard className="w-8 h-8 text-primary" />
          Subscription & Billing
        </h1>
        <p className="text-muted-foreground mt-2">
          Kelola paket langganan dan lihat riwayat tagihan LocalCompliance Anda.
        </p>
      </div>

      {/* Active Plan Overview */}
      <div className="bg-card border rounded-3xl p-8 relative overflow-hidden">
        {/* Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Current Plan</h2>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-4xl font-bold font-heading">{activePlan.name}</span>
              {subscription?.billingCycle === 'annual' && (
                <span className="text-sm font-medium bg-secondary text-secondary-foreground px-2 py-1 rounded-lg mb-1">
                  Tahunan
                </span>
              )}
            </div>
            
            {isPaid ? (
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Status: <span className="font-semibold text-emerald-500">Active</span></p>
                <p>
                  Periode Aktif: {new Date(subscription.currentPeriodStart).toLocaleDateString('id-ID')} - {new Date(subscription.currentPeriodEnd).toLocaleDateString('id-ID')}
                </p>
                {subscription.cancelAtPeriodEnd && (
                  <div className="mt-3 flex items-start gap-2 text-amber-600 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 max-w-md">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p className="text-xs font-medium">Langganan Anda telah dibatalkan dan <b>tidak akan diperpanjang</b>. Tersedia hingga akhir periode.</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Saat ini Anda menggunakan paket gratis.</p>
            )}
          </div>

          <div className="flex flex-col gap-3 min-w-[200px]">
            <Link 
              href="/pricing"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              {isPaid ? 'Ubah Paket' : 'Upgrade Sekarang'}
            </Link>
            {isPaid && !subscription.cancelAtPeriodEnd && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex items-center justify-center px-6 py-3 rounded-xl border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors"
              >
                {cancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Batalkan Langganan'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold font-heading flex items-center gap-2">
          <Receipt className="w-6 h-6 text-muted-foreground" />
          Riwayat Tagihan
        </h3>
        
        {invoices.length === 0 ? (
          <div className="text-center py-12 border rounded-3xl bg-card border-dashed">
            <p className="text-muted-foreground">Belum ada riwayat tagihan.</p>
          </div>
        ) : (
          <div className="border rounded-2xl overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr className="text-left text-muted-foreground font-medium">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Nominal</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{inv.midtransTransactionId || inv.id.split('-').pop()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(inv.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-medium whitespace-nowrap">
                      Rp {Number(inv.amount).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' :
                        inv.status === 'failed' ? 'bg-red-500/10 text-red-600' :
                        'bg-amber-500/10 text-amber-600'
                      }`}>
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDownloadInvoice(inv.id)}
                        className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        PDF <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
