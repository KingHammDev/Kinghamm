import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    // 檢查環境變數
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    // 確保 JWT_SECRET 存在
    if (!process.env.JWT_SECRET) {
      console.error('Missing JWT_SECRET in environment variables');
      return NextResponse.json({
        success: false,
        message: '系統配置錯誤 (JWT_SECRET missing)',
      }, { status: 500 });
    }

    // 解析請求內容
    const body = await request.json();
    console.log('Request body:', { ...body, password: '[HIDDEN]' });
    
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: '請輸入電子郵件和密碼',
      }, { status: 400 });
    }

    // 查找使用者
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: '信箱或密碼錯誤',
      }, { status: 401 });
    }

    // 驗證密碼
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: '信箱或密碼錯誤',
      }, { status: 401 });
    }

    // 準備 token payload
    const payload = {
      userId: user.id,
      email: user.email,
    };

    console.log('Token payload:', payload);

    // 生成 JWT token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 建立回應
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
    console.error('Login error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    return NextResponse.json({
      success: false,
      message: '登入時發生錯誤',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}