import { create } from 'zustand';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  plan: string;
  emailVerified: boolean;
  onboardingCompleted: boolean;
}

interface AuthStore {
  user: UserProfile | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

/** Global auth state — synced with Supabase session */
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  clearUser: () => set({ user: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
