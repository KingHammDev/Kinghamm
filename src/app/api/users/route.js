import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 驗證 schema
const userSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件'),
  name: z.string().min(2, '名稱至少需要 2 個字元'),
  password: z.string().min(6, '密碼至少需要 6 個字元'),
});

// 獲取所有使用者
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      message: '獲取使用者列表時發生錯誤',
    }, { status: 500 });
  }
}

// 創建新使用者
export async function POST(request) {
  try {
    console.log(request)
    const body = await request.json();

    console.log(body)
    
    // 驗證輸入資料
    const validationResult = userSchema.safeParse(body);

    console.log(validationResult.success)

    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: '輸入資料格式不正確',
        errors: validationResult.error.errors,
      }, { status: 400 });
    }

    const { email, name, password } = validationResult.data;

    console.log(validationResult.data)

    // 檢查電子郵件是否已存在
    // const existingUser = await prisma.user.findUnique({
    //   where: { email: email },
    // });

    // console.log(existingUser)
    const existingUser = false
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: '此電子郵件已被使用',
      }, { status: 400 });
    }

    // 密碼加密
    const hashedPassword = await bcrypt.hash(password, 12);

    // 創建新使用者
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: '使用者創建成功',
      user,
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({
      success: false,
      message: '創建使用者時發生錯誤',
    }, { status: 500 });
  }
};