import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkInventoryBalance } from '@/utils/inventory';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { docNo } = await params;

    // 取得文件及其所有項目
    const items = await prisma.clothesAdj.findMany({
      where: {
        c_adj_no: docNo
      },
      orderBy: {
        c_adj_id: 'asc'
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
        c_adj_no: docNo
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
    const originalItems = await prisma.clothesAdj.findMany({
      where: {
        c_adj_no: docNo
      }
    });

    // 為每個項目計算數量差異
    const itemChanges = items.map(newItem => {
      const originalItem = originalItems.find(orig => orig.c_adj_id === parseInt(newItem.seqNo));
      return {
        ...newItem,
        od_no: newItem.productNo,
        fa_id: newItem.faId,
        color_name: newItem.colorName,
        type: 'adj',
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
      // 先刪除原有的項目
      await tx.clothesAdj.deleteMany({
        where: {
          c_adj_no: docNo
        }
      });

      // 新增更新後的項目
      for (const item of items) {
        await tx.clothesAdj.create({
          data: {
            c_adj_no: docNo,
            c_adj_id: parseInt(item.seqNo),
            fa_id: item.faId,
            od_no: item.productNo,
            color_name: item.colorName,
            po: item.po,
            size: item.size,
            quantity: parseInt(item.quantity),
            user_id: item.userId
          }
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: '更新成功'
    });

  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({
      success: false,
      message: '更新時發生錯誤',
      error: error.message
    }, { status: 500 });
  }
}