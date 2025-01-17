import { NextResponse } from 'next/server';
import { getMssqlData } from '@/lib/mssql';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productNo = searchParams.get('productNo');

    // 這裡放入你要的 SQL 查詢
    const query = `
        select
        case when shipping.bl_no like 'D%' then 'VN1' when shipping.bl_no like 'E%' then 'VN2' end FaId,
        shipping.bl_no ShippingNo,
        shipping.bl_seq ShippingSeq,
        (select bl_date from blh where bl_no=shipping.bl_no) ShippingDate,
        (select my_no from odh where od_no=shipping.od_no) ProductNo,
        (select clr_name from clr where clr_no=(select clr_no from odb where od_no=shipping.od_no and od_seq=shipping.od_seq)) ColorName,
        (select po_no from odb where od_no=shipping.od_no and od_seq=shipping.od_seq) Po,
        case size 
        when 'qty01' then (select us01 from odh where od_no=shipping.od_no)
        when 'qty02' then (select us02 from odh where od_no=shipping.od_no)
        when 'qty03' then (select us03 from odh where od_no=shipping.od_no)
        when 'qty04' then (select us04 from odh where od_no=shipping.od_no)
        when 'qty05' then (select us05 from odh where od_no=shipping.od_no)
        when 'qty06' then (select us06 from odh where od_no=shipping.od_no)
        when 'qty07' then (select us07 from odh where od_no=shipping.od_no)
        when 'qty08' then (select us08 from odh where od_no=shipping.od_no)
        when 'qty09' then (select us09 from odh where od_no=shipping.od_no)
        when 'qty10' then (select us10 from odh where od_no=shipping.od_no)
        when 'qty11' then (select us11 from odh where od_no=shipping.od_no)
        when 'qty12' then (select us12 from odh where od_no=shipping.od_no)
        end Size,
        total Quantity
        from blb shipping
        left join (
        select bl_no,bl_seq,od_no,od_seq,size,total
        from blb
        UNPIVOT
        (total for [size] in (qty01,qty02,qty03,qty04,qty05,qty06,qty07,qty08,qty09,qty10,qty11,qty12))a
        ) quantity
        on shipping.bl_no = quantity.bl_no and shipping.bl_seq = quantity.bl_seq
        where shipping.od_no=(select od_no from odh where my_no='${productNo}')
        and price=0
        and total!=0
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