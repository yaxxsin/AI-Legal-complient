import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly supabase: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.supabase = createClient(
      this.config.getOrThrow<string>('SUPABASE_URL'),
      this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  /** Register new user via email + password */
  async register(dto: RegisterDto) {
    // Check if email already exists in our DB
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException({
        code: 'DUPLICATE_ENTRY',
        message: 'Email sudah terdaftar',
      });
    }

    // Create Supabase auth user
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: false,
      user_metadata: { full_name: dto.fullName },
    });

    if (authError) {
      this.logger.error(`Supabase register error: ${authError.message}`);
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: authError.message,
      });
    }

    // Create user row in our DB (synced with Supabase auth.users.id)
    const user = await this.prisma.user.create({
      data: {
        id: authData.user.id,
        email: dto.email,
        fullName: dto.fullName,
        role: 'user',
        plan: 'free',
        emailVerified: false,
      },
    });

    // Send verification email via Supabase (resend OTP link)
    await this.supabase.auth.resend({
      type: 'signup',
      email: dto.email,
    });

    this.logger.log(`User registered: ${user.email}`);
    return { id: user.id, email: user.email };
  }

  /** Login with email + password */
  async login(dto: LoginDto) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      throw new UnauthorizedException({
        code: 'AUTH_REQUIRED',
        message: 'Email atau password salah',
      });
    }

    // Update last login time
    await this.prisma.user.update({
      where: { id: data.user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    };
  }

  /** Logout — revoke session (requires user's access token) */
  async logout(accessToken: string): Promise<void> {
    const { error } = await this.supabase.auth.admin.signOut(accessToken);

    if (error) {
      this.logger.warn(`Logout error: ${error.message}`);
      // Don't throw — still invalidate on our side
    }
  }

  /** Send password reset email */
  async forgotPassword(email: string): Promise<void> {
    const redirectTo = `${this.config.get('CORS_ORIGIN', 'http://localhost:3000')}/reset-password`;

    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      this.logger.warn(`Forgot password error for ${email}: ${error.message}`);
      // Don't throw — don't reveal if email exists
    }

    // Always return success (security: don't reveal email existence)
  }

  /** Reset password with new password (user must have valid session from reset link) */
  async resetPassword(accessToken: string, newPassword: string): Promise<void> {
    // Create a client with the user's access token
    const userClient = createClient(
      this.config.getOrThrow<string>('SUPABASE_URL'),
      this.config.getOrThrow<string>('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      },
    );

    const { error } = await userClient.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Reset password gagal. Link mungkin sudah expired.',
      });
    }
  }

  /** Sync Supabase auth user to our users table (used by webhook/callback) */
  async syncUser(supabaseUserId: string): Promise<void> {
    const { data } = await this.supabase.auth.admin.getUserById(supabaseUserId);

    if (!data?.user) return;

    await this.prisma.user.upsert({
      where: { id: supabaseUserId },
      update: {
        emailVerified: !!data.user.email_confirmed_at,
        lastLoginAt: new Date(),
      },
      create: {
        id: supabaseUserId,
        email: data.user.email!,
        fullName: (data.user.user_metadata?.full_name as string) ?? 'User',
        role: 'user',
        plan: 'free',
        emailVerified: !!data.user.email_confirmed_at,
      },
    });
  }
}
