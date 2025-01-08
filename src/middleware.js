import { NextResponse } from 'next/server';
import { verifyAuth } from './lib/auth';

// 需要認證的路徑
const protectedPaths = [];
// 公開路徑
const publicPaths = ['/login', '/register', '/forgot-password'];

export async function middleware(request) {
  const path = request.nextUrl.pathname;

  // 處理需要認證的路徑
  if (protectedPaths.some(pp => path.startsWith(pp))) {
    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      // 未登入，重導向到登入頁面
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      // 驗證 token
      await verifyAuth(authToken);
      return NextResponse.next();
    } catch (error) {
      // token 無效，重導向到登入頁面
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 處理已登入用戶訪問登入頁面的情況
  if (publicPaths.includes(path)) {
    const authToken = request.cookies.get('auth_token')?.value;
    if (authToken) {
      try {
        await verifyAuth(authToken);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch (error) {
        // Token 無效，繼續顯示登入頁面
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/users/:path*',
    '/accounting/:path*',
    '/settings/:path*',
    '/login',
    '/register',
    '/forgot-password'
  ],
};