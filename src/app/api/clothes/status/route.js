// src/app/api/inventory/status/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year'));
    const month = parseInt(searchParams.get('month'));
    const factory = searchParams.get('factory');

    // 計算日期範圍
    const currentMonthStart = new Date(year, month - 1, 1);
    const currentMonthEnd = endOfMonth(currentMonthStart);
    const lastMonthStart = startOfMonth(subMonths(currentMonthStart, 1));

    if (!factory) {
      return NextResponse.json({
        success: false,
        message: '未提供廠區'
      }, { status: 400 });
    }

    const whereCondition = {
      fa_id: factory,
      doc_date: {
        gte: currentMonthStart,
        lte: currentMonthEnd
      }
    };

    // 使用交易確保資料一致性
    const data = await prisma.$transaction(async (tx) => {
      // 上個月結存資料
      const lastMonthBalance = await tx.monthlyBalance.findMany({
        where: {
          fa_id: factory,
          year: lastMonthStart.getFullYear(),
          month: lastMonthStart.getMonth() + 1
        }
      });

      // 本月資料
      const [inData, outData, adjData] = await Promise.all([
        // 入庫資料
        tx.clothesIn.groupBy({
          by: ['fa_id', 'od_no', 'color_name', 'po', 'size'],
          where: whereCondition,
          _sum: {
            quantity: true
          }
        }),
        // 出庫資料
        tx.clothesOut.groupBy({
          by: ['fa_id', 'od_no', 'color_name', 'po', 'size'],
          where: whereCondition,
          _sum: {
            quantity: true
          }
        }),
        // 調整資料
        tx.clothesAdj.groupBy({
          by: ['fa_id', 'od_no', 'color_name', 'po', 'size'],
          where: whereCondition,
          _sum: {
            quantity: true
          }
        })
      ]);

      // 合併所有資料
      const allKeys = new Set([
        ...inData.map(item => `${item.fa_id}-${item.od_no}-${item.color_name}-${item.po}-${item.size}`),
        ...outData.map(item => `${item.fa_id}-${item.od_no}-${item.color_name}-${item.po}-${item.size}`),
        ...adjData.map(item => `${item.fa_id}-${item.od_no}-${item.color_name}-${item.po}-${item.size}`),
        ...lastMonthBalance.map(item => `${item.fa_id}-${item.od_no}-${item.color_name}-${item.po}-${item.size}`)
      ]);

      // 整理資料
      const result = Array.from(allKeys).map(key => {
        const [fa_id, od_no, color_name, po, size] = key.split('-');

        // 找到對應的數據
        const opening = lastMonthBalance.find(item =>
          item.fa_id === fa_id &&
          item.od_no === od_no &&
          item.color_name === color_name &&
          item.po === po &&
          item.size === size
        )?.quantity || 0;

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

        return {
          fa_id,
          od_no,
          color_name,
          po,
          size,
          opening,
          in_qty: inQty,
          out_qty: outQty,
          adj_qty: adjQty,
          closing
        };
      });

      return result;
    });

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.log(error.message)
    return NextResponse.json({
      success: false,
      message: '查詢資料時發生錯誤'
    }, { status: 500 });
  }
}