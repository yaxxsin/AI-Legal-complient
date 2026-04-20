'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface AuthState {
  isLoading: boolean;
  error: string | null;
}

/** Hook for auth actions — calls NestJS API directly */
export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    isLoading: false,
    error: null,
  });

  /** Register with email + password */
  async function signUp(email: string, password: string, fullName: string) {
    setState({ isLoading: true, error: null });

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, fullName }),
      });

      const data = await res.json();
      if (!res.ok) {
        setState({ isLoading: false, error: data.message ?? 'Registrasi gagal' });
        return false;
      }

      // Store token in cookie via document.cookie (httpOnly should be set server-side)
      if (data.accessToken) {
        document.cookie = `access_token=${data.accessToken}; path=/; max-age=3600; SameSite=Lax`;
      }

      setState({ isLoading: false, error: null });
      return true;
    } catch {
      setState({ isLoading: false, error: 'Terjadi kesalahan jaringan' });
      return false;
    }
  }

  /** Sign in with email + password */
  async function signIn(email: string, password: string) {
    setState({ isLoading: true, error: null });

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setState({ isLoading: false, error: data.message ?? 'Email atau password salah' });
        return false;
      }

      if (data.accessToken) {
        document.cookie = `access_token=${data.accessToken}; path=/; max-age=${data.expiresIn ?? 3600}; SameSite=Lax`;
      }
      if (data.refreshToken) {
        document.cookie = `refresh_token=${data.refreshToken}; path=/; max-age=2592000; SameSite=Lax`;
      }

      setState({ isLoading: false, error: null });
      router.refresh();
      return true;
    } catch {
      setState({ isLoading: false, error: 'Terjadi kesalahan jaringan' });
      return false;
    }
  }

  /** Sign out current session */
  async function signOut() {
    setState({ isLoading: true, error: null });

    // Clear cookies
    document.cookie = 'access_token=; path=/; max-age=0';
    document.cookie = 'refresh_token=; path=/; max-age=0';

    setState({ isLoading: false, error: null });
    router.push('/login');
    router.refresh();
    return true;
  }

  /** Send reset password email */
  async function resetPassword(email: string) {
    setState({ isLoading: true, error: null });

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setState({ isLoading: false, error: 'Gagal mengirim email reset' });
        return false;
      }

      setState({ isLoading: false, error: null });
      return true;
    } catch {
      setState({ isLoading: false, error: 'Terjadi kesalahan jaringan' });
      return false;
    }
  }

  /** Change password (verify old password first) */
  async function changePassword(oldPassword: string, newPassword: string) {
    setState({ isLoading: true, error: null });

    try {
      const token = getCookie('access_token');
      const res = await fetch(`${API_URL}/users/me/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setState({ isLoading: false, error: data.message ?? 'Gagal mengubah password' });
        return false;
      }

      setState({ isLoading: false, error: null });
      return true;
    } catch {
      setState({ isLoading: false, error: 'Terjadi kesalahan jaringan' });
      return false;
    }
  }

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
    changePassword,
  };
}

/** Helper to read cookie value */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}
