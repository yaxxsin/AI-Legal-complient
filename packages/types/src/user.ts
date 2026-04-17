export type UserRole = 'user' | 'admin' | 'super_admin';
export type UserPlan = 'free' | 'starter' | 'growth' | 'business';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  plan: UserPlan;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}
