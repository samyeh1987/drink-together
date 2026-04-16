import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** Extract locale from a path like '/en/meals' or fallback to 'en' */
function extractLocale(path: string): string {
  const match = path.match(/^\/(en|zh-CN|th)(?:\/|$)/);
  return match ? match[1] : 'en';
}

// This route handles Supabase email confirmation links
// Supabase sends: /auth/confirm?token_hash=xxx&type=email&next=/en/meals
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as 'email' | 'recovery' | null;
  const next = requestUrl.searchParams.get('next') ?? '/en/meals';
  const locale = extractLocale(next);

  if (token_hash && type) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore in Server Component context
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({ token_hash, type });

    if (!error) {
      if (type === 'recovery') {
        // For password reset, redirect to reset-password page (locale-aware)
        return NextResponse.redirect(
          new URL(`/${locale}/auth/reset-password?verified=1`, requestUrl.origin)
        );
      }
      // Email confirmation success → go to meals or next
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Failure → back to login with error, preserving locale
  return NextResponse.redirect(
    new URL(`/${locale}/auth/login?error=confirmation_failed`, requestUrl.origin)
  );
}
