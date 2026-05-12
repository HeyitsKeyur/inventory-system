import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import useAuthStore from '../store/authStore';
import { notificationClient } from '../api/notificationClient';
import { GET_NOTIFICATIONS, MARK_AS_READ } from '../api/notificationQueries';
import {
    LayoutDashboard,
    Package,
    Truck,
    LogOut,
    TrendingUp,
    Bell,
    CheckCircle,
    Clock,
    Loader,
    Box,
    AlertTriangle
} from 'lucide-react';

const FULFILL_ORDER = gql`
  mutation FulfillOrder($productId: ID!, $quantity: Int!) {
    fulfillOrder(productId: $productId, quantity: $quantity) {
      success
      message
      newStock
    }
  }
`;

const GET_MY_PRODUCTS = gql`
  query GetMyProducts($supplierId: ID) {
    products(supplierId: $supplierId) {
      id
      name
      sku
      stock
      lowStockThreshold
    }
  }
`;

const NOTIFY_LOW_STOCK = gql`
  mutation NotifyLowStock($productId: ID!) {
    notifyLowStock(productId: $productId) {
      success
      message
    }
  }
`;

const SupplierDashboard = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [fulfillStatus, setFulfillStatus] = useState({});
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'products'

    // Fetch notifications
    const { data: notificationData, loading: notificationsLoading, refetch: refetchNotifications } = useQuery(GET_NOTIFICATIONS, {
        client: notificationClient,
        variables: { supplierId: user?.id, limit: 10 },
        pollInterval: 5000
    });

    // Fetch my products
    const { data: productsData, loading: productsLoading } = useQuery(GET_MY_PRODUCTS, {
        variables: { supplierId: user?.id },
        skip: !user?.id
    });

    // Mutations
    const [markAsRead] = useMutation(MARK_AS_READ, {
        client: notificationClient
    });

    const [fulfillOrder] = useMutation(FULFILL_ORDER);
    const [notifyLowStock] = useMutation(NOTIFY_LOW_STOCK);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleFulfillOrder = async (notification, quantity = 50) => {
        try {
            setFulfillStatus(prev => ({ ...prev, [notification.id]: 'fulfilling' }));

            const { data } = await fulfillOrder({
                variables: {
                    productId: notification.productId,
                    quantity: quantity
                }
            });

            if (data.fulfillOrder.success) {
                await markAsRead({
                    variables: { notificationId: notification.id }
                });

                setFulfillStatus(prev => ({ ...prev, [notification.id]: 'success' }));
                refetchNotifications();

                setTimeout(() => {
                    setFulfillStatus(prev => ({ ...prev, [notification.id]: null }));
                }, 3000);
            }
        } catch (error) {
            console.error('Error fulfilling order:', error);
            setFulfillStatus(prev => ({ ...prev, [notification.id]: 'error' }));
        }
    };

    const handleTestAlert = async (productId) => {
        try {
            const { data } = await notifyLowStock({
                variables: { productId }
            });
            if (data.notifyLowStock.success) {
                alert('Test alert sent! Check your notifications panel.');
                refetchNotifications();
            } else {
                alert('Failed to send alert: ' + data.notifyLowStock.message);
            }
        } catch (error) {
            console.error('Error sending test alert:', error);
            alert('Error sending test alert: ' + error.message);
        }
    };

    const notifications = (notificationData?.notifications || []).filter(n => !n.read);
    const unreadCount = notifications.length;
    const myProducts = productsData?.products || [];

    // Mock stats
    const stats = [
        { title: 'My Products', value: myProducts.length || '0', icon: Package, color: 'bg-blue-500' },
        { title: 'Pending Requests', value: '8', icon: Clock, color: 'bg-amber-500' },
        { title: 'Completed Orders', value: '126', icon: CheckCircle, color: 'bg-emerald-500' },
        { title: 'Revenue', value: '$12,450', icon: TrendingUp, color: 'bg-indigo-500' },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-10 hidden md:flex flex-col">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xl">
                        <Truck className="h-8 w-8" />
                        <span>Supplier</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 ml-10">Portal</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'dashboard' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <LayoutDashboard className="h-5 w-5" />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'products' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Package className="h-5 w-5" />
                        My Products
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                            {user?.name?.charAt(0) || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'Supplier'}</p>
                            <p className="text-xs text-slate-500 truncate" title={user?.id}>ID: {user?.id?.substring(0, 8)}...</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="md:ml-64 min-h-screen p-8">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                {activeTab === 'dashboard' ? 'Supplier Dashboard' : 'My Products'}
                            </h1>
                            <p className="text-slate-500 mt-1">
                                {activeTab === 'dashboard' ? 'Manage your products and fulfill stock requests.' : 'View and manage your product inventory.'}
                            </p>
                        </div>
                        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <Bell className="h-6 w-6" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-slate-50"></span>
                            )}
                        </button>
                    </div>

                    {activeTab === 'dashboard' ? (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {stats.map((stat, index) => (
                                    <div key={index} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                                                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                                            </div>
                                            <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                                                <stat.icon className={`h-6 w-6 text-${stat.color.replace('bg-', '')}-600`} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Notifications Panel */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Notifications */}
                                <div className="lg:col-span-1">
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
                                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                <Bell className="h-5 w-5 text-emerald-600" />
                                                Low Stock Alerts
                                            </h2>
                                            {unreadCount > 0 && (
                                                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                                    {unreadCount} New
                                                </span>
                                            )}
                                        </div>
                                        <div className="divide-y divide-slate-100 overflow-y-auto flex-1 max-h-[500px]">
                                            {notificationsLoading ? (
                                                <div className="p-8 text-center text-slate-500">
                                                    <Loader className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                                                    Loading alerts...
                                                </div>
                                            ) : notifications.length === 0 ? (
                                                <div className="p-8 text-center text-slate-500">
                                                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-200" />
                                                    No new alerts
                                                </div>
                                            ) : (
                                                notifications.map((notification) => {
                                                    const status = fulfillStatus[notification.id];
                                                    const isRead = notification.read || status === 'success';

                                                    return (
                                                        <div key={notification.id} className={`p-4 transition-colors ${isRead ? 'bg-white opacity-75' : 'bg-emerald-50/50 hover:bg-emerald-50'}`}>
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="flex-1">
                                                                    <h3 className="font-medium text-slate-900 text-sm">{notification.productName}</h3>
                                                                    <p className="text-xs text-slate-500 mt-0.5">SKU: {notification.sku}</p>
                                                                </div>
                                                                <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                                    {notification.currentStock} left
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                                                                <span>Threshold: {notification.lowStockThreshold}</span>
                                                                <span>{new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>

                                                            {!isRead ? (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        defaultValue="50"
                                                                        className="w-20 px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-emerald-500"
                                                                        id={`qty-${notification.id}`}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const qtyInput = document.getElementById(`qty-${notification.id}`);
                                                                            const qty = parseInt(qtyInput.value) || 50;
                                                                            handleFulfillOrder(notification, qty);
                                                                        }}
                                                                        disabled={status === 'fulfilling'}
                                                                        className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5 ${status === 'fulfilling'
                                                                            ? 'bg-emerald-400 text-white cursor-wait'
                                                                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                                                                            }`}
                                                                    >
                                                                        {status === 'fulfilling' ? (
                                                                            <>
                                                                                <Loader className="h-3 w-3 animate-spin" />
                                                                                Restocking...
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Box className="h-3 w-3" />
                                                                                Fulfill
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-1.5 text-xs font-medium text-emerald-600 flex items-center justify-center gap-1.5 bg-emerald-50 rounded">
                                                                    <CheckCircle className="h-3 w-3" />
                                                                    Fulfilled & Read
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Stock Requests Table (Placeholder) */}
                                <div className="lg:col-span-2">
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex items-center justify-center p-12 text-slate-400">
                                        <div className="text-center">
                                            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>Stock Requests feature coming soon...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* My Products Tab */
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-3">Product Name</th>
                                            <th className="px-6 py-3">SKU</th>
                                            <th className="px-6 py-3">Stock</th>
                                            <th className="px-6 py-3">Threshold</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {productsLoading ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                                    <Loader className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                                                    Loading products...
                                                </td>
                                            </tr>
                                        ) : myProducts.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                                    No products found assigned to you.
                                                </td>
                                            </tr>
                                        ) : (
                                            myProducts.map((product) => (
                                                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-900">{product.name}</td>
                                                    <td className="px-6 py-4 text-slate-500">{product.sku}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stock <= product.lowStockThreshold ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                                                            }`}>
                                                            {product.stock}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500">{product.lowStockThreshold}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleTestAlert(product.id)}
                                                            className="text-amber-600 hover:text-amber-800 font-medium text-xs flex items-center gap-1 ml-auto"
                                                            title="Send a test low stock alert to yourself"
                                                        >
                                                            <AlertTriangle className="h-3.5 w-3.5" />
                                                            Test Alert
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default SupplierDashboard;
