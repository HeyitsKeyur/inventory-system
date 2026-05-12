import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Loader, Eye, Check } from 'lucide-react';
import { useState } from 'react';
import { getSafeProductImage } from '../lib/imageHelpers';

const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      id
      name
      description
      price
      stock
      category
      images
    }
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

const ProductList = () => {
    const navigate = useNavigate();
    const { loading, error, data } = useQuery(GET_PRODUCTS);
    const [addToCart] = useMutation(ADD_TO_CART);
    const [addedProducts, setAddedProducts] = useState({});

    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
    };

    const handleAddToCart = async (e, product) => {
        e.stopPropagation(); // Prevent navigation
        try {
            await addToCart({
                variables: {
                    productId: product.id,
                    quantity: 1
                }
            });

            // Show success state briefly
            setAddedProducts(prev => ({ ...prev, [product.id]: true }));
            setTimeout(() => {
                setAddedProducts(prev => ({ ...prev, [product.id]: false }));
            }, 2000);

        } catch (err) {
            console.error('Failed to add to cart:', err);
            alert('Failed to add to cart: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-4 rounded-lg text-center">
                <p className="text-red-600 font-medium">Error loading products</p>
                <p className="text-sm text-red-500 mt-1">{error.message}</p>
            </div>
        );
    }

    if (!data?.products?.length) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
                <p className="text-slate-500">No products found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.products.map((product) => (
                <div key={product.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
                    <div
                        className="h-48 bg-slate-100 flex items-center justify-center relative cursor-pointer"
                        onClick={() => handleProductClick(product.id)}
                    >
                        <img
                            src={getSafeProductImage(product.name, product.images)}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                        />

                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="bg-white/90 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                <Eye className="h-3.5 w-3.5" />
                                View Details
                            </span>
                        </div>

                        {product.stock <= 5 && product.stock > 0 && (
                            <span className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full z-10">
                                Low Stock
                            </span>
                        )}
                        {product.stock === 0 && (
                            <span className="absolute top-2 right-2 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full z-10">
                                Out of Stock
                            </span>
                        )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                    {product.category}
                                </span>
                                <h3
                                    className="font-bold text-slate-900 mt-1 line-clamp-1 cursor-pointer hover:text-indigo-600 transition-colors"
                                    onClick={() => handleProductClick(product.id)}
                                >
                                    {product.name}
                                </h3>
                            </div>
                            <p className="font-bold text-slate-900">${product.price.toFixed(2)}</p>
                        </div>

                        <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                            {product.description || 'No description available.'}
                        </p>

                        <button
                            disabled={product.stock === 0}
                            onClick={(e) => handleAddToCart(e, product)}
                            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${addedProducts[product.id]
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                        >
                            {addedProducts[product.id] ? (
                                <>
                                    <Check className="h-4 w-4" />
                                    Added
                                </>
                            ) : (
                                <>
                                    <ShoppingCart className="h-4 w-4" />
                                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProductList;
