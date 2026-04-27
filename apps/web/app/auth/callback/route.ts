import { NextRequest, NextResponse } from 'next/server';

/**
 * Auth callback route handler
 * Handles redirects for:
 * - Email verification (token from email link)
 * - Password reset redirect
 *
 * Google SSO is deferred to Phase 2.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get('token');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';

  // Email verification callback
  if (type === 'verify' && token) {
    // TODO: Call NestJS API to verify email token
    return NextResponse.redirect(`${origin}/login?verified=true`);
  }

  // Password reset callback — redirect to reset form with token
  if (type === 'reset' && token) {
    return NextResponse.redirect(`${origin}/reset-password?token=${token}`);
  }

  // Generic callback — just redirect
  if (token) {
    const response = NextResponse.redirect(`${origin}${next}`);
    response.cookies.set('access_token', token, {
      path: '/',
      maxAge: 3600,
      sameSite: 'lax',
    });
    return response;
  }

  // If no token, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=callback_failed`);
}
