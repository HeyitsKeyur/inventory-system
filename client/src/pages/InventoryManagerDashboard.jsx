import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
    LayoutDashboard,
    Package,
    AlertTriangle,
    LogOut,
    Search,
    Bell,
    CheckCircle,
    Loader,
    Plus
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import AddProductModal from '../components/AddProductModal';

const GET_DASHBOARD_DATA = gql`
  query GetInventoryDashboard {
    products(limit: 5) {
      id
      name
      sku
      stock
      price
      category
      lowStockThreshold
    }
    lowStockProducts {
      id
      name
      sku
      stock
      lowStockThreshold
      supplierName
    }
    fulfilledOrders(limit: 5) {
      id
      productName
      supplierName
      quantity
      fulfilledAt
    }
    stats {
      totalProducts
      lowStockCount
      totalValue
      pendingOrders
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

// ... (keep existing imports)

const InventoryManagerDashboard = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const { loading, error, data, refetch } = useQuery(GET_DASHBOARD_DATA);
    const [notifyLowStock, { loading: notifying }] = useMutation(NOTIFY_LOW_STOCK);

    const [notificationStatus, setNotificationStatus] = useState({});
    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

    const products = data?.products || [];
    const lowStockItems = data?.lowStockProducts || [];
    const fulfilledOrders = data?.fulfilledOrders || [];
    const dashboardStats = data?.stats || {};

    const stats = [
        { title: 'Total Products', value: dashboardStats.totalProducts || 0, icon: Package, color: 'bg-blue-500' },
        { title: 'Low Stock Items', value: dashboardStats.lowStockCount || 0, icon: AlertTriangle, color: 'bg-red-500' },
        { title: 'Total Value', value: `$${(dashboardStats.totalValue || 0).toLocaleString()}`, icon: LayoutDashboard, color: 'bg-emerald-500' },
        { title: 'Pending Orders', value: dashboardStats.pendingOrders || 0, icon: CheckCircle, color: 'bg-amber-500' },
    ];

    const sidebarItems = [
        {
            label: 'Dashboard',
            icon: LayoutDashboard,
            active: true,
            action: () => navigate('/inventory-manager')
        },
        {
            label: 'Inventory',
            icon: Package,
            active: false,
            action: () => navigate('/inventory-manager')
        },
        {
            label: 'Low Stock',
            icon: AlertTriangle,
            active: false,
            action: () => navigate('/inventory-manager/low-stock')
        },
        {
            label: 'Orders',
            icon: CheckCircle,
            active: false,
            action: () => navigate('/inventory-manager/orders')
        }
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleNotifySupplier = async (productId, productName) => {
        setNotificationStatus(prev => ({ ...prev, [productId]: 'sending' }));
        try {
            const { data } = await notifyLowStock({ variables: { productId } });
            if (data.notifyLowStock.success) {
                setNotificationStatus(prev => ({ ...prev, [productId]: 'sent' }));
            } else {
                alert(data.notifyLowStock.message);
                setNotificationStatus(prev => ({ ...prev, [productId]: 'error' }));
            }
        } catch (err) {
            console.error('Notification error:', err);
            setNotificationStatus(prev => ({ ...prev, [productId]: 'error' }));
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <p className="text-red-600 font-bold mb-2">Error loading dashboard</p>
                <p className="text-slate-500">{error.message}</p>
                <button onClick={() => refetch()} className="mt-4 text-indigo-600 hover:underline">Retry</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            <AddProductModal
                isOpen={isAddProductModalOpen}
                onClose={() => setIsAddProductModalOpen(false)}
                onSuccess={() => {
                    refetch();
                    // Optional: Show toast
                }}
            />
            {/* Sidebar */}
            <aside className="hidden md:flex md:flex-col fixed inset-y-0 w-64 bg-white border-r border-slate-200 shadow-sm">
                <div className="px-6 py-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-600 text-white">
                            <LayoutDashboard className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Inventory</p>
                            <p className="text-lg font-bold text-slate-900">Manager Hub</p>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-slate-500 leading-snug">
                        Stay on top of stock levels, supplier notifications, and replenishment tasks.
                    </p>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1">
                    {sidebarItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={item.action}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${item.active
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="px-6 py-5 border-t border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">
                            {user?.name?.slice(0, 1) || 'IM'}
                        </div>
                        <div>
                            <p className="font-medium text-slate-900 text-sm">{user?.name}</p>
                            <p className="text-xs text-slate-500">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden sticky top-0 z-10 bg-white border-b border-slate-200">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Inventory Manager</p>
                        <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsAddProductModalOpen(true)}
                            className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium"
                        >
                            Add Product
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-full border border-slate-200 text-slate-500"
                            aria-label="Logout"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="md:ml-64 min-h-screen p-8">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
                            <p className="text-slate-500 mt-1">Welcome back, manage your inventory efficiently.</p>
                        </div>
                        <button
                            onClick={() => setIsAddProductModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <Plus className="h-4 w-4" />
                            Add Product
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                                        <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                                    </div>
                                    <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10 text-${stat.color.replace('bg-', '')}`}>
                                        <stat.icon className={`h-6 w-6 text-${stat.color.replace('bg-', '')}-600`} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Recent Products Table */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Products Table */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-slate-900">Recent Products</h2>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search products..."
                                            className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                                        />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-medium">
                                            <tr>
                                                <th className="px-6 py-3">Product Name</th>
                                                <th className="px-6 py-3">SKU</th>
                                                <th className="px-6 py-3">Category</th>
                                                <th className="px-6 py-3">Price</th>
                                                <th className="px-6 py-3">Stock</th>
                                                <th className="px-6 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {products.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-4 text-center text-slate-500">No products found</td>
                                                </tr>
                                            ) : (
                                                products.map((product) => (
                                                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-slate-900">{product.name}</td>
                                                        <td className="px-6 py-4 text-slate-500">{product.sku}</td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                                {product.category}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-900">${product.price.toFixed(2)}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`font-medium ${product.stock < 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                                {product.stock}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">Edit</button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 border-t border-slate-100 text-center">
                                    <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View All Products</button>
                                </div>
                            </div>

                            {/* Recent Fulfillments */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-100">
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                                        Recent Fulfillments
                                    </h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-medium">
                                            <tr>
                                                <th className="px-6 py-3">Product</th>
                                                <th className="px-6 py-3">Supplier</th>
                                                <th className="px-6 py-3">Quantity</th>
                                                <th className="px-6 py-3">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {fulfilledOrders.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-4 text-center text-slate-500">No recent fulfillments</td>
                                                </tr>
                                            ) : (
                                                fulfilledOrders.map((order) => (
                                                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-slate-900">{order.productName}</td>
                                                        <td className="px-6 py-4 text-slate-500">{order.supplierName}</td>
                                                        <td className="px-6 py-4 text-emerald-600 font-medium">+{order.quantity}</td>
                                                        <td className="px-6 py-4 text-slate-500">
                                                            {new Date(parseInt(order.fulfilledAt)).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Low Stock Alerts */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
                            <div className="p-6 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                    Low Stock Alerts
                                </h2>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {lowStockItems.length === 0 ? (
                                    <div className="p-4 text-center text-slate-500 text-sm">No low stock alerts</div>
                                ) : (
                                    <>
                                        {lowStockItems.slice(0, 5).map((item) => {
                                            const status = notificationStatus[item.id];
                                            return (
                                                <div key={item.id} className="p-4 hover:bg-red-50 transition-colors">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h3 className="font-medium text-slate-900">{item.name}</h3>
                                                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                                            Only {item.stock} left
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mb-3">
                                                        SKU: {item.sku} • Threshold: {item.lowStockThreshold}
                                                        {item.supplierName && ` • Supplier: ${item.supplierName}`}
                                                    </p>
                                                    <button
                                                        onClick={() => handleNotifySupplier(item.id, item.name)}
                                                        disabled={status === 'sending' || status === 'sent'}
                                                        className={`w-full py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5 ${status === 'sent'
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
                                                                Supplier Notified
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Bell className="h-3 w-3" />
                                                                Notify Supplier
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {lowStockItems.length > 10 && (
                                            <div className="p-4 text-center border-t border-slate-100">
                                                <button
                                                    onClick={() => navigate('/inventory-manager/low-stock')}
                                                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                                                >
                                                    View All ({lowStockItems.length})
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
                                <p className="text-xs text-slate-500">Alerts are updated in real-time</p>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default InventoryManagerDashboard;
