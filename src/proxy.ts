
import { NextRequest, NextResponse } from 'next/server';
import { getUser } from './lib/auth-helpers';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith('/api/');

  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  let user = null;

  try {
    user = await getUser();
  } catch {
    user = null;
  }

  const isAuthed = Boolean(user && user.id);

  if (!isAuthed) {
    if (isApiRoute) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (pathname === '/signin' || pathname === '/signup') {
      return NextResponse.next();
    }

    return NextResponse.redirect(
      new URL('/signin', request.url)
    );
  }

  const isAdmin = user?.role === 'admin';

  if (isApiRoute && !isAdmin) {
    return NextResponse.json(
      { message: 'Forbidden' },
      { status: 403 }
    );
  }

  if (pathname === '/signin' || pathname === '/signup') {
    return NextResponse.redirect(
      new URL(isAdmin ? '/dashboard' : '/', request.url)
    );
  }

  if (isAdmin && pathname === '/') {
    return NextResponse.redirect(
      new URL('/dashboard', request.url)
    );
  }

  const inDashboard =
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/');

  if (!isAdmin && inDashboard) {
    return NextResponse.redirect(
      new URL('/', request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/signin',
    '/signup',
    '/api/:path*',
  ],
};