/**
 * User roles and plan types for RBAC + plan gating.
 * Source of truth: master_blueprint.md BAB 3 (users table)
 */

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum UserPlan {
  FREE = 'free',
  STARTER = 'starter',
  GROWTH = 'growth',
  BUSINESS = 'business',
}

/** Plan hierarchy — higher index = more features */
export const PLAN_HIERARCHY: UserPlan[] = [
  UserPlan.FREE,
  UserPlan.STARTER,
  UserPlan.GROWTH,
  UserPlan.BUSINESS,
];

/** Check if userPlan meets or exceeds requiredPlan */
export function isPlanSufficient(
  userPlan: string,
  requiredPlan: UserPlan,
): boolean {
  const userIdx = PLAN_HIERARCHY.indexOf(userPlan as UserPlan);
  const reqIdx = PLAN_HIERARCHY.indexOf(requiredPlan);
  return userIdx >= reqIdx;
}
