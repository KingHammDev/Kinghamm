import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { docNo } = await params;

    // 取得文件及其所有項目
    const items = await prisma.clothesOut.findMany({
      where: {
        c_out_no: docNo
      },
      orderBy: {
        c_out_id: 'asc'
      }
    });

    if (!items.length) {
      return NextResponse.json({
        success: false,
        message: '找不到文件'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      document: {
        c_out_no: docNo
      },
      items: items
    });

  } catch (error) {
    console.log(error.message);
    return NextResponse.json({
      success: false,
      message: '讀取文件時發生錯誤'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request, { params }) {
  try {
    const { docNo } = await params;
    const body = await request.json();
    const { items } = body;

    // 使用交易來更新資料
    await prisma.$transaction(async (tx) => {
      // 先刪除原有的項目
      await tx.clothesOut.deleteMany({
        where: {
          c_out_no: docNo
        }
      });

      // 新增更新後的項目
      for (const item of items) {
        await tx.clothesOut.create({
          data: {
            c_out_no: docNo,
            c_out_id: parseInt(item.seqNo),
            od_no: item.productNo,
            color_name: item.colorName,
            po: item.po,
            size: item.size,
            quantity: parseInt(item.quantity),
            user_id: item.userId,
            fa_id: item.faId
          }
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: '更新成功'
    });

  } catch (error) {
    console.log(error.message);
    return NextResponse.json({
      success: false,
      message: '更新文件時發生錯誤'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}