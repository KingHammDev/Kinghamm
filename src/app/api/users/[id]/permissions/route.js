import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 取得使用者權限
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    const permissions = await prisma.userPermission.findMany({
      where: {
        userId: parseInt(id)
      }
    });

    return NextResponse.json({
      success: true,
      permissions
    });

  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json({
      success: false,
      message: '取得權限設定失敗'
    }, { status: 500 });
  }
}

// 更新使用者權限
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { permissions } = await request.json();

    await prisma.$transaction(async (tx) => {
      // 先刪除現有權限
      await tx.userPermission.deleteMany({
        where: {
          userId: parseInt(id)
        }
      });

      // 新增新的權限設定
      for (const [moduleId, actions] of Object.entries(permissions)) {
        if (actions && actions.length > 0) {
          await tx.userPermission.create({
            data: {
              userId: parseInt(id),
              moduleId,
              actions
            }
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: '權限更新成功'
    });

  } catch (error) {
    console.log(error.message);
    return NextResponse.json({
      success: false,
      message: '更新權限設定失敗'
    }, { status: 500 });
  }
}