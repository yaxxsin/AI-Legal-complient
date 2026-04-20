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
  private readonly supabase: SupabaseClient | null;
  private readonly isConfigured: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const url = this.config.get<string>('SUPABASE_URL', '');
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY', '');

    if (!url || url.includes('your-project') || !key || key === 'your-service-role-key') {
      this.logger.warn('⚠️ Supabase not configured — Auth features will use mock mode');
      this.supabase = null;
      this.isConfigured = false;
    } else {
      this.supabase = createClient(url, key);
      this.isConfigured = true;
    }
  }

  /** Guard helper: throw if Supabase not configured */
  private requireSupabase(): SupabaseClient {
    if (!this.supabase) {
      throw new BadRequestException('Supabase belum dikonfigurasi. Cek SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.');
    }
    return this.supabase;
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
    const sb = this.requireSupabase();
    const { data: authData, error: authError } = await sb.auth.admin.createUser({
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
    await sb.auth.resend({
      type: 'signup',
      email: dto.email,
    });

    this.logger.log(`User registered: ${user.email}`);
    return { id: user.id, email: user.email };
  }

  /** Login with email + password */
  async login(dto: LoginDto) {
    const sb = this.requireSupabase();
    const { data, error } = await sb.auth.signInWithPassword({
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
    const sb = this.requireSupabase();
    const { error } = await sb.auth.admin.signOut(accessToken);

    if (error) {
      this.logger.warn(`Logout error: ${error.message}`);
      // Don't throw — still invalidate on our side
    }
  }

  /** Send password reset email */
  async forgotPassword(email: string): Promise<void> {
    const redirectTo = `${this.config.get('CORS_ORIGIN', 'http://localhost:3000')}/reset-password`;

    const sb = this.requireSupabase();
    const { error } = await sb.auth.resetPasswordForEmail(email, {
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
      this.config.get<string>('SUPABASE_URL', ''),
      this.config.get<string>('NEXT_PUBLIC_SUPABASE_ANON_KEY', ''),
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
    const sb = this.requireSupabase();
    const { data } = await sb.auth.admin.getUserById(supabaseUserId);

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

  /** Login/register via Google OAuth — called after Supabase OAuth callback */
  async loginWithGoogle(accessToken: string) {
    // Verify the token and get user from Supabase
    const sb = this.requireSupabase();
    const { data, error } = await sb.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new UnauthorizedException({
        code: 'AUTH_REQUIRED',
        message: 'Google login gagal. Silakan coba lagi.',
      });
    }

    const supabaseUser = data.user;
    const metadata = supabaseUser.user_metadata ?? {};

    // Upsert user to our DB (merge by Supabase ID)
    const user = await this.prisma.user.upsert({
      where: { id: supabaseUser.id },
      update: {
        emailVerified: true, // Google users are always verified
        lastLoginAt: new Date(),
        // Update avatar from Google if not manually set
        ...(metadata.avatar_url && { avatarUrl: metadata.avatar_url as string }),
        ...(metadata.full_name && { fullName: metadata.full_name as string }),
      },
      create: {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        fullName: (metadata.full_name as string) ?? (metadata.name as string) ?? 'User',
        avatarUrl: (metadata.avatar_url as string) ?? null,
        role: 'user',
        plan: 'free',
        emailVerified: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        plan: true,
        onboardingCompleted: true,
      },
    });

    this.logger.log(`Google SSO: ${user.email} (${user.onboardingCompleted ? 'existing' : 'new'})`);

    return {
      user,
      isNewUser: !user.onboardingCompleted,
    };
  }
}
