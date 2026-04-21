'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, X, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import Script from 'next/script';

// Ensure window has snap
declare global {
  interface Window {
    snap: any;
  }
}

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    // Fetch plans hardcoded from backend
    apiClient<any[]>('/billing/plans')
      .then((res) => {
        setPlans(res.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCheckout = async (planId: string) => {
    if (!user) {
      router.push(`/login?redirect=/pricing`);
      return;
    }

    setProcessing(planId);
    try {
      // Assuming cookie has auth
      const getCookie = (name: string) => {
        if (typeof document === 'undefined') return null;
        const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
        return match ? match[2] : null;
      };
      
      const token = getCookie('access_token');
      
      const res = await apiClient<any>('/billing/checkout', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ planId, billingCycle }),
      });

      if (res.data?.free) {
        // Free plan activated
        alert('Plan Free berhasil diaktifkan!');
        router.push('/dashboard');
        return;
      }

      // Midtrans Snap processing
      if (res.data?.token) {
        window.snap.pay(res.data.token, {
          onSuccess: function (result: any) {
            router.push('/billing');
          },
          onPending: function (result: any) {
            router.push('/billing');
          },
          onError: function (result: any) {
            alert('Pembayaran gagal atau dibatalkan.');
            setProcessing(null);
          },
          onClose: function () {
            setProcessing(null);
          },
        });
      }
    } catch (err: any) {
      alert(err?.error?.message || 'Gagal membuat tagihan. Coba lagi.');
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-background border-t">
      {/* Load Midtrans Snap Script */}
      <Script 
        src="https://app.sandbox.midtrans.com/snap/snap.js" 
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-DUMMY'} 
        strategy="lazyOnload"
      />

      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-heading font-bold mb-4">
            Harga Fleksibel Sesuai Skala Bisnismu
          </h1>
          <p className="text-muted-foreground text-lg">
            Mulai pelajari legalitas gratis, atau upgrade untuk perlindungan hukum menyeluruh dengan akses AI tak terbatas.
          </p>

          <div className="mt-8 inline-flex items-center gap-2 p-1 bg-muted rounded-full">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'annual'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tahunan <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full ml-1 animate-pulse">Hemat 20%</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`p-6 rounded-3xl border transition-all duration-300 ${
                  plan.highlight
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-xl scale-105'
                    : 'border-border bg-card hover:border-primary/50 hover:shadow-md'
                }`}
              >
                {plan.highlight && (
                  <div className="w-max mx-auto px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full mb-4 translate-y-[-50%] absolute top-0 left-1/2 -translate-x-1/2">
                    POPULAR
                  </div>
                )}
                
                <h3 className="text-xl font-bold font-heading">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-2 min-h-[40px]">
                  {plan.description}
                </p>

                <div className="mt-6 mb-8">
                  <span className="text-4xl font-bold">
                    Rp {(billingCycle === 'annual' ? plan.price_annual / 12 : plan.price_monthly).toLocaleString('id-ID')}
                  </span>
                  <span className="text-muted-foreground text-sm">/bln</span>
                  {billingCycle === 'annual' && plan.price_annual > 0 && (
                    <p className="text-xs text-primary mt-1 font-medium">Billed annually at Rp {plan.price_annual.toLocaleString('id-ID')}</p>
                  )}
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features.map((feature: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span className="text-sm text-foreground/80 leading-relaxed font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={processing !== null}
                  className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    plan.highlight
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {processing === plan.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    user?.plan === plan.id ? 'Current Plan' : 'Pilih Paket'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
