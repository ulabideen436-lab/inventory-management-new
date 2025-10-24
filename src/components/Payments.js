import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function Payments() {
  const [payments, setPayments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  
  // Enhanced form state
  const [form, setForm] = useState({ 
    supplier_id: '', 
    customer_id: '', 
    amount: '', 
    description: '',
    type: 'supplier',
    payment_method: 'cash',
    reference_number: '',
    due_date: '',
    category: 'general'
  });
  
  // UI states
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [viewMode, setViewMode] = useState('dashboard');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Analytics states
  const [overduePayments, setOverduePayments] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [paymentAnalytics, setPaymentAnalytics] = useState(null);
  
  const token = localStorage.getItem('token');

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentsRes, suppliersRes, customersRes, salesRes, purchasesRes] = await Promise.all([
        axios.get('http://localhost:5000/payments', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/suppliers', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/customers', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/sales', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/purchases', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setPayments(paymentsRes.data || []);
      setSuppliers(suppliersRes.data || []);
      setCustomers(customersRes.data || []);
      setSales(salesRes.data || []);
      setPurchases(purchasesRes.data || []);
      
      calculatePaymentAnalytics(paymentsRes.data || []);
      calculateOverduePayments(paymentsRes.data || [], salesRes.data || [], purchasesRes.data || []);
      
      setError('');
    } catch (err) {
      setError('Failed to fetch payment data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Calculate payment analytics
  const calculatePaymentAnalytics = (paymentData) => {
    const customerPayments = paymentData.filter(p => p.customer_id);
    const supplierPayments = paymentData.filter(p => p.supplier_id);
    
    const totalReceived = customerPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalPaid = supplierPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const netCashFlow = totalReceived - totalPaid;
    
    const methodBreakdown = paymentData.reduce((acc, p) => {
      const method = p.payment_method || 'cash';
      acc[method] = (acc[method] || 0) + parseFloat(p.amount || 0);
      return acc;
    }, {});
    
    setPaymentAnalytics({
      totalReceived,
      totalPaid,
      netCashFlow,
      totalTransactions: paymentData.length,
      avgPaymentAmount: paymentData.length > 0 ? (totalReceived + totalPaid) / paymentData.length : 0,
      methodBreakdown
    });
  };

  // Calculate overdue payments
  const calculateOverduePayments = (paymentData, salesData, purchaseData) => {
    const today = new Date();
    const overdue = [];
    const upcoming = [];
    
    // Sample overdue calculation (would need more sophisticated logic in real app)
    salesData.forEach(sale => {
      if (sale.status === 'completed' && sale.customer_id) {
        const dueDate = new Date(sale.date);
        dueDate.setDate(dueDate.getDate() + 30);
        
        if (dueDate < today) {
          const daysPastDue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
          overdue.push({
            type: 'customer',
            id: sale.id,
            customer_id: sale.customer_id,
            amount: sale.total_amount,
            dueDate,
            description: `Invoice #${sale.id}`,
            daysPastDue
          });
        }
      }
    });
    
    setOverduePayments(overdue);
    setUpcomingPayments(upcoming);
  };

  // Form handling
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const paymentData = {
        amount: parseFloat(form.amount),
        description: form.description,
        payment_method: form.payment_method,
        reference_number: form.reference_number,
        category: form.category
      };

      if (form.type === 'supplier') {
        paymentData.supplier_id = parseInt(form.supplier_id);
      } else {
        paymentData.customer_id = parseInt(form.customer_id);
      }

      await axios.post('http://localhost:5000/payments', paymentData, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      setMessage('Payment recorded successfully!');
      setForm({ 
        supplier_id: '', 
        customer_id: '', 
        amount: '', 
        description: '',
        type: 'supplier',
        payment_method: 'cash',
        reference_number: '',
        due_date: '',
        category: 'general'
      });
      setShowPaymentModal(false);
      await fetchAllData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  // Filtering
  const getFilteredPayments = () => {
    let filtered = [...payments];
    
    if (filterType === 'supplier') {
      filtered = filtered.filter(p => p.supplier_id);
    } else if (filterType === 'customer') {
      filtered = filtered.filter(p => p.customer_id);
    }
    
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(p => p.payment_method === paymentMethodFilter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.description?.toLowerCase().includes(term) ||
        String(p.amount).includes(term)
      );
    }
    
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  };

  const filteredPayments = getFilteredPayments();

  // Helper functions
  const getPaymentMethodStyle = (method) => {
    const styles = {
      'cash': { color: '#28a745', backgroundColor: '#d4edda', icon: '💵' },
      'check': { color: '#17a2b8', backgroundColor: '#d1ecf1', icon: '📝' },
      'bank_transfer': { color: '#6f42c1', backgroundColor: '#e2d9f3', icon: '🏦' },
      'credit_card': { color: '#fd7e14', backgroundColor: '#ffe8d1', icon: '💳' }
    };
    return styles[method] || { color: '#6c757d', backgroundColor: '#f8f9fa', icon: '💰' };
  };

  const getEntityName = (payment) => {
    if (payment.supplier_id) {
      const supplier = suppliers.find(s => s.id === payment.supplier_id);
      return supplier ? supplier.name : 'Unknown Supplier';
    }
    if (payment.customer_id) {
      const customer = customers.find(c => c.id === payment.customer_id);
      return customer ? customer.name : 'Unknown Customer';
    }
    return 'Unknown';
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>💳 Advanced Payment Management</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: showAdvancedFilters ? '#28a745' : '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showAdvancedFilters ? '🔍 Hide Filters' : '🔍 Show Filters'}
          </button>
          <button 
            onClick={() => setShowPaymentModal(true)}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ➕ New Payment
          </button>
          <button 
            onClick={fetchAllData} 
            disabled={loading}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: loading ? '#ccc' : '#17a2b8', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '🔄 Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '12px', 
          borderRadius: '4px', 
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          ⚠️ {error}
        </div>
      )}

      {message && (
        <div style={{ 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          padding: '12px', 
          borderRadius: '4px', 
          marginBottom: '20px',
          border: '1px solid #c3e6cb'
        }}>
          ✅ {message}
        </div>
      )}

      {/* Financial Dashboard */}
      {paymentAnalytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, color: '#28a745' }}>💰 Total Received</h4>
              <span style={{ fontSize: '20px' }}>📈</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
              {formatCurrency(paymentAnalytics.totalReceived)}
            </div>
            <div style={{ fontSize: '12px', color: '#6c757d' }}>
              From customers
            </div>
          </div>

          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, color: '#dc3545' }}>💸 Total Paid</h4>
              <span style={{ fontSize: '20px' }}>📉</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
              {formatCurrency(paymentAnalytics.totalPaid)}
            </div>
            <div style={{ fontSize: '12px', color: '#6c757d' }}>
              To suppliers
            </div>
          </div>

          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, color: paymentAnalytics.netCashFlow >= 0 ? '#28a745' : '#dc3545' }}>💎 Net Cash Flow</h4>
              <span style={{ fontSize: '20px' }}>{paymentAnalytics.netCashFlow >= 0 ? '✅' : '⚠️'}</span>
            </div>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: paymentAnalytics.netCashFlow >= 0 ? '#28a745' : '#dc3545'
            }}>
              {formatCurrency(paymentAnalytics.netCashFlow)}
            </div>
            <div style={{ fontSize: '12px', color: '#6c757d' }}>
              Received - Paid
            </div>
          </div>

          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, color: '#17a2b8' }}>📊 Total Transactions</h4>
              <span style={{ fontSize: '20px' }}>📋</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#17a2b8' }}>
              {paymentAnalytics.totalTransactions}
            </div>
            <div style={{ fontSize: '12px', color: '#6c757d' }}>
              All payments
            </div>
          </div>
        </div>
      )}

      {/* Overdue Payments Alert */}
      {overduePayments.length > 0 && (
        <div style={{ 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>⚠️ Overdue Payments Alert</h4>
          <p style={{ margin: '0 0 10px 0', color: '#856404' }}>
            You have {overduePayments.length} overdue payment(s) that need attention.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {overduePayments.slice(0, 3).map(payment => (
              <div key={payment.id} style={{ 
                backgroundColor: 'white', 
                padding: '10px', 
                borderRadius: '4px', 
                border: '1px solid #ffeaa7',
                fontSize: '14px'
              }}>
                <div style={{ fontWeight: 'bold' }}>{payment.description}</div>
                <div style={{ color: '#dc3545' }}>{formatCurrency(payment.amount)}</div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  {payment.daysPastDue} days overdue
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Mode Controls */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setFilterType('all')} 
              style={{
                padding: '8px 16px',
                backgroundColor: filterType === 'all' ? '#007bff' : '#e9ecef',
                color: filterType === 'all' ? 'white' : '#495057',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              📊 All Payments
            </button>
            <button 
              onClick={() => setFilterType('customer')} 
              style={{
                padding: '8px 16px',
                backgroundColor: filterType === 'customer' ? '#28a745' : '#e9ecef',
                color: filterType === 'customer' ? 'white' : '#495057',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              💰 Received
            </button>
            <button 
              onClick={() => setFilterType('supplier')} 
              style={{
                padding: '8px 16px',
                backgroundColor: filterType === 'supplier' ? '#dc3545' : '#e9ecef',
                color: filterType === 'supplier' ? 'white' : '#495057',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              💸 Paid Out
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ fontWeight: 'bold', color: '#495057' }}>View:</label>
            {['dashboard', 'list', 'analytics'].map(mode => (
              <button 
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: viewMode === mode ? '#007bff' : '#e9ecef',
                  color: viewMode === mode ? 'white' : '#495057',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {mode === 'dashboard' ? '📊 Dashboard' : mode === 'list' ? '📋 List' : '📈 Analytics'}
              </button>
            ))}
          </div>
        </div>

        {/* Search and Quick Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>🔍 Search:</label>
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Description, amount..."
              style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>💳 Payment Method:</label>
            <select 
              value={paymentMethodFilter} 
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
            >
              <option value="all">All Methods</option>
              <option value="cash">💵 Cash</option>
              <option value="check">📝 Check</option>
              <option value="bank_transfer">🏦 Bank Transfer</option>
              <option value="credit_card">💳 Credit Card</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>🔄 Sort:</label>
            <div style={{ display: 'flex', gap: '5px' }}>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{ flex: 1, padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="type">Type</option>
              </select>
          <select
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
                style={{ width: '70px', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              >
                <option value="desc">↓</option>
                <option value="asc">↑</option>
          </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>📊 Results:</label>
            <div style={{ padding: '8px', color: '#6c757d', fontSize: '14px' }}>
              Showing {filteredPayments.length} of {payments.length} payments
            </div>
          </div>
        </div>
      </div>

      {/* Payments Display */}
      {viewMode === 'list' ? (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef',
          overflow: 'hidden'
        }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#495057' }}>📅 Date</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#495057' }}>👤 Entity</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#495057' }}>🏷️ Type</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#495057' }}>💳 Method</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#495057' }}>📝 Description</th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6', color: '#495057' }}>💰 Amount</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6', color: '#495057' }}>⚙️ Actions</th>
          </tr>
        </thead>
        <tbody>
              {filteredPayments.map((payment, idx) => {
                const methodStyle = getPaymentMethodStyle(payment.payment_method);
                const isReceived = payment.customer_id;
            return (
                  <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px', color: '#495057' }}>
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', color: '#495057' }}>
                      {getEntityName(payment)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: isReceived ? '#d4edda' : '#f8d7da',
                        color: isReceived ? '#155724' : '#721c24'
                      }}>
                        {isReceived ? '💰 Received' : '💸 Paid Out'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        ...methodStyle
                      }}>
                        {methodStyle.icon} {payment.payment_method || 'cash'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#495057' }}>
                      {payment.description || 'No description'}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'right', 
                      fontWeight: 'bold',
                      color: isReceived ? '#28a745' : '#dc3545'
                    }}>
                      {isReceived ? '+' : '-'}{formatCurrency(payment.amount)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button 
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          📄 Receipt
                        </button>
                      </div>
                    </td>
              </tr>
            );
          })}
        </tbody>
      </table>
          
          {filteredPayments.length === 0 && (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              color: '#6c757d',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <h3 style={{ margin: '0 0 8px 0', color: '#495057' }}>No Payments Found</h3>
              <p style={{ margin: 0 }}>No payments match your current filters. Try adjusting your search criteria.</p>
            </div>
          )}
        </div>
      ) : viewMode === 'analytics' ? (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '30px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>📈 Payment Method Analytics</h3>
          
          {paymentAnalytics && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              {Object.entries(paymentAnalytics.methodBreakdown).map(([method, amount]) => {
                const methodStyle = getPaymentMethodStyle(method);
                return (
                  <div key={method} style={{ 
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #dee2e6'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ marginRight: '8px', fontSize: '16px' }}>{methodStyle.icon}</span>
                      <span style={{ fontWeight: 'bold', color: '#495057', textTransform: 'capitalize' }}>
                        {method.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: methodStyle.color }}>
                      {formatCurrency(amount)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      Total volume
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Dashboard View - Default */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {filteredPayments.slice(0, 12).map((payment, idx) => {
            const methodStyle = getPaymentMethodStyle(payment.payment_method);
            const isReceived = payment.customer_id;
            return (
              <div key={idx} style={{ 
                backgroundColor: 'white', 
                padding: '20px', 
                borderRadius: '8px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: isReceived ? '#d4edda' : '#f8d7da',
                    color: isReceived ? '#155724' : '#721c24'
                  }}>
                    {isReceived ? '💰 Received' : '💸 Paid Out'}
                  </span>
                  <span style={{ fontSize: '14px', color: '#6c757d' }}>
                    {new Date(payment.date).toLocaleDateString()}
                  </span>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>
                    {isReceived ? 'From:' : 'To:'}
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#495057' }}>{getEntityName(payment)}</div>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>Description:</div>
                  <div style={{ color: '#495057' }}>{payment.description || 'No description'}</div>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    ...methodStyle
                  }}>
                    {methodStyle.icon} {payment.payment_method || 'cash'}
                  </span>
                  {payment.reference_number && (
                    <span style={{ marginLeft: '10px', fontSize: '12px', color: '#6c757d' }}>
                      Ref: {payment.reference_number}
                    </span>
                  )}
                </div>
                
                <div style={{ 
                  borderTop: '1px solid #dee2e6', 
                  paddingTop: '15px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Amount</div>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: 'bold',
                      color: isReceived ? '#28a745' : '#dc3545'
                    }}>
                      {isReceived ? '+' : '-'}{formatCurrency(payment.amount)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      📄 Receipt
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredPayments.length === 0 && (
            <div style={{ 
              gridColumn: '1 / -1',
              padding: '40px', 
              textAlign: 'center', 
              color: '#6c757d',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <h3 style={{ margin: '0 0 8px 0', color: '#495057' }}>No Payments Found</h3>
              <p style={{ margin: 0 }}>No payments match your current filters. Try adjusting your search criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#333' }}>💳 Record New Payment</h3>
              <button 
                onClick={() => setShowPaymentModal(false)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>
                    Payment Type:
                  </label>
                  <select 
                    name="type" 
                    value={form.type} 
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                    required
                  >
                    <option value="supplier">💸 Payment to Supplier</option>
                    <option value="customer">💰 Payment from Customer</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>
                    Payment Method:
                  </label>
                  <select 
                    name="payment_method" 
                    value={form.payment_method} 
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  >
                    <option value="cash">💵 Cash</option>
                    <option value="check">📝 Check</option>
                    <option value="bank_transfer">🏦 Bank Transfer</option>
                    <option value="credit_card">💳 Credit Card</option>
                  </select>
                </div>

                {form.type === 'supplier' ? (
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>
                      Supplier:
                    </label>
                    <select 
                      name="supplier_id" 
                      value={form.supplier_id} 
                      onChange={handleChange}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                      required
                    >
                      <option value="">Select a supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>
                      Customer:
                    </label>
                    <select 
                      name="customer_id" 
                      value={form.customer_id} 
                      onChange={handleChange}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                      required
                    >
                      <option value="">Select a customer</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>{customer.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>
                    Amount:
                  </label>
                  <input 
                    type="number" 
                    name="amount" 
                    value={form.amount} 
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>
                    Reference Number:
                  </label>
                  <input 
                    type="text" 
                    name="reference_number" 
                    value={form.reference_number} 
                    onChange={handleChange}
                    placeholder="Optional"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>
                    Category:
                  </label>
                  <select 
                    name="category" 
                    value={form.category} 
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  >
                    <option value="general">General</option>
                    <option value="invoice">Invoice Payment</option>
                    <option value="expense">Expense</option>
                    <option value="refund">Refund</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>
                  Description:
                </label>
                <textarea 
                  name="description" 
                  value={form.description} 
                  onChange={handleChange}
                  placeholder="Payment description or notes..."
                  rows="3"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button 
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ❌ Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: loading ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {loading ? '⏳ Processing...' : '💾 Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments;
