import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const moduleId = searchParams.get('moduleId');
    const actionId = searchParams.get('actionId');

    const permission = await prisma.userPermission.findFirst({
      where: {
        userId: parseInt(userId),
        moduleId
      }
    });

    const hasPermission = permission?.actions.includes(actionId) || false;

    return NextResponse.json({
      success: true,
      hasPermission
    });

  } catch (error) {
    console.error('Permission check error:', error);
    return NextResponse.json({
      success: false,
      hasPermission: false
    });
  }
}