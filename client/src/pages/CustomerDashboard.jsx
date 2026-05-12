import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import useAuthStore from '../store/authStore';
import { notificationClient } from '../api/notificationClient';
import ProductList from '../components/ProductList';
import RecentlyVisited from '../components/RecentlyVisited';
import { LogOut, User, ShoppingBag, Bell, X } from 'lucide-react';

const GET_NOTIFICATIONS = gql`
  query GetNotifications($userId: String!) {
    notifications(userId: $userId, unreadOnly: true, limit: 5) {
      id
      message
      createdAt
      read
      type
      productName
      productId
    }
    unreadCount(userId: $userId)
  }
`;

const MARK_AS_READ = gql`
  mutation MarkAsRead($notificationId: ID!) {
    markAsRead(notificationId: $notificationId) {
      id
      read
    }
  }
`;

const GET_CART = gql`
  query GetCart {
    getCart {
      totalItems
    }
  }
`;

const CustomerDashboard = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);

    const { data: notifData, refetch: refetchNotifs } = useQuery(GET_NOTIFICATIONS, {
        client: notificationClient,
        variables: { userId: user?.id },
        pollInterval: 30000,
        skip: !user?.id
    });

    const [markAsRead] = useMutation(MARK_AS_READ, {
        client: notificationClient
    });

    const { data: cartData } = useQuery(GET_CART, {
        skip: !user?.id,
        fetchPolicy: 'cache-and-network'
    });

    const handleViewProduct = (productId) => {
        if (!productId) return;
        setShowNotifications(false);
        navigate(`/product/${productId}`);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleMarkRead = async (id) => {
        try {
            await markAsRead({ variables: { notificationId: id } });
            refetchNotifs();
        } catch (err) {
            console.error('Error marking read:', err);
        }
    };

    const unreadCount = notifData?.unreadCount || 0;
    const notifications = notifData?.notifications || [];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="bg-indigo-600 p-2 rounded-lg">
                                <ShoppingBag className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-slate-900">Mini-Inventory</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Notifications */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-full relative"
                                >
                                    <Bell className="h-6 w-6" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                                        <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                                            <h3 className="font-bold text-slate-900">Notifications</h3>
                                            <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-4 text-center text-slate-500 text-sm">
                                                    No new notifications
                                                </div>
                                            ) : (
                                                notifications.map((notif) => (
                                                    <div key={notif.id} className="p-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 group">
                                                        <p className="text-sm text-slate-800 mb-1">{notif.message}</p>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs text-slate-500">
                                                                {new Date(notif.createdAt).toLocaleDateString()}
                                                            </span>
                                                            <button
                                                                onClick={() => handleMarkRead(notif.id)}
                                                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                                            >
                                                                Mark read
                                                            </button>
                                                        </div>

                                                        {notif.type === 'NEW_PRODUCT' && notif.productId && (
                                                            <div className="mt-3 p-3 border border-indigo-100 rounded-lg bg-indigo-50/60 text-xs text-indigo-900 hidden group-hover:flex flex-col gap-2">
                                                                <p className="text-sm font-semibold">New product spotlight</p>
                                                                <p className="text-base font-bold text-indigo-700">{notif.productName}</p>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleViewProduct(notif.productId)}
                                                                    className="self-start px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                                                                >
                                                                    View Product
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => navigate('/cart')}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-full relative"
                            >
                                <ShoppingBag className="h-6 w-6" />
                                {(cartData?.getCart?.totalItems > 0) && (
                                    <span className="absolute top-0 right-0 h-4 w-4 bg-indigo-600 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white">
                                        {cartData.getCart.totalItems}
                                    </span>
                                )}
                            </button>

                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                    {user?.name?.charAt(0) || 'C'}
                                </div>
                                <span className="text-sm font-medium text-slate-700 hidden sm:block">{user?.name}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-8">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <User className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name}!</h1>
                            <p className="text-slate-500">{user?.email}</p>
                            <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                Customer
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Recently Visited Section */}
                    <RecentlyVisited />

                    {/* Products Section */}
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Browse Products</h2>
                        <ProductList />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CustomerDashboard;
