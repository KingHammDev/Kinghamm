import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { items } = body;

    // 基本驗證
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: false,
        message: '無效的輸入資料'
      }, { status: 400 });
    }

    // 驗證所有項目的資料
    for (const item of items) {
      if (!item.productNo || !item.quantity) {
        return NextResponse.json({
          success: false,
          message: '所有項目都必須填寫貨號和數量'
        }, { status: 400 });
      }
    }

    // 生成單據號碼
    const today = new Date();
    const dateStr = format(today, 'yyyyMMdd');

    // 查詢當天最大流水號
    const lastDocument = await prisma.clothesIn.findFirst({
      where: {
        c_in_no: {
          startsWith: `C${dateStr}`
        }
      },
      orderBy: {
        c_in_no: 'desc'
      }
    });

    let sequence = 1;
    if (lastDocument) {
      const lastSequence = parseInt(lastDocument.c_in_no.slice(-4));
      sequence = lastSequence + 1;
    }
    
    const documentNo = `C${dateStr}${sequence.toString().padStart(4, '0')}`;

    // 使用 Prisma 交易，但改用 async/await 方式處理
    const result = await prisma.$transaction(async (tx) => {
      // 批次創建所有項目
      const createdItems = [];
      for (const item of items) {
        const createdItem = await tx.clothesIn.create({
          data: {
            c_in_no: documentNo,
            c_in_id: item.seqNo,
            od_no: item.productNo,
            quantity: parseInt(item.quantity),
            user_id: 1
          }
        });
        createdItems.push(createdItem);
      }
      return createdItems;
    });

    return NextResponse.json({
      success: true,
      message: '儲存成功',
      documentNo,
      items: result
    });

  } catch (error) {
    console.error('Save error:', error);
    
    // 更詳細的錯誤訊息處理
    let errorMessage = '儲存失敗';
    if (error.code === 'P2002') {
      errorMessage = '資料重複';
    }

    return NextResponse.json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}