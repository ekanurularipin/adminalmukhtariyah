import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = request.nextUrl.clone();
  const path = url.pathname;

  // 1. Lewatkan file statis, gambar, manifest, dan service worker agar tidak kena redirect login
  if (
    path.startsWith('/_next') ||
    path.startsWith('/images') ||
    path === '/favicon.ico' ||
    path === '/manifest.json' ||
    path === '/manifest.webmanifest' ||
    path === '/sw.js' ||
    /\.(png|jpg|jpeg|webp|gif|svg|ico|woff2?|ttf|css|js|map)$/i.test(path)
  ) {
    return response;
  }

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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isGuruLoggedIn = request.cookies.get('guru_auth')?.value === '1';
  const hasAnySession = Boolean(session) || isGuruLoggedIn;

  // 2. Izinkan akses ke halaman /auth/login dan webhook /api/telegram tanpa login
  if (path.startsWith('/auth/login') || path.startsWith('/api/telegram')) {
    if (hasAnySession && path.startsWith('/auth/login')) {
      url.pathname =
        isGuruLoggedIn && !session ? '/DashboardGuru/akun-guru/dashboard' : '/';
      return NextResponse.redirect(url);
    }
    return response;
  }

  // 3. Jika sesi guru aktif (dan tidak ada sesi Supabase Auth), arahkan ke dashboard guru
  if (isGuruLoggedIn && !session && !path.startsWith('/DashboardGuru')) {
    url.pathname = '/DashboardGuru/akun-guru/dashboard';
    return NextResponse.redirect(url);
  }

  // 4. Jika belum login sama sekali, arahkan ke /auth/login
  if (!hasAnySession) {
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|sw.js|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|css|js|map)$).*)',
  ],
};