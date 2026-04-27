import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import * as UAParser from 'ua-parser-js';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto, LoginDto } from './dto';

/** JWT payload structure */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  plan: string;
}

/** Session metadata from request */
interface SessionMeta {
  ipAddress: string;
  userAgent: string;
}

/** Cookie config constants */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // true for HTTPS
  sameSite: 'lax' as const,
  path: '/',
};

const ACCESS_TOKEN_EXPIRY = 3600; // 1 hour
const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60; // 30 days
const SESSION_IDLE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days idle timeout

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly isProduction: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.jwtSecret = this.config.getOrThrow<string>('JWT_SECRET');
    this.isProduction = this.config.get<string>('NODE_ENV') === 'production';
  }

  /** Generate JWT access token (short-lived) */
  private generateAccessToken(payload: JwtPayload): string {
    return jwt.sign({ ...payload }, this.jwtSecret, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
  }

  /** Generate opaque refresh token (stored in DB) */
  private generateRefreshTokenString(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /** Parse user-agent into device name */
  private parseDeviceName(userAgent: string): string {
    const parser = new UAParser.UAParser(userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    return `${browser.name || 'Unknown'} on ${os.name || 'Unknown'}`;
  }

  /** Create a new session in DB */
  private async createSession(
    userId: string,
    meta: SessionMeta,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = await this.buildPayload(userId);
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshTokenString();

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000);

    await this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        deviceName: this.parseDeviceName(meta.userAgent),
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  /** Build JWT payload from user ID */
  private async buildPayload(userId: string): Promise<JwtPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    };
  }

  /** Get cookie options (secure in production) */
  getCookieOptions() {
    return {
      ...COOKIE_OPTIONS,
      secure: this.isProduction,
    };
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
  async register(dto: RegisterDto, meta: SessionMeta) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException({
        code: 'DUPLICATE_ENTRY',
        message: 'Email sudah terdaftar',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

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

    this.logger.log(`[Auth] User registered: ${user.email}`);

    const tokens = await this.createSession(user.id, meta);

    return {
      ...tokens,
      expiresIn: ACCESS_TOKEN_EXPIRY,
      user: { id: user.id, email: user.email },
    };
  }

  /** Login with email + password */
  async login(dto: LoginDto, meta: SessionMeta) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException({
        code: 'AUTH_REQUIRED',
        message: 'Email atau password salah',
      });
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException({
        code: 'AUTH_REQUIRED',
        message: 'Email atau password salah',
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`[Auth] User logged in: ${user.email} from ${meta.ipAddress}`);

    const tokens = await this.createSession(user.id, meta);

    return {
      ...tokens,
      expiresIn: ACCESS_TOKEN_EXPIRY,
      user: { id: user.id, email: user.email },
    };
  }

  /** Logout — revoke session by refresh token */
  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) return;

    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
    });

    if (session) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { isActive: false },
      });
      this.logger.log(`[Auth] Session revoked for user ${session.userId}`);
    }
  }

  /** Refresh access token — rotate refresh token */
  async refreshToken(oldRefreshToken: string, meta: SessionMeta) {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken: oldRefreshToken },
    });

    if (!session || !session.isActive) {
      throw new UnauthorizedException('Invalid or revoked refresh token');
    }

    if (session.expiresAt < new Date()) {
      // Expired — deactivate and reject
      await this.prisma.session.update({
        where: { id: session.id },
        data: { isActive: false },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Rotate: generate new refresh token, invalidate old
    const newRefreshToken = this.generateRefreshTokenString();
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000);

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
        lastActiveAt: new Date(),
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        deviceName: this.parseDeviceName(meta.userAgent),
      },
    });

    const payload = await this.buildPayload(session.userId);
    const accessToken = this.generateAccessToken(payload);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY,
    };
  }

  /** Send password reset email */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      const resetToken = jwt.sign(
        { sub: user.id, type: 'reset' },
        this.jwtSecret,
        { expiresIn: '1h' },
      );
      // TODO: Send email via Resend with resetToken
      this.logger.log(`[Auth] Password reset requested for ${email}`);
    }
    // Always return success (don't reveal email existence)
  }

  /** Reset password with token — revoke all sessions */
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

    // Security: revoke all sessions on password change
    await this.revokeAllSessions(decoded.sub);
    this.logger.log(`[Auth] Password reset + all sessions revoked for user ${decoded.sub}`);
  }

  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================

  /** Get all active sessions for a user */
  async getUserSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, isActive: true, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        ipAddress: true,
        deviceName: true,
        lastActiveAt: true,
        createdAt: true,
      },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  /** Revoke a specific session */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false },
    });

    this.logger.log(`[Auth] Session ${sessionId} revoked by user ${userId}`);
  }

  /** Revoke ALL sessions for a user (force logout everywhere) */
  async revokeAllSessions(userId: string): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    this.logger.log(`[Auth] All ${result.count} sessions revoked for user ${userId}`);
    return result.count;
  }

  /** Cleanup expired and idle sessions (called by cron or on-demand) */
  async cleanupExpiredSessions(): Promise<number> {
    const idleCutoff = new Date(Date.now() - SESSION_IDLE_TTL);

    const result = await this.prisma.session.updateMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: { lt: new Date() } },
          { lastActiveAt: { lt: idleCutoff } },
        ],
      },
      data: { isActive: false },
    });

    if (result.count > 0) {
      this.logger.log(`[Auth] Cleaned up ${result.count} expired/idle sessions`);
    }
    return result.count;
  }

  /** Touch session — update lastActiveAt (called by guard) */
  async touchSession(refreshToken: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { refreshToken, isActive: true },
      data: { lastActiveAt: new Date() },
    });
  }
}
