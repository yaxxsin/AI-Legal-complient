import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Auth callback route handler
 * Handles Supabase redirects for:
 * - Email verification
 * - Password reset
 * - OAuth (Google SSO)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: Record<string, unknown> }) => {
              response.cookies.set(name, value, options as never);
            });
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Sync user to our NestJS backend (handles both email verify and Google SSO)
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token) {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

          const syncResponse = await fetch(`${apiUrl}/auth/google`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          // If user is new (no onboarding), redirect to onboarding
          if (syncResponse.ok) {
            const data = await syncResponse.json();
            if (data.isNewUser) {
              return NextResponse.redirect(`${origin}/onboarding`);
            }
          }
        }
      } catch {
        // Non-blocking: sync failure shouldn't prevent login
        // User will be synced on next API call via auth guard
      }

      return response;
    }
  }

  // If no code or error, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=callback_failed`);
}
