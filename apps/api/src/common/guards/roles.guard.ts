import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../database/prisma.service';

/** Checks if the authenticated user has the required role(s) */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Always fetch and cache dbUser for downstream guards (PlanGuard)
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, plan: true },
    });

    if (!dbUser) {
      throw new ForbiddenException('User not found in database');
    }

    // Attach to request for PlanGuard and controllers
    request.dbUser = dbUser;

    // If no role restriction, allow (still cached dbUser)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!requiredRoles.includes(dbUser.role)) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    }

    return true;
  }
}

