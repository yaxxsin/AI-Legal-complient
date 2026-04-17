import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register via email + password' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login via email + password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout — revoke session' })
  async logout(
    @Headers('authorization') authHeader: string,
  ): Promise<void> {
    const token = authHeader?.replace('Bearer ', '');
    if (token) {
      await this.authService.logout(token);
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { message: 'Jika email terdaftar, link reset telah dikirim' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set new password with reset token' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Headers('authorization') authHeader: string,
  ) {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return { message: 'Token tidak valid' };
    }
    await this.authService.resetPassword(token, dto.password);
    return { message: 'Password berhasil diubah' };
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email — redirect from email link' })
  async verifyEmail(
    @Query('token') token: string,
    @Query('type') type: string,
    @Res() res: Response,
  ): Promise<void> {
    const frontendUrl = this.config.get('CORS_ORIGIN', 'http://localhost:3000');

    if (type === 'signup' || type === 'email') {
      // Supabase already verified the email when user clicked the link
      // Redirect to frontend callback to exchange code for session
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&type=${type}`);
    } else {
      res.redirect(`${frontendUrl}/login?verified=true`);
    }
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync Google SSO user to our database' })
  async loginWithGoogle(
    @Headers('authorization') authHeader: string,
  ) {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return { success: false, error: 'Token required' };
    }
    return this.authService.loginWithGoogle(token);
  }
}
