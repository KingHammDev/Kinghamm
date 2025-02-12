import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getInventoryData(searchParams) {
  try {
    // 從 PostgreSQL 取得所有相關資料
    const items = await prisma.$transaction(async (tx) => {
      // 根據查詢條件取得資料（這裡以貨號為例）
      const condition = {
        where: {
          od_no: {
            contains: searchParams.productNo
          }
        }
      };

      // 取得入庫、出庫、調整的所有資料
      const [inData, outData, adjData] = await Promise.all([
        tx.clothesIn.findMany(condition),
        tx.clothesOut.findMany(condition),
        tx.clothesAdj.findMany(condition)
      ]);

      // 合併所有資料並根據共同條件分組
      const groupedData = [...inData, ...outData, ...adjData].reduce((acc, item) => {
        const key = `${item.fa_id}-${item.od_no}-${item.color_name}-${item.po}-${item.size}`;
        if (!acc[key]) {
          acc[key] = {
            fa_id: item.fa_id,
            od_no: item.od_no,
            color_name: item.color_name,
            po: item.po,
            size: item.size,
            inQty: 0,
            outQty: 0,
            adjQty: 0
          };
        }

        // 根據資料來源累加數量
        if ('c_in_no' in item) {
          acc[key].inQty += item.quantity;
        } else if ('c_out_no' in item) {
          acc[key].outQty += item.quantity;
        } else if ('c_adj_no' in item) {
          acc[key].adjQty += item.quantity;
        }

        return acc;
      }, {});


      // 計算實際庫存並轉換成陣列
      return Object.values(groupedData)
        .map(item => ({
          ...item,
          quantity: item.inQty - item.outQty + item.adjQty
        }))
        .filter(item => item.quantity > 0); // 只返回有庫存的項目
    });


    return items;
  } catch (error) {
    console.error('Error fetching inventory data:', error);
    throw error;
  }
}

// API 路由
// src/app/api/inventory/route.js
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const items = await getInventoryData({
      productNo: searchParams.get('productNo')
    });

    return NextResponse.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      message: '查詢資料時發生錯誤'
    }, { status: 500 });
  }
}