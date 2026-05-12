import React from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { Clock, ShoppingCart } from 'lucide-react';
import { getSafeProductImage } from '../lib/imageHelpers';

const GET_RECENTLY_VISITED = gql`
  query GetRecentlyVisited {
    recentlyVisited {
      id
      name
      price
      images
      category
      stock
    }
  }
`;

import { useNavigate } from 'react-router-dom';

// ... (imports)

const RecentlyVisited = () => {
    const navigate = useNavigate();
    const { loading, error, data } = useQuery(GET_RECENTLY_VISITED, {
        fetchPolicy: 'cache-and-network', // Always fetch from server
        nextFetchPolicy: 'cache-first'
    });

    if (loading || error || !data?.recentlyVisited?.length) return null;

    return (
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-slate-400" />
                <h2 className="text-xl font-bold text-slate-900">Recently Viewed</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.recentlyVisited.map((product) => (
                    <div
                        key={product.id}
                        className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group cursor-pointer"
                        onClick={() => navigate(`/product/${product.id}`)}
                    >
                        <div className="h-32 bg-slate-100 relative">
                            <img
                                src={getSafeProductImage(product.name, product.images)}
                                alt={product.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                            />
                            {product.stock === 0 && (
                                <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">Out of Stock</span>
                                </div>
                            )}
                        </div>
                        <div className="p-3">
                            <p className="text-xs text-indigo-600 font-medium mb-1">{product.category}</p>
                            <h3 className="font-medium text-slate-900 text-sm truncate">{product.name}</h3>
                            <div className="flex items-center justify-between mt-2">
                                <span className="font-bold text-slate-900 text-sm">${product.price.toFixed(2)}</span>
                                <button
                                    disabled={product.stock === 0}
                                    className="p-1.5 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors disabled:opacity-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Add to cart logic here if implemented
                                    }}
                                >
                                    <ShoppingCart className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentlyVisited;
