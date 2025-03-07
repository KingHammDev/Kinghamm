import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkInventoryBalance } from '@/utils/inventory';

const prisma = new PrismaClient();

export async function DELETE(request, { params }) {
  try {
    const { docNo } = await params;
    const body = await request.json();
    const { itemIds } = body;

    // 取得要刪除的項目資料
    const itemsToDelete = await prisma.clothesIn.findMany({
      where: {
        c_in_no: docNo,
        c_in_id: { in: itemIds }
      }
    });

    // 檢查庫存平衡
    const checkResult = await checkInventoryBalance(
      itemsToDelete.map(item => ({
        ...item,
        type: 'in'  // 標記為入庫單據
      }))
    );

    if (!checkResult.valid) {
      return NextResponse.json({
        success: false,
        message: checkResult.message
      }, { status: 400 });
    }

    // 使用交易進行刪除
    await prisma.$transaction(async (tx) => {
      // 刪除指定的項目
      await tx.clothesIn.deleteMany({
        where: {
          AND: [
            { c_in_no: docNo },
            { c_in_id: { in: itemIds } }
          ]
        }
      });

      // 重新排序剩餘項目的序號
      const remainingItems = await tx.clothesIn.findMany({
        where: { c_in_no: docNo },
        orderBy: { c_in_id: 'asc' }
      });

      for (let i = 0; i < remainingItems.length; i++) {
        await tx.clothesIn.update({
          where: {
            c_in_no_c_in_id: {
              c_in_no: docNo,
              c_in_id: remainingItems[i].c_in_id
            }
          },
          data: {
            c_in_id: i + 1
          }
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: '刪除成功'
    });

  } catch (error) {
    console.log(error.message);
    return NextResponse.json({
      success: false,
      message: '刪除項目時發生錯誤'
    }, { status: 500 });
  }
}