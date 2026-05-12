import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import { ArrowLeft, ShoppingCart, Loader, AlertTriangle, CheckCircle, Check } from 'lucide-react';
import { getSafeProductImage } from '../lib/imageHelpers';

const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      name
      description
      price
      stock
      category
      images
      sku
      supplierName
    }
  }
`;

const TRACK_VISIT = gql`
  mutation TrackVisit($productId: ID!) {
    trackVisit(productId: $productId)
  }
`;

const ADD_TO_CART = gql`
  mutation AddToCart($productId: ID!, $quantity: Int!) {
    addToCart(productId: $productId, quantity: $quantity) {
      id
      totalItems
    }
  }
`;

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const hasTrackedRef = useRef(false);
    const { loading, error, data } = useQuery(GET_PRODUCT, {
        variables: { id }
    });
    const [trackVisit] = useMutation(TRACK_VISIT);
    const [addToCart, { loading: addingToCart }] = useMutation(ADD_TO_CART);
    const [addedToCart, setAddedToCart] = useState(false);

    useEffect(() => {
        if (id && data?.product && !hasTrackedRef.current) {
            hasTrackedRef.current = true;
            // Track visit on backend (Redis LRU cache is per-user)
            trackVisit({ variables: { productId: id } })
                .then(() => {
                    console.log('✅ Product visit tracked');
                })
                .catch(err => {
                    console.error('Error tracking visit:', err);
                });
        }
    }, [id, data, trackVisit]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !data?.product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Product Not Found</h2>
                    <p className="text-slate-500 mb-6">The product you are looking for does not exist or has been removed.</p>
                    <button
                        onClick={() => navigate('/customer')}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const { product } = data;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/customer')}
                    className="mb-6 flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors font-medium"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Products
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
                    {/* Image Section */}
                    <div className="md:w-1/2 bg-slate-100 flex items-center justify-center p-8 min-h-[400px]">
                        <img
                            src={getSafeProductImage(product.name, product.images)}
                            alt={product.name}
                            className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                        />
                    </div>

                    {/* Details Section */}
                    <div className="md:w-1/2 p-8 flex flex-col">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wide">
                                    {product.category}
                                </span>
                                {product.stock <= 5 && product.stock > 0 && (
                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase tracking-wide">
                                        Low Stock
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl font-bold text-slate-900 mb-2">{product.name}</h1>
                            <p className="text-slate-500 text-sm mb-6">SKU: {product.sku}</p>

                            <div className="text-3xl font-bold text-slate-900 mb-6">
                                ${product.price.toFixed(2)}
                            </div>

                            <div className="prose prose-slate mb-8">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Description</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {product.description || 'No description available for this product.'}
                                </p>
                            </div>

                            {product.supplierName && (
                                <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Sold By</p>
                                    <p className="text-slate-900 font-medium flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                        {product.supplierName}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto pt-6 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <span className={`text-sm font-medium ${product.stock > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {product.stock > 0 ? `${product.stock} units in stock` : 'Out of Stock'}
                                </span>
                            </div>
                            <button
                                disabled={product.stock === 0 || addingToCart}
                                onClick={async () => {
                                    try {
                                        await addToCart({
                                            variables: {
                                                productId: product.id,
                                                quantity: 1
                                            }
                                        });
                                        setAddedToCart(true);
                                        setTimeout(() => setAddedToCart(false), 2000);
                                    } catch (err) {
                                        console.error('Failed to add to cart:', err);
                                        alert('Failed to add to cart: ' + err.message);
                                    }
                                }}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 ${addedToCart
                                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-200'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                                    }`}
                            >
                                {addedToCart ? (
                                    <>
                                        <Check className="h-5 w-5" />
                                        Added to Cart
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="h-5 w-5" />
                                        {product.stock === 0 ? 'Out of Stock' : addingToCart ? 'Adding...' : 'Add to Cart'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
