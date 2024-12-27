import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const authToken = request.cookies.get('auth_token')?.value;
    
    if (!authToken) {
      return NextResponse.json({
        success: false,
        message: '未登入'
      }, { status: 401 });
    }

    const user = await verifyAuth(authToken);

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '驗證失敗'
    }, { status: 401 });
  }
}