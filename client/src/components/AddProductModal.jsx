import React, { useEffect, useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { authAPI } from '../api/authAPI';
import useAuthStore from '../store/authStore';

const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) {
      id
      name
      price
    }
  }
`;

/**
 * Simple modal component for adding a new product.
 * Props:
 *  - isOpen: boolean to control visibility
 *  - onClose: function to close the modal
 *  - onSuccess: callback after successful creation (e.g., refetch data)
 */
export default function AddProductModal({ isOpen, onClose, onSuccess }) {
    const { user } = useAuthStore();
    const isSupplierUser = user?.role === 'SUPPLIER';

    const [form, setForm] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        sku: '',
        lowStockThreshold: '10'
    });

    const [suppliers, setSuppliers] = useState([]);
    const [supplierMode, setSupplierMode] = useState('existing');
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [newSupplier, setNewSupplier] = useState({
        name: '',
        email: '',
        password: 'password123'
    });
    const [supplierError, setSupplierError] = useState('');
    const [supplierLoading, setSupplierLoading] = useState(false);

    const [createProduct, { loading, error }] = useMutation(CREATE_PRODUCT);

    useEffect(() => {
        if (isOpen && !isSupplierUser) {
            fetchSuppliers();
        }
    }, [isOpen, isSupplierUser]);

    const fetchSuppliers = async () => {
        try {
            setSupplierLoading(true);
            const response = await authAPI.getSuppliers();
            if (response.success) {
                const mapped = (response.data || []).map((supplier) => ({
                    id: supplier._id || supplier.id,
                    name: supplier.name,
                    email: supplier.email
                }));
                setSuppliers(mapped);
                if (!selectedSupplierId && mapped.length > 0) {
                    setSelectedSupplierId(mapped[0].id);
                }
                if (mapped.length === 0) {
                    setSupplierMode('new');
                }
            } else {
                setSupplierError(response.message || 'Failed to fetch suppliers');
            }
        } catch (err) {
            console.error('Failed to load suppliers:', err);
            setSupplierError('Unable to load suppliers. Please try again.');
        } finally {
            setSupplierLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSupplierFieldChange = (e) => {
        const { name, value } = e.target;
        setNewSupplier((prev) => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setForm({
            name: '',
            description: '',
            price: '',
            stock: '',
            category: '',
            sku: '',
            lowStockThreshold: '10'
        });
        setSupplierError('');
        setNewSupplier({
            name: '',
            email: '',
            password: 'password123'
        });
        if (suppliers.length > 0) {
            setSupplierMode('existing');
            setSelectedSupplierId(suppliers[0].id);
        } else {
            setSupplierMode('new');
        }
    };

    const handleModalClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSupplierError('');
            let supplierIdToUse = null;
            let supplierNameToUse = null;

            if (!isSupplierUser) {
                if (supplierMode === 'existing') {
                    if (!selectedSupplierId) {
                        setSupplierError('Please select a supplier');
                        return;
                    }
                    const existing = suppliers.find((supplier) => supplier.id === selectedSupplierId);
                    supplierIdToUse = selectedSupplierId;
                    supplierNameToUse = existing?.name || 'Unknown Supplier';
                } else {
                    if (!newSupplier.name || !newSupplier.email || !newSupplier.password) {
                        setSupplierError('Please fill in all new supplier fields');
                        return;
                    }
                    const response = await authAPI.register({
                        name: newSupplier.name.trim(),
                        email: newSupplier.email.trim(),
                        password: newSupplier.password,
                        role: 'SUPPLIER'
                    });
                    if (!response.success) {
                        setSupplierError(response.message || 'Failed to create supplier');
                        return;
                    }
                    supplierIdToUse = response.data.user.id;
                    supplierNameToUse = response.data.user.name;
                    await fetchSuppliers();
                }
            }

            await createProduct({
                variables: {
                    input: {
                        name: form.name,
                        description: form.description,
                        price: parseFloat(form.price),
                        stock: parseInt(form.stock, 10),
                        category: form.category,
                        sku: form.sku,
                        lowStockThreshold: form.lowStockThreshold ? parseInt(form.lowStockThreshold, 10) : undefined,
                        supplierId: supplierIdToUse || undefined,
                        supplierName: supplierNameToUse || undefined
                    }
                }
            });
            onSuccess && onSuccess();
            resetForm();
            onClose();
        } catch (err) {
            console.error('Create product error:', err);
            if (err.message) {
                setSupplierError(err.message);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-4">Add New Product</h2>
                {error && (
                    <p className="text-red-600 mb-2">Error: {error.message}</p>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Product Name"
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Description"
                        className="w-full border rounded px-3 py-2"
                    />
                    <input
                        name="price"
                        type="number"
                        step="0.01"
                        value={form.price}
                        onChange={handleChange}
                        placeholder="Price"
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                    <input
                        name="stock"
                        type="number"
                        value={form.stock}
                        onChange={handleChange}
                        placeholder="Stock Quantity"
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                    <input
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        placeholder="Category"
                        className="w-full border rounded px-3 py-2"
                    />
                    <input
                        name="sku"
                        value={form.sku}
                        onChange={handleChange}
                        placeholder="SKU"
                        className="w-full border rounded px-3 py-2"
                    />
                    <input
                        name="lowStockThreshold"
                        type="number"
                        value={form.lowStockThreshold}
                        onChange={handleChange}
                        placeholder="Low stock threshold (optional)"
                        className="w-full border rounded px-3 py-2"
                    />

                    {!isSupplierUser && (
                        <div className="border border-slate-200 rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-700">Supplier</p>
                                <div className="flex gap-4 text-sm">
                                    <label className="flex items-center gap-1">
                                        <input
                                            type="radio"
                                            name="supplierMode"
                                            value="existing"
                                            checked={supplierMode === 'existing'}
                                            onChange={() => setSupplierMode('existing')}
                                            disabled={suppliers.length === 0}
                                        />
                                        Existing
                                    </label>
                                    <label className="flex items-center gap-1">
                                        <input
                                            type="radio"
                                            name="supplierMode"
                                            value="new"
                                            checked={supplierMode === 'new'}
                                            onChange={() => setSupplierMode('new')}
                                        />
                                        New Supplier
                                    </label>
                                </div>
                            </div>

                            {supplierMode === 'existing' ? (
                                <div className="space-y-2">
                                    {supplierLoading ? (
                                        <p className="text-sm text-slate-500">Loading suppliers...</p>
                                    ) : suppliers.length === 0 ? (
                                        <p className="text-sm text-amber-600">
                                            No suppliers found. Please create a new supplier.
                                        </p>
                                    ) : (
                                        <select
                                            className="w-full border rounded px-3 py-2"
                                            value={selectedSupplierId}
                                            onChange={(e) => setSelectedSupplierId(e.target.value)}
                                        >
                                            {suppliers.map((supplier) => (
                                                <option key={supplier.id} value={supplier.id}>
                                                    {supplier.name} ({supplier.email})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    <button
                                        type="button"
                                        onClick={fetchSuppliers}
                                        className="text-xs text-indigo-600 hover:text-indigo-800"
                                    >
                                        Refresh supplier list
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    <input
                                        name="name"
                                        value={newSupplier.name}
                                        onChange={handleSupplierFieldChange}
                                        placeholder="Supplier Name"
                                        className="w-full border rounded px-3 py-2"
                                        required
                                    />
                                    <input
                                        name="email"
                                        type="email"
                                        value={newSupplier.email}
                                        onChange={handleSupplierFieldChange}
                                        placeholder="Supplier Email"
                                        className="w-full border rounded px-3 py-2"
                                        required
                                    />
                                    <input
                                        name="password"
                                        type="text"
                                        value={newSupplier.password}
                                        onChange={handleSupplierFieldChange}
                                        placeholder="Temporary Password"
                                        className="w-full border rounded px-3 py-2"
                                        required
                                    />
                                    <p className="text-xs text-slate-500">
                                        Share the temporary password with the supplier so they can log in and update it later.
                                    </p>
                                </div>
                            )}

                            {supplierError && (
                                <p className="text-sm text-red-600">{supplierError}</p>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end space-x-2 mt-4">
                        <button
                            type="button"
                            onClick={handleModalClose}
                            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
