import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';
import { checkInventoryBalance } from '@/utils/inventory';


const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { items, docDate, userData } = body;
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

    // 檢查調整數量是否會導致負庫存
    const checkResult = await checkInventoryBalance(
      items.map(item => ({
        od_no: item.productNo,
        color_name: item.colorName,
        po: item.po,
        size: item.size,
        fa_id: item.fa_id,
        quantity: parseInt(item.quantity),
        type: 'adj'  // 標示為調整類型
      }))
    );

    if (!checkResult.valid) {
      return NextResponse.json({
        success: false,
        message: checkResult.message
      }, { status: 400 });
    }
    // 生成單據號碼
    const today = new Date();
    const dateStr = format(today, 'yyyyMMdd');

    // 查詢當天最大流水號
    const lastDocument = await prisma.clothesAdj.findFirst({
      where: {
        c_adj_no: {
          startsWith: `${items[0].faId}A${dateStr}`
        }
      },
      orderBy: {
        c_adj_no: 'desc'
      }
    });

    let sequence = 1;
    if (lastDocument) {
      const lastSequence = parseInt(lastDocument.c_adj_no.slice(-4));
      sequence = lastSequence + 1;
    }

    const documentNo = `${items[0].faId}A${dateStr}${sequence.toString().padStart(4, '0')}`;

    // 使用 transaction 進行資料儲存
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.clothesAdj.create({
          data: {
            c_adj_no: documentNo,
            c_adj_id: parseInt(item.seqNo),
            od_no: item.productNo,
            color_name: item.colorName,
            po: item.po,
            size: item.size,
            quantity: parseInt(item.quantity),
            doc_date: new Date(docDate),
            user_id: userData.id,
            fa_id: userData.faId
          }
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: '儲存成功',
      documentNo
    });

  } catch (error) {
    console.log(error.message);

    return NextResponse.json({
      success: false,
      message: '儲存失敗',
      error: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}