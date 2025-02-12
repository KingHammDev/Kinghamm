'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { utils, writeFile } from 'xlsx';

// 廠區選項
const FACTORY_OPTIONS = [
  { value: 'VN1', label: 'VN1' },
  { value: 'VN2', label: 'VN2' }
];


export default function ClothesStatusPage() {
  const [yearMonth, setYearMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedFactory, setSelectedFactory] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [showData, setShowData] = useState(false);  // 控制是否顯示資料
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // 查詢資料
  const handleSearch = async () => {
    if (!selectedFactory) {
      alert('請選擇廠區');
      return;
    }

    try {
      setLoading(true);
      const [year, month] = yearMonth.split('-').map(Number);

      const response = await fetch(
        `/api/clothes/status?year=${year}&month=${month}&factory=${selectedFactory}`
      );
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setShowData(true);
      } else {
        alert(result.message || '查詢失敗');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('查詢時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 新增查看明細的函數
  const handleViewDetail = async (item) => {
    try {
      setLoadingDetail(true);
      const [year, month] = yearMonth.split('-').map(Number);

      const response = await fetch(`/api/clothes/detail?year=${year}&month=${month}&fa_id=${item.fa_id}&od_no=${item.od_no}&color_name=${item.color_name}&po=${item.po}&size=${item.size}`);
      const result = await response.json();

      if (result.success) {
        setDetailData(result.data);
        setSelectedDetail(item);
      } else {
        alert(result.message || '取得明細失敗');
      }
    } catch (error) {
      console.error('Error fetching detail:', error);
      alert('取得明細時發生錯誤');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleExport = () => {
    if (!data.length) {
      alert('沒有可匯出的資料');
      return;
    }

    try {
      // 準備匯出資料
      const exportData = data.map(item => ({
        '廠區': item.fa_id,
        '貨號': item.od_no,
        '顏色': item.color_name,
        'PO': item.po,
        '尺寸': item.size,
        '期初': item.opening,
        '入庫': item.in_qty,
        '出庫': item.out_qty,
        '調整': item.adj_qty,
        '結存': item.closing
      }));

      // 建立工作表
      const ws = utils.json_to_sheet(exportData);

      // 設定欄寬
      const colWidths = [
        { wch: 10 },  // 廠區
        { wch: 15 },  // 貨號
        { wch: 15 },  // 顏色
        { wch: 15 },  // PO
        { wch: 10 },  // 尺寸
        { wch: 10 },  // 期初
        { wch: 10 },  // 入庫
        { wch: 10 },  // 出庫
        { wch: 10 },  // 調整
        { wch: 10 },  // 結存
      ];
      ws['!cols'] = colWidths;

      // 建立工作簿
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, '進耗存報表');

      // 產生檔案名稱
      const fileName = `進耗存報表_${selectedFactory}_${yearMonth.replace('-', '')}.xlsx`;

      // 下載檔案
      writeFile(wb, fileName);
    } catch (error) {
      console.error('Export error:', error);
      alert('匯出失敗');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-800">進耗存報表</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">廠區:</span>
            <select
              value={selectedFactory}
              onChange={(e) => setSelectedFactory(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">請選擇廠區</option>
              {FACTORY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">年月:</span>
            <input
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md"
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '查詢中...' : '查詢'}
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              匯出 Excel
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : showData ? (  // 只有在 showData 為 true 時才顯示表格
        <div className="overflow-x-auto">
          <div className="mb-4 text-lg font-medium">
            {yearMonth.replace('-', '年')}月 進耗存報表
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">廠區</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">貨號</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">顏色</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">尺寸</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">期初</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">入庫</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">出庫</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">調整</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">結存</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{item.fa_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.od_no}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.color_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.po}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.size}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">{item.opening}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">{item.in_qty}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">{item.out_qty}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">{item.adj_qty}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium">{item.closing}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleViewDetail(item)}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors duration-200"
                    >
                      查看明細
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          請選擇年月後點擊查詢按鈕
        </div>
      )}
      {/* 明細對話框 */}
      {/* 修改明細對話框內容 */}
      {selectedDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {selectedDetail.fa_id} - {selectedDetail.od_no} ({selectedDetail.color_name}, {selectedDetail.po}, {selectedDetail.size}) 異動明細
              </h3>
              <button
                onClick={() => {
                  setSelectedDetail(null);
                  setDetailData(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <>
                {/* 入庫明細 - 只在有資料時顯示 */}
                {detailData?.inData.length > 0 && (
                  <div className="mb-8">  {/* 加大間距 */}
                    <div className="flex items-center mb-3 pb-2 border-b-2 border-indigo-500"> {/* 新增底線及樣式 */}
                      <h4 className="text-lg font-semibold text-indigo-700">入庫明細</h4>
                      <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-700 text-sm rounded">
                        共 {detailData.inData.length} 筆
                      </span>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">單據號碼</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">數量</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">建立人員</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {detailData.inData.map((doc, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2">{doc.c_in_no}</td>
                            <td className="px-4 py-2">{format(new Date(doc.doc_date), 'yyyy/MM/dd')}</td>
                            <td className="px-4 py-2 text-right">{doc.total_quantity}</td>
                            <td className="px-4 py-2">{doc.user_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 出庫明細 - 只在有資料時顯示 */}
                {detailData?.outData.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center mb-3 pb-2 border-b-2 border-red-500">
                      <h4 className="text-lg font-semibold text-red-700">出庫明細</h4>
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-sm rounded">
                        共 {detailData.outData.length} 筆
                      </span>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">單據號碼</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">數量</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">建立人員</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {detailData.outData.map((doc, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2">{doc.c_out_no}</td>
                            <td className="px-4 py-2">{format(new Date(doc.doc_date), 'yyyy/MM/dd')}</td>
                            <td className="px-4 py-2 text-right">{doc.total_quantity}</td>
                            <td className="px-4 py-2">{doc.user_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 調整明細 - 只在有資料時顯示 */}
                {detailData?.adjData.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center mb-3 pb-2 border-b-2 border-green-500">
                      <h4 className="text-lg font-semibold text-green-700">調整明細</h4>
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-sm rounded">
                        共 {detailData.adjData.length} 筆
                      </span>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">單據號碼</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">數量</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">建立人員</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {detailData.adjData.map((doc, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2">{doc.c_adj_no}</td>
                            <td className="px-4 py-2">{format(parseISO(doc.doc_date), 'yyyy/MM/dd')}</td>
                            <td className="px-4 py-2 text-right">{doc.total_quantity}</td>
                            <td className="px-4 py-2">{doc.user_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 如果沒有任何明細資料，顯示提示訊息 */}
                {(!detailData?.inData.length && !detailData?.outData.length && !detailData?.adjData.length) && (
                  <div className="text-center py-8 text-gray-500">
                    此項目在本月份無任何異動紀錄
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}