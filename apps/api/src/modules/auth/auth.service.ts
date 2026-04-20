import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto, LoginDto } from './dto';

/** JWT payload structure */
interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  plan: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly jwtExpiration: string;
  private readonly jwtRefreshExpiration: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.jwtSecret = this.config.getOrThrow<string>('JWT_SECRET');
    this.jwtExpiration = this.config.get<string>('JWT_EXPIRATION', '1h');
    this.jwtRefreshExpiration = this.config.get<string>('JWT_REFRESH_EXPIRATION', '30d');
  }

  /** Generate JWT access token */
  private generateAccessToken(payload: JwtPayload): string {
    return jwt.sign({ ...payload }, this.jwtSecret, {
      expiresIn: 3600, // 1 hour in seconds
    });
  }

  /** Generate JWT refresh token */
  private generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign({ ...payload }, this.jwtSecret, {
      expiresIn: 2592000, // 30 days in seconds
    });
  }

  /** Verify JWT token */
  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /** Register new user via email + password */
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException({
        code: 'DUPLICATE_ENTRY',
        message: 'Email sudah terdaftar',
      });
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create user in DB
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
        role: 'user',
        plan: 'free',
        emailVerified: false,
      },
    });

    // TODO: Send verification email via Resend
    this.logger.log(`User registered: ${user.email}`);

    // Generate tokens
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
      user: { id: user.id, email: user.email },
    };
  }

  /** Login with email + password */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException({
        code: 'AUTH_REQUIRED',
        message: 'Email atau password salah',
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException({
        code: 'AUTH_REQUIRED',
        message: 'Email atau password salah',
      });
    }

    // Update last login time
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
      expiresIn: 3600,
      user: { id: user.id, email: user.email },
    };
  }

  /** Logout — invalidate tokens (client-side cookie clear) */
  async logout(_accessToken: string): Promise<void> {
    // With JWT strategy, logout is primarily client-side (clear cookies)
    // TODO: Add token blacklist if needed (Redis-based)
    this.logger.log('User logged out (client-side token clear)');
  }

  /** Send password reset email */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      // Generate a short-lived reset token (1 hour)
      const resetToken = jwt.sign(
        { sub: user.id, type: 'reset' },
        this.jwtSecret,
        { expiresIn: '1h' },
      );

      // TODO: Send email via Resend with resetToken
      this.logger.log(`Password reset requested for ${email}, token: ${resetToken.substring(0, 20)}...`);
    }

    // Always return success (security: don't reveal email existence)
  }

  /** Reset password with token */
  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    let decoded: { sub: string; type: string };
    try {
      decoded = jwt.verify(resetToken, this.jwtSecret) as { sub: string; type: string };
    } catch {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Reset password gagal. Link mungkin sudah expired.',
      });
    }

    if (decoded.type !== 'reset') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Token tidak valid.',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: decoded.sub },
      data: { passwordHash },
    });

    this.logger.log(`Password reset completed for user ${decoded.sub}`);
  }

  /** Refresh access token using refresh token */
  async refreshToken(refreshToken: string) {
    const decoded = this.verifyToken(refreshToken);

    // Fetch fresh user data
    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    };

    return {
      accessToken: this.generateAccessToken(payload),
      user: { id: user.id, email: user.email },
    };
  }
}
