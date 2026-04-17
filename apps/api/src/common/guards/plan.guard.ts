import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PLANS_KEY } from '../decorators/plan.decorator';
import { PrismaService } from '../../database/prisma.service';

/**
 * Checks if the authenticated user's plan meets the required plan(s).
 * Must be used AFTER SupabaseAuthGuard.
 */
@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlans = this.reflector.getAllAndOverride<string[]>(
      PLANS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPlans || requiredPlans.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const supabaseUser = request.user;

    if (!supabaseUser?.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Use cached dbUser if RolesGuard already attached it
    const dbUser =
      request.dbUser ??
      (await this.prisma.user.findUnique({
        where: { id: supabaseUser.id },
        select: { plan: true },
      }));

    if (!dbUser || !requiredPlans.includes(dbUser.plan)) {
      throw new ForbiddenException({
        code: 'FEATURE_NOT_AVAILABLE',
        message: 'Fitur ini tidak tersedia di plan Anda saat ini',
      });
    }

    return true;
  }
}
