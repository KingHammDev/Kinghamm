'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import { UserCircle, LogOut, Users, DollarSign, Settings, ChevronLeft, ChevronRight, Shirt } from 'lucide-react';
import {
  UserCircle,
  LogOut,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Package,
  PackagePlus,
  PackageMinus,
  PackageSearch,
  LineChart,
  // DollarSign
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isClothesOpen, setClothesOpen] = useState(false);

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
    {
      icon: Package,
      text: '成品管理',
      isExpandable: true,
      isOpen: isClothesOpen,
      onClick: () => setClothesOpen(!isClothesOpen),
      subItems: [
        { icon: PackagePlus, text: '入庫', path: '/clothes/in' },
        { icon: PackageMinus, text: '出庫', path: '/clothes/out' },
        { icon: PackageSearch, text: '調整', path: '/clothes/adjust' },
        { icon: LineChart, text: '進耗存', path: '/clothes/status' },
      ]
    },
    { icon: Users, text: '使用者維護', path: '/users' },
    // { icon: DollarSign, text: '關帳作業', path: '/accounting' },
    { icon: Settings, text: '系統設定', path: '/settings' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 導航欄 */}
      <nav className="bg-white shadow-lg fixed w-full z-10">
        <div className="max-w-full mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-semibold text-gray-800">管理系統</span>
            </div>

            {/* 用戶資訊和登出 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <UserCircle className="h-8 w-8 text-gray-400" />
                <span className="ml-2 text-gray-700">{user?.name || '載入中...'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-700 hover:text-red-600"
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-2">登出</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 側邊欄和主要內容區域 */}
      <div className="flex pt-16">
        {/* 側邊欄 */}
        <aside className={`
          fixed left-0 h-[calc(100vh-4rem)] bg-white shadow-lg transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-64' : 'w-16'}
        `}>
          {/* 收合按鈕 */}
          <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 relative">
            {isSidebarOpen && <span className="text-sm font-medium text-gray-600">功能選單</span>}
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className={`
                bg-white rounded-full p-1 shadow-md border border-gray-200
                hover:bg-gray-50 transition-colors duration-200
                ${isSidebarOpen ? 'absolute -right-3' : 'ml-auto'}
              `}
            >
              {isSidebarOpen ? 
                <ChevronLeft className="h-4 w-4 text-gray-600" /> : 
                <ChevronRight className="h-4 w-4 text-gray-600" />
              }
            </button>
          </div>

          <div className="py-4">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="relative">
                  <button
                    onClick={item.isExpandable ? item.onClick : () => router.push(item.path)}
                    className={`
                      w-full flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-indigo-600
                      transition-colors duration-200
                      ${isSidebarOpen ? 'justify-between' : 'justify-center'}
                    `}
                  >
                    <div className="flex items-center min-w-0">
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {isSidebarOpen && (
                        <span className="ml-3 truncate">{item.text}</span>
                      )}
                    </div>
                    {item.isExpandable && isSidebarOpen && (
                      item.isOpen ?
                        <ChevronUp className="h-4 w-4" /> :
                        <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {/* 子選單 */}
                  {item.isExpandable && item.isOpen && isSidebarOpen && (
                    <div className="bg-gray-50">
                      {item.subItems.map((subItem, subIndex) => {
                        const SubIcon = subItem.icon;
                        return (
                          <button
                            key={subIndex}
                            onClick={() => router.push(subItem.path)}
                            className="
                              w-full flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-indigo-600
                              pl-12 text-sm transition-colors duration-200
                            "
                          >
                            <SubIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="ml-3 truncate">{subItem.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
        {/* 主要內容區域 */}
        <main className={`
          flex-1 transition-all duration-300 ease-in-out p-6
          ${isSidebarOpen ? 'ml-64' : 'ml-16'}
        `}>
          <div className="bg-white rounded-lg shadow-md h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}