import axios from 'axios';
import { useEffect, useState } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';

function Suppliers() {
  // State management
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({ name: '', brand_name: '', contact_info: '', opening_balance: '', opening_balance_type: 'debit' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = usePersistentState('suppliers_search', '');
  const [editing, setEditing] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = usePersistentState('suppliers_current_page', 1);
  const [itemsPerPage, setItemsPerPage] = usePersistentState('suppliers_items_per_page', 25);

  // Advanced filter states
  const [balanceFilter, setBalanceFilter] = usePersistentState('suppliers_balance_filter', 'all'); // all | payables | zero
  const [minBalance, setMinBalance] = usePersistentState('suppliers_min_balance', '');
  const [maxBalance, setMaxBalance] = usePersistentState('suppliers_max_balance', '');
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState('suppliers_show_advanced_filters', false);

  // Modal states
  const [showAdd, setShowAdd] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Purchase modal state - simplified version
  const [purchaseForm, setPurchaseForm] = useState({
    supplier_id: '',
    total_cost: '',
    description: '',
    supplier_invoice_id: '',
    delivery_method: '',
    purchase_date: ''
  });
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseMessage, setPurchaseMessage] = useState('');

  // Payment modal state
  const [paymentForm, setPaymentForm] = useState({
    supplier_id: '',
    amount: '',
    description: '',
    payment_method: '',
    payment_date: ''
  });
  const [paymentError, setPaymentError] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');

  // History modal state
  const [historySupplier, setHistorySupplier] = useState(null);
  const [historyPurchases, setHistoryPurchases] = useState([]);
  const [historyPayments, setHistoryPayments] = useState([]);
  const [supplierLedger, setSupplierLedger] = useState([]);
  const [showPurchaseEditor, setShowPurchaseEditor] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  // Legacy state for purchase editor (simplified)
  const [editingPurchaseItems, setEditingPurchaseItems] = useState([]);
  const [newPurchaseItem, setNewPurchaseItem] = useState({ product_id: '', quantity: '', cost_price: '' });
  const [purchaseProducts, setPurchaseProducts] = useState([]);
  const [purchaseItem, setPurchaseItem] = useState({ product_id: '', quantity: '', cost_price: '' });

  const [showSupplierPaymentEditor, setShowSupplierPaymentEditor] = useState(false);
  const [editingSupplierPayment, setEditingSupplierPayment] = useState({ supplierId: null, paymentId: null, amount: '', description: '' });

  const token = localStorage.getItem('token');

  // Refresh function to reload suppliers
  const refreshSuppliers = () => {
    window.location.reload();
  };

  // Purchase editing
  const openPurchaseEditor = async (purchaseId) => {
    console.log('openPurchaseEditor called with ID:', purchaseId);
    try {
      const res = await axios.get(`http://localhost:5000/purchases/${purchaseId}`, { headers: { Authorization: `Bearer ${token}` } });
      console.log('Purchase data received:', res.data);
      setEditingPurchase(res.data);
      setEditingPurchaseItems(res.data.items || []);
      setShowPurchaseEditor(true);

      // Close the supplier history modal when opening purchase editor
      setHistorySupplier(null);

      console.log('Purchase editor modal should now be visible');
    } catch (error) {
      console.error('Error fetching purchase:', error);
      alert('Error fetching purchase details: ' + (error.response?.data?.message || error.message));
    }
  };

  // Add new item to editing purchase
  const addEditingPurchaseItem = () => {
    if (!newPurchaseItem.product_id || !newPurchaseItem.quantity || !newPurchaseItem.cost_price) {
      alert('Please fill in all product details');
      return;
    }

    const quantity = parseFloat(newPurchaseItem.quantity);
    const cost_price = parseFloat(newPurchaseItem.cost_price);

    if (quantity <= 0 || cost_price <= 0) {
      alert('Quantity and cost price must be greater than 0');
      return;
    }

    // Check if product is already in the list
    const existingItem = editingPurchaseItems.find(item => item.product_id === newPurchaseItem.product_id);
    if (existingItem) {
      alert('Product already added to this purchase. Remove it first to add again.');
      return;
    }

    const newItem = {
      product_id: newPurchaseItem.product_id,
      quantity: quantity,
      cost_price: cost_price,
      product_name: purchaseProducts.find(p => p.id === newPurchaseItem.product_id)?.name || 'Unknown Product'
    };

    setEditingPurchaseItems([...editingPurchaseItems, newItem]);
    setNewPurchaseItem({ product_id: '', quantity: '', cost_price: '' });
  };

  // Remove item from editing purchase
  const removeEditingPurchaseItem = (index) => {
    const newItems = editingPurchaseItems.filter((_, i) => i !== index);
    setEditingPurchaseItems(newItems);
  };

  // Purchase item handlers for the new simplified form
  const handlePurchaseItemChange = e => {
    setPurchaseItem({ ...purchaseItem, [e.target.name]: e.target.value });
  };

  const addPurchaseItem = () => {
    // This function is no longer used in simplified workflow but kept for compatibility
    console.log('addPurchaseItem called - this should not be used in simplified workflow');
  };

  const removePurchaseItem = (index) => {
    // This function is no longer used in simplified workflow but kept for compatibility
    console.log('removePurchaseItem called - this should not be used in simplified workflow');
  };


  // Save edited purchase
  const saveEditedPurchase = async () => {
    if (editingPurchaseItems.length === 0) {
      alert('Please add at least one item to the purchase');
      return;
    }

    try {
      // Calculate new total cost
      const newTotalCost = editingPurchaseItems.reduce((sum, item) => sum + (item.quantity * item.cost_price), 0);

      // Update purchase total cost
      await axios.put(`http://localhost:5000/purchases/${editingPurchase.id}`, {
        total_cost: newTotalCost,
        items: editingPurchaseItems
      }, { headers: { Authorization: `Bearer ${token}` } });

      setShowPurchaseEditor(false);
      fetchHistory(editingPurchase.supplier_id);
      alert('Purchase updated successfully');
    } catch (error) {
      console.error('Error updating purchase:', error);
      alert('Error updating purchase: ' + (error.response?.data?.message || error.message));
    }
  };

  // Payment editing
  const openSupplierPaymentEditor = (supplierId, paymentId, amount, description) => {
    console.log('openSupplierPaymentEditor called with:', { supplierId, paymentId, amount, description });
    setEditingSupplierPayment({ supplierId, paymentId, amount, description });
    setShowSupplierPaymentEditor(true);
    console.log('Payment editor modal should now be visible');
  };

  const saveSupplierPayment = async () => {
    const { supplierId, paymentId, amount, description } = editingSupplierPayment;
    try {
      await axios.put(`http://localhost:5000/payments/${paymentId}`, { amount, description }, { headers: { Authorization: `Bearer ${token}` } });
      setShowSupplierPaymentEditor(false);
      fetchHistory(supplierId);
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Error updating payment: ' + (error.response?.data?.message || error.message));
    }
  };

  // Filter suppliers based on search term
  // Apply all filters
  const getFilteredSuppliers = () => {
    return suppliers.filter(supplier => {
      // Search filter
      const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contact_info?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Balance filter
      const balance = parseFloat(supplier.balance || 0);

      if (balanceFilter === 'payables' && balance <= 0) return false;
      if (balanceFilter === 'zero' && balance !== 0) return false;

      // Balance range filter
      if (minBalance && Math.abs(balance) < parseFloat(minBalance)) return false;
      if (maxBalance && Math.abs(balance) > parseFloat(maxBalance)) return false;

      return true;
    });
  };

  const filteredSuppliers = getFilteredSuppliers();

  // Fetch purchase and payment history for a supplier
  const fetchHistory = async (supplierId) => {
    try {
      console.log('Fetching history for supplier:', supplierId);

      // Try new history API first
      try {
        const response = await axios.get(`http://127.0.0.1:5000/suppliers/${supplierId}/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('New API response:', response.data);

        if (response.data.ledger && response.data.ledger.length > 0) {
          // Use the properly formatted ledger from backend
          setHistoryPurchases(response.data.ledger.filter(item => item.type === 'purchase'));
          setHistoryPayments(response.data.ledger.filter(item => item.type === 'payment'));
          setSupplierLedger(response.data.ledger);
          console.log('Using new API ledger with', response.data.ledger.length, 'entries');
          return;
        }
      } catch (historyError) {
        console.log('New API failed, falling back to old method:', historyError.message);
      }

      // Fallback to old method
      console.log('Using fallback method');
      const [purchasesRes, paymentsRes] = await Promise.all([
        axios.get(`http://localhost:5000/purchases?supplier_id=${supplierId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`http://localhost:5000/payments?supplier_id=${supplierId}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      console.log('Fallback - Purchases:', purchasesRes.data.length, 'Payments:', paymentsRes.data.length);
      setHistoryPurchases(purchasesRes.data);
      setHistoryPayments(paymentsRes.data);
      setSupplierLedger([]);

    } catch (error) {
      console.error('Error fetching supplier history:', error);
      setHistoryPurchases([]);
      setHistoryPayments([]);
      setSupplierLedger([]);
    }
  };

  const handleShowHistory = (supplier) => {
    console.log('handleShowHistory called with supplier:', supplier);
    setHistorySupplier(supplier);
    setShowHistory(true);
    console.log('showHistory set to true, fetching history...');
    fetchHistory(supplier.id);
  };

  // Payment modal handlers
  const handlePaymentChange = e => {
    setPaymentForm({ ...paymentForm, [e.target.name]: e.target.value });
  };

  const handlePaymentSubmit = async e => {
    e.preventDefault();
    setPaymentError('');
    setPaymentMessage('');
    if (!paymentForm.supplier_id || !paymentForm.amount) {
      setPaymentError('Select supplier and enter amount');
      return;
    }
    try {
      await axios.post('http://localhost:5000/payments', paymentForm, { headers: { Authorization: `Bearer ${token}` } });
      setPaymentMessage('Payment recorded');
      setPaymentForm({
        supplier_id: '',
        amount: '',
        description: '',
        payment_method: '',
        payment_date: ''
      });
      setShowPayment(false);
      refreshSuppliers(); // Refresh supplier balances
    } catch {
      setPaymentError('Error recording payment');
    }
  };



  const handlePurchaseFormChange = e => {
    setPurchaseForm({ ...purchaseForm, [e.target.name]: e.target.value });
  };

  const handlePurchaseSubmit = async e => {
    e.preventDefault();
    setPurchaseError('');
    setPurchaseMessage('');

    console.log('Purchase form submission started:', purchaseForm);

    // Validate required fields for simplified purchase
    if (!purchaseForm.supplier_id) {
      setPurchaseError('Please select a supplier');
      return;
    }

    if (!purchaseForm.total_cost || Number(purchaseForm.total_cost) <= 0) {
      setPurchaseError('Please enter a valid purchase amount');
      return;
    }

    try {
      console.log('Sending simplified purchase request:', {
        supplier_id: purchaseForm.supplier_id,
        total_cost: purchaseForm.total_cost,
        description: purchaseForm.description,
        supplier_invoice_id: purchaseForm.supplier_invoice_id,
        delivery_method: purchaseForm.delivery_method,
        purchase_date: purchaseForm.purchase_date
      });

      const response = await axios.post('http://localhost:5000/purchases', {
        supplier_id: purchaseForm.supplier_id,
        total_cost: purchaseForm.total_cost,
        description: purchaseForm.description,
        supplier_invoice_id: purchaseForm.supplier_invoice_id,
        delivery_method: purchaseForm.delivery_method,
        purchase_date: purchaseForm.purchase_date
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Purchase response:', response.data);
      setPurchaseMessage('Purchase created successfully');
      setPurchaseForm({
        supplier_id: '',
        total_cost: '',
        description: '',
        supplier_invoice_id: '',
        delivery_method: '',
        purchase_date: ''
      });
      setShowPurchase(false);
      // Refresh suppliers after purchase
      refreshSuppliers();
    } catch (error) {
      console.error('Purchase error:', error);
      const errorMessage = error.response?.data?.message || 'Error creating purchase';
      setPurchaseError(errorMessage);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5000/suppliers', { headers: { Authorization: `Bearer ${token}` } });
        setSuppliers(res.data);
      } catch {
        setError('Failed to fetch suppliers');
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();

    // Cleanup function to prevent memory leaks
    return () => {
      setMessage('');
      setError('');
      setPurchaseError('');
      setPaymentError('');
    };
  }, [token]);

  // Fetch products when purchase editor is opened
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/products', { headers: { Authorization: `Bearer ${token}` } });
        setPurchaseProducts(res.data);
      } catch (error) {
        console.error('Error fetching products:', error);
        setPurchaseProducts([]);
      }
    };

    if (showPurchaseEditor) {
      fetchProducts();
    }
  }, [showPurchaseEditor, token]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validate required fields
    if (!form.name.trim()) {
      setError('Supplier name is required');
      return;
    }

    try {
      if (editing) {
        await axios.put(`http://localhost:5000/suppliers/${editing}`, form, { headers: { Authorization: `Bearer ${token}` } });
        setMessage('Supplier updated successfully');
        setEditing(null);
      } else {
        await axios.post('http://localhost:5000/suppliers', form, { headers: { Authorization: `Bearer ${token}` } });
        setMessage('Supplier added successfully');
      }
      setForm({ name: '', brand_name: '', contact_info: '', opening_balance: '', opening_balance_type: 'debit' });
      setShowAdd(false);
      refreshSuppliers();
    } catch (err) {
      console.error('Error submitting supplier form:', err);
      setError(editing ? 'Error updating supplier' : 'Error adding supplier');
    }
  };

  const handleEdit = (supplier) => {
    // Map backend fields to frontend form fields
    setForm({
      name: supplier.name,
      brand_name: supplier.brand_name,
      contact_info: supplier.contact_info,
      opening_balance: supplier.opening_balance,
      opening_balance_type: supplier.opening_balance_type
    });
    setEditing(supplier.id);
    setShowAdd(true);
  };

  const handleDelete = async (id) => {
    const password = prompt('Enter your password to confirm deletion:');
    if (!password) {
      return; // User cancelled or didn't enter password
    }

    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await axios.delete(`http://localhost:5000/suppliers/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { password }
        });
        setMessage('Supplier deleted successfully');
        refreshSuppliers();
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to delete supplier';
        setError(errorMessage);
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="flex flex-col items-center gap-4">
          <div className="loading-spinner"></div>
          <span className="text-gray-600">Loading suppliers...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '2.5rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #60a5fa 0%, #34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🏪 Supplier Management
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8, fontSize: '1.1rem' }}>Manage suppliers, track balances, and handle purchase transactions</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(96, 165, 250, 0.1)',
              border: '1px solid rgba(96, 165, 250, 0.2)',
              padding: '1rem',
              borderRadius: '12px',
              textAlign: 'center',
              minWidth: '120px'
            }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.8, color: '#374151' }}>Total Suppliers</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{suppliers.length}</div>
            </div>
            <div style={{
              background: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              padding: '1rem',
              borderRadius: '12px',
              textAlign: 'center',
              minWidth: '120px'
            }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.8, color: '#374151' }}>Active Suppliers</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{suppliers.filter(s => s.is_active !== false).length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="alert alert-success">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {message}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600"></div>
            <div>
              <p className="text-xl font-bold text-gray-900">{suppliers.length}</p>
              <p className="text-xs text-gray-600">Total Suppliers</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-green-100 text-green-600"></div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                PKR {suppliers.reduce((sum, s) => sum + (parseFloat(s.balance) || 0), 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-600">Total Outstanding</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600"></div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {suppliers.filter(s => (parseFloat(s.balance) || 0) >= 0).length}
              </p>
              <p className="text-xs text-gray-600">Cleared Suppliers</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-orange-100 text-orange-600"></div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {suppliers.filter(s => (parseFloat(s.balance) || 0) < 0).length}
              </p>
              <p className="text-xs text-gray-600">Pending Payments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between gap-6 px-2">
          <div className="flex-1 max-w-md ml-4">
            <input
              type="text"
              className="form-input text-sm"
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="text-xs text-gray-500 mt-1">
              {filteredSuppliers.length} of {suppliers.length} suppliers
            </div>
            <button
              style={{
                marginTop: '8px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: showAdvancedFilters ? '#8b5cf6' : '#64748b',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              {showAdvancedFilters ? '🔽' : '▶️'} Advanced Filters
            </button>
          </div>
          <div className="flex gap-4 mr-3">
            <button
              onClick={() => setShowAdd(true)}
              className="btn btn-primary flex items-center justify-center gap-2 w-32"
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                minWidth: '120px'
              }}
            >
              Add Supplier
            </button>
            <button
              onClick={() => {
                console.log('Opening purchase modal');
                setShowPurchase(true);
              }}
              className="btn btn-secondary flex items-center justify-center gap-2 w-32"
            >
              New Purchase
            </button>
            <button
              onClick={() => setShowPayment(true)}
              className="btn btn-success flex items-center justify-center gap-2 w-32"
            >
              Record Payment
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div style={{
          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          margin: '1rem 0',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '1.1rem', fontWeight: '600' }}>
            🔍 Advanced Filters
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {/* Balance Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#4b5563', fontWeight: '500' }}>
                💰 Balance Status
              </label>
              <select
                value={balanceFilter}
                onChange={(e) => { setBalanceFilter(e.target.value); setCurrentPage(1); }}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Suppliers</option>
                <option value="payables">Have Payables (Owe Money)</option>
                <option value="zero">Zero Balance</option>
              </select>
            </div>

            {/* Balance Range */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#4b5563', fontWeight: '500' }}>
                📊 Min Balance (PKR)
              </label>
              <input
                type="number"
                placeholder="Minimum..."
                value={minBalance}
                onChange={(e) => { setMinBalance(e.target.value); setCurrentPage(1); }}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#4b5563', fontWeight: '500' }}>
                📊 Max Balance (PKR)
              </label>
              <input
                type="number"
                placeholder="Maximum..."
                value={maxBalance}
                onChange={(e) => { setMaxBalance(e.target.value); setCurrentPage(1); }}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          {/* Clear Filters */}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: '#ef4444',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500'
              }}
              onClick={() => {
                setBalanceFilter('all');
                setMinBalance('');
                setMaxBalance('');
                setCurrentPage(1);
              }}
            >
              🗑️ Clear Advanced Filters
            </button>

            {(balanceFilter !== 'all' || minBalance || maxBalance) && (
              <div style={{
                padding: '0.5rem 1rem',
                background: '#fef3c7',
                border: '2px solid #f59e0b',
                borderRadius: '8px',
                color: '#92400e',
                fontWeight: '500',
                fontSize: '0.875rem'
              }}>
                ⚡ {filteredSuppliers.length} of {suppliers.length} suppliers match
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pagination Controls - Top */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        padding: '0.5rem'
      }}>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Showing {itemsPerPage === 'all' ? `all ${filteredSuppliers.length}` : `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, filteredSuppliers.length)} of ${filteredSuppliers.length}`} suppliers
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Items per page:</span>
          <select
            value={itemsPerPage}
            onChange={e => {
              const value = e.target.value === 'all' ? 'all' : Number(e.target.value);
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Supplier Details</th>
              <th>Brand</th>
              <th>Contact</th>
              <th>Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(itemsPerPage === 'all' ? filteredSuppliers : filteredSuppliers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)).length === 0 ? (
              <tr>
                <td colSpan="5">
                  <div className="empty-state">
                    <span className="icon"></span>
                    <h3>{searchTerm ? 'No suppliers found' : 'No suppliers yet'}</h3>
                    <p>
                      {searchTerm
                        ? 'Try adjusting your search terms.'
                        : 'Add your first supplier to get started.'
                      }
                    </p>
                    {!searchTerm && (
                      <button onClick={() => setShowAdd(true)} className="btn btn-primary">
                        <span className="icon"></span>
                        Add First Supplier
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              (itemsPerPage === 'all' ? filteredSuppliers : filteredSuppliers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)).map(supplier => (
                <tr key={supplier.id}>
                  <td>
                    <div className="supplier-info">
                      <button
                        onClick={() => handleShowHistory(supplier)}
                        className="supplier-name"
                      >
                        {supplier.name}
                      </button>
                      <div className="supplier-id">ID: {supplier.id}</div>
                    </div>
                  </td>
                  <td>
                    <div className="brand-info" style={{ minHeight: '20px', padding: '4px 0' }}>
                      {supplier.brand_name ? (
                        <span className="brand-name" style={{ fontSize: '14px', color: '#666' }}>{supplier.brand_name}</span>
                      ) : (
                        <span className="no-brand" style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>No brand specified</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="contact-info" style={{ minHeight: '20px', padding: '4px 0' }}>
                      {supplier.contact_info ? (
                        <span className="contact-details" style={{ fontSize: '14px', color: '#333' }}>{supplier.contact_info}</span>
                      ) : (
                        <span className="no-contact" style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>No contact info</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="balance-display">
                      <span className={`balance-amount ${(parseFloat(supplier.balance) || 0) >= 0
                        ? 'balance-positive'
                        : 'balance-negative'
                        }`}>
                        PKR {(parseFloat(supplier.balance) || 0).toFixed(2)}
                      </span>
                      <div className="balance-status">
                        {(parseFloat(supplier.balance) || 0) >= 0 ? (
                          <span className="status-paid">Cleared</span>
                        ) : (
                          <span className="status-pending">Pending</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="btn btn-secondary btn-sm"
                        title="Edit supplier"
                      >
                        <span className="icon"></span>
                        Edit
                      </button>
                      <button
                        onClick={() => handleShowHistory(supplier)}
                        className="btn btn-info btn-sm"
                        title="View transaction history"
                      >
                        <span className="icon"></span>
                        History
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        className="btn btn-danger btn-sm"
                        title="Delete supplier"
                      >
                        <span className="icon"></span>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls - Bottom */}
      {itemsPerPage !== 'all' && filteredSuppliers.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '1rem',
          padding: '0.5rem'
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
              background: currentPage === 1 ? '#f3f4f6' : '#fff',
              color: currentPage === 1 ? '#9ca3af' : '#374151',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            ← Previous
          </button>

          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Page {currentPage} of {Math.ceil(filteredSuppliers.length / itemsPerPage)}
          </div>

          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage >= Math.ceil(filteredSuppliers.length / itemsPerPage)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
              background: currentPage >= Math.ceil(filteredSuppliers.length / itemsPerPage) ? '#f3f4f6' : '#fff',
              color: currentPage >= Math.ceil(filteredSuppliers.length / itemsPerPage) ? '#9ca3af' : '#374151',
              cursor: currentPage >= Math.ceil(filteredSuppliers.length / itemsPerPage) ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Supplier Analytics Dashboard */}
      <div className="card mb-8">
        <div className="card-header">
          <div>
            <h4 className="card-title flex items-center">
              <span className="icon"></span>
              Supplier Analytics Dashboard
            </h4>
            <p className="text-sm text-gray-600 mt-2">
              Comprehensive analysis of supplier relationships and financial obligations
            </p>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Financial Overview */}
            <div>
              <h5 className="font-bold text-gray-700 mb-4 flex items-center">
                <span className="mr-2"></span>
                Financial Overview
              </h5>
              <div className="space-y-4">
                {(() => {
                  const totalSuppliers = suppliers.length;
                  const totalOwed = suppliers.reduce((sum, supplier) => sum + parseFloat(supplier.balance || 0), 0);
                  const suppliersOwedTo = suppliers.filter(s => parseFloat(s.balance || 0) > 0);
                  const suppliersOwingUs = suppliers.filter(s => parseFloat(s.balance || 0) < 0);
                  const balancedSuppliers = suppliers.filter(s => parseFloat(s.balance || 0) === 0);

                  const averageOwed = totalSuppliers > 0 ? totalOwed / totalSuppliers : 0;
                  const highestOwed = Math.max(...suppliers.map(s => parseFloat(s.balance || 0)));
                  const lowestOwed = Math.min(...suppliers.map(s => parseFloat(s.balance || 0)));

                  return (
                    <>
                      <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                        <div className="font-bold text-red-900 text-lg">Overall Financial Summary</div>
                        <div className="grid grid-cols-1 gap-2 mt-3">
                          <div className="text-sm text-red-700">
                            <span className="font-semibold">Total Suppliers:</span> {totalSuppliers}
                          </div>
                          <div className="text-sm text-red-700">
                            <span className="font-semibold">Total Amount Owed:</span> PKR {totalOwed.toFixed(2)}
                          </div>
                          <div className="text-sm text-red-700">
                            <span className="font-semibold">Average Amount:</span> PKR {averageOwed.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <div className="font-bold text-blue-900 text-lg">Payment Status</div>
                        <div className="grid grid-cols-1 gap-2 mt-3">
                          <div className="text-sm text-blue-700">
                            <span className="font-semibold text-red-600">We Owe:</span> {suppliersOwedTo.length} suppliers
                          </div>
                          <div className="text-sm text-blue-700">
                            <span className="font-semibold text-green-600">Owe Us:</span> {suppliersOwingUs.length} suppliers
                          </div>
                          <div className="text-sm text-blue-700">
                            <span className="font-semibold text-gray-600">Balanced:</span> {balancedSuppliers.length} suppliers
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                        <div className="font-bold text-purple-900 text-lg">Amount Range</div>
                        <div className="grid grid-cols-1 gap-2 mt-3">
                          <div className="text-sm text-purple-700">
                            <span className="font-semibold">Highest Owed:</span> PKR {highestOwed.toFixed(2)}
                          </div>
                          <div className="text-sm text-purple-700">
                            <span className="font-semibold">Lowest Amount:</span> PKR {lowestOwed.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Top Suppliers Analysis */}
            <div>
              <h5 className="font-bold text-gray-700 mb-4 flex items-center">
                <span className="mr-2"></span>
                Priority Suppliers
              </h5>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(() => {
                  const sortedByAmount = [...suppliers]
                    .sort((a, b) => parseFloat(b.balance || 0) - parseFloat(a.balance || 0))
                    .slice(0, 10);

                  return sortedByAmount.map((supplier, index) => {
                    const balance = parseFloat(supplier.balance || 0);
                    const weOwe = balance > 0;
                    const theyOwe = balance < 0;

                    return (
                      <div key={supplier.id} className={`p-4 rounded-lg border shadow-sm ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200' :
                        weOwe ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200' :
                          theyOwe ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200' :
                            'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
                        }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className={`font-bold text-lg flex items-center ${index === 0 ? 'text-yellow-900' :
                              weOwe ? 'text-red-900' :
                                theyOwe ? 'text-green-900' :
                                  'text-gray-900'
                              }`}>
                              {index === 0 && ''}
                              {supplier.name}
                              {index < 3 && (
                                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                                  #{index + 1}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-1 gap-1 mt-2">
                              <div className={`text-sm ${index === 0 ? 'text-yellow-700' :
                                weOwe ? 'text-red-700' :
                                  theyOwe ? 'text-green-700' :
                                    'text-gray-700'
                                }`}>
                                <span className="font-semibold">
                                  {weOwe ? 'We Owe:' : theyOwe ? 'They Owe:' : 'Balance:'}
                                </span> PKR {Math.abs(balance).toFixed(2)}
                              </div>
                              <div className={`text-sm ${index === 0 ? 'text-yellow-700' :
                                weOwe ? 'text-red-700' :
                                  theyOwe ? 'text-green-700' :
                                    'text-gray-700'
                                }`}>
                                <span className="font-semibold">Brand:</span> {supplier.brand_name || 'No brand'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Supplier Insights */}
            <div>
              <h5 className="font-bold text-gray-700 mb-4 flex items-center">
                <span className="mr-2"></span>
                Supplier Insights
              </h5>
              <div className="space-y-4">
                {(() => {
                  const suppliersWithBrand = suppliers.filter(s => s.brand_name && s.brand_name.trim() !== '');
                  const suppliersWithContact = suppliers.filter(s => s.contact_info && s.contact_info.trim() !== '');
                  const suppliersWithCompleteInfo = suppliers.filter(s =>
                    s.brand_name && s.brand_name.trim() !== '' &&
                    s.contact_info && s.contact_info.trim() !== ''
                  );

                  const urgentPayments = suppliers.filter(s => parseFloat(s.balance || 0) > 1000);
                  const smallAmounts = suppliers.filter(s => parseFloat(s.balance || 0) > 0 && parseFloat(s.balance || 0) <= 1000);

                  return (
                    <>
                      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
                        <div className="font-bold text-indigo-900 text-lg">Supplier Information</div>
                        <div className="grid grid-cols-1 gap-2 mt-3">
                          <div className="text-sm text-indigo-700">
                            <span className="font-semibold">With Brand Info:</span> {suppliersWithBrand.length} ({((suppliersWithBrand.length / suppliers.length) * 100).toFixed(1)}%)
                          </div>
                          <div className="text-sm text-indigo-700">
                            <span className="font-semibold">With Contact:</span> {suppliersWithContact.length} ({((suppliersWithContact.length / suppliers.length) * 100).toFixed(1)}%)
                          </div>
                          <div className="text-sm text-indigo-700">
                            <span className="font-semibold">Complete Info:</span> {suppliersWithCompleteInfo.length} ({((suppliersWithCompleteInfo.length / suppliers.length) * 100).toFixed(1)}%)
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                        <div className="font-bold text-orange-900 text-lg">Payment Priority</div>
                        <div className="grid grid-cols-1 gap-2 mt-3">
                          <div className="text-sm text-orange-700">
                            <span className="font-semibold text-red-600">Urgent (&gt;PKR 1000):</span> {urgentPayments.length} suppliers
                          </div>
                          <div className="text-sm text-orange-700">
                            <span className="font-semibold text-yellow-600">Small (&lt;PKR 1000):</span> {smallAmounts.length} suppliers
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-4 rounded-lg border border-teal-200">
                        <div className="font-bold text-teal-900 text-lg">Quick Actions</div>
                        <div className="mt-3 space-y-2">
                          <button
                            onClick={() => setShowAdd(!showAdd)}
                            className="w-full text-left text-sm text-teal-700 hover:text-teal-900 font-medium"
                          >
                            Add New Supplier
                          </button>
                          <button
                            onClick={() => {
                              const incomplete = suppliers.filter(s =>
                                !s.brand_name || s.brand_name.trim() === '' ||
                                !s.contact_info || s.contact_info.trim() === ''
                              );
                              if (incomplete.length > 0) {
                                alert(`${incomplete.length} suppliers have incomplete information`);
                              } else {
                                alert('All suppliers have complete information!');
                              }
                            }}
                            className="w-full text-left text-sm text-teal-700 hover:text-teal-900 font-medium"
                          >
                            Check Incomplete Profiles
                          </button>
                          <button
                            onClick={() => {
                              const urgent = suppliers.filter(s => parseFloat(s.balance || 0) > 1000);
                              if (urgent.length > 0) {
                                alert(`${urgent.length} suppliers require urgent payments over PKR 1000`);
                              } else {
                                alert('No urgent payments required!');
                              }
                            }}
                            className="w-full text-left text-sm text-teal-700 hover:text-teal-900 font-medium"
                          >
                            Check Urgent Payments
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Add/Edit Supplier Modal */}
      {showAdd && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editing ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Supplier Name *</label>
                  <input
                    name="name"
                    placeholder="Enter supplier name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Brand Name</label>
                  <input
                    name="brand_name"
                    placeholder="Brand they supply"
                    value={form.brand_name}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Information</label>
                  <textarea
                    name="contact_info"
                    placeholder="Phone, email, address..."
                    value={form.contact_info}
                    onChange={handleChange}
                    className="form-input form-textarea"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Opening Balance</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      name="opening_balance"
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      value={form.opening_balance}
                      onChange={handleChange}
                      className="form-input"
                      style={{ flex: 2 }}
                    />
                    <select
                      name="opening_balance_type"
                      value={form.opening_balance_type}
                      onChange={handleChange}
                      className="form-input"
                      style={{ flex: 1 }}
                    >
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Select Debit if you owe the supplier money, Credit if supplier owes you
                  </small>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e);
                }}
                className="btn btn-primary"
              >
                {editing ? 'Update Supplier' : 'Add Supplier'}
              </button>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setEditing(null);
                  setForm({ name: '', brand_name: '', contact_info: '', opening_balance: '', opening_balance_type: 'debit' });
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Purchase Modal */}
      {showPurchase && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '0',
            borderRadius: '12px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e5e7eb'
          }}>
            {/* Header */}
            <div style={{
              padding: '24px 30px',
              background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
              borderBottom: '1px solid #374151'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: '700',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '24px' }}>📦</span>
                Create Purchase Order
              </h3>
              <p style={{
                margin: '5px 0 0 0',
                fontSize: '14px',
                color: '#d1d5db'
              }}>
                Record a new purchase from supplier
              </p>
            </div>

            {/* Form Content */}
            <div style={{
              padding: '30px',
              maxHeight: 'calc(90vh - 200px)',
              overflowY: 'auto'
            }}>
              {purchaseError && (
                <div className="alert alert-error mb-4">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {purchaseError}
                </div>
              )}

              {purchaseMessage && (
                <div className="alert alert-success mb-4">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {purchaseMessage}
                </div>
              )}

              <form onSubmit={handlePurchaseSubmit} className="space-y-6">
                <div className="form-group">
                  <label className="form-label">Supplier *</label>
                  {showPurchase === 'history' ? (
                    <input
                      type="text"
                      value={historySupplier.name}
                      disabled
                      className="form-input bg-gray-100"
                    />
                  ) : (
                    <select
                      name="supplier_id"
                      value={purchaseForm.supplier_id}
                      onChange={handlePurchaseFormChange}
                      required
                      className="form-input"
                    >
                      <option value="">Select supplier</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Purchase Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      name="description"
                      value={purchaseForm.description}
                      onChange={handlePurchaseFormChange}
                      placeholder="Enter purchase description/notes"
                      className="form-input"
                      rows="3"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="form-group">
                      <label className="form-label">Supplier Invoice ID</label>
                      <input
                        name="supplier_invoice_id"
                        type="text"
                        value={purchaseForm.supplier_invoice_id}
                        onChange={handlePurchaseFormChange}
                        placeholder="Enter supplier's invoice number"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Purchase Date</label>
                      <input
                        name="purchase_date"
                        type="date"
                        value={purchaseForm.purchase_date}
                        onChange={handlePurchaseFormChange}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Delivery Method</label>
                      <input
                        name="delivery_method"
                        type="text"
                        value={purchaseForm.delivery_method}
                        onChange={handlePurchaseFormChange}
                        placeholder="Enter delivery method (e.g., Pickup, Delivery, Courier, etc.)"
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title">�� Purchase Amount</h4>
                    <p className="text-sm text-gray-600">Enter the total purchase amount</p>
                  </div>
                  <div className="card-body">
                    <div className="form-group">
                      <label className="form-label">Total Amount *</label>
                      <input
                        name="total_cost"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Enter total purchase amount"
                        value={purchaseForm.total_cost}
                        onChange={handlePurchaseFormChange}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Submit button inside form */}
                <div className="flex gap-3 justify-end mt-6">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!purchaseForm.supplier_id || !purchaseForm.total_cost}
                  >
                    Create Purchase
                  </button>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => {
                  console.log('Closing purchase modal');
                  setShowPurchase(false);
                  setPurchaseForm({
                    supplier_id: '',
                    total_cost: '',
                    description: '',
                    supplier_invoice_id: '',
                    delivery_method: '',
                    purchase_date: new Date().toISOString().split('T')[0]
                  });
                  setPurchaseError('');
                  setPurchaseMessage('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {(showPayment === true || showPayment === 'history') && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Record Payment</h3>
            </div>
            <div className="modal-body">
              {paymentError && (
                <div className="alert alert-error mb-4">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {paymentError}
                </div>
              )}

              {paymentMessage && (
                <div className="alert alert-success mb-4">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {paymentMessage}
                </div>
              )}

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Supplier *</label>
                  {showPayment === 'history' ? (
                    <input
                      type="text"
                      value={historySupplier.name}
                      disabled
                      className="form-input bg-gray-100"
                    />
                  ) : (
                    <select
                      name="supplier_id"
                      value={paymentForm.supplier_id}
                      onChange={handlePaymentChange}
                      required
                      className="form-input"
                    >
                      <option value="">Select supplier</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name} - Balance: ${s.balance}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Amount *</label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={paymentForm.amount}
                    onChange={handlePaymentChange}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <input
                    name="description"
                    type="text"
                    placeholder="Payment description..."
                    value={paymentForm.description}
                    onChange={handlePaymentChange}
                    className="form-input"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Payment Date</label>
                    <input
                      name="payment_date"
                      type="date"
                      value={paymentForm.payment_date}
                      onChange={handlePaymentChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <input
                      name="payment_method"
                      type="text"
                      value={paymentForm.payment_method}
                      onChange={handlePaymentChange}
                      placeholder="Enter payment method (e.g., Cash, Bank Transfer, Check, etc.)"
                      className="form-input"
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handlePaymentSubmit(e);
                }}
                className="btn btn-primary"
              >
                Record Payment
              </button>
              <button
                onClick={() => {
                  setShowPayment(false);
                  if (showPayment === 'history') setShowHistory(true);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal - Supplier Ledger Statement */}
      {showHistory && historySupplier && (
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
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            width: '98vw',
            maxWidth: '98vw',
            height: '95vh',
            maxHeight: '95vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '16px',
              padding: '20px 24px 16px'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                Supplier Ledger - {historySupplier.name}
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={async () => {
                    try {
                      const supplier = historySupplier;
                      const entries = (supplierLedger && supplierLedger.length > 0)
                        ? supplierLedger.map(r => ({
                          date: r.type === 'opening' ? null : r.date,
                          tx: r.id || '',
                          doc: r.doc_type || (r.type === 'purchase' ? 'PUR' : r.type === 'payment' ? 'PAY' : 'OP'),
                          description: r.description || '',
                          debit: Number(r.debit || 0),
                          credit: Number(r.credit || 0)
                        }))
                        : [
                          ...historyPurchases.map(p => ({
                            date: p.date || p.created_at,
                            tx: p.id,
                            doc: 'PUR',
                            description: `Purchase of goods - ID: ${p.id}`,
                            debit: Number(p.total_cost || 0),
                            credit: 0
                          })),
                          ...historyPayments.map(p => ({
                            date: p.date || p.created_at,
                            tx: p.id,
                            doc: 'PAY',
                            description: p.description || 'Payment to supplier',
                            debit: 0,
                            credit: Number(p.amount || 0)
                          }))
                        ].sort((a, b) => new Date(a.date) - new Date(b.date));

                      // Opening balance (as per backend, positive = Dr we owe supplier, negative = Cr they owe us)
                      const opening = Number(supplier.opening_balance || 0);
                      let totalDr = opening > 0 ? Math.abs(opening) : 0;
                      let totalCr = opening < 0 ? Math.abs(opening) : 0;

                      // Build rows with running difference: diff = Dr - Cr
                      let rowsHtml = '';
                      if (opening !== 0) {
                        rowsHtml += `<tr>
                          <td></td>
                          <td>OPENING</td>
                          <td>OP</td>
                          <td>Opening Balance</td>
                          <td style=\"text-align:right;color:#dc2626;font-weight:600\">${opening > 0 ? 'PKR ' + Math.abs(opening).toLocaleString() : ''}</td>
                          <td style=\"text-align:right;color:#059669;font-weight:600\">${opening < 0 ? 'PKR ' + Math.abs(opening).toLocaleString() : ''}</td>
                          <td style=\"text-align:right;font-weight:700\">PKR ${Math.abs(totalDr - totalCr).toLocaleString()} ${(totalDr - totalCr) >= 0 ? 'Dr' : 'Cr'}</td>
                        </tr>`;
                      }

                      entries.forEach(e => {
                        totalDr += e.debit;
                        totalCr += e.credit;
                        const diff = totalDr - totalCr;
                        rowsHtml += `<tr>
                          <td>${e.date ? new Date(e.date).toLocaleDateString() : ''}</td>
                          <td>${e.tx || ''}</td>
                          <td>${e.doc || ''}</td>
                          <td>${e.description || ''}</td>
                          <td style=\"text-align:right;color:#dc2626;font-weight:600\">PKR ${(e.debit || 0).toLocaleString()}</td>
                          <td style=\"text-align:right;color:#059669;font-weight:600\">PKR ${(e.credit || 0).toLocaleString()}</td>
                          <td style=\"text-align:right;font-weight:700\">PKR ${Math.abs(diff).toLocaleString()} ${diff >= 0 ? 'Dr' : 'Cr'}</td>
                        </tr>`;
                      });

                      const closingDiff = totalDr - totalCr;

                      const win = window.open('', '_blank');
                      if (!win) return;
                      win.document.write(`
                        <html>
                          <head>
                            <title>Supplier Ledger - ${supplier.name}</title>
                            <style>
                              body { font-family: Arial, Helvetica, sans-serif; color: #111827; padding: 32px; }
                              .title { text-align: center; font-size: 20px; font-weight: 800; }
                              .meta { display:flex; justify-content: space-between; margin: 10px 0; font-size: 13px; }
                              table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                              th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; }
                              th { background: #f9fafb; text-align: center; }
                              .totals { display:flex; justify-content: space-between; margin-top: 12px; font-weight: 700; }
                            </style>
                          </head>
                          <body>
                            <div class=\"title\">SUPPLIER ACCOUNT LEDGER STATEMENT</div>
                            <div class=\"meta\"><div><strong>Supplier:</strong> ${supplier.name || ''}</div><div><strong>Brand:</strong> ${supplier.brand_name || 'N/A'}</div></div>
                            <div class=\"meta\"><div><strong>Generated:</strong> ${new Date().toLocaleString()}</div><div><strong>Closing:</strong> PKR ${Math.abs(closingDiff).toLocaleString()} ${closingDiff >= 0 ? 'Dr' : 'Cr'}</div></div>
                            <table>
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Trans#</th>
                                  <th>DOC</th>
                                  <th>Description</th>
                                  <th>Debit</th>
                                  <th>Credit</th>
                                  <th>Balance</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${rowsHtml}
                              </tbody>
                            </table>
                            <div class=\"totals\">
                              <div>Total Debit: PKR ${totalDr.toLocaleString()}</div>
                              <div>Total Credit: PKR ${totalCr.toLocaleString()}</div>
                              <div>Closing Balance: PKR ${Math.abs(closingDiff).toLocaleString()} ${closingDiff >= 0 ? 'Dr' : 'Cr'}</div>
                            </div>
                            <script>window.print()</script>
                          </body>
                        </html>
                      `);
                      win.document.close();
                    } catch (e) {
                      console.error('PDF generation failed', e);
                      alert('Failed to generate PDF');
                    }
                  }}
                  style={{
                    backgroundColor: '#059669',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '500'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#047857'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#059669'}
                >
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    setShowHistory(false);
                    setHistorySupplier(null);
                    setHistoryPurchases([]);
                    setHistoryPayments([]);
                  }}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            <div style={{ padding: '0 24px 24px' }}>
              {/* Account Ledger Header */}
              <div style={{
                marginBottom: '20px',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  margin: '0 0 8px 0',
                  color: '#1f2937'
                }}>
                  SUPPLIER ACCOUNT LEDGER STATEMENT
                </h3>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '14px',
                  color: '#4b5563'
                }}>
                  <div>
                    <strong>Supplier Name:</strong> {historySupplier.name ? historySupplier.name.toUpperCase() : ''}
                  </div>
                  <div>
                    <strong>ALL DATES</strong>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '14px',
                  color: '#4b5563',
                  marginTop: '8px'
                }}>
                  <div>
                    <strong>Brand:</strong> {historySupplier.brand_name ? historySupplier.brand_name : 'N/A'}
                  </div>
                  <div>
                    <strong>Closing Balance:</strong>
                    <span style={{
                      fontWeight: 'bold',
                      marginLeft: '4px',
                      color: parseFloat(historySupplier.balance || 0) >= 0 ? '#ef4444' : '#10b981'
                    }}>
                      PKR {Math.abs(parseFloat(historySupplier.balance || 0)).toFixed(2)} {parseFloat(historySupplier.balance || 0) >= 0 ? 'Dr' : 'Cr'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '20px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => {
                    setPurchaseForm({
                      supplier_id: historySupplier.id,
                      total_cost: '',
                      description: '',
                      supplier_invoice_id: '',
                      delivery_method: '',
                      purchase_date: new Date().toISOString().split('T')[0]
                    });
                    setShowPurchase('history');
                    setShowHistory(false);
                  }}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  New Purchase
                </button>
                <button
                  onClick={() => {
                    setPaymentForm({
                      supplier_id: historySupplier.id,
                      amount: '',
                      description: '',
                      payment_method: '',
                      payment_date: ''
                    });
                    setShowPayment('history');
                    setShowHistory(false);
                  }}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Make Payment
                </button>
              </div>

              {/* Ledger Table */}
              <div style={{ overflowX: 'auto', padding: '0 10px' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px',
                  marginBottom: '20px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1f2937' }}>
                      <th style={{
                        border: '1px solid #374151',
                        padding: '16px 12px',
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '15px',
                        color: '#ffffff',
                        width: '8%'
                      }}>Date</th>
                      <th style={{
                        border: '1px solid #374151',
                        padding: '16px 12px',
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '15px',
                        color: '#ffffff',
                        width: '6%'
                      }}>Trans#</th>
                      <th style={{
                        border: '1px solid #374151',
                        padding: '16px 12px',
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '15px',
                        color: '#ffffff',
                        width: '6%'
                      }}>DOC</th>
                      <th style={{
                        border: '1px solid #374151',
                        padding: '16px 12px',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '15px',
                        color: '#ffffff',
                        width: '20%'
                      }}>Description</th>
                      <th style={{
                        border: '1px solid #374151',
                        padding: '16px 12px',
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '15px',
                        color: '#ffffff',
                        width: '10%'
                      }}>Invoice/Ref#</th>
                      <th style={{
                        border: '1px solid #374151',
                        padding: '16px 12px',
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '15px',
                        color: '#ffffff',
                        width: '10%'
                      }}>Method</th>
                      <th style={{
                        border: '1px solid #374151',
                        padding: '16px 12px',
                        textAlign: 'right',
                        fontWeight: '600',
                        fontSize: '15px',
                        color: '#ffffff',
                        width: '10%'
                      }}>Debit</th>
                      <th style={{
                        border: '1px solid #374151',
                        padding: '16px 12px',
                        textAlign: 'right',
                        fontWeight: '600',
                        fontSize: '15px',
                        color: '#ffffff',
                        width: '10%'
                      }}>Credit</th>
                      <th style={{
                        border: '1px solid #374151',
                        padding: '16px 12px',
                        textAlign: 'right',
                        fontWeight: '600',
                        fontSize: '15px',
                        color: '#ffffff',
                        width: '10%'
                      }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Use the properly formatted ledger from backend if available
                      if (supplierLedger && supplierLedger.length > 0) {
                        return supplierLedger.map((record, index) => (
                          <tr
                            key={`${record.type}-${record.id}-${index}`}
                            style={{
                              borderBottom: '1px solid #e5e7eb',
                              cursor: record.type === 'purchase' || record.type === 'payment' ? 'pointer' : 'default',
                              backgroundColor: record.type === 'opening' ? '#f9fafb' : 'transparent',
                              transition: 'background-color 0.2s'
                            }}
                            onClick={(e) => {
                              if (record.type === 'opening') return;
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Clicked record:', record);
                              if (record.type === 'purchase') {
                                console.log('Opening purchase editor for:', record.id);
                                openPurchaseEditor(record.id);
                              } else if (record.type === 'payment') {
                                console.log('Opening payment editor for:', record.id);
                                openSupplierPaymentEditor(historySupplier.id, record.id, record.credit, record.description);
                              }
                            }}
                            onMouseEnter={(e) => {
                              if (record.type !== 'opening') {
                                e.currentTarget.style.backgroundColor = '#f3f4f6';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (record.type !== 'opening') {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                            title={record.type === 'purchase' ? 'Click to edit purchase' : record.type === 'payment' ? 'Click to edit payment' : ''}
                          >
                            <td style={{
                              border: '1px solid #e5e7eb',
                              padding: '12px 10px',
                              textAlign: 'center',
                              whiteSpace: 'nowrap',
                              fontSize: '14px',
                              color: '#374151'
                            }}>
                              {record.type === 'opening' ? '-' : new Date(record.date).toLocaleDateString()}
                            </td>
                            <td style={{
                              border: '1px solid #e5e7eb',
                              padding: '12px 10px',
                              textAlign: 'center',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#1f2937'
                            }}>
                              {record.id || index + 1}
                            </td>
                            <td style={{
                              border: '1px solid #e5e7eb',
                              padding: '12px 10px',
                              textAlign: 'center',
                              fontSize: '14px',
                              fontWeight: '700',
                              color: record.type === 'purchase' ? '#dc2626' : record.type === 'payment' ? '#059669' : '#6b7280'
                            }}>
                              {record.doc_type || (record.type === 'purchase' ? 'PUR' : record.type === 'payment' ? 'PAY' : 'OP')}
                            </td>
                            <td style={{
                              border: '1px solid #e5e7eb',
                              padding: '12px 10px',
                              fontSize: '14px',
                              color: '#4b5563',
                              lineHeight: '1.6'
                            }}>
                              {record.description}
                            </td>
                            <td style={{
                              border: '1px solid #e5e7eb',
                              padding: '12px 10px',
                              textAlign: 'center',
                              fontSize: '14px',
                              color: '#6b7280'
                            }}>
                              {record.type === 'purchase' ? (record.supplier_invoice_id || '-') :
                                record.type === 'payment' ? (record.reference_number || '-') : '-'}
                            </td>
                            <td style={{
                              border: '1px solid #e5e7eb',
                              padding: '12px 10px',
                              textAlign: 'center',
                              fontSize: '14px',
                              color: '#6b7280'
                            }}>
                              {record.type === 'purchase' ? (record.delivery_method || '-') :
                                record.type === 'payment' ? (record.payment_method || '-') : '-'}
                            </td>
                            <td style={{
                              border: '1px solid #e5e7eb',
                              padding: '12px 10px',
                              textAlign: 'right',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#dc2626'
                            }}>
                              {record.debit > 0 ? parseFloat(record.debit || 0).toLocaleString() : '-'}
                            </td>
                            <td style={{
                              border: '1px solid #e5e7eb',
                              padding: '12px 10px',
                              textAlign: 'right',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#059669'
                            }}>
                              {record.credit > 0 ? parseFloat(record.credit || 0).toLocaleString() : '-'}
                            </td>
                            <td style={{
                              border: '1px solid #e5e7eb',
                              padding: '12px 10px',
                              textAlign: 'right',
                              fontSize: '14px',
                              fontWeight: '700',
                              color: parseFloat(record.running_balance || 0) >= 0 ? '#dc2626' : '#059669'
                            }}>
                              {Math.abs(parseFloat(record.running_balance || 0)).toLocaleString()} {parseFloat(record.running_balance || 0) >= 0 ? 'Dr' : 'Cr'}
                            </td>
                          </tr>
                        ));
                      }

                      // Fallback to old combined transaction method if ledger is not available
                      const allTransactions = [
                        ...historyPurchases.map(purchase => ({
                          ...purchase,
                          type: 'purchase',
                          amount: purchase.total_cost,
                          date: purchase.date || purchase.created_at,
                          description: `Purchase of goods - ID: ${purchase.id}`
                        })),
                        ...historyPayments.map(payment => ({
                          ...payment,
                          type: 'payment',
                          amount: payment.amount,
                          date: payment.date || payment.created_at,
                          description: payment.description || 'Payment to supplier'
                        }))
                      ].sort((a, b) => new Date(a.date) - new Date(b.date));

                      // Calculate running balance
                      let runningBalance = 0;
                      const transactionsWithBalance = allTransactions.map(transaction => {
                        if (transaction.type === 'purchase') {
                          runningBalance += parseFloat(transaction.amount || 0);
                        } else {
                          runningBalance -= parseFloat(transaction.amount || 0);
                        }
                        return { ...transaction, running_balance: runningBalance };
                      });

                      if (transactionsWithBalance.length === 0) {
                        return (
                          <tr>
                            <td colSpan="7" style={{
                              textAlign: 'center',
                              padding: '40px',
                              color: '#666',
                              border: '1px solid #e5e7eb'
                            }}>
                              No transaction history found for this supplier.
                            </td>
                          </tr>
                        );
                      }

                      return transactionsWithBalance.map((record, index) => (
                        <tr
                          key={index}
                          style={{
                            borderBottom: '1px solid #e5e7eb',
                            cursor: record.type === 'purchase' || record.type === 'payment' ? 'pointer' : 'default',
                            transition: 'background-color 0.2s'
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Clicked fallback record:', record);
                            if (record.type === 'purchase') {
                              console.log('Opening purchase editor for fallback:', record.id);
                              openPurchaseEditor(record.id);
                            } else if (record.type === 'payment') {
                              console.log('Opening payment editor for fallback:', record.id);
                              openSupplierPaymentEditor(historySupplier.id, record.id, record.amount, record.description);
                            }
                          }}
                          onMouseEnter={(e) => {
                            if (record.type === 'purchase' || record.type === 'payment') {
                              e.currentTarget.style.backgroundColor = '#f3f4f6';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title={record.type === 'purchase' ? 'Click to edit purchase' : record.type === 'payment' ? 'Click to edit payment' : ''}
                        >
                          <td style={{
                            border: '1px solid #e5e7eb',
                            padding: '8px',
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            fontSize: '12px'
                          }}>
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td style={{
                            border: '1px solid #e5e7eb',
                            padding: '8px',
                            textAlign: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {record.id || index + 1}
                          </td>
                          <td style={{
                            border: '1px solid #e5e7eb',
                            padding: '8px',
                            textAlign: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: record.type === 'purchase' ? '#dc2626' : '#059669'
                          }}>
                            {record.type === 'purchase' ? 'PUR' : 'PAY'}
                          </td>
                          <td style={{
                            border: '1px solid #e5e7eb',
                            padding: '8px',
                            fontSize: '12px'
                          }}>
                            {record.description}
                          </td>
                          <td style={{
                            border: '1px solid #e5e7eb',
                            padding: '8px',
                            textAlign: 'right',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#dc2626'
                          }}>
                            {record.type === 'purchase' ? parseFloat(record.amount || 0).toLocaleString() : '-'}
                          </td>
                          <td style={{
                            border: '1px solid #e5e7eb',
                            padding: '8px',
                            textAlign: 'right',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#059669'
                          }}>
                            {record.type === 'payment' ? parseFloat(record.amount || 0).toLocaleString() : '-'}
                          </td>
                          <td style={{
                            border: '1px solid #e5e7eb',
                            padding: '8px',
                            textAlign: 'right',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {parseFloat(record.running_balance || 0).toLocaleString()} {record.running_balance >= 0 ? 'Dr' : 'Cr'}
                          </td>
                        </tr>
                      ));
                    })()}

                    {/* Grand Total Row */}
                    <tr style={{ backgroundColor: '#f9fafb', fontWeight: 'bold', borderTop: '2px solid #374151' }}>
                      <td colSpan="6" style={{
                        border: '1px solid #d1d5db',
                        padding: '16px 12px',
                        textAlign: 'right',
                        fontSize: '15px',
                        fontWeight: '700',
                        color: '#1f2937'
                      }}>
                        GRAND TOTAL:
                      </td>
                      <td style={{
                        border: '1px solid #d1d5db',
                        padding: '16px 12px',
                        textAlign: 'right',
                        fontSize: '15px',
                        fontWeight: '700',
                        color: '#dc2626',
                        backgroundColor: '#fef2f2'
                      }}>
                        {supplierLedger && supplierLedger.length > 0
                          ? supplierLedger.filter(item => item.debit > 0).reduce((sum, item) => sum + parseFloat(item.debit || 0), 0).toLocaleString()
                          : historyPurchases.reduce((sum, purchase) => sum + parseFloat(purchase.total_cost || 0), 0).toLocaleString()
                        }
                      </td>
                      <td style={{
                        border: '1px solid #d1d5db',
                        padding: '16px 12px',
                        textAlign: 'right',
                        fontSize: '15px',
                        fontWeight: '700',
                        color: '#059669',
                        backgroundColor: '#f0fdf4'
                      }}>
                        {supplierLedger && supplierLedger.length > 0
                          ? supplierLedger.filter(item => item.credit > 0).reduce((sum, item) => sum + parseFloat(item.credit || 0), 0).toLocaleString()
                          : historyPayments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0).toLocaleString()
                        }
                      </td>
                      <td style={{
                        border: '1px solid #d1d5db',
                        padding: '16px 12px',
                        textAlign: 'right',
                        fontSize: '15px',
                        fontWeight: '700',
                        color: parseFloat(historySupplier.balance || 0) >= 0 ? '#dc2626' : '#059669',
                        backgroundColor: parseFloat(historySupplier.balance || 0) >= 0 ? '#fef2f2' : '#f0fdf4'
                      }}>
                        {Math.abs(parseFloat(historySupplier.balance || 0)).toLocaleString()} {parseFloat(historySupplier.balance || 0) >= 0 ? 'Dr' : 'Cr'}
                      </td>
                    </tr>

                    {/* Closing Balance Row */}
                    <tr style={{ backgroundColor: '#1f2937', fontWeight: 'bold' }}>
                      <td colSpan="9" style={{
                        border: '1px solid #374151',
                        padding: '16px 12px',
                        textAlign: 'center',
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#ffffff'
                      }}>
                        Closing Balance: {Math.abs(parseFloat(historySupplier.balance || 0)).toLocaleString()} {parseFloat(historySupplier.balance || 0) >= 0 ? 'Dr' : 'Cr'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Editor Modal */}
      {showPurchaseEditor && editingPurchase && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '0',
            borderRadius: '12px',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e5e7eb'
          }}>
            {/* Header */}
            <div style={{
              padding: '24px 30px',
              background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
              borderBottom: '1px solid #374151'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: '700',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '24px' }}>📝</span>
                Edit Purchase #{editingPurchase.id}
              </h3>
              <p style={{
                margin: '5px 0 0 0',
                fontSize: '14px',
                color: '#d1d5db'
              }}>
                Update purchase details and amount
              </p>
            </div>

            {/* Form Content */}
            <div style={{
              padding: '30px',
              maxHeight: 'calc(90vh - 200px)',
              overflowY: 'auto'
            }}>
              {/* Description */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#374151'
                }}>
                  📄 Description/Notes
                </label>
                <textarea
                  value={editingPurchase.description || ''}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, description: e.target.value })}
                  placeholder="Enter purchase description or notes (optional)"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Two Column Layout for Invoice and Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '22px' }}>
                {/* Supplier Invoice ID */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    🧾 Supplier Invoice ID
                  </label>
                  <input
                    type="text"
                    value={editingPurchase.supplier_invoice_id || ''}
                    onChange={(e) => setEditingPurchase({ ...editingPurchase, supplier_invoice_id: e.target.value })}
                    placeholder="Invoice #"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                {/* Purchase Date */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    📅 Purchase Date
                  </label>
                  <input
                    type="date"
                    value={editingPurchase.date ? new Date(editingPurchase.date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingPurchase({ ...editingPurchase, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
              </div>

              {/* Delivery Method */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#374151'
                }}>
                  🚚 Delivery Method
                </label>
                <input
                  type="text"
                  value={editingPurchase.delivery_method || ''}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, delivery_method: e.target.value })}
                  placeholder="e.g., Pickup, Delivery, Courier"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Total Amount - Highlighted */}
              <div style={{
                marginBottom: '0',
                padding: '20px',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '2px solid #86efac',
                borderRadius: '10px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontWeight: '700',
                  fontSize: '15px',
                  color: '#166534'
                }}>
                  💰 Total Purchase Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editingPurchase.total_cost || ''}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, total_cost: e.target.value })}
                  placeholder="0.00"
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #10b981',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#059669',
                    fontFamily: 'inherit',
                    backgroundColor: '#ffffff',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#059669';
                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#10b981';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <p style={{
                  margin: '8px 0 0 0',
                  fontSize: '12px',
                  color: '#059669',
                  fontWeight: '500'
                }}>
                  Enter the total cost including all items and charges
                </p>
              </div>
            </div>

            {/* Footer with Action Buttons */}
            <div style={{
              padding: '20px 30px',
              backgroundColor: '#f9fafb',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowPurchaseEditor(false);
                  setEditingPurchase(null);
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#ffffff';
                  e.target.style.borderColor = '#d1d5db';
                }}
              >
                ✕ Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!editingPurchase.total_cost || parseFloat(editingPurchase.total_cost) <= 0) {
                      alert('Please enter a valid total amount');
                      return;
                    }

                    await axios.put(
                      `http://127.0.0.1:5000/purchases/${editingPurchase.id}`,
                      {
                        total_cost: parseFloat(editingPurchase.total_cost),
                        description: editingPurchase.description || '',
                        supplier_invoice_id: editingPurchase.supplier_invoice_id || '',
                        purchase_date: editingPurchase.date,
                        delivery_method: editingPurchase.delivery_method || ''
                      },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );

                    alert('Purchase updated successfully');
                    setShowPurchaseEditor(false);
                    setEditingPurchase(null);

                    // Refresh the suppliers list to show updated balance
                    refreshSuppliers();
                  } catch (error) {
                    console.error('Error updating purchase:', error);
                    alert('Error updating purchase: ' + (error.response?.data?.message || error.message));
                  }
                }}
                disabled={!editingPurchase.total_cost || parseFloat(editingPurchase.total_cost) <= 0}
                style={{
                  padding: '12px 32px',
                  backgroundColor: (!editingPurchase.total_cost || parseFloat(editingPurchase.total_cost) <= 0) ? '#9ca3af' : '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (!editingPurchase.total_cost || parseFloat(editingPurchase.total_cost) <= 0) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  boxShadow: (!editingPurchase.total_cost || parseFloat(editingPurchase.total_cost) <= 0) ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (editingPurchase.total_cost && parseFloat(editingPurchase.total_cost) > 0) {
                    e.target.style.backgroundColor = '#047857';
                    e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (editingPurchase.total_cost && parseFloat(editingPurchase.total_cost) > 0) {
                    e.target.style.backgroundColor = '#059669';
                    e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                ✓ Save Changes
              </button>
            </div>
          </div>
        </div>
      )}      {/* Supplier Payment Editor Modal */}
      {showSupplierPaymentEditor && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '0',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e5e7eb'
          }}>
            {/* Header */}
            <div style={{
              padding: '24px 30px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              borderBottom: '1px solid #047857'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: '700',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '24px' }}>💳</span>
                Edit Payment
              </h3>
              <p style={{
                margin: '5px 0 0 0',
                fontSize: '14px',
                color: '#d1fae5'
              }}>
                Update payment details and amount
              </p>
            </div>

            {/* Form Content */}
            <div style={{
              padding: '30px',
              maxHeight: 'calc(90vh - 200px)',
              overflowY: 'auto'
            }}>
              {/* Payment Amount */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#374151'
                }}>
                  💰 Payment Amount (PKR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingSupplierPayment.amount}
                  onChange={(e) => setEditingSupplierPayment({ ...editingSupplierPayment, amount: e.target.value })}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #10b981',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#059669',
                    fontFamily: 'inherit',
                    backgroundColor: '#f0fdf4',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#059669';
                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                    e.target.style.backgroundColor = '#ffffff';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#10b981';
                    e.target.style.boxShadow = 'none';
                    e.target.style.backgroundColor = '#f0fdf4';
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#374151'
                }}>
                  📝 Description/Notes
                </label>
                <textarea
                  value={editingSupplierPayment.description}
                  onChange={(e) => setEditingSupplierPayment({ ...editingSupplierPayment, description: e.target.value })}
                  rows="4"
                  placeholder="Payment description or notes (optional)"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>

            {/* Footer with Action Buttons */}
            <div style={{
              padding: '20px 30px',
              backgroundColor: '#f9fafb',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowSupplierPaymentEditor(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#ffffff';
                  e.target.style.borderColor = '#d1d5db';
                }}
              >
                ✕ Cancel
              </button>
              <button
                onClick={saveSupplierPayment}
                style={{
                  padding: '12px 32px',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#047857';
                  e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#059669';
                  e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
              >
                ✓ Save Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Suppliers;

