import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowLeft, Loader } from 'lucide-react';
import { getSafeProductImage } from '../lib/imageHelpers';

const GET_CART = gql`
  query GetCart {
    getCart {
      id
      items {
        product {
          id
          name
          price
          images
        }
        quantity
      }
      totalItems
      totalPrice
    }
  }
`;

const REMOVE_FROM_CART = gql`
  mutation RemoveFromCart($productId: ID!) {
    removeFromCart(productId: $productId) {
      id
      totalItems
      totalPrice
      items {
        product {
          id
        }
        quantity
      }
    }
  }
`;

const CLEAR_CART = gql`
  mutation ClearCart {
    clearCart
  }
`;

const PLACE_ORDER = gql`
  mutation PlaceOrder {
    placeOrder {
      id
      totalAmount
      status
    }
  }
`;

const CartPage = () => {
    const navigate = useNavigate();
    const { loading, error, data } = useQuery(GET_CART);
    const [removeFromCart] = useMutation(REMOVE_FROM_CART);
    const [clearCart] = useMutation(CLEAR_CART, {
        refetchQueries: [{ query: GET_CART }]
    });
    const [placeOrder, { loading: placingOrder }] = useMutation(PLACE_ORDER, {
        refetchQueries: [{ query: GET_CART }]
    });

    const handleRemove = async (productId) => {
        try {
            await removeFromCart({ variables: { productId } });
        } catch (err) {
            alert('Error removing item: ' + err.message);
        }
    };

    const handleClearCart = async () => {
        if (window.confirm('Are you sure you want to clear your cart?')) {
            try {
                await clearCart();
            } catch (err) {
                alert('Error clearing cart: ' + err.message);
            }
        }
    };

    const handlePlaceOrder = async () => {
        if (window.confirm(`Confirm order for $${cart.totalPrice.toFixed(2)}?`)) {
            try {
                await placeOrder();
                alert('Order placed successfully! 🎉');
                navigate('/customer');
            } catch (err) {
                alert('Failed to place order: ' + err.message);
            }
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
                    <p className="text-red-600 font-bold mb-2">Error loading cart</p>
                    <p className="text-slate-500">{error.message}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 text-indigo-600 hover:underline">Retry</button>
                </div>
            </div>
        );
    }

    const cart = data?.getCart;
    const items = cart?.items || [];

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/customer')}
                    className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-6 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </button>

                <h1 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                    <ShoppingBag className="h-8 w-8 text-indigo-600" />
                    Your Shopping Cart
                </h1>

                {items.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
                        <ShoppingBag className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <h2 className="text-xl font-medium text-slate-900 mb-2">Your cart is empty</h2>
                        <p className="text-slate-500 mb-6">Looks like you haven't added anything yet.</p>
                        <button
                            onClick={() => navigate('/customer')}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {items.map((item) => (
                                <div key={item.product.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-center">
                                    <div className="h-20 w-20 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <img
                                            src={getSafeProductImage(item.product.name, item.product.images)}
                                            alt={item.product.name}
                                            className="h-full w-full object-cover rounded-lg"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 truncate">{item.product.name}</h3>
                                        <p className="text-slate-500 text-sm">${item.product.price.toFixed(2)} x {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-900 mb-2">${(item.product.price * item.quantity).toFixed(2)}</p>
                                        <button
                                            onClick={() => handleRemove(item.product.id)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-end">
                                <button
                                    onClick={handleClearCart}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Clear Cart
                                </button>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-8">
                                <h2 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h2>
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Subtotal ({cart.totalItems} items)</span>
                                        <span>${cart.totalPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Shipping</span>
                                        <span className="text-emerald-600 font-medium">Free</span>
                                    </div>
                                    <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-slate-900 text-lg">
                                        <span>Total</span>
                                        <span>${cart.totalPrice.toFixed(2)}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={placingOrder}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                >
                                    {placingOrder ? (
                                        <>
                                            <Loader className="h-5 w-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Place Order'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartPage;
