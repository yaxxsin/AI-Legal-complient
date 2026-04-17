import { SetMetadata } from '@nestjs/common';

export const PLANS_KEY = 'plans';

/** Decorator to restrict endpoint access to specific plans (or higher) */
export const RequirePlan = (...plans: string[]) =>
  SetMetadata(PLANS_KEY, plans);
