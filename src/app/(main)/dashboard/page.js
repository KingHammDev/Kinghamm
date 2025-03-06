'use client';

import { useTranslation } from '@/hooks/useTranslation'

export default function DashboardPage() {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-semibold text-gray-800">{t('app.(main).dashboard.welcome')}</h1>
      <p className="mt-4 text-gray-600">
        {t('app.(main).dashboard.description')}
      </p>
    </div>
  );
}