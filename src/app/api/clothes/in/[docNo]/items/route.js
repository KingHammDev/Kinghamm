import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(request, { params }) {
    try {
        const { docNo } = params;
        const body = await request.json();
        const { itemIds } = body;

        if (!Array.isArray(itemIds) || itemIds.length === 0) {
            return NextResponse.json({
                success: false,
                message: '無效的刪除項目'
            }, { status: 400 });
        }

        // 使用交易確保資料一致性
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

            // 逐一更新序號
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
        console.error('Delete error:', error);
        return NextResponse.json({
            success: false,
            message: '刪除項目時發生錯誤'
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}