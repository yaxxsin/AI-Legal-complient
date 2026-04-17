'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface AuthState {
  isLoading: boolean;
  error: string | null;
}

/** Hook for Supabase auth actions (client-side) */
export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    isLoading: false,
    error: null,
  });

  const supabase = createClient();

  /** Register with email + password */
  async function signUp(email: string, password: string, fullName: string) {
    setState({ isLoading: true, error: null });

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setState({ isLoading: false, error: error.message });
      return false;
    }

    setState({ isLoading: false, error: null });
    return true;
  }

  /** Sign in with email + password */
  async function signIn(email: string, password: string) {
    setState({ isLoading: true, error: null });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setState({ isLoading: false, error: 'Email atau password salah' });
      return false;
    }

    setState({ isLoading: false, error: null });
    router.refresh();
    return true;
  }

  /** Sign out current session */
  async function signOut() {
    setState({ isLoading: true, error: null });

    const { error } = await supabase.auth.signOut();

    if (error) {
      setState({ isLoading: false, error: error.message });
      return false;
    }

    setState({ isLoading: false, error: null });
    router.push('/login');
    router.refresh();
    return true;
  }

  /** Send reset password email */
  async function resetPassword(email: string) {
    setState({ isLoading: true, error: null });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setState({ isLoading: false, error: error.message });
      return false;
    }

    setState({ isLoading: false, error: null });
    return true;
  }

  /** Update password (while authenticated) */
  async function updatePassword(newPassword: string) {
    setState({ isLoading: true, error: null });

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setState({ isLoading: false, error: error.message });
      return false;
    }

    setState({ isLoading: false, error: null });
    return true;
  }

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };
}
