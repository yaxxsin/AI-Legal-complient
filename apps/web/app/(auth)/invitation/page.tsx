'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/use-user';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

function InvitationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isUserLoading) return;

    if (!user) {
      router.push(`/login?redirect=/invitation?token=${token}`);
      return;
    }

    if (!token) {
      setStatus('error');
      setMessage('Token undangan tidak valid atau tidak ditemukan.');
      return;
    }

    const claimInvitation = async () => {
      try {
        const _token = getCookie('access_token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
        
        const res = await fetch(`${apiUrl}/teams/invitations/accept`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(_token && { Authorization: `Bearer ${_token}` })
          },
          body: JSON.stringify({ token })
        });
        
        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage('Undangan berhasil diterima! Mengarahkan ke dashboard...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Gagal menerima undangan');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Terjadi kesalahan jaringan.');
      }
    };

    claimInvitation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserLoading, user, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="bg-card w-full max-w-md p-8 rounded-2xl border border-border text-center shadow-sm">
        <h1 className="text-2xl font-bold font-heading mb-4">Undangan Tim</h1>
        
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto"></div>
            <p className="text-muted-foreground text-sm">Memproses undangan Anda...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 text-success animate-fade-in">
            <div className="text-5xl mx-auto">🎉</div>
            <p className="font-semibold">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-5xl mx-auto">❌</div>
            <p className="text-destructive font-medium">{message}</p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="mt-4 px-6 py-2.5 bg-foreground text-background font-semibold rounded-xl w-full"
            >
              Kembali ke Beranda
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvitationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4">Memuat...</div>}>
      <InvitationContent />
    </Suspense>
  );
}
