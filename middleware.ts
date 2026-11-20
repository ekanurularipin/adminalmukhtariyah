import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Ambil sesi user
  const { data: { session } } = await supabase.auth.getSession();

  const isGuruLoggedIn = request.cookies.get('guru_auth')?.value === '1';
  const hasAnySession = Boolean(session) || isGuruLoggedIn;

  const url = request.nextUrl.clone();
  const path = url.pathname;

  // 1. Izinkan akses ke halaman /auth/login dan webhook /api/telegram tanpa login
  if (path.startsWith('/auth/login') || path.startsWith('/api/telegram')) {
    if (hasAnySession && path.startsWith('/auth/login')) {
      url.pathname =
        isGuruLoggedIn && !session ? '/DashboardGuru/akun-guru/dashboard' : '/';
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (isGuruLoggedIn && !session && !path.startsWith('/DashboardGuru')) {
    url.pathname = '/DashboardGuru/akun-guru/dashboard';
    return NextResponse.redirect(url);
  }

  // 2. Jika BELUM LOGIN dan mencoba membuka halaman lain (dashboard, dll), tendang ke /auth/login
  if (!hasAnySession) {
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Matcher untuk semua rute kecuali file statis, manifest, icons, dan api telegram
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)',
  ],
};