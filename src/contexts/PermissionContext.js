'use client';

import { createContext, useContext, useState, useEffect } from 'react';

// 提供初始值
const defaultContextValue = {
  permissions: {},
  loading: true,
  hasPermission: () => false,
  canShowModule: () => false,
  reloadPermissions: () => Promise.resolve() // 新增重新載入函數
};

const PermissionContext = createContext(defaultContextValue);

export function PermissionProvider({ children }) {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  const loadUserPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      if (data.success && data.user) {
        const permResponse = await fetch(`/api/users/${data.user.id}/permissions`);
        const permData = await permResponse.json();
        
        if (permData.success) {
          const permMap = {};
          permData.permissions.forEach(perm => {
            permMap[perm.moduleId] = perm.actions;
          });
          setPermissions(permMap);
        }
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserPermissions();
  }, []);

  const contextValue = {
    permissions,
    loading,
    hasPermission: (moduleId, actionId) => {
      return permissions[moduleId]?.includes(actionId) || false;
    },
    canShowModule: (moduleId) => {
      return permissions[moduleId]?.includes('view') || false;
    },
    reloadPermissions: loadUserPermissions // 匯出重新載入函數
  };

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
}