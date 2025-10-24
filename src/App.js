import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import FloatingCustomerPanel from './components/FloatingCustomerPanel';
import { CustomerProvider } from './context/CustomerContext';
import CashierPOS from './pages/CashierPOS';
import Login from './pages/Login';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerPOS from './pages/OwnerPOS';
import authService from './services/authService';

function App() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Listen to Firebase authentication state changes
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const userData = await authService.getUserData(firebaseUser.uid);
        if (userData) {
          setUser(firebaseUser);
          setRole(userData.role);
          
          // Store in localStorage for compatibility
          localStorage.setItem('user', JSON.stringify({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || userData.displayName,
            role: userData.role
          }));
        }
      } else {
        // User is signed out
        setUser(null);
        setRole(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#667eea'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <CustomerProvider>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to={role === 'owner' ? '/owner' : '/cashier'} />} />
        <Route path="/cashier" element={role === 'cashier' || role === 'owner' ? <CashierPOS /> : <Navigate to="/login" />} />
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
