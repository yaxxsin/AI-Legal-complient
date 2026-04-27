'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

export default function ForgotPasswordPage() {
  const { resetPassword, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const success = await resetPassword(email);
    if (success) {
      setIsSuccess(true);
    } else {
      setError('Gagal mengirim email. Coba lagi.');
    }
  }

  if (isSuccess) {
    return (
      <div className="animate-fade-in text-center py-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📧</span>
        </div>
        <h1 className="text-2xl font-heading font-bold mb-2">Cek Email Anda</h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
          Jika email <strong className="text-foreground">{email}</strong> terdaftar,
          kami telah mengirim link untuk reset password.
        </p>
        <Link
          href="/login"
          className="text-primary text-sm font-medium hover:underline"
        >
          ← Kembali ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-heading font-bold">Lupa Password</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Masukkan email Anda dan kami akan mengirim link reset password
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center border border-destructive/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@perusahaan.com"
            required
            autoComplete="email"
            className="w-full h-11 px-4 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Mengirim...' : 'Kirim Link Reset'}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        <Link href="/login" className="text-primary font-medium hover:underline">
          ← Kembali ke halaman masuk
        </Link>
      </p>
    </div>
  );
}
