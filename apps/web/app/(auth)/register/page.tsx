'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)/;

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!agreedTerms) {
      setError('Anda harus menyetujui syarat dan ketentuan');
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setError('Password harus mengandung minimal 1 huruf besar dan 1 angka');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Email sudah terdaftar. Silakan masuk.');
        } else {
          setError(authError.message);
        }
        return;
      }

      setIsSuccess(true);
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="animate-fade-in text-center py-8">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📧</span>
        </div>
        <h1 className="text-2xl font-heading font-bold mb-2">Cek Email Anda</h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
          Kami telah mengirim link verifikasi ke <strong className="text-foreground">{email}</strong>.
          Klik link tersebut untuk mengaktifkan akun Anda.
        </p>
        <p className="text-xs text-muted-foreground">
          Tidak menerima email?{' '}
          <button
            type="button"
            onClick={() => setIsSuccess(false)}
            className="text-primary hover:underline"
          >
            Coba daftar ulang
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-lg">LC</span>
        </div>
        <h1 className="text-2xl font-heading font-bold">Buat Akun Baru</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Gratis untuk 1 profil bisnis
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center border border-destructive/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="fullName" className="text-sm font-medium">
            Nama Lengkap
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Budi Santoso"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            className="w-full h-11 px-4 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

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

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 karakter"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full h-11 px-4 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />

          {/* Password strength indicator */}
          {password.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      passwordStrength >= level
                        ? level <= 1
                          ? 'bg-destructive'
                          : level <= 2
                            ? 'bg-warning'
                            : 'bg-success'
                        : 'bg-border'
                    }`}
                  />
                ))}
              </div>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li className={password.length >= 8 ? 'text-success' : ''}>
                  {password.length >= 8 ? '✓' : '○'} Minimal 8 karakter
                </li>
                <li className={/[A-Z]/.test(password) ? 'text-success' : ''}>
                  {/[A-Z]/.test(password) ? '✓' : '○'} 1 huruf besar
                </li>
                <li className={/\d/.test(password) ? 'text-success' : ''}>
                  {/\d/.test(password) ? '✓' : '○'} 1 angka
                </li>
              </ul>
            </div>
          )}
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedTerms}
            onChange={(e) => setAgreedTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-input accent-primary"
          />
          <span className="text-xs text-muted-foreground">
            Saya menyetujui{' '}
            <span className="text-primary">Syarat & Ketentuan</span> dan{' '}
            <span className="text-primary">Kebijakan Privasi</span> LocalCompliance
          </span>
        </label>

        <button
          type="submit"
          disabled={isLoading || !agreedTerms}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Mendaftarkan...
            </span>
          ) : (
            'Daftar Sekarang'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Sudah punya akun?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}

/** Calculate password strength (1-4) */
function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}
