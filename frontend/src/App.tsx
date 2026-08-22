import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Spinner } from './components/UI';
import AppLayout from './layouts/AppLayout';

// Lazy-loaded page components for route-level code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CustomerListPage = lazy(() => import('./pages/CustomerListPage'));
const AddCustomerPage = lazy(() => import('./pages/AddCustomerPage'));
const EditCustomerPage = lazy(() => import('./pages/EditCustomerPage'));
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage'));
const ProductListPage = lazy(() => import('./pages/ProductListPage'));
const ProductFormPage = lazy(() => import('./pages/ProductFormPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const ChallanListPage = lazy(() => import('./pages/ChallanListPage'));
const ChallanFormPage = lazy(() => import('./pages/ChallanFormPage'));
const ChallanDetailPage = lazy(() => import('./pages/ChallanDetailPage'));
const ChallanEditPage = lazy(() => import('./pages/ChallanEditPage'));

function PageLoader() {
  return (
    <div className="center-spinner">
      <Spinner />
    </div>
  );
}

// Wraps routes that require authentication
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;

  return (
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
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
