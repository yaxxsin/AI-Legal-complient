import { type NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/onboarding', '/chat', '/checklist', '/documents', '/notifications', '/billing', '/settings'];
const ADMIN_ROUTES = ['/admin'];
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Read JWT from cookie
  const token = request.cookies.get('access_token')?.value;
  const hasAuth = !!token;

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAdmin = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isAuth = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  // Redirect unauthenticated users away from protected routes
  if (!hasAuth && (isProtected || isAdmin)) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth pages
  if (hasAuth && isAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
