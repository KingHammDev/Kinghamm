import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkInventoryBalance } from '@/utils/inventory';

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
        c_out_no: docNo,
        doc_date: items[0].doc_date
      },
      items: items
    });

  } catch (error) {
    console.log(error);
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

    // 先獲取原有的資料
    const originalItems = await prisma.clothesOut.findMany({
      where: {
        c_out_no: docNo
      }
    });

    console.log(originalItems)
    // 為每個項目計算數量差異
    const itemChanges = items.map(newItem => {
      const originalItem = originalItems.find(orig => orig.c_out_id === parseInt(newItem.seqNo));
      return {
        ...newItem,
        od_no: newItem.productNo,
        fa_id: newItem.faId,
        color_name: newItem.colorName,
        type: 'out',
        oldQuantity: originalItem ? originalItem.quantity : 0,
        newQuantity: parseInt(newItem.quantity)
      };
    });

    // 檢查庫存變化，傳入 isUpdate = true
    const checkResult = await checkInventoryBalance(itemChanges, true);

    if (!checkResult.valid) {
      return NextResponse.json({
        success: false,
        message: checkResult.message
      }, { status: 400 });
    }

    // 使用交易進行更新
    await prisma.$transaction(async (tx) => {
      const { doc_date } = await tx.clothesOut.findFirst({
        where: {
          c_adj_no: docNo
        },
        select: {
          doc_date: true
        }
      })
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
            fa_id: item.faId,
            od_no: item.productNo,
            color_name: item.colorName,
            po: item.po,
            size: item.size,
            quantity: parseInt(item.quantity),
            user_id: item.userId,
            doc_date
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
      message: '更新時發生錯誤',
      error: error.message
    }, { status: 500 });
  }
}