// src/app/api/clothes/adjust/import/route.js

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';
import { checkInventoryBalance } from '@/utils/inventory';
import { parseForm } from '@/utils/formidable';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        // 解析表單數據
        const { fields, files } = await parseForm(request);
        const file = files.file?.[0];
        const action = new URL(request.url).searchParams.get('action') || 'import';

        if (!file || !file.data) {
            return NextResponse.json({
                success: false,
                message: '請上傳Excel文件'
            }, { status: 400 });
        }

        // 直接從記憶體讀取Excel檔案
        const workbook = XLSX.read(file.data, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // 檢查數據格式
        if (rawData.length < 2) {
            return NextResponse.json({
                success: false,
                message: 'Excel文件格式不正確或沒有數據'
            }, { status: 400 });
        }

        // 取得表頭
        const headers = rawData[0];
        const expectedHeaders = ['貨號', '顏色', 'PO', '尺寸', '數量'];

        // 檢查必要欄位是否存在
        const requiredColumns = {};
        expectedHeaders.forEach(header => {
            const index = headers.findIndex(h => h && h.toString().trim().includes(header));
            if (index === -1) {
                throw new Error(`找不到必要欄位: ${header}`);
            }
            requiredColumns[header] = index;
        });

        // 處理數據
        const processedData = [];
        for (let i = 1; i < rawData.length; i++) {
            const row = rawData[i];

            // 跳過空行
            if (!row.length || !row[requiredColumns['貨號']]) continue;

            const item = {
                od_no: row[requiredColumns['貨號']].toString().trim(),
                color_name: row[requiredColumns['顏色']]?.toString().trim() || '',
                po: row[requiredColumns['PO']]?.toString().trim() || '',
                size: row[requiredColumns['尺寸']]?.toString().trim() || '',
                quantity: parseInt(row[requiredColumns['數量']] || 0, 10),
            };

            // 驗證數據
            if (!item.od_no || !item.quantity) continue;

            processedData.push(item);
        }

        // 如果是預覽模式，直接返回處理後的數據
        if (action === 'preview') {
            return NextResponse.json({
                success: true,
                data: processedData
            });
        }

        // 獲取表單字段
        const docDate = fields.docDate || format(new Date(), 'yyyy-MM-dd');
        const userId = parseInt(fields.userId, 10);
        const faId = fields.faId;

        if (!userId || !faId) {
            return NextResponse.json({
                success: false,
                message: '缺少必要的用戶信息'
            }, { status: 400 });
        }

        // 為每個項目添加廠區信息
        const itemsWithFaId = processedData.map(item => ({
            ...item,
            fa_id: faId,
            type: 'adj' // 標示為調整類型
        }));

        // 檢查庫存調整是否會導致負庫存
        const checkResult = await checkInventoryBalance(itemsWithFaId);
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
                    startsWith: `${faId}A${dateStr}`
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

        const documentNo = `${faId}A${dateStr}${sequence.toString().padStart(4, '0')}`;

        // 使用交易進行數據存儲
        await prisma.$transaction(async (tx) => {
            for (let i = 0; i < itemsWithFaId.length; i++) {
                const item = itemsWithFaId[i];
                await tx.clothesAdj.create({
                    data: {
                        c_adj_no: documentNo,
                        c_adj_id: i + 1,
                        fa_id: item.fa_id,
                        od_no: item.od_no,
                        color_name: item.color_name,
                        po: item.po,
                        size: item.size,
                        quantity: item.quantity,
                        doc_date: new Date(docDate),
                        user_id: userId
                    }
                });
            }
        });

        return NextResponse.json({
            success: true,
            message: '導入成功',
            documentNo,
            count: itemsWithFaId.length
        });

    } catch (error) {
        console.log(error.message);
        return NextResponse.json({
            success: false,
            message: `導入失敗: ${error.message}`
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}