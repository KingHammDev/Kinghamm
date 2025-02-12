// src/app/api/users/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 取得使用者列表
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const faId = searchParams.get('faId');

    const whereCondition = faId ? { faId } : {};

    const users = await prisma.user.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      message: '取得使用者列表失敗'
    }, { status: 500 });
  }
}

// 新增使用者
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name, faId } = body;

    // 檢查必填欄位
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: '請填寫必填欄位'
      }, { status: 400 });
    }

    // 檢查電子郵件是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: '此電子郵件已被使用'
      }, { status: 400 });
    }

    // 密碼加密
    const hashedPassword = await bcrypt.hash(password, 12);

    // 建立使用者
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        faId
      }
    });

    return NextResponse.json({
      success: true,
      message: '使用者新增成功',
      user
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({
      success: false,
      message: '新增使用者失敗'
    }, { status: 500 });
  }
}