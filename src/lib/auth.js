import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function verifyAuth(token) {
  try {
    // 驗證 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 確認使用者存在
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function getServerAuthSession() {
  // 這個函數可以在伺服器端元件中使用來獲取當前使用者資訊
  return {
    // 實作伺服器端 session 管理
  };
}