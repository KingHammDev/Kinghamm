'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { usePermission } from '@/contexts/PermissionContext';

// 定義模組和操作


const PERMISSION_MODULES = {
  clothes_management: {
    label: '成品管理',
    id: 'clothes_management',
    actions: [
      { id: 'view', label: '顯示此模組' }
    ],
    subModules: {
      clothes_in: {
        label: '入庫作業',
        id: 'clothes_in',
        actions: [
          { id: 'view', label: '顯示此功能' },
          { id: 'import', label: '資料匯入' },
          { id: 'create', label: '新增單據' },
          { id: 'delete', label: '刪除選中項目' },
          { id: 'add_detail', label: '新增明細' },
          { id: 'save', label: '儲存' }
        ]
      },
      clothes_out: {
        label: '出庫作業',
        id: 'clothes_out',
        actions: [
          { id: 'view', label: '顯示此功能' },
          { id: 'import', label: '資料匯入' },
          { id: 'delete', label: '刪除選中項目' },
          { id: 'save', label: '儲存' }
        ]
      },
      clothes_adj: {
        label: '調整作業',
        id: 'clothes_adj',
        actions: [
          { id: 'view', label: '顯示此功能' },
          { id: 'create', label: '新增單據' },
          { id: 'delete', label: '刪除選中項目' },
          { id: 'add_detail', label: '新增明細' },
          { id: 'save', label: '儲存' }
        ]
      },
      clothes_status: {
        label: '進耗存報表',
        id: 'clothes_status',
        actions: [
          { id: 'view', label: '顯示此功能' },
          { id: 'export', label: '匯出 Excel' }
        ]
      }
    }
  },
  user_management: {
    label: '使用者管理',
    id: 'user_management',
    actions: [
      { id: 'view', label: '顯示此模組' }
    ],
    subModules: {}
  },
  system_management: {
    label: '系統管理',
    id: 'system_management',
    actions: [
      { id: 'view', label: '顯示此模組' }
    ],
    subModules: {}
  }
};

function CollapsibleSection({ moduleId, title, children, isOpen, onToggle, permissions, onPermissionChange }) {
  const hasViewPermission = permissions[moduleId]?.includes('view') || false;

  return (
    <div className="border rounded-lg">
      <div className="px-4 py-2 flex justify-between items-center bg-gray-50 hover:bg-gray-100 rounded-t-lg">
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={hasViewPermission}
              onChange={(e) => onPermissionChange(moduleId, 'view', e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="ml-2 font-medium text-gray-700">{title}</span>
          </label>
        </div>
        <button onClick={onToggle}>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
      </div>
      {isOpen && (
        <div className="p-4 border-t bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

export default function UserFormModal({ user, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    faId: user?.faId || ''
  });
  const [loading, setLoading] = useState(false);

  const [permissions, setPermissions] = useState({});
  const [openSections, setOpenSections] = useState({});
  const { reloadPermissions } = usePermission();


  const toggleSection = (sectionId) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // 在 useEffect 中載入現有權限
  useEffect(() => {
    if (user?.id) {
      fetchUserPermissions(user.id);
    }
  }, [user]);

  const fetchUserPermissions = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}/permissions`);
      const data = await response.json();
      if (data.success) {
        const permMap = {};
        data.permissions.forEach(perm => {
          permMap[perm.moduleId] = perm.actions;
        });
        setPermissions(permMap);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const handlePermissionChange = (moduleId, actionId, checked) => {
    if (!moduleId) return;

    setPermissions(prev => {
      const newPermissions = { ...prev };

      // 如果是主模組的 view 權限
      if (PERMISSION_MODULES[moduleId]) {
        // 處理主模組權限
        newPermissions[moduleId] = newPermissions[moduleId] || [];
        if (checked) {
          // 新增權限
          if (!newPermissions[moduleId].includes(actionId)) {
            newPermissions[moduleId] = [...newPermissions[moduleId], actionId];
          }
        } else {
          // 移除權限
          newPermissions[moduleId] = newPermissions[moduleId].filter(a => a !== actionId);
          // 如果主模組被取消，同時取消所有子模組的權限
          Object.keys(PERMISSION_MODULES[moduleId].subModules).forEach(subModuleId => {
            newPermissions[subModuleId] = [];
          });
        }
      } else {
        // 處理子模組權限
        const modulePerms = prev[moduleId] || [];
        newPermissions[moduleId] = checked
          ? [...modulePerms, actionId]
          : modulePerms.filter(a => a !== actionId);
      }

      return newPermissions;
    });
  };

  // 檢查子模組是否應該被禁用的函數
  const isSubModuleDisabled = (moduleId, subModuleId) => {
    return !permissions[moduleId]?.includes('view');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user && !formData.password) {
      alert('請輸入密碼');
      return;
    }

    try {
      setLoading(true);

      const url = user ? `/api/users/${user.id}` : '/api/users';
      const method = user ? 'PUT' : 'POST';

      // 如果是編輯且密碼為空，不傳送密碼欄位
      const submitData = { ...formData };
      if (user && !submitData.password) {
        delete submitData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (user?.id || data.user?.id) {
        const userId = user?.id || data.user.id;
        await fetch(`/api/users/${userId}/permissions`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ permissions })
        });
      }
      if (response.ok) {
        // 權限更新成功後重新載入權限
        await reloadPermissions();
        await onSubmit();
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('儲存時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl h-[80vh] flex flex-col">
        {/* 標題區 */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">
            {user ? '編輯使用者' : '新增使用者'}
          </h2>
        </div>

        {/* 內容區 - 使用 flex 和 grid 來布局 */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* 左側基本資料 */}
            <div className="w-1/3 p-6 border-r overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      電子郵件
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!!user}
                      className="w-full border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      名稱
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {user ? '新密碼（不修改請留空）' : '密碼'}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      廠區
                    </label>
                    <select
                      value={formData.faId}
                      onChange={(e) => setFormData({ ...formData, faId: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">請選擇廠區</option>
                      <option value="VN1">VN1</option>
                      <option value="VN2">VN2</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>

            {/* 右側權限設定 */}
            <div className="flex-1 p-6 overflow-y-scroll">
              <h3 className="text-lg font-medium text-gray-900 mb-4">功能權限設定</h3>
              <div className="space-y-4">
                {Object.entries(PERMISSION_MODULES).map(([moduleKey, moduleData]) => (
                  <CollapsibleSection
                    key={moduleKey}
                    moduleId={moduleKey}
                    title={moduleData.label}
                    isOpen={openSections[moduleKey]}
                    onToggle={() => toggleSection(moduleKey)}
                    permissions={permissions}
                    onPermissionChange={handlePermissionChange}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(moduleData.subModules).map(([subModuleKey, subModule]) => (
                        <div key={subModuleKey} className="bg-gray-50 p-4 rounded-lg">
                          <div className="mb-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={permissions[subModuleKey]?.includes('view') || false}
                                onChange={(e) => handlePermissionChange(subModuleKey, 'view', e.target.checked)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                disabled={isSubModuleDisabled(moduleKey, subModuleKey)}
                              />
                              <span className="ml-2 font-medium text-gray-700">{subModule.label}</span>
                            </label>
                          </div>
                          <div className="space-y-2 ml-6">
                            {subModule.actions.filter(action => action.id !== 'view').map(action => (
                              <label key={action.id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={permissions[subModuleKey]?.includes(action.id) || false}
                                  onChange={(e) => handlePermissionChange(subModuleKey, action.id, e.target.checked)}
                                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  disabled={!permissions[subModuleKey]?.includes('view') || isSubModuleDisabled(moduleKey, subModuleKey)}
                                />
                                <span className="ml-2 text-sm text-gray-600">
                                  {action.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* 底部按鈕區 */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '處理中...' : (user ? '更新' : '新增')}
          </button>
        </div>
      </div>
    </div>
  );
}