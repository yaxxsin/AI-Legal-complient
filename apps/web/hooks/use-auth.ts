'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface AuthState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for auth actions — calls NestJS API directly.
 * Cookies are now set server-side via Set-Cookie headers (httpOnly).
 * Frontend no longer touches document.cookie for auth tokens.
 */
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
        credentials: 'include', // Required for Set-Cookie to work cross-origin
        body: JSON.stringify({ email, password, fullName }),
      });

      const data = await res.json();
      if (!res.ok) {
        setState({ isLoading: false, error: data.message ?? 'Registrasi gagal' });
        return false;
      }

      // Cookies are set automatically via Set-Cookie response headers
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

      // Cookies are set automatically via Set-Cookie response headers
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

    try {
      // Call server to revoke session + clear httpOnly cookies
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Even if API call fails, proceed with client-side cleanup
    }

    setState({ isLoading: false, error: null });
    router.push('/login');
    router.refresh();
    return true;
  }

  /** Refresh access token (called when 401 detected) */
  async function refreshAccessToken(): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      return res.ok;
    } catch {
      return false;
    }
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
      const res = await fetch(`${API_URL}/users/me/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
    refreshAccessToken,
    resetPassword,
    changePassword,
  };
}
