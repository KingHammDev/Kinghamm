// src/app/(main)/settings/page.js
'use client';

import { useState } from 'react';
import { format } from 'date-fns';

export default function SettingsPage() {
  const [yearMonth, setYearMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [calculating, setCalculating] = useState(false);

  const handleMonthlyCalculate = async () => {
    if (!confirm(`確定要執行 ${yearMonth} 的月結作業嗎？`)) {
      return;
    }

    try {
      setCalculating(true);
      const [year, month] = yearMonth.split('-').map(Number);

      const response = await fetch('/api/settings/monthly-calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year,
          month,
          userId: 1  // 這裡應該使用實際的使用者 ID
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('月結作業完成');
      } else {
        alert(result.message || '月結作業失敗');
      }
    } catch (error) {
      console.error('Monthly calculation error:', error);
      alert('月結作業執行時發生錯誤');
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">系統設定</h1>
        
        {/* 月結設定區塊 */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">月結作業</h2>
          <div className="flex items-center space-x-4">
            <input
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={calculating}
            />
            <button
              onClick={handleMonthlyCalculate}
              disabled={calculating}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {calculating ? '處理中...' : '執行月結'}
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            選擇要執行月結的年月，執行後將計算該月份的庫存結存。
          </p>
        </div>

        {/* 其他系統設定... */}
      </div>
    </div>
  );
}