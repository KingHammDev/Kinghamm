// src/app/api/users/[id]/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 更新使用者
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { email, password, name, faId } = body;

        // 準備更新資料
        const updateData = {
            name,
            faId
        };

        // 如果有提供新密碼，則加密後更新
        if (password) {
            updateData.password = await bcrypt.hash(password, 12);
        }

        // 更新使用者
        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        return NextResponse.json({
            success: true,
            message: '使用者更新成功',
            user
        });

    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({
            success: false,
            message: '更新使用者失敗'
        }, { status: 500 });
    }
}

// 刪除使用者
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        await prisma.user.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({
            success: true,
            message: '使用者刪除成功'
        });

    } catch (error) {
        console.log(error.message);
        return NextResponse.json({
            success: false,
            message: '刪除使用者失敗'
        }, { status: 500 });
    }
}