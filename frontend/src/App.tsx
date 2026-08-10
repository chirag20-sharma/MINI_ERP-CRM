import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Spinner } from './components/UI';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import CustomerListPage from './pages/CustomerListPage';
import AddCustomerPage from './pages/AddCustomerPage';
import EditCustomerPage from './pages/EditCustomerPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import ProductListPage from './pages/ProductListPage';
import ProductFormPage from './pages/ProductFormPage';
import ProductDetailPage from './pages/ProductDetailPage';
import InventoryPage from './pages/InventoryPage';
import ChallanListPage from './pages/ChallanListPage';
import ChallanFormPage from './pages/ChallanFormPage';
import ChallanDetailPage from './pages/ChallanDetailPage';
import ChallanEditPage from './pages/ChallanEditPage';
import DashboardPage from './pages/DashboardPage';

// Wraps routes that require authentication
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-spinner"><Spinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-spinner"><Spinner /></div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><CustomerListPage /></ProtectedRoute>} />
      <Route path="/customers/new" element={<ProtectedRoute><AddCustomerPage /></ProtectedRoute>} />
      <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetailPage /></ProtectedRoute>} />
      <Route path="/customers/:id/edit" element={<ProtectedRoute><EditCustomerPage /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><ProductListPage /></ProtectedRoute>} />
      <Route path="/products/new" element={<ProtectedRoute><ProductFormPage /></ProtectedRoute>} />
      <Route path="/products/:id" element={<ProtectedRoute><ProductDetailPage /></ProtectedRoute>} />
      <Route path="/products/:id/edit" element={<ProtectedRoute><ProductFormPage /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
      <Route path="/challans" element={<ProtectedRoute><ChallanListPage /></ProtectedRoute>} />
      <Route path="/challans/new" element={<ProtectedRoute><ChallanFormPage /></ProtectedRoute>} />
      <Route path="/challans/:id" element={<ProtectedRoute><ChallanDetailPage /></ProtectedRoute>} />
      <Route path="/challans/:id/edit" element={<ProtectedRoute><ChallanEditPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
