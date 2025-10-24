import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import FloatingCustomerPanel from './components/FloatingCustomerPanel';
import { CustomerProvider } from './context/CustomerContext';
import CashierPOS from './pages/CashierPOS';
import Login from './pages/Login';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerPOS from './pages/OwnerPOS';
import { getRole } from './utils/auth';

function App() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const userRole = getRole();
    console.log('App component - detected role:', userRole);
    setRole(userRole);
    setLoading(false);
  }, [location]); // Re-check authentication when location changes

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <CustomerProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cashier" element={role === 'cashier' ? <CashierPOS /> : <Navigate to="/login" />} />
        <Route path="/owner-pos" element={role === 'owner' ? <OwnerPOS /> : <Navigate to="/login" />} />
        <Route path="/owner" element={<Navigate to="/owner/products" replace />} />
        <Route path="/owner/*" element={role === 'owner' ? <OwnerDashboard /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      {/* Floating Customer Panel - Shows on all pages when a customer is selected */}
      <FloatingCustomerPanel />
    </CustomerProvider>
  );
}

export default App;
