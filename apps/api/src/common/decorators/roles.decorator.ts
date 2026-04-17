import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Decorator to restrict endpoint access to specific roles */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
