import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { updateSession } from './lib/supabase/middleware';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Supabase auth routes — let them pass through without intl routing
  if (pathname.startsWith('/auth/')) {
    return updateSession(request);
  }

  // First run intl middleware, then refresh Supabase session
  const response = intlMiddleware(request);
  return updateSession(request, response);
}

export const config = {
  matcher: [
    '/',
    '/(zh-CN|en|th)/:path*',
    '/auth/:path*',
  ],
};
