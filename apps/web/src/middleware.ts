import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Gating de rutas en el servidor (defensa en profundidad).
 *
 * Este middleware impide que las páginas privadas se sirvan a usuarios sin
 * sesión y que las de administración/productor se sirvan a roles que no
 * corresponden. NO sustituye a la autorización del backend: la validación real
 * (firma del JWT y rol) la hace cada microservicio en sus endpoints. Aquí solo
 * se decodifica el payload del token para un chequeo de UX, sin confiar en él
 * como única fuente de verdad.
 */

const PROTECTED = ['/admin', '/checkout', '/orders', '/profile', '/producer'];
const ADMIN_ONLY = ['/admin'];
const PROVIDER_ONLY = ['/producer'];

interface JwtPayload {
  role?: string;
  exp?: number;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '='));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get('eco_session')?.value;
  if (!token) {
    const login = new URL('/auth/login', req.url);
    login.searchParams.set('redirect', pathname);
    return NextResponse.redirect(login);
  }

  const payload = decodeJwt(token);
  // Token expirado o ilegible → volver a iniciar sesión.
  if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
    const login = new URL('/auth/login', req.url);
    login.searchParams.set('redirect', pathname);
    const res = NextResponse.redirect(login);
    res.cookies.delete('eco_session');
    return res;
  }

  const role = payload.role;
  const isAdminRoute = ADMIN_ONLY.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isProviderRoute = PROVIDER_ONLY.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (isAdminRoute && role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }
  if (isProviderRoute && role !== 'provider' && role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/checkout/:path*', '/orders/:path*', '/profile/:path*', '/producer/:path*'],
};
