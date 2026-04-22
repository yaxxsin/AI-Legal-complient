import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService, COOKIE_OPTIONS } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

/** Extract session metadata from request */
function getSessionMeta(req: Request) {
  return {
    ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.socket?.remoteAddress
      || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
  };
}

/** Set auth cookies on response */
function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  isProduction: boolean,
) {
  const opts = { ...COOKIE_OPTIONS, secure: isProduction };

  res.cookie('access_token', accessToken, {
    ...opts,
    maxAge: 3600 * 1000, // 1 hour
  });

  res.cookie('refresh_token', refreshToken, {
    ...opts,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/api/v1/auth', // Only sent to auth endpoints
  });
}

/** Clear auth cookies */
function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/api/v1/auth' });
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly isProduction: boolean;

  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {
    this.isProduction = this.config.get<string>('NODE_ENV') === 'production';
  }

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 per minute
  @ApiOperation({ summary: 'Register via email + password' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = getSessionMeta(req);
    const result = await this.authService.register(dto, meta);

    setAuthCookies(res, result.accessToken, result.refreshToken, this.isProduction);

    return {
      success: true,
      data: {
        user: result.user,
        expiresIn: result.expiresIn,
      },
    };
  }

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 10 } }) // 10 per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login via email + password' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = getSessionMeta(req);
    const result = await this.authService.login(dto, meta);

    setAuthCookies(res, result.accessToken, result.refreshToken, this.isProduction);

    return {
      success: true,
      data: {
        user: result.user,
        expiresIn: result.expiresIn,
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout — revoke session + clear cookies' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    await this.authService.logout(refreshToken);
    clearAuthCookies(res);

    return { success: true, message: 'Logged out' };
  }

  @Post('forgot-password')
  @Throttle({ default: { ttl: 60000, limit: 3 } }) // 3 per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { success: true, message: 'Jika email terdaftar, link reset telah dikirim' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set new password with reset token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { success: true, message: 'Password berhasil diubah. Silakan login kembali.' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token (rotates refresh token)' })
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const oldRefreshToken = req.cookies?.refresh_token || req.body?.refreshToken;

    if (!oldRefreshToken) {
      clearAuthCookies(res);
      return { success: false, message: 'No refresh token provided' };
    }

    const meta = getSessionMeta(req);
    const result = await this.authService.refreshToken(oldRefreshToken, meta);

    setAuthCookies(res, result.accessToken, result.refreshToken, this.isProduction);

    return {
      success: true,
      data: { expiresIn: result.expiresIn },
    };
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email — redirect from email link' })
  async verifyEmail(
    @Query('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    const frontendUrl = this.config.get('CORS_ORIGIN', 'http://localhost:3000');
    // TODO: Verify token and mark user.emailVerified = true
    res.redirect(`${frontendUrl}/login?verified=true`);
  }

  // ==========================================
  // SESSION MANAGEMENT ENDPOINTS
  // ==========================================

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @ApiOperation({ summary: 'List all active sessions for current user' })
  async getSessions(@Req() req: Request) {
    const userId = (req as any).user.id;
    const sessions = await this.authService.getUserSessions(userId);
    return { success: true, data: sessions };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Revoke a specific session' })
  async revokeSession(
    @Req() req: Request,
    @Param('sessionId') sessionId: string,
  ) {
    const userId = (req as any).user.id;
    await this.authService.revokeSession(userId, sessionId);
    return { success: true, message: 'Session revoked' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/revoke-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke all sessions (force logout everywhere)' })
  async revokeAllSessions(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = (req as any).user.id;
    const count = await this.authService.revokeAllSessions(userId);
    clearAuthCookies(res);
    return { success: true, message: `${count} sessions revoked` };
  }
}
