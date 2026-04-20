import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';
import { PrismaService } from '../../database/prisma.service';

/** Verifies the JWT from the Authorization header or cookie */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    // Verify JWT
    const payload = this.authService.verifyToken(token);

    // Fetch full user from DB
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Attach user to request for downstream use
    request.user = user;
    return true;
  }

  /** Extract token from Authorization header or cookie */
  private extractToken(request: { headers: Record<string, string>; cookies?: Record<string, string> }): string | null {
    // Try Authorization header first
    const authHeader = request.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Fallback to cookie
    return request.cookies?.access_token ?? null;
  }
}
