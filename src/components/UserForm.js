'use client';

import { useState } from 'react';
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件'),
  name: z.string().min(2, '名稱至少需要 2 個字元'),
  password: z.string().min(6, '密碼至少需要 6 個字元').optional(),
});

export default function UserForm({ initialData = {}, onSubmit, isEditing = false }) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    ...initialData,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    try {
      // 如果是編輯模式，密碼是可選的
      const schema = isEditing
        ? userSchema.partial({ password: true })
        : userSchema;

      schema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      const newErrors = {};
      error.errors.forEach((err) => {
        if (err.path) {
          newErrors[err.path[0]] = err.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  // 定義共用的 input 樣式
  const inputClasses = `
    mt-1 
    block 
    w-full 
    rounded-md 
    py-3
    px-4
    text-base
    border-2
    shadow-sm 
    focus:ring-2
    focus:ring-offset-1
    transition-colors
    duration-200
  `;

  // 根據錯誤狀態決定額外的樣式
  const getInputStyle = (fieldName) => {
    return `${inputClasses} ${errors[fieldName]
        ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
      }`;
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          電子郵件
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={getInputStyle('email')}
          disabled={loading || isEditing}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          名稱
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={getInputStyle('name')}
          disabled={loading}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          {isEditing ? '新密碼（可選）' : '密碼'}
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password || ''}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className={getInputStyle('password')}
          disabled={loading}
          required={!isEditing}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? '處理中...' : isEditing ? '更新' : '創建'}
        </button>
      </div>
    </form>
  );
};