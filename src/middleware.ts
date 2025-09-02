import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

// Requiere sesión para acceder a rutas protegidas.
export async function middleware(request: NextRequest) {
  // Si no hay sesión, redirige al login conservando el returnTo
  const session = await auth0.getSession(request);
  if (!session?.user) {
    const loginUrl = new URL('/auth/login', request.url);
    const returnTo = request.nextUrl.pathname + request.nextUrl.search;
    loginUrl.searchParams.set('returnTo', returnTo);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Excluir: root ("/"), rutas de auth, API, estáticos y register
    '/((?!$|auth|api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|register).*)',
  ],
};
