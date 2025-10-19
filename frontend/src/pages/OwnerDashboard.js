import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Customers from '../components/Customers';
import Products from '../components/Products';
import Sales from '../components/Sales';
import Settings from '../components/Settings';
import Suppliers from '../components/Suppliers';
import Transactions from '../components/Transactions';

function OwnerDashboard() {
  const location = useLocation();

  // Function to determine if a link is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Style for active link
  const activeLinkStyle = {
    color: '#ffffff',
    textDecoration: 'none',
    backgroundColor: '#3498db',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    border: '2px solid #2980b9'
  };

  // Style for inactive link
  const inactiveLinkStyle = {
    color: '#ecf0f1',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    transition: 'all 0.3s ease'
  };

  // Style for Owner POS button (always special)
  const ownerPosStyle = {
    color: 'white',
    textDecoration: 'none',
    backgroundColor: '#e74c3c',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  };

  return (
    <div>
      <nav style={{
        padding: '15px 20px',
        backgroundColor: '#2c3e50',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link
            to="/owner-pos"
            style={ownerPosStyle}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#c0392b';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#e74c3c';
            }}
          >
            🛒 Owner POS
          </Link>
          <span style={{ color: '#bdc3c7', margin: '0 8px' }}>|</span>

          <Link
            to="/owner/products"
            style={isActive('/owner/products') ? activeLinkStyle : inactiveLinkStyle}
            onMouseOver={(e) => {
              if (!isActive('/owner/products')) {
                e.target.style.backgroundColor = '#34495e';
              }
            }}
            onMouseOut={(e) => {
              if (!isActive('/owner/products')) {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            📦 Products {isActive('/owner/products') && '← Current'}
          </Link>

          <span style={{ color: '#bdc3c7', margin: '0 8px' }}>|</span>

          <Link
            to="/owner/sales"
            style={isActive('/owner/sales') ? activeLinkStyle : inactiveLinkStyle}
            onMouseOver={(e) => {
              if (!isActive('/owner/sales')) {
                e.target.style.backgroundColor = '#34495e';
              }
            }}
            onMouseOut={(e) => {
              if (!isActive('/owner/sales')) {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            💰 Sales {isActive('/owner/sales') && '← Current'}
          </Link>

          <span style={{ color: '#bdc3c7', margin: '0 8px' }}>|</span>

          <Link
            to="/owner/customers"
            style={isActive('/owner/customers') ? activeLinkStyle : inactiveLinkStyle}
            onMouseOver={(e) => {
              if (!isActive('/owner/customers')) {
                e.target.style.backgroundColor = '#34495e';
              }
            }}
            onMouseOut={(e) => {
              if (!isActive('/owner/customers')) {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            👥 Customers {isActive('/owner/customers') && '← Current'}
          </Link>

          <span style={{ color: '#bdc3c7', margin: '0 8px' }}>|</span>

          <Link
            to="/owner/suppliers"
            style={isActive('/owner/suppliers') ? activeLinkStyle : inactiveLinkStyle}
            onMouseOver={(e) => {
              if (!isActive('/owner/suppliers')) {
                e.target.style.backgroundColor = '#34495e';
              }
            }}
            onMouseOut={(e) => {
              if (!isActive('/owner/suppliers')) {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            🏭 Suppliers {isActive('/owner/suppliers') && '← Current'}
          </Link>

          <span style={{ color: '#bdc3c7', margin: '0 8px' }}>|</span>

          <Link
            to="/owner/transactions"
            style={isActive('/owner/transactions') ? activeLinkStyle : inactiveLinkStyle}
            onMouseOver={(e) => {
              if (!isActive('/owner/transactions')) {
                e.target.style.backgroundColor = '#34495e';
              }
            }}
            onMouseOut={(e) => {
              if (!isActive('/owner/transactions')) {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            📊 Transactions {isActive('/owner/transactions') && '← Current'}
          </Link>

          <span style={{ color: '#bdc3c7', margin: '0 8px' }}>|</span>

          <Link
            to="/owner/settings"
            style={isActive('/owner/settings') ? activeLinkStyle : inactiveLinkStyle}
            onMouseOver={(e) => {
              if (!isActive('/owner/settings')) {
                e.target.style.backgroundColor = '#34495e';
              }
            }}
            onMouseOut={(e) => {
              if (!isActive('/owner/settings')) {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            ⚙️ Settings {isActive('/owner/settings') && '← Current'}
          </Link>
        </div>
        <div style={{ color: '#ecf0f1', fontSize: '14px', fontWeight: '500' }}>
          StoreFlow Professional - Owner Dashboard
        </div>
      </nav>
      <Routes>
        <Route path="products" element={<Products />} />
        <Route path="sales" element={<Sales />} />
        <Route path="customers" element={<Customers />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="products" replace />} />
      </Routes>
    </div>
  );
}

export default OwnerDashboard;
