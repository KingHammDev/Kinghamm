import { NextResponse } from 'next/server';
import { getMssqlData } from '@/lib/mssql';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productNo = searchParams.get('productNo');

    // 這裡放入你要的 SQL 查詢
    const query = `
        select
        bl_no ShippingNo,
        (select bl_date from blh where bl_no=blb.bl_no) ShippingDate,
        (select my_no from odh where od_no=blb.od_no) ProductNo,
        sum(qty) Quantity
        from blb
        where od_no=(select od_no from odh where my_no='${productNo}')
        and price=0
        group by bl_no,od_no
    `;

    const data = await getMssqlData(query, [productNo || '']);

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      message: '查詢資料時發生錯誤'
    }, { status: 500 });
  }
}