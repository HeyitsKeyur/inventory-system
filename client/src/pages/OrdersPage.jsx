import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { Loader, Package, User, Calendar, DollarSign } from 'lucide-react';

const GET_ORDERS = gql`
  query GetOrders {
    orders {
      id
      orderNumber
      customerId
      totalAmount
      status
      createdAt
      items {
        name
        sku
        quantity
        price
      }
    }
  }
`;

const OrdersPage = () => {
    const { loading, error, data } = useQuery(GET_ORDERS);

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
                    <p className="text-red-600 font-bold mb-2">Error loading orders</p>
                    <p className="text-slate-500">{error.message}</p>
                </div>
            </div>
        );
    }

    const orders = data?.orders || [];

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                    <Package className="h-8 w-8 text-indigo-600" />
                    Customer Orders
                </h1>

                {orders.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
                        <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <h2 className="text-xl font-medium text-slate-900 mb-2">No orders yet</h2>
                        <p className="text-slate-500">When customers place orders, they will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap gap-4 justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <span className="font-mono text-sm text-slate-500">#{order.orderNumber}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            {new Date(Number(order.createdAt)).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-2 font-bold text-slate-900">
                                            <DollarSign className="h-4 w-4" />
                                            {order.totalAmount.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wider">Items</h3>
                                    <div className="space-y-2">
                                        {order.items.map((item, index) => (
                                            <div key={index} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-sm font-medium">
                                                        {item.quantity}x
                                                    </span>
                                                    <span className="text-slate-900">{item.name}</span>
                                                    <span className="text-slate-400 text-xs">({item.sku})</span>
                                                </div>
                                                <span className="text-slate-600">${item.price.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersPage;
