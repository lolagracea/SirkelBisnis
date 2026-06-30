import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Login from './Pages/Auth/Login';
import Register from './Pages/Auth/Register';
import UmkmDashboard from './Pages/UMKM/Dashboard';
import SupplierDashboard from './Pages/Supplier/Dashboard';
import PrintInvoice from './Pages/Supplier/PrintInvoice';

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex justify-center items-center font-sans antialiased text-[#1E293B]">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-[#16A34A] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-[#64748B]">Memuat Sesi Pengguna...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function MainApp() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route 
        path="/umkm/dashboard" 
        element={
          <ProtectedRoute requiredRole="umkm">
            <UmkmDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/supplier/dashboard" 
        element={
          <ProtectedRoute requiredRole="supplier">
            <SupplierDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/supplier/orders/:id/invoice" 
        element={
          <ProtectedRoute requiredRole="supplier">
            <PrintInvoice />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="*" 
        element={
          user ? (
            user.role === 'umkm' ? <Navigate to="/umkm/dashboard" replace /> : <Navigate to="/supplier/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
    </Routes>
  );
}

const container = document.getElementById('app');
if (container) {
  // Vite's HMR re-executes this module on every save while the dev server
  // is running. Calling createRoot(container) again on a container that
  // already has a root attached causes React to manage two separate fiber
  // trees over the same DOM nodes, which then throws
  // "Failed to execute 'removeChild' on 'Node'" once one of the roots
  // tries to clean up nodes the other root already removed/replaced.
  // We cache the root on the container itself so HMR re-runs reuse the
  // existing root (just calling .render() again) instead of creating a
  // brand new one.
  if (!container.__sirkelReactRoot) {
    container.__sirkelReactRoot = createRoot(container);
  }
  const root = container.__sirkelReactRoot;

  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <MainApp />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}

// Make sure Vite doesn't force a full page reload for this module on HMR;
// reusing the cached root above already handles re-rendering correctly.
if (import.meta.hot) {
  import.meta.hot.accept();
}