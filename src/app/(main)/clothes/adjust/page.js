'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { usePermission } from '@/contexts/PermissionContext';
import { useTranslation } from '@/hooks/useTranslation';

export default function ClothesAdjustPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const docNo = searchParams.get('docNo');

    const [userData, setUserData] = useState({});
    const [docDate, setDocDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [documentNo, setDocumentNo] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchProductNo, setSearchProductNo] = useState('');
    const [searchError, setSearchError] = useState('');

    // const [isMssqlModalOpen, setMssqlModalOpen] = useState(false);
    // const [mssqlSearchProductNo, setMssqlSearchProductNo] = useState('');
    // const [mssqlData, setMssqlData] = useState([]);
    // const [mssqlLoading, setMssqlLoading] = useState(false);
    // const [selectedMssqlItems, setSelectedMssqlItems] = useState([]);

    const { hasPermission, admin } = usePermission();
    const { t } = useTranslation();

    useEffect(() => {
        if (docNo) {
            fetchDocument(docNo);
            setIsEditing(true);
        }
        fetchUserData();
    }, [docNo]);

    const fetchUserData = async () => {
        try {
            const response = await fetch('/api/auth/me');
            const data = await response.json();
            if (data.success) {
                setUserData(data.user);
            }

        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchDocument = async (docNo) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/clothes/adjust/${docNo}`);
            const data = await response.json();

            if (data.success) {
                setDocumentNo(data.document.c_adj_no);
                const formattedItems = data.items.map(item => ({
                    checked: false,
                    seqNo: item.c_adj_id,
                    productNo: item.od_no,
                    colorName: item.color_name,
                    po: item.po,
                    size: item.size,
                    quantity: item.quantity.toString(),
                    docDate: item.doc_date,
                    faId: userData.faId,
                    userId: userData.id
                }));
                setItems(formattedItems);
                setIsEditing(true);
            }
        } catch (error) {
            console.error('Error fetching document:', error);
        } finally {
            setLoading(false);
        }
    };

    const addNewLine = () => {
        setItems(prevItems => [
            ...prevItems,
            {
                checked: false,
                seqNo: prevItems.length + 1,
                productNo: '',
                colorName: '',
                po: '',
                size: '',
                quantity: '',
                faId: userData.faId,
                userId: userData.id
            }
        ]);
    };

    const handleInputChange = (index, field, value) => {
        setItems(prevItems => {
            const newItems = [...prevItems];
            newItems[index] = {
                ...newItems[index],
                [field]: value
            };
            return newItems;
        });
    };

    const handleCheckboxChange = (index) => {
        setItems(prevItems => {
            const newItems = [...prevItems];
            newItems[index] = {
                ...newItems[index],
                checked: !newItems[index].checked
            };
            return newItems;
        });
    };

    const deleteSelected = async () => {
        if (!items.some(item => item.checked)) {
            alert(t('app.(main).clothes.public.check_select'));
            return;
        }

        try {
            setLoading(true);
            const selectedItems = items.filter(item => item.checked);

            // 如果已有單據號碼，需要從資料庫刪除
            if (documentNo) {
                const response = await fetch(`/api/clothes/adjust/${documentNo}/items`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        itemIds: selectedItems.map(item => item.seqNo)
                    }),
                });

                const data = await response.json();
                if (!data.success) {
                    throw new Error(data.message || t('app.(main).clothes.public.delete_fail'));
                }
            }

            // 更新本地狀態
            const remainingItems = items.filter(item => !item.checked);
            // 如果刪除後沒有剩餘項目，重置所有狀態
            if (remainingItems.length === 0) {
                setItems([]);
                setDocumentNo('');
                setIsEditing(false);
                // 如果有其他相關狀態也需要重置
                router.push('/clothes/adjust'); // 清除 URL 參數
            } else {
                // 如果還有剩餘項目，重新編號
                setItems(
                    remainingItems.map((item, index) => ({
                        ...item,
                        seqNo: index + 1
                    }))
                );
            }

        } catch (error) {
            console.error('Delete error:', error);
            alert(error.message || t('app.(main).clothes.public.delete_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (items.some(item => !item.productNo || !item.quantity || !item.po || !item.colorName || !item.size)) {
            alert(t('app.(main).clothes.public.check_input'));
            return;
        }

        try {
            setLoading(true);

            const endpoint = isEditing
                ? `/api/clothes/adjust/${documentNo}`
                : '/api/clothes/adjust';

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ items, docDate, userData }),
            });

            const data = await response.json();

            if (data.success) {
                alert(isEditing ? t('app.(main).clothes.public.update_success') : t('app.(main).clothes.public.save_success'));
                if (!isEditing) {
                    setDocumentNo(data.documentNo);
                    setIsEditing(true);
                }
            } else {
                alert(data.message || t('app.(main).clothes.public.save_fail'));
            }
        } catch (error) {
            console.error('Save error:', error);
            alert(t('app.(main).clothes.public.save_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setItems([{ checked: false, seqNo: 1, productNo: '', colorName: '', po: '', size: '', quantity: '', faId: userData.faId, userId: userData.id }]);
        setDocumentNo('');
        setIsEditing(false);
        router.push('/clothes/adjust');
    };



    const openSearchModal = () => {
        setIsSearchModalOpen(true);
        setSearchProductNo('');
        setDocuments([]);
        setSearchError('');
    };

    // 查詢單據按鈕
    const handleSearch = async () => {
        if (!searchProductNo.trim()) {
            setSearchError(t('app.(main).clothes.public.check_order'));
            return;
        }

        try {
            setSearchLoading(true);
            setSearchError('');
            const response = await fetch(`/api/clothes/adjust/search?productNo=${encodeURIComponent(searchProductNo)}`);
            const data = await response.json();

            if (data.success) {
                setDocuments(data.documents);
            } else {
                setSearchError(data.message);
            }
        } catch (error) {
            console.error('Error searching documents:', error);
            setSearchError(t('app.(main).clothes.public.request_error'));
        } finally {
            setSearchLoading(false);
        }
    };
    const handleSearchProductNoChange = (e) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        setSearchProductNo(value);
    };

    // 選擇單據
    const handleSelectDocument = (docNo) => {
        router.push(`/clothes/adjust?docNo=${docNo}`);
        setIsSearchModalOpen(false);
    };

    // const handleMssqlSearch = async () => {
    //     if (!mssqlSearchProductNo.trim()) {
    //         alert('請輸入貨號');
    //         return;
    //     }

    //     try {
    //         setMssqlLoading(true);
    //         const response = await fetch(`/api/mssql/clothes?productNo=${encodeURIComponent(mssqlSearchProductNo)}`);
    //         const data = await response.json();

    //         if (data.success) {
    //             setMssqlData(data.data);
    //         } else {
    //             throw new Error(data.message);
    //         }
    //     } catch (error) {
    //         console.error('MSSQL search error:', error);
    //         alert(error.message || '查詢時發生錯誤');
    //     } finally {
    //         setMssqlLoading(false);
    //     }
    // };

    // // 處理選擇 MSSQL 資料項目
    // const handleMssqlItemSelect = (item, checked) => {
    //     if (checked) {
    //         setSelectedMssqlItems(prev => [...prev, item]);
    //     } else {
    //         setSelectedMssqlItems(prev => prev.filter(i => !(i.ShippingNo === item.ShippingNo && i.ShippingSeq === item.ShippingSeq && i.Size === item.Size)));
    //     }
    // };

    // // 將選中的項目加入到入庫明細
    // const addSelectedItemsToDetail = () => {
    //     const newItems = [
    //         ...items,
    //         ...selectedMssqlItems.map((item, index) => ({
    //             checked: false,
    //             seqNo: items.length + index + 1,
    //             productNo: item.ProductNo,
    //             colorName: item.ColorName,
    //             po: item.Po,
    //             size: item.Size,
    //             quantity: item.Quantity.toString(),
    //             faId: userData.faId,
    //             userId: userData.id
    //         }))
    //     ];
    //     setItems(newItems);
    //     setMssqlModalOpen(false);
    //     setSelectedMssqlItems([]);
    //     setMssqlData([]);
    //     setMssqlSearchProductNo('');
    // };


    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-semibold text-gray-800">{t('app.(main).clothes.adjust.title')}</h1>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{t('app.(main).clothes.public.doc_date')}:</span>
                        <input
                            type="date"
                            value={docDate}
                            onChange={(e) => setDocDate(e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        />
                    </div>
                    {documentNo && (
                        <div className="px-3 py-1 bg-gray-100 rounded-md">
                            <span className="text-sm text-gray-600">{t('app.(main).clothes.public.doc_no')}:</span>
                            <span className="ml-2 font-medium text-gray-800">{documentNo}</span>
                        </div>
                    )}
                </div>
                <div className="space-x-2">
                    {/* <button
                        onClick={() => setMssqlModalOpen(true)}
                        type="button"
                        className="px-4 py-2 text-purple-600 border border-purple-600 rounded hover:bg-purple-50"
                    >
                        資料匯入
                    </button> */}
                    <button
                        onClick={openSearchModal}
                        type="button"
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                    >
                        {t('app.(main).clothes.public.btn_doc_request')}
                    </button>
                    {hasPermission('clothes_adj', 'create') && (
                        <button
                            onClick={handleCreateNew}
                            type="button"
                            className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                        >
                            {t('app.(main).clothes.public.btn_doc_create')}
                        </button>
                    )}
                    {hasPermission('clothes_adj', 'delete') && (
                        <button
                            onClick={deleteSelected}
                            type="button"
                            className="px-4 py-2 text-red-600 border border-red-600 rounded hover:bg-red-50"
                            disabled={!items.some(item => item.checked) || loading}
                        >
                            {t('app.(main).clothes.public.btn_select_delete')}
                        </button>
                    )}
                    {hasPermission('clothes_adj', 'add_detail') && (
                        <button
                            onClick={addNewLine}
                            type="button"
                            className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                            disabled={loading}
                        >
                            {t('app.(main).clothes.public.btn_add_row')}
                        </button>
                    )}
                    {hasPermission('clothes_adj', 'save') && (
                        <button
                            onClick={handleSubmit}
                            type="button"
                            disabled={loading}
                            className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600"
                        >
                            {loading ? t('app.(main).clothes.public.requesting') : (isEditing ? t('app.(main).clothes.public.update') : t('app.(main).clothes.public.save'))}
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="w-12 px-4 py-3">
                                <input
                                    type="checkbox"
                                    onChange={(e) => {
                                        const allChecked = items.every(item => item.checked);
                                        setItems(prevItems =>
                                            prevItems.map(item => ({
                                                ...item,
                                                checked: !allChecked
                                            }))
                                        );
                                    }}
                                    checked={items.length > 0 && items.every(item => item.checked)}
                                    className="rounded border-gray-300"
                                />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('app.(main).clothes.public.seq')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('app.(main).clothes.public.order')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('app.(main).clothes.public.color')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('app.(main).clothes.public.po')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('app.(main).clothes.public.size')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('app.(main).clothes.public.qty')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.map((item, index) => (
                            <tr key={index} className={item.checked ? 'bg-gray-50' : ''}>
                                <td className="px-4 py-2">
                                    <input
                                        type="checkbox"
                                        checked={item.checked}
                                        onChange={(e) => handleCheckboxChange(index)}
                                        className="rounded border-gray-300"
                                    />
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                    {item.seqNo}
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={item.productNo}
                                        onChange={(e) => handleInputChange(index, 'productNo', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                        className="w-full border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Order"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={item.colorName}
                                        onChange={(e) => handleInputChange(index, 'colorName', e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Color"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={item.po}
                                        onChange={(e) => handleInputChange(index, 'po', e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="PO"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={item.size}
                                        onChange={(e) => handleInputChange(index, 'size', e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Size"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleInputChange(index, 'quantity', e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Quantity"

                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isSearchModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">{t('app.(main).clothes.public.btn_doc_request')}</h2>
                            <button
                                onClick={() => {
                                    setIsSearchModalOpen(false);
                                    setSearchProductNo('');
                                    setSearchError('');
                                    setDocuments([]);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={searchProductNo}
                                    onChange={handleSearchProductNoChange}
                                    placeholder="Order"
                                    className="flex-1 border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={searchLoading}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                                >
                                    {searchLoading ? t('app.(main).clothes.public.requesting') : t('app.(main).clothes.public.request')}
                                </button>
                            </div>
                            {searchError && (
                                <p className="mt-2 text-sm text-red-600">{searchError}</p>
                            )}
                        </div>

                        <div className="overflow-y-auto max-h-[60vh]">
                            {documents.length > 0 ? (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                {t('app.(main).clothes.public.doc_no')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                {t('app.(main).clothes.public.create_date')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                {t('app.(main).clothes.public.item_qty')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                {t('app.(main).clothes.public.total_qty')}
                                            </th>
                                            <th className="px-6 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {documents.map((doc) => (
                                            <tr key={doc.c_adj_no} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {doc.c_adj_no}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(doc.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {doc.itemCount} {t('app.(main).clothes.public.count')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {doc.totalQuantity}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => handleSelectDocument(doc.c_adj_no)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        {t('app.(main).clothes.public.select')}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : !searchLoading && (
                                <div className="text-center py-8 text-gray-500">
                                    {t('app.(main).clothes.public.input_order_request')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* {isMssqlModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-6xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">ERP出貨資料</h2>
                            <button
                                onClick={() => {
                                    setMssqlModalOpen(false);
                                    setMssqlSearchProductNo('');
                                    setMssqlData([]);
                                    setSelectedMssqlItems([]);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={mssqlSearchProductNo}
                                    onChange={(e) => setMssqlSearchProductNo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                    placeholder="請輸入貨號"
                                    className="flex-1 border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                    onClick={handleMssqlSearch}
                                    disabled={mssqlLoading}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                                >
                                    {mssqlLoading ? '查詢中...' : '查詢'}
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto max-h-[60vh]">
                            {mssqlData.length > 0 ? (
                                <>
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="w-12 px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedMssqlItems(mssqlData);
                                                            } else {
                                                                setSelectedMssqlItems([]);
                                                            }
                                                        }}
                                                        checked={mssqlData.length > 0 && selectedMssqlItems.length === mssqlData.length}
                                                        className="rounded border-gray-300"
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">廠區</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">出貨單號</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">出貨日期</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">貨號</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">顏色</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">尺寸</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">數量</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {mssqlData.map((item, index) => (
                                                <tr key={index} className={selectedMssqlItems.includes(item) ? 'bg-blue-50' : ''}>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedMssqlItems.some(i => (i.ShippingNo === item.ShippingNo && i.ShippingSeq === item.ShippingSeq && i.Size === item.Size))}
                                                            onChange={(e) => handleMssqlItemSelect(item, e.target.checked)}
                                                            className="rounded border-gray-300"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">{item.FaId}</td>
                                                    <td className="px-4 py-2">{item.ShippingNo}</td>
                                                    <td className="px-4 py-2">{new Date(item.ShippingDate).toLocaleDateString()}</td>
                                                    <td className="px-4 py-2">{item.ProductNo}</td>
                                                    <td className="px-4 py-2">{item.ColorName}</td>
                                                    <td className="px-4 py-2">{item.Po}</td>
                                                    <td className="px-4 py-2">{item.Size}</td>
                                                    <td className="px-4 py-2">{item.Quantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={addSelectedItemsToDetail}
                                            disabled={selectedMssqlItems.length === 0}
                                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                                        >
                                            加入選中項目
                                        </button>
                                    </div>
                                </>
                            ) : !mssqlLoading && (
                                <div className="text-center py-8 text-gray-500">
                                    請輸入貨號進行查詢
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )} */}
        </div>
    );
}