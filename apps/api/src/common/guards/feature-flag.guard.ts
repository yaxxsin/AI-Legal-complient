import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { FEATURE_FLAG_KEY } from '../decorators/feature-flag.decorator';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const featureKey = this.reflector.get<string>(FEATURE_FLAG_KEY, context.getHandler()) || 
                       this.reflector.get<string>(FEATURE_FLAG_KEY, context.getClass());

    // If no feature toggle is required, let it pass
    if (!featureKey) {
      return true;
    }

    const flag = await this.prisma.featureFlag.findUnique({
      where: { key: featureKey },
    });

    // Default to true if not defined in DB
    if (!flag) {
      return true;
    }

    if (!flag.enabled) {
      throw new ForbiddenException(`Feature '${featureKey}' is currently disabled.`);
    }

    // Check plan restrictions if specified
    const targetPlans = flag.targetPlans as string[] | null;
    if (targetPlans && Array.isArray(targetPlans) && targetPlans.length > 0) {
      const request = context.switchToHttp().getRequest();
      const userId = request.user?.id;

      if (!userId) {
        throw new ForbiddenException(`Authentication required to access feature '${featureKey}'.`);
      }

      let dbUser = request.dbUser;
      if (!dbUser) {
        dbUser = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { plan: true },
        });
        request.dbUser = dbUser; // cache it for consecutive guards
      }

      if (!dbUser || !targetPlans.includes(dbUser.plan)) {
        throw new ForbiddenException(`Feature '${featureKey}' is not available for your current plan.`);
      }
    }

    return true;
  }
}
