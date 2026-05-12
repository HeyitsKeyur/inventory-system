import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import useAuthStore from '../store/authStore';
import {
    ArrowLeft,
    AlertTriangle,
    Loader,
    Bell,
    CheckCircle
} from 'lucide-react';

const GET_LOW_STOCK_PRODUCTS = gql`
  query GetLowStockProducts {
    lowStockProducts {
      id
      name
      sku
      stock
      lowStockThreshold
      supplierName
    }
  }
`;

const NOTIFY_LOW_STOCK = gql`
  mutation NotifyLowStock($productId: ID!) {
    notifyLowStock(productId: $productId) {
      success
      message
      notificationId
    }
  }
`;

const LowStockPage = () => {
    const navigate = useNavigate();
    const { loading, error, data } = useQuery(GET_LOW_STOCK_PRODUCTS);
    const [notifyLowStock] = useMutation(NOTIFY_LOW_STOCK);
    const [notificationStatus, setNotificationStatus] = useState({});

    const handleNotifySupplier = async (productId, productName) => {
        try {
            setNotificationStatus(prev => ({ ...prev, [productId]: 'sending' }));

            const { data } = await notifyLowStock({
                variables: { productId }
            });

            if (data.notifyLowStock.success) {
                setNotificationStatus(prev => ({ ...prev, [productId]: 'sent' }));
                setTimeout(() => {
                    setNotificationStatus(prev => ({ ...prev, [productId]: null }));
                }, 3000);
            }
        } catch (err) {
            console.error('Error notifying supplier:', err);
            setNotificationStatus(prev => ({ ...prev, [productId]: 'error' }));
            setTimeout(() => {
                setNotificationStatus(prev => ({ ...prev, [productId]: null }));
            }, 3000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <p className="text-red-600 font-bold mb-2">Error loading low stock items</p>
                    <p className="text-slate-500">{error.message}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const lowStockItems = data?.lowStockProducts || [];

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <AlertTriangle className="h-6 w-6 text-red-500" />
                            Low Stock Items
                        </h1>
                        <p className="text-slate-500 mt-1">Manage all products that are below their stock threshold.</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Product Name</th>
                                    <th className="px-6 py-3">SKU</th>
                                    <th className="px-6 py-3">Supplier</th>
                                    <th className="px-6 py-3">Stock Level</th>
                                    <th className="px-6 py-3">Threshold</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {lowStockItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-slate-500">No low stock items found</td>
                                    </tr>
                                ) : (
                                    lowStockItems.map((item) => {
                                        const status = notificationStatus[item.id];
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                                                <td className="px-6 py-4 text-slate-500">{item.sku}</td>
                                                <td className="px-6 py-4 text-slate-500">{item.supplierName || 'N/A'}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">
                                                        {item.stock}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">{item.lowStockThreshold}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleNotifySupplier(item.id, item.name)}
                                                        disabled={status === 'sending' || status === 'sent'}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${status === 'sent'
                                                            ? 'bg-green-600 text-white cursor-not-allowed'
                                                            : status === 'sending'
                                                                ? 'bg-indigo-400 text-white cursor-wait'
                                                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                            }`}
                                                    >
                                                        {status === 'sending' ? (
                                                            <>
                                                                <Loader className="h-3 w-3 animate-spin" />
                                                                Sending...
                                                            </>
                                                        ) : status === 'sent' ? (
                                                            <>
                                                                <CheckCircle className="h-3 w-3" />
                                                                Notified
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Bell className="h-3 w-3" />
                                                                Notify Supplier
                                                            </>
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LowStockPage;
