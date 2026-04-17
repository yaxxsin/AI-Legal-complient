import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract the authenticated Supabase user from the request.
 * Usage: @CurrentUser() user: SupabaseUser
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
