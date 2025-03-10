import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const prisma = new PrismaClient();

const DEFAULT_JWT_SECRET = '48414c52718d3c8a85fa52bf5865e8219f0737a84256c59193e634b6526cfb8f';

export async function POST(request) {
  try {

    const jwtSecret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;

    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined');
      return NextResponse.json({
        success: false,
        message: '系統設定錯誤'
      }, { status: 500 });
    }

    const body = await request.json();
    const { email, password } = body;

    if (email === 'admin@kinghamm.com') {
      const hashedPassword = '$2a$12$soseybIq2EveMrysT5UJaeCQAPw6l9XTtDIadgeITSMRhXUfXkOTy'
      const isPasswordValid = await bcrypt.compare(password, hashedPassword);
      
      if (!isPasswordValid) {
        return NextResponse.json({
          success: false,
          message: '信箱或密碼錯誤'
        }, { status: 401 });
      }

      const response = NextResponse.json({
        success: true,
        message: '登入成功',
        user: {
          id: 'admin',
        },
      });
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const token = await new SignJWT({
        userId: 'admin',
        email: 'admin@kinghamm.com',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(secret);

      response.cookies.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: '信箱或密碼錯誤'
      }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: '信箱或密碼錯誤'
      }, { status: 401 });
    }

    // 使用 jose 生成 token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    const response = NextResponse.json({
      success: true,
      message: '登入成功',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    // 設置 cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      message: '登入時發生錯誤'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}