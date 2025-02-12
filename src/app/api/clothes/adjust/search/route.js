import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productNo = searchParams.get('productNo');

    if (!productNo) {
      return NextResponse.json({
        success: false,
        message: '請輸入貨號進行查詢'
      }, { status: 400 });
    }

    // 先找出包含該貨號的所有入庫單據
    const documents = await prisma.clothesAdj.findMany({
      where: {
        od_no: {
          contains: productNo
        }
      },
      orderBy: {
        c_adj_no: 'desc'
      }
    });

    // 整理資料，將相同單號的資料合併
    const groupedDocs = documents.reduce((acc, curr) => {
      if (!acc[curr.c_adj_no]) {
        acc[curr.c_adj_no] = {
          c_adj_no: curr.c_adj_no,
          created_at: curr.created_at,
          items: []
        };
      }
      acc[curr.c_adj_no].items.push({
        od_no: curr.od_no,
        quantity: curr.quantity
      });
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: documents,
      documents: Object.values(groupedDocs).map(doc => ({
        c_adj_no: doc.c_adj_no,
        created_at: doc.created_at,
        itemCount: doc.items.length,
        totalQuantity: doc.items.reduce((sum, item) => sum + item.quantity, 0)
      }))
    });

  } catch (error) {
    console.error('Error searching documents:', error);
    return NextResponse.json({
      success: false,
      message: '查詢單據時發生錯誤'
    }, { status: 500 });
  }
}