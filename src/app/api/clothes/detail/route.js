// src/app/api/inventory/detail/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { startOfMonth, endOfMonth } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get('year'));
        const month = parseInt(searchParams.get('month'));
        const fa_id = searchParams.get('fa_id');
        const od_no = searchParams.get('od_no');
        const color_name = searchParams.get('color_name');
        const po = searchParams.get('po');
        const size = searchParams.get('size');

        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = endOfMonth(monthStart);

        const whereCondition = {
            fa_id,
            od_no,
            color_name,
            po,
            size,
            doc_date: {
                gte: monthStart,
                lte: monthEnd
            }
        };

        const details = await prisma.$transaction(async (tx) => {
            // 取得入庫明細
            const inData = await tx.clothesIn.groupBy({
                by: ['c_in_no', 'user_id', 'doc_date'],
                where: whereCondition,
                _sum: {
                    quantity: true
                },
                orderBy: {
                    c_in_no: 'asc'
                }
            });

            // 取得入庫單據的使用者資訊
            const inUsers = await tx.user.findMany({
                where: {
                    id: {
                        in: inData.map(item => item.user_id)
                    }
                }
            });

            // 取得出庫明細
            const outData = await tx.clothesOut.groupBy({
                by: ['c_out_no', 'user_id', 'doc_date'],
                where: whereCondition,
                _sum: {
                    quantity: true
                },
                orderBy: {
                    c_out_no: 'asc'
                }
            });

            // 取得出庫單據的使用者資訊
            const outUsers = await tx.user.findMany({
                where: {
                    id: {
                        in: outData.map(item => item.user_id)
                    }
                }
            });

            // 取得調整明細
            const adjData = await tx.clothesAdj.groupBy({
                by: ['c_adj_no', 'user_id', 'doc_date'],
                where: whereCondition,
                _sum: {
                    quantity: true
                },
                orderBy: {
                    c_adj_no: 'asc'
                }
            });

            // 取得調整單據的使用者資訊
            const adjUsers = await tx.user.findMany({
                where: {
                    id: {
                        in: adjData.map(item => item.user_id)
                    }
                }
            });

            // 組合資料
            return {
                inData: inData.map(item => ({
                    c_in_no: item.c_in_no,
                    doc_date: item.doc_date.toISOString(),
                    total_quantity: item._sum.quantity,
                    user_name: inUsers.find(user => user.id === item.user_id)?.name || '未知'
                })),
                outData: outData.map(item => ({
                    c_out_no: item.c_out_no,
                    doc_date: item.doc_date.toISOString(),
                    total_quantity: item._sum.quantity,
                    user_name: outUsers.find(user => user.id === item.user_id)?.name || '未知'
                })),
                adjData: adjData.map(item => ({
                    c_adj_no: item.c_adj_no,
                    doc_date: item.doc_date.toISOString(),
                    total_quantity: item._sum.quantity,
                    user_name: adjUsers.find(user => user.id === item.user_id)?.name || '未知'
                }))
            };
        });

        return NextResponse.json({
            success: true,
            data: details
        });

    } catch (error) {
        console.log(error.message);
        return NextResponse.json({
            success: false,
            message: '取得明細資料時發生錯誤'
        }, { status: 500 });
    }
}