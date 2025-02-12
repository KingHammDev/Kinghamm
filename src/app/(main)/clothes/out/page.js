'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { usePermission } from '@/contexts/PermissionContext';

export default function ClothesOutPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const docNo = searchParams.get('docNo');

    const [userData, setUserData] = useState(null);
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

    const [isClothesModalOpen, setIsClothesModalOpen] = useState(false);
    const [clothesSearchProductNo, setClothesSearchProductNo] = useState('');
    const [clothesData, setClothesData] = useState([]);
    const [clothesLoading, setClothesLoading] = useState(false);
    const [selectedClothesItems, setSelectedClothesItems] = useState([]);

    const { hasPermission } = usePermission();

    useEffect(() => {
        if (docNo) {
            fetchDocument(docNo);
            setIsEditing(true);
        }
        fetchUserData()
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
            const response = await fetch(`/api/clothes/out/${docNo}`);
            const data = await response.json();

            if (data.success) {
                setDocumentNo(data.document.c_out_no);
                const formattedItems = data.items.map(item => ({
                    checked: false,
                    seqNo: item.c_out_id,
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

    // const addNewLine = () => {
    //     setItems(prevItems => [
    //         ...prevItems,
    //         {
    //             checked: false,
    //             seqNo: prevItems.length + 1,
    //             productNo: '',
    //             colorName: '',
    //             po: '',
    //             size: '',
    //             quantity: '',
    //             faId: userData.faId,
    //             userId: userData.id
    //         }
    //     ]);
    // };

    const handleInputChange = (index, field, value) => {
        if (field === 'quantity') {
            if (value < 0) {
                alert("數量不可小於0")
                return
            }
        }
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
            alert('請先選擇要刪除的項目');
            return;
        }

        try {
            setLoading(true);
            const selectedItems = items.filter(item => item.checked);

            // 如果已有單據號碼，需要從資料庫刪除
            if (documentNo) {
                const response = await fetch(`/api/clothes/out/${documentNo}/items`, {
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
                    throw new Error(data.message || '刪除失敗');
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
                router.push('/clothes/out'); // 清除 URL 參數
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
            alert(error.message || '刪除時發生錯誤');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (items.some(item => !item.productNo || !item.quantity || !item.po || !item.colorName || !item.size)) {
            alert('請填寫所有必填欄位');
            return;
        }

        try {
            setLoading(true);

            const endpoint = isEditing
                ? `/api/clothes/out/${documentNo}`
                : '/api/clothes/out';

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
                alert(isEditing ? '更新成功' : '儲存成功');
                if (!isEditing) {
                    setDocumentNo(data.documentNo);
                    setIsEditing(true);
                }
            } else {
                alert(data.message || '儲存失敗');
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('儲存時發生錯誤');
        } finally {
            setLoading(false);
        }
    };

    // const handleCreateNew = () => {
    //     setItems([{ checked: false, seqNo: 1, productNo: '',colorName: '', po: '', size:'', quantity: '' }]);
    //     setDocumentNo('');
    //     setIsEditing(false);
    //     router.push('/clothes/out');
    // };



    const openSearchModal = () => {
        setIsSearchModalOpen(true);
        setSearchProductNo('');
        setDocuments([]);
        setSearchError('');
    };

    // 查詢單據按鈕
    const handleSearch = async () => {
        if (!searchProductNo.trim()) {
            setSearchError('請輸入貨號');
            return;
        }

        try {
            setSearchLoading(true);
            setSearchError('');
            const response = await fetch(`/api/clothes/out/search?productNo=${encodeURIComponent(searchProductNo)}`);
            const data = await response.json();

            if (data.success) {
                setDocuments(data.documents);
            } else {
                setSearchError(data.message);
            }
        } catch (error) {
            console.error('Error searching documents:', error);
            setSearchError('查詢時發生錯誤');
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
        router.push(`/clothes/out?docNo=${docNo}`);
        setIsSearchModalOpen(false);
    };

    const handleClothesInSearch = async () => {
        if (!clothesSearchProductNo.trim()) {
            alert('請輸入貨號');
            return;
        }

        try {
            setClothesLoading(true);
            const response = await fetch(`/api/clothes/out/search?productNo=${encodeURIComponent(clothesSearchProductNo)}`);
            const data = await response.json();
            if (data.success) {
                setClothesData(data.data);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('search error:', error);
            alert(error.message || '查詢時發生錯誤');
        } finally {
            setClothesLoading(false);
        }
    };

    // 處理選擇 ClothesIn 資料項目
    const handleClothesInItemSelect = (item, checked) => {
        if (checked) {
            setSelectedClothesItems(prev => [...prev, item]);
        } else {
            setSelectedClothesItems(prev => prev.filter(i => !(i.c_in_no === item.c_in_no && i.c_in_id === item.c_in_id && i.size === item.size)));
        }
    };

    // 將選中的項目加入到入庫明細
    const addSelectedItemsToDetail = () => {
        const newItems = [
            ...items,
            ...selectedClothesItems.map((item, index) => ({
                checked: false,
                seqNo: items.length + index + 1,
                productNo: item.od_no,
                colorName: item.color_name,
                po: item.po,
                size: item.size,
                quantity: item.quantity.toString(),
                faId: userData.faId,
                userId: userData.id
            }))
        ];
        setItems(newItems);
        setIsClothesModalOpen(false);
        setSelectedClothesItems([]);
        setClothesData([]);
        setClothesSearchProductNo('');
    };


    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-semibold text-gray-800">成品出庫作業</h1>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">單據日期:</span>
                        <input
                            type="date"
                            value={docDate}
                            onChange={(e) => setDocDate(e.target.value)}
                            className={`px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
                                ${isEditing
                                    ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                                    : 'border-gray-300'}`}
                            disabled={loading || isEditing}
                        />
                    </div>
                    {documentNo && (
                        <div className="px-3 py-1 bg-gray-100 rounded-md">
                            <span className="text-sm text-gray-600">單據號碼:</span>
                            <span className="ml-2 font-medium text-gray-800">{documentNo}</span>
                        </div>
                    )}
                </div>
                <div className="space-x-2">
                    {hasPermission('clothes_out', 'import') && (
                        <button
                            onClick={() => setIsClothesModalOpen(true)}
                            type="button"
                            className="px-4 py-2 text-purple-600 border border-purple-600 rounded hover:bg-purple-50"
                        >
                            資料匯入
                        </button>
                    )}
                    <button
                        onClick={openSearchModal}
                        type="button"
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                    >
                        查詢單據
                    </button>
                    {/* <button
                        onClick={handleCreateNew}
                        type="button"
                        className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                    >
                        新增單據
                    </button> */}
                    {hasPermission('clothes_out', 'delete') && (
                        <button
                            onClick={deleteSelected}
                            type="button"
                            className="px-4 py-2 text-red-600 border border-red-600 rounded hover:bg-red-50"
                            disabled={!items.some(item => item.checked) || loading}
                        >
                            刪除選中項目
                        </button>
                    )}
                    {/* <button
                        onClick={addNewLine}
                        type="button"
                        className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                        disabled={loading}
                    >
                        新增明細
                    </button> */}
                    {hasPermission('clothes_out', 'save') && (
                        <button
                            onClick={handleSubmit}
                            type="button"
                            disabled={loading}
                            className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600"
                        >
                            {loading ? '處理中...' : (isEditing ? '更新' : '儲存')}
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
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">序號</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">貨號</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">顏色</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">尺寸</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">數量</th>
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
                                        placeholder="請輸入貨號"
                                        readOnly
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={item.colorName}
                                        onChange={(e) => handleInputChange(index, 'colorName', e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="請輸入顏色"
                                        readOnly
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={item.po}
                                        onChange={(e) => handleInputChange(index, 'po', e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="請輸入PO"
                                        readOnly
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={item.size}
                                        onChange={(e) => handleInputChange(index, 'size', e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="請輸入尺寸"
                                        readOnly
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleInputChange(index, 'quantity', e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="請輸入數量"
                                        min="1"
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
                            <h2 className="text-xl font-semibold">查詢單據</h2>
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
                                    placeholder="請輸入貨號"
                                    className="flex-1 border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={searchLoading}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                                >
                                    {searchLoading ? '查詢中...' : '查詢'}
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
                                                單據號碼
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                建立日期
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                品項數量
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                總數量
                                            </th>
                                            <th className="px-6 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {documents.map((doc) => (
                                            <tr key={doc.c_out_no} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {doc.c_out_no}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(doc.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {doc.itemCount} 項
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {doc.totalQuantity}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => handleSelectDocument(doc.c_out_no)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        選擇
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : !searchLoading && (
                                <div className="text-center py-8 text-gray-500">
                                    請輸入貨號進行查詢
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {isClothesModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-6xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">成品庫存資料</h2>
                            <button
                                onClick={() => {
                                    setIsClothesModalOpen(false);
                                    setClothesSearchProductNo('');
                                    setClothesData([]);
                                    setSelectedClothesItems([]);
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
                                    value={clothesSearchProductNo}
                                    onChange={(e) => setClothesSearchProductNo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                    placeholder="請輸入貨號"
                                    className="flex-1 border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                    onClick={handleClothesInSearch}
                                    disabled={clothesLoading}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                                >
                                    {clothesLoading ? '查詢中...' : '查詢'}
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto max-h-[60vh]">
                            {clothesData.length > 0 ? (
                                <>
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="w-12 px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedClothesItems(clothesData);
                                                            } else {
                                                                setSelectedClothesItems([]);
                                                            }
                                                        }}
                                                        checked={clothesData.length > 0 && selectedClothesItems.length === clothesData.length}
                                                        className="rounded border-gray-300"
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">廠區</th>
                                                {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">入庫單號</th> */}
                                                {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">入庫日期</th> */}
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">貨號</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">顏色</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">尺寸</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">數量</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {clothesData.map((item, index) => (
                                                <tr key={index} className={selectedClothesItems.includes(item) ? 'bg-blue-50' : ''}>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedClothesItems.some(i => (i.c_in_no === item.c_in_no && i.c_in_id === item.c_in_id && i.size === item.size))}
                                                            onChange={(e) => handleClothesInItemSelect(item, e.target.checked)}
                                                            className="rounded border-gray-300"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">{item.fa_id}</td>
                                                    <td className="px-4 py-2">{item.od_no}</td>
                                                    <td className="px-4 py-2">{item.color_name}</td>
                                                    <td className="px-4 py-2">{item.po}</td>
                                                    <td className="px-4 py-2">{item.size}</td>
                                                    <td className="px-4 py-2">{item.quantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={addSelectedItemsToDetail}
                                            disabled={selectedClothesItems.length === 0}
                                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                                        >
                                            加入選中項目
                                        </button>
                                    </div>
                                </>
                            ) : !clothesLoading && (
                                <div className="text-center py-8 text-gray-500">
                                    請輸入貨號進行查詢
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}