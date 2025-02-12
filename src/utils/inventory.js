// src/utils/inventory.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function checkInventoryBalance(items, isUpdate = false, isDelete = false) {

    const groupedItems = items.reduce((acc, item) => {
        const key = `${item.fa_id}-${item.od_no}-${item.color_name}-${item.po}-${item.size}`;
        if (!acc[key]) {
            acc[key] = {
                ...item,
                quantity: 0
            };
        }
        acc[key].quantity += parseInt(item.quantity);
        return acc;
    }, {});

    for (const item of Object.values(groupedItems)) {
        // 取得所有相關交易的數量，加入廠區條件
        const [inSum, outSum, adjSum] = await Promise.all([
            // 入庫總和
            prisma.clothesIn.aggregate({
                where: {
                    od_no: item.od_no,
                    color_name: item.color_name,
                    po: item.po,
                    size: item.size,
                    fa_id: item.fa_id
                },
                _sum: {
                    quantity: true
                }
            }),
            // 出庫總和
            prisma.clothesOut.aggregate({
                where: {
                    od_no: item.od_no,
                    color_name: item.color_name,
                    po: item.po,
                    size: item.size,
                    fa_id: item.fa_id
                },
                _sum: {
                    quantity: true
                }
            }),
            // 調整總和
            prisma.clothesAdj.aggregate({
                where: {
                    od_no: item.od_no,
                    color_name: item.color_name,
                    po: item.po,
                    size: item.size,
                    fa_id: item.fa_id
                },
                _sum: {
                    quantity: true
                }
            })
        ]);

        // 計算庫存總量
        const inTotal = inSum._sum.quantity || 0;
        const outTotal = outSum._sum.quantity || 0;
        const adjTotal = adjSum._sum.quantity || 0;
        const currentBalance = inTotal - outTotal + adjTotal;

        // 根據不同單據類型檢查庫存
        let newBalance;
        if (!isUpdate) {
            // 新增或刪除的情況
            switch (item.type) {
                case 'in':
                    newBalance = currentBalance - item.quantity;  // 刪除入庫時減少庫存
                    break;
                case 'out':
                    newBalance = isDelete
                        ? currentBalance + item.quantity  // 刪除出庫時增加庫存
                        : currentBalance - item.quantity; // 新增出庫時減少庫存
                    break;
                case 'adj':
                    newBalance = isDelete
                        ? currentBalance - item.quantity  // 刪除調整時減去原本的調整量
                        : currentBalance + item.quantity; // 新增調整時加上調整量
                    break;
                default:
                    throw new Error('未知的單據類型');
            }
        } else {
            // 更新的情況
            switch (item.type) {
                case 'in':
                    newBalance = currentBalance + (item.newQuantity - item.oldQuantity);
                    break;
                case 'out':
                    console.log(inTotal, outTotal, adjTotal)
                    console.log(item.newQuantity, item.oldQuantity)
                    newBalance = currentBalance - (item.newQuantity - item.oldQuantity);
                    break;
                case 'adj':
                    newBalance = currentBalance + (item.oldQuantity - item.newQuantity);
                    break;
                default:
                    throw new Error('未知的單據類型');
            }
        }

        if (newBalance < 0) {
            let action = isUpdate ? '更新' : isDelete ? '刪除' : '新增';
            return {
                valid: false,
                message: `廠區 ${item.fa_id} 貨號 ${item.od_no} (${item.color_name}, ${item.po}, ${item.size}) ${action}後庫存將為負數 (${newBalance})`,
                item
            };
        }
    }

    return { valid: true };
}