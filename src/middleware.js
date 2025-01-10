// src/middleware.js
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// 需要認證的路徑
const protectedPaths = [
  '/dashboard', 
  '/clothes',      
  '/accounting', 
  '/settings'
];

// 使用 jose 來驗證 token
async function verifyToken(token) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function middleware(request) {
  const path = request.nextUrl.pathname;

  // 檢查是否是受保護的路徑
  if (protectedPaths.some(pp => path.startsWith(pp))) {
    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 使用 verifyToken 進行驗證
    const payload = await verifyToken(authToken);
    if (!payload) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
  }

  // 處理已登入用戶訪問登入頁面的情況
  if (path === '/login') {
    const authToken = request.cookies.get('auth_token')?.value;
    if (authToken) {
      const payload = await verifyToken(authToken);
      if (payload) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/clothes/:path*',
    '/accounting/:path*',
    '/settings/:path*',
    '/login'
  ]
};