// src/app/(main)/users/page.js
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import UserFormModal from '@/components/UserForm'

const FACTORY_OPTIONS = [
    { value: '', label: '全部' },
    { value: 'VN1', label: 'VN1' },
    { value: 'VN2', label: 'VN2' }
];

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchFactory, setSearchFactory] = useState('');

    // 查詢使用者
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/users${searchFactory ? `?faId=${searchFactory}` : ''}`);
            const data = await response.json();

            if (data.success) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    // 刪除使用者
    const handleDelete = async (userId) => {
        if (!confirm('確定要刪除此使用者嗎？')) return;

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            if (data.success) {
                await fetchUsers();
            } else {
                alert(data.message || '刪除失敗');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('刪除時發生錯誤');
        }
    };

    return (
        <div className="p-6">
            {/* 標題和功能按鈕 */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">使用者管理</h1>
                <button
                    onClick={() => {
                        setSelectedUser(null);
                        setShowForm(true);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                    新增使用者
                </button>
            </div>

            {/* 查詢條件 */}
            <div className="mb-6 bg-white p-4 rounded-md shadow">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">廠區:</label>
                        <select
                            value={searchFactory}
                            onChange={(e) => setSearchFactory(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-1"
                        >
                            {FACTORY_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={fetchUsers}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        查詢
                    </button>
                </div>
            </div>

            {/* 使用者列表 */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    名稱
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    電子郵件
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    廠區
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    建立日期
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.faId || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {format(new Date(user.createdAt), 'yyyy/MM/dd')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                        <button
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setShowForm(true);
                                            }}
                                            className="px-3 py-1.5 text-sm text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-colors duration-200"
                                        >
                                            編輯
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="px-3 py-1.5 text-sm text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors duration-200"
                                        >
                                            刪除
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 編輯/新增表單對話框 */}
            {showForm && (
                <UserFormModal
                    user={selectedUser}
                    onClose={() => {
                        setShowForm(false);
                        setSelectedUser(null);
                    }}
                    onSubmit={async () => {
                        await fetchUsers();
                        setShowForm(false);
                        setSelectedUser(null);
                    }}
                />
            )}
        </div>
    );
}