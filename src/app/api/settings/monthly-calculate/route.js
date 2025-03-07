// src/app/api/settings/monthly-calculate/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { endOfMonth } from 'date-fns';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { year, month, userId } = body;

    // 計算日期範圍
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = endOfMonth(monthStart);

    // 使用交易進行月結作業
    await prisma.$transaction(async (tx) => {
      // 先刪除該月份已存在的結存資料
      await tx.monthlyBalance.deleteMany({
        where: {
          year,
          month
        }
      });

      // 取得當月所有異動資料
      const [inData, outData, adjData] = await Promise.all([
        // 入庫資料
        tx.clothesIn.groupBy({
          by: ['fa_id', 'od_no', 'color_name', 'po', 'size'],
          where: {
            doc_date: {
              gte: monthStart,
              lte: monthEnd
            }
          },
          _sum: {
            quantity: true
          }
        }),
        // 出庫資料
        tx.clothesOut.groupBy({
          by: ['fa_id', 'od_no', 'color_name', 'po', 'size'],
          where: {
            doc_date: {
              gte: monthStart,
              lte: monthEnd
            }
          },
          _sum: {
            quantity: true
          }
        }),
        // 調整資料
        tx.clothesAdj.groupBy({
          by: ['fa_id', 'od_no', 'color_name', 'po', 'size'],
          where: {
            doc_date: {
              gte: monthStart,
              lte: monthEnd
            }
          },
          _sum: {
            quantity: true
          }
        })
      ]);

      // 取得上月結存資料
      const lastMonthBalance = await tx.monthlyBalance.findMany({
        where: {
          year: month === 1 ? year - 1 : year,
          month: month === 1 ? 12 : month - 1
        }
      });

      // 整理所有唯一的品項
      const allKeys = new Set([
        ...inData.map(item => `${item.fa_id}-${item.od_no}-${item.color_name}-${item.po}-${item.size}`),
        ...outData.map(item => `${item.fa_id}-${item.od_no}-${item.color_name}-${item.po}-${item.size}`),
        ...adjData.map(item => `${item.fa_id}-${item.od_no}-${item.color_name}-${item.po}-${item.size}`),
        ...lastMonthBalance.map(item => `${item.fa_id}-${item.od_no}-${item.color_name}-${item.po}-${item.size}`)
      ]);

      // 建立本月結存資料
      for (const key of allKeys) {
        const [fa_id, od_no, color_name, po, size] = key.split('-');

        // 計算期初（上月結存）
        const opening = lastMonthBalance.find(item =>
          item.fa_id === fa_id &&
          item.od_no === od_no &&
          item.color_name === color_name &&
          item.po === po &&
          item.size === size
        )?.quantity || 0;

        // 計算當月異動
        const inQty = inData.find(item =>
          item.fa_id === fa_id &&
          item.od_no === od_no &&
          item.color_name === color_name &&
          item.po === po &&
          item.size === size
        )?._sum.quantity || 0;

        const outQty = outData.find(item =>
          item.fa_id === fa_id &&
          item.od_no === od_no &&
          item.color_name === color_name &&
          item.po === po &&
          item.size === size
        )?._sum.quantity || 0;

        const adjQty = adjData.find(item =>
          item.fa_id === fa_id &&
          item.od_no === od_no &&
          item.color_name === color_name &&
          item.po === po &&
          item.size === size
        )?._sum.quantity || 0;

        // 計算結存
        const closing = opening + inQty - outQty + adjQty;
        // 儲存結存資料
        if (closing !== 0) {
          await tx.monthlyBalance.create({
            data: {
              year,
              month,
              fa_id,
              od_no,
              color_name,
              po,
              size,
              quantity: closing,
              user_id: userId
            }
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: '月結作業完成'
    });

  } catch (error) {
    console.log(error.message);
    return NextResponse.json({
      success: false,
      message: '月結作業失敗'
    }, { status: 500 });
  }
}