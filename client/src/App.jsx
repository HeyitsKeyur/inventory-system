import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import ProductDetails from './pages/ProductDetails';
import CartPage from './pages/CartPage';
import InventoryManagerDashboard from './pages/InventoryManagerDashboard';
import SupplierDashboard from './pages/SupplierDashboard';
import LowStockPage from './pages/LowStockPage';
import OrdersPage from './pages/OrdersPage';
import ProtectedRoute from './components/ProtectedRoute';
import useAuthStore from './store/authStore';

function App() {
  // Always redirect to login for root and unknown routes
  const getDefaultRoute = () => {
    return '/login';
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/product/:id"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <ProductDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <CartPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory-manager"
          element={
            <ProtectedRoute allowedRoles={['INVENTORY_MANAGER']}>
              <InventoryManagerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory-manager/low-stock"
          element={
            <ProtectedRoute allowedRoles={['INVENTORY_MANAGER']}>
              <LowStockPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory-manager/orders"
          element={
            <ProtectedRoute allowedRoles={['INVENTORY_MANAGER']}>
              <OrdersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/supplier"
          element={
            <ProtectedRoute allowedRoles={['SUPPLIER']}>
              <SupplierDashboard />
            </ProtectedRoute>
          }
        />

        {/* Unauthorized */}
        <Route
          path="/unauthorized"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="card text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
                <p className="text-slate-600">You don't have permission to access this page.</p>
              </div>
            </div>
          }
        />

        {/* Default Route - Always redirect to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* Catch-all route - redirect to login if not authenticated, otherwise to appropriate dashboard */}
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
