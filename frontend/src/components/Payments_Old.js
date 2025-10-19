
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function Payments() {
  const [payments, setPayments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  
  // Enhanced form state with payment scheduling
  const [form, setForm] = useState({ 
    supplier_id: '', 
    customer_id: '', 
    amount: '', 
    description: '',
    type: 'supplier', // 'supplier' or 'customer'
    payment_method: 'cash', // 'cash', 'check', 'bank_transfer', 'credit_card'
    reference_number: '',
    due_date: '',
    is_recurring: false,
    recurring_interval: 'monthly', // 'weekly', 'monthly', 'quarterly'
    category: 'general' // 'general', 'invoice', 'expense', 'refund'
  });
  
  // UI and filtering states
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
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard', 'list', 'calendar', 'reconciliation'
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Advanced features states
  const [overduePayments, setOverduePayments] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [reconciliationData, setReconciliationData] = useState(null);
  const [paymentAnalytics, setPaymentAnalytics] = useState(null);
  const [cashFlowProjection, setCashFlowProjection] = useState([]);
  
  const token = localStorage.getItem('token');

  // Enhanced data fetching with analytics calculation
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
      
      // Calculate analytics and overdue payments
      calculatePaymentAnalytics(paymentsRes.data || []);
      calculateOverduePayments(paymentsRes.data || [], salesRes.data || [], purchasesRes.data || []);
      calculateCashFlowProjection(paymentsRes.data || []);
      
      setError('');
    } catch (err) {
      setError('Failed to fetch payment data');
      console.error('Payment data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Calculate comprehensive payment analytics
  const calculatePaymentAnalytics = (paymentData) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    
    const recentPayments = paymentData.filter(p => new Date(p.date) >= thirtyDaysAgo);
    
    const customerPayments = paymentData.filter(p => p.customer_id);
    const supplierPayments = paymentData.filter(p => p.supplier_id);
    
    const totalReceived = customerPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalPaid = supplierPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const netCashFlow = totalReceived - totalPaid;
    
    // Payment method breakdown
    const methodBreakdown = paymentData.reduce((acc, p) => {
      const method = p.payment_method || 'cash';
      acc[method] = (acc[method] || 0) + parseFloat(p.amount || 0);
      return acc;
    }, {});
    
    // Monthly trends
    const monthlyTrends = paymentData.reduce((acc, p) => {
      const month = new Date(p.date).toISOString().slice(0, 7);
      if (!acc[month]) acc[month] = { received: 0, paid: 0 };
      if (p.customer_id) acc[month].received += parseFloat(p.amount || 0);
      if (p.supplier_id) acc[month].paid += parseFloat(p.amount || 0);
      return acc;
    }, {});
    
    setPaymentAnalytics({
      totalReceived,
      totalPaid,
      netCashFlow,
      totalTransactions: paymentData.length,
      avgPaymentAmount: paymentData.length > 0 ? (totalReceived + totalPaid) / paymentData.length : 0,
      methodBreakdown,
      monthlyTrends,
      recentPaymentsCount: recentPayments.length
    });
  };

  // Calculate overdue and upcoming payments
  const calculateOverduePayments = (paymentData, salesData, purchaseData) => {
    const today = new Date();
    const upcomingThreshold = new Date();
    upcomingThreshold.setDate(today.getDate() + 7); // 7 days ahead
    
    // Find overdue invoices/purchases that haven't been fully paid
    const overdue = [];
    const upcoming = [];
    
    // Check sales for overdue customer payments
    salesData.forEach(sale => {
      if (sale.status === 'completed' && sale.customer_id) {
        const paidAmount = paymentData
          .filter(p => p.customer_id === sale.customer_id && new Date(p.date) >= new Date(sale.date))
          .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        
        const totalAmount = parseFloat(sale.total_amount || 0);
        const remainingAmount = totalAmount - paidAmount;
        
        if (remainingAmount > 0) {
          const dueDate = new Date(sale.date);
          dueDate.setDate(dueDate.getDate() + 30); // Assume 30-day payment terms
          
          if (dueDate < today) {
            overdue.push({
              type: 'customer',
              id: sale.id,
              customer_id: sale.customer_id,
              amount: remainingAmount,
              dueDate,
              description: `Invoice #${sale.id}`,
              daysPastDue: Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
            });
          } else if (dueDate <= upcomingThreshold) {
            upcoming.push({
              type: 'customer',
              id: sale.id,
              customer_id: sale.customer_id,
              amount: remainingAmount,
              dueDate,
              description: `Invoice #${sale.id}`,
              daysUntilDue: Math.floor((dueDate - today) / (1000 * 60 * 60 * 24))
            });
          }
        }
      }
    });
    
    setOverduePayments(overdue);
    setUpcomingPayments(upcoming);
  };

  // Calculate cash flow projection
  const calculateCashFlowProjection = (paymentData) => {
    const projection = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const projectionDate = new Date(today);
      projectionDate.setMonth(today.getMonth() + i);
      const monthKey = projectionDate.toISOString().slice(0, 7);
      
      // Historical data for this month in previous years
      const historicalData = paymentData.filter(p => {
        const paymentMonth = new Date(p.date).getMonth();
        return paymentMonth === projectionDate.getMonth();
      });
      
      const avgReceived = historicalData
        .filter(p => p.customer_id)
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) / Math.max(1, historicalData.length);
      
      const avgPaid = historicalData
        .filter(p => p.supplier_id)
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) / Math.max(1, historicalData.length);
      
      projection.push({
        month: monthKey,
        projectedReceived: avgReceived,
        projectedPaid: avgPaid,
        projectedNet: avgReceived - avgPaid
      });
    }
    
    setCashFlowProjection(projection);
  };

  // Enhanced form handling
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  // Enhanced form submission with validation
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    // Enhanced validation
    if (form.type === 'supplier') {
      const supplierValid = suppliers.some(s => String(s.id) === String(form.supplier_id));
      if (!supplierValid) {
        setError('Please select a valid supplier.');
        setLoading(false);
        return;
      }
    } else {
      const customerValid = customers.some(c => String(c.id) === String(form.customer_id));
      if (!customerValid) {
        setError('Please select a valid customer.');
        setLoading(false);
        return;
      }
    }

    const amountValid = form.amount && !isNaN(Number(form.amount)) && Number(form.amount) > 0;
    if (!amountValid) {
      setError('Please enter a valid amount greater than 0.');
      setLoading(false);
      return;
    }

    try {
      const paymentData = {
        amount: parseFloat(form.amount),
        description: form.description,
        payment_method: form.payment_method,
        reference_number: form.reference_number,
        due_date: form.due_date || null,
        category: form.category,
        is_recurring: form.is_recurring,
        recurring_interval: form.is_recurring ? form.recurring_interval : null
      };

      if (form.type === 'supplier') {
        paymentData.supplier_id = parseInt(form.supplier_id);
      } else {
        paymentData.customer_id = parseInt(form.customer_id);
      }

      if (selectedPayment) {
        // Update existing payment
        await axios.put(`http://localhost:5000/payments/${selectedPayment.id}`, paymentData, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setMessage('Payment updated successfully!');
      } else {
        // Create new payment
        await axios.post('http://localhost:5000/payments', paymentData, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setMessage('Payment recorded successfully!');
      }

      // Reset form and refresh data
      setForm({ 
        supplier_id: '', 
        customer_id: '', 
        amount: '', 
        description: '',
        type: 'supplier',
        payment_method: 'cash',
        reference_number: '',
        due_date: '',
        is_recurring: false,
        recurring_interval: 'monthly',
        category: 'general'
      });
      setSelectedPayment(null);
      setShowPaymentModal(false);
      await fetchAllData();

      // Auto-hide success message
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save payment');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced filtering logic
  const getFilteredPayments = () => {
    let filtered = [...payments];
    
    // Type filter
    if (filterType === 'supplier') {
      filtered = filtered.filter(p => p.supplier_id);
    } else if (filterType === 'customer') {
      filtered = filtered.filter(p => p.customer_id);
    }
    
    // Payment method filter
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(p => p.payment_method === paymentMethodFilter);
    }
    
    // Search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.description?.toLowerCase().includes(term) ||
        p.reference_number?.toLowerCase().includes(term) ||
        String(p.amount).includes(term) ||
        suppliers.find(s => s.id === p.supplier_id)?.name?.toLowerCase().includes(term) ||
        customers.find(c => c.id === p.customer_id)?.name?.toLowerCase().includes(term)
      );
    }
    
    // Date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(p => {
        const paymentDate = new Date(p.date);
        const start = dateRange.start ? new Date(dateRange.start) : new Date('1900-01-01');
        const end = dateRange.end ? new Date(dateRange.end) : new Date('2100-12-31');
        return paymentDate >= start && paymentDate <= end;
      });
    }
    
    // Amount range filter
    if (amountRange.min || amountRange.max) {
      filtered = filtered.filter(p => {
        const amount = parseFloat(p.amount) || 0;
        const min = parseFloat(amountRange.min) || 0;
        const max = parseFloat(amountRange.max) || Infinity;
        return amount >= min && amount <= max;
      });
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'amount':
          valueA = parseFloat(a.amount) || 0;
          valueB = parseFloat(b.amount) || 0;
          break;
        case 'type':
          valueA = a.supplier_id ? 'supplier' : 'customer';
          valueB = b.supplier_id ? 'supplier' : 'customer';
          break;
        case 'method':
          valueA = a.payment_method || '';
          valueB = b.payment_method || '';
          break;
        default: // date
          valueA = new Date(a.date);
          valueB = new Date(b.date);
      }
      
      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
    
    return filtered;
  };

  const filteredPayments = getFilteredPayments();

  // Payment method styling
  const getPaymentMethodStyle = (method) => {
    const styles = {
      'cash': { color: '#28a745', backgroundColor: '#d4edda', icon: '💵' },
      'check': { color: '#17a2b8', backgroundColor: '#d1ecf1', icon: '📝' },
      'bank_transfer': { color: '#6f42c1', backgroundColor: '#e2d9f3', icon: '🏦' },
      'credit_card': { color: '#fd7e14', backgroundColor: '#ffe8d1', icon: '💳' }
    };
    return styles[method] || { color: '#6c757d', backgroundColor: '#f8f9fa', icon: '💰' };
  };

  // Helper functions
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

  const getPaymentType = (payment) => {
    return payment.supplier_id ? 'supplier' : 'customer';
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  }; 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      setMessage(`${form.type === 'supplier' ? 'Supplier' : 'Customer'} payment recorded successfully`);
      setForm({ 
        supplier_id: '', 
        customer_id: '', 
        amount: '', 
        description: '',
        type: 'supplier'
      });
      setShowPaymentModal(false);
      fetchPayments();
    } catch (err) {
      setError('Error recording payment');
      console.error('Payment error:', err);
    }
  };

  const openPaymentModal = () => {
    setShowPaymentModal(true);
    setError('');
    setMessage('');
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>Payment Management</h2>
        <button 
          onClick={openPaymentModal}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          + Record New Payment
        </button>
      </div>

      {error && <div style={{ color: 'red', margin: '10px 0', padding: '10px', backgroundColor: '#fee', borderRadius: '4px' }}>{error}</div>}
      {message && <div style={{ color: 'green', margin: '10px 0', padding: '10px', backgroundColor: '#efe', borderRadius: '4px' }}>{message}</div>}
      
      {/* Dashboard Metrics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '25px' 
      }}>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          border: '1px solid #e9ecef',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
            +${payments.filter(p => p.customer_id).reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2)}
          </div>
          <div style={{ color: '#6c757d', fontSize: '14px', marginTop: '5px' }}>Total Received</div>
        </div>
        
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          border: '1px solid #e9ecef',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
            -${payments.filter(p => p.supplier_id).reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2)}
          </div>
          <div style={{ color: '#6c757d', fontSize: '14px', marginTop: '5px' }}>Total Paid Out</div>
        </div>
        
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          border: '1px solid #e9ecef',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#17a2b8' }}>
            ${(payments.filter(p => p.customer_id).reduce((sum, p) => sum + Number(p.amount), 0) - 
               payments.filter(p => p.supplier_id).reduce((sum, p) => sum + Number(p.amount), 0)).toFixed(2)}
          </div>
          <div style={{ color: '#6c757d', fontSize: '14px', marginTop: '5px' }}>Net Cash Flow</div>
        </div>
        
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          border: '1px solid #e9ecef',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6f42c1' }}>
            {payments.length}
          </div>
          <div style={{ color: '#6c757d', fontSize: '14px', marginTop: '5px' }}>Total Transactions</div>
        </div>
      </div>

      {/* Search and Filter Section - Horizontal Layout */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #e9ecef',
        marginBottom: '20px'
      }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          alignItems: 'end'
        }}>
          {/* Search Input */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#495057' }}>
              Search Payments
            </label>
            <input
              type="text"
              placeholder="Search by party name, description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ced4da',
                borderRadius: '8px',
                fontSize: '16px',
                height: '48px'
              }}
            />
          </div>

          {/* Type Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#495057' }}>
              � Payment Type
            </label>
            <select 
              value={filterType} 
              onChange={e => setFilterType(e.target.value)}
              style={{ 
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ced4da',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'white',
                height: '48px'
              }}
            >
              <option value="all">All Payments</option>
              <option value="supplier">Supplier Payments</option>
              <option value="customer">Customer Payments</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#495057' }}>
              Date Filter
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ced4da',
                borderRadius: '8px',
                fontSize: '16px',
                height: '48px'
              }}
            />
          </div>

          {/* Amount Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#495057' }}>
              Min Amount
            </label>
            <input
              type="number"
              placeholder="Min amount..."
              value={amountFilter}
              onChange={e => setAmountFilter(e.target.value)}
              min="0"
              step="0.01"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ced4da',
                borderRadius: '8px',
                fontSize: '16px',
                height: '48px'
              }}
            />
          </div>

          {/* Clear Filters Button */}
          <div>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setDateFilter('');
                setAmountFilter('');
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: 'bold',
                height: '48px'
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
        
        {/* Results Summary */}
        <div style={{ 
          marginTop: '15px',
          padding: '10px 15px',
          backgroundColor: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#6c757d',
          textAlign: 'center'
        }}>
          Showing {payments.filter(p => {
            // Type filter
            if (filterType === 'supplier' && !p.supplier_id) return false;
            if (filterType === 'customer' && !p.customer_id) return false;
            
            // Search filter
            if (searchTerm) {
              const searchLower = searchTerm.toLowerCase();
              const partyName = (p.supplier_name || p.customer_name || '').toLowerCase();
              const description = (p.description || '').toLowerCase();
              if (!partyName.includes(searchLower) && !description.includes(searchLower)) return false;
            }
            
            // Date filter
            if (dateFilter) {
              const paymentDate = new Date(p.date).toISOString().split('T')[0];
              if (paymentDate !== dateFilter) return false;
            }
            
            // Amount filter
            if (amountFilter && Number(p.amount) < Number(amountFilter)) return false;
            
            return true;
          }).length} of {payments.length} payments
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>ID</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Type</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Party</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Amount</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Description</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {payments
            .filter(p => {
              // Type filter
              if (filterType === 'supplier' && !p.supplier_id) return false;
              if (filterType === 'customer' && !p.customer_id) return false;
              
              // Search filter
              if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const partyName = (p.supplier_name || p.customer_name || '').toLowerCase();
                const description = (p.description || '').toLowerCase();
                if (!partyName.includes(searchLower) && !description.includes(searchLower)) return false;
              }
              
              // Date filter
              if (dateFilter) {
                const paymentDate = new Date(p.date).toISOString().split('T')[0];
                if (paymentDate !== dateFilter) return false;
              }
              
              // Amount filter
              if (amountFilter && Number(p.amount) < Number(amountFilter)) return false;
              
              return true;
            })
            .map(p => {
              const isSupplierPayment = p.supplier_id;
              return (
                <tr key={p.id}>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{p.id}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                    <span style={{ 
                      backgroundColor: isSupplierPayment ? '#dc3545' : '#28a745', 
                      color: 'white', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {isSupplierPayment ? 'PAID OUT' : 'RECEIVED'}
                    </span>
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                    {isSupplierPayment ? p.supplier_name : p.customer_name}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                    <span style={{ 
                      color: isSupplierPayment ? '#dc3545' : '#28a745',
                      fontWeight: 'bold'
                    }}>
                      {isSupplierPayment ? '-' : '+'}${Number(p.amount).toFixed(2)}
                    </span>
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                    {p.description || '-'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                    {new Date(p.date).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>

      {/* Payment Recording Modal */}
      {showPaymentModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000 
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '30px', 
            borderRadius: '12px', 
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)', 
            maxWidth: '500px', 
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 'bold' }}>
              Record Payment
            </h3>
            
            <form onSubmit={handleSubmit}>
              {/* Payment Type Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Payment Type:</label>
                <select 
                  value={form.type} 
                  onChange={e => setForm({...form, type: e.target.value, supplier_id: '', customer_id: ''})}
                  style={{ 
                    padding: '10px', 
                    width: '100%', 
                    border: '1px solid #ddd', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="supplier">Pay Supplier</option>
                  <option value="customer">Receive from Customer</option>
                </select>
              </div>

              {/* Supplier/Customer Selection */}
              {form.type === 'supplier' ? (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Supplier:</label>
                  {suppliers.length > 0 ? (
                    <select
                      name="supplier_id"
                      value={form.supplier_id}
                      onChange={e => setForm({ ...form, supplier_id: String(e.target.value) })}
                      required
                      style={{ 
                        padding: '10px', 
                        width: '100%', 
                        border: '1px solid #ddd', 
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="" disabled>Select supplier</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={String(s.id)}>{s.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span>Loading suppliers...</span>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Customer:</label>
                  {customers.length > 0 ? (
                    <select
                      name="customer_id"
                      value={form.customer_id}
                      onChange={e => setForm({ ...form, customer_id: String(e.target.value) })}
                      required
                      style={{ 
                        padding: '10px', 
                        width: '100%', 
                        border: '1px solid #ddd', 
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="" disabled>Select customer</option>
                      {customers.map(c => (
                        <option key={c.id} value={String(c.id)}>{c.name} {c.brand_name ? `(${c.brand_name})` : ''}</option>
                      ))}
                    </select>
                  ) : (
                    <span>Loading customers...</span>
                  )}
                </div>
              )}
              
              {/* Amount */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Amount:</label>
                <input 
                  name="amount" 
                  type="number" 
                  step="0.01"
                  min="0"
                  placeholder="Enter amount" 
                  value={form.amount} 
                  onChange={handleChange} 
                  required 
                  style={{ 
                    padding: '10px', 
                    width: '100%', 
                    border: '1px solid #ddd', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Description (Optional):</label>
                <textarea 
                  name="description" 
                  placeholder="Payment description or reference" 
                  value={form.description} 
                  onChange={handleChange} 
                  rows="3"
                  style={{ 
                    padding: '10px', 
                    width: '100%', 
                    border: '1px solid #ddd', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '15px' }}>
                <button 
                  type="submit" 
                  disabled={!form.amount || parseFloat(form.amount) <= 0 || (!form.supplier_id && !form.customer_id)}
                  style={{ 
                    flex: 1,
                    padding: '12px', 
                    backgroundColor: form.type === 'supplier' ? '#dc3545' : '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    opacity: (!form.amount || parseFloat(form.amount) <= 0 || (!form.supplier_id && !form.customer_id)) ? 0.5 : 1
                  }}
                >
                  {form.type === 'supplier' ? '💸 Pay Supplier' : '💰 Receive Payment'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setForm({ 
                      supplier_id: '', 
                      customer_id: '', 
                      amount: '', 
                      description: '',
                      type: 'supplier'
                    });
                    setError('');
                    setMessage('');
                  }}
                  style={{ 
                    flex: 1,
                    padding: '12px', 
                    backgroundColor: '#6c757d', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
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
