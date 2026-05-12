import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { authAPI } from '../api/authAPI';
import useAuthStore from '../store/authStore';

export default function Login() {
    const navigate = useNavigate();
    const { isAuthenticated, user, setAuth } = useAuthStore();

    // Don't auto-redirect - let users see the login page even if authenticated
    // They can manually navigate to their dashboard or use the login form to switch users

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authAPI.login(formData);
            console.log('Login response:', response);

            if (response.success) {
                setAuth(response.data.user, response.data.token);

                // Redirect based on role
                const role = response.data.user.role;
                switch (role) {
                    case 'ADMIN':
                        navigate('/admin');
                        break;
                    case 'INVENTORY_MANAGER':
                        navigate('/inventory-manager');
                        break;
                    case 'CUSTOMER':
                        navigate('/customer');
                        break;
                    case 'SUPPLIER':
                        navigate('/supplier');
                        break;
                    default:
                        navigate('/');
                }
            }
        } catch (err) {
            console.error('Login error:', err);
            const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-4 shadow-lg">
                        <LogIn className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
                    <p className="text-slate-600">Sign in to your account to continue</p>
                </div>

                {/* Login Form */}
                <div className="card animate-slide-up">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error Alert */}
                        {error && (
                            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="input pl-11"
                                    placeholder="you@example.com"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="input pl-11"
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-slate-500">Don't have an account?</span>
                        </div>
                    </div>

                    {/* Register Link */}
                    <Link
                        to="/register"
                        className="btn btn-secondary w-full flex items-center justify-center gap-2 py-3 text-base"
                    >
                        Create Account
                    </Link>
                </div>

                {/* Test Credentials */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in">
                    <p className="text-sm font-medium text-blue-900 mb-2">Test Credentials:</p>
                    <div className="text-xs text-blue-700 space-y-1">
                        <p>• Admin: admin@inventory.com</p>
                        <p>• Manager: manager@inventory.com</p>
                        <p>• Customer: customer@test.com</p>
                        <p>• Supplier: supplier1@supply.com</p>
                        <p className="mt-2 font-medium">Password: password123</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
