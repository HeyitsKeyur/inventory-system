import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Shield, Plus, Trash2, Users, Truck, Briefcase } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { authAPI } from '../api/authAPI';
import ProductList from '../components/ProductList';
import AddProductModal from '../components/AddProductModal';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        suppliers: 0,
        managers: 0,
        customers: 0
    });

    useEffect(() => {
        fetchUsers();
    }, [refreshKey]);

    const fetchUsers = async () => {
        try {
            const response = await authAPI.getUsers();
            if (response.success) {
                const userList = response.data;
                setUsers(userList);

                // Calculate stats
                setStats({
                    total: userList.length,
                    suppliers: userList.filter(u => u.role === 'SUPPLIER').length,
                    managers: userList.filter(u => u.role === 'INVENTORY_MANAGER').length,
                    customers: userList.filter(u => u.role === 'CUSTOMER').length
                });
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await authAPI.deleteUser(userId);
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
        }
    };

    const handleLogout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            logout();
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                                <p className="text-sm text-slate-600">Full system access</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsAddProductModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Add Product
                            </button>
                            <button
                                onClick={handleLogout}
                                className="btn btn-secondary flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <AddProductModal
                isOpen={isAddProductModalOpen}
                onClose={() => setIsAddProductModalOpen(false)}
                onSuccess={() => setRefreshKey(prev => prev + 1)}
            />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Card */}
                <div className="card mb-8 animate-fade-in">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-red-700" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name}!</h2>
                            <p className="text-slate-600">{user?.email}</p>
                            <span className="inline-block mt-2 px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                                Administrator
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="card animate-slide-up">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            <h3 className="text-sm font-medium text-slate-600">Total Users</h3>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                    </div>
                    <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <div className="flex items-center gap-3 mb-2">
                            <Truck className="w-5 h-5 text-amber-600" />
                            <h3 className="text-sm font-medium text-slate-600">Suppliers</h3>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{stats.suppliers}</p>
                    </div>
                    <div className="card animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center gap-3 mb-2">
                            <Briefcase className="w-5 h-5 text-purple-600" />
                            <h3 className="text-sm font-medium text-slate-600">Managers</h3>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{stats.managers}</p>
                    </div>
                    <div className="card animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center gap-3 mb-2">
                            <User className="w-5 h-5 text-emerald-600" />
                            <h3 className="text-sm font-medium text-slate-600">Customers</h3>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{stats.customers}</p>
                    </div>
                </div>

                {/* User Management */}
                <div className="card mb-8">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">User Management</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="py-3 px-4 text-sm font-semibold text-slate-600">Name</th>
                                    <th className="py-3 px-4 text-sm font-semibold text-slate-600">Email</th>
                                    <th className="py-3 px-4 text-sm font-semibold text-slate-600">Role</th>
                                    <th className="py-3 px-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="py-3 px-4 text-slate-900 font-medium">{u.name}</td>
                                        <td className="py-3 px-4 text-slate-600">{u.email}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold 
                                                ${u.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                                                    u.role === 'INVENTORY_MANAGER' ? 'bg-purple-100 text-purple-700' :
                                                        u.role === 'SUPPLIER' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-blue-100 text-blue-700'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                onClick={() => handleDeleteUser(u._id)}
                                                disabled={u.role === 'ADMIN' || u._id === user.id}
                                                className="p-2 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                title="Delete User"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Product Catalog */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Product Catalog</h3>
                    <ProductList key={refreshKey} />
                </div>
            </main>
        </div>
    );
}
