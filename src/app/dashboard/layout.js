'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircle, LogOut, Users, DollarSign, Settings } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (!data.success) {
          router.push('/login');
          return;
        }
        
        setUser(data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 如果正在載入或沒有用戶資料，顯示載入畫面
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      });
      
      if (response.ok) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const menuItems = [
    { icon: Users, text: '使用者維護', path: '/users' },
    { icon: DollarSign, text: '關帳作業', path: '/accounting' },
    { icon: Settings, text: '系統設定', path: '/settings' }
  ];

  // 以下是原有的 return JSX 部分
  return (
    <div className="min-h-screen bg-gray-100">
      {/* 導航欄 */}
      <nav className="bg-white shadow-lg fixed w-full z-10">
        {/* ... 原有的導航欄代碼 ... */}
      </nav>

      {/* 側邊欄和主要內容區域 */}
      <div className="flex pt-16">
        {/* ... 原有的側邊欄和主要內容區域代碼 ... */}
      </div>
    </div>
  );
}