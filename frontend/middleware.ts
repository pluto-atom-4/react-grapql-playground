import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/', '/builds'];

export function middleware(request: NextRequest): NextResponse | undefined {
  const pathname = request.nextUrl.pathname;

  // Get token from cookies (set by AuthProvider if available)
  // For now, we rely on client-side redirect since localStorage isn't available in middleware
  // A better approach would be to use httpOnly cookies for the token

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // If accessing protected route without token, redirect to login
  // Note: This is a simplified check. In production, you'd verify the token from cookies
  if (isProtectedRoute) {
    // Without httpOnly cookies, we can't check auth in middleware
    // Client-side redirect in AuthProvider will handle this
  }

  return undefined;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
