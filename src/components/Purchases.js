
import axios from 'axios';
import { useEffect, useState } from 'react';

function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ supplier_id: '', items: [] });
  const [item, setItem] = useState({ product_id: '', quantity: '', cost_price: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalValue: 0,
    avgOrderValue: 0,
    topSupplier: ''
  });
  const token = localStorage.getItem('token');

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/purchases', { headers: { Authorization: `Bearer ${token}` } });
      setPurchases(res.data);
      calculateStats(res.data);
    } catch {
      setError('Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (purchaseData) => {
    const totalPurchases = purchaseData.length;
    const totalValue = purchaseData.reduce((sum, p) => sum + parseFloat(p.total_cost || 0), 0);
    const avgOrderValue = totalPurchases > 0 ? totalValue / totalPurchases : 0;

    // Find top supplier by purchase count
    const supplierCounts = {};
    purchaseData.forEach(p => {
      const supplier = suppliers.find(s => String(s.id) === String(p.supplier_id));
      if (supplier) {
        supplierCounts[supplier.name] = (supplierCounts[supplier.name] || 0) + 1;
      }
    });

    const topSupplier = Object.keys(supplierCounts).reduce((a, b) =>
      supplierCounts[a] > supplierCounts[b] ? a : b, '') || 'None';

    setStats({
      totalPurchases,
      totalValue,
      avgOrderValue,
      topSupplier
    });
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/suppliers', { headers: { Authorization: `Bearer ${token}` } });
      setSuppliers(res.data);
    } catch {
      setError('Failed to fetch suppliers');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/products', { headers: { Authorization: `Bearer ${token}` } });
      setProducts(res.data);
    } catch {
      setError('Failed to fetch products');
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (purchases.length > 0 && suppliers.length > 0) {
      calculateStats(purchases);
    }
  }, [purchases, suppliers]);

  const handleItemChange = e => {
    setItem({ ...item, [e.target.name]: e.target.value });
  };

  const addItem = () => {
    if (!item.product_id || !item.quantity || !item.cost_price) {
      setError('Please fill all item fields');
      return;
    }

    const selectedProduct = products.find(p => p.id === item.product_id);
    if (!selectedProduct) {
      setError('Please select a valid product');
      return;
    }

    console.log('Adding item:', item);
    console.log('Selected product:', selectedProduct);

    // Ensure proper data types - keep product_id as string to match products table
    const newItem = {
      product_id: item.product_id, // Keep as string
      quantity: Number(item.quantity),
      cost_price: Number(item.cost_price),
      product_name: selectedProduct.name
    };

    // Check if item already exists in the list
    const existingItemIndex = form.items.findIndex(i => i.product_id === newItem.product_id);
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...form.items];
      updatedItems[existingItemIndex].quantity = updatedItems[existingItemIndex].quantity + newItem.quantity;
      setForm({ ...form, items: updatedItems });
    } else {
      // Add new item
      setForm({ ...form, items: [...form.items, newItem] });
    }

    setItem({ product_id: '', quantity: '', cost_price: '' });
    setError('');
  };

  const removeItem = (index) => {
    const updatedItems = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: updatedItems });
  };

  const handleFormChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!form.supplier_id || form.items.length === 0) {
      setError('Please select a supplier and add at least one product');
      return;
    }

    // Prepare form data with proper types
    const purchaseData = {
      supplier_id: Number(form.supplier_id),
      items: form.items.map(item => ({
        product_id: item.product_id, // Keep as string to match products table
        quantity: Number(item.quantity),
        cost_price: Number(item.cost_price)
      }))
    };

    // Debug log the form data
    console.log('Submitting purchase form:', purchaseData);

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/purchases', purchaseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Purchase response:', response.data);
      setMessage('✅ Purchase order created successfully!');
      setForm({ supplier_id: '', items: [] });
      fetchPurchases();

      // Auto-dismiss message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Purchase creation error:', err);
      console.error('Error response:', err.response?.data);
      setError(`❌ Error creating purchase order: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const viewPurchaseDetails = (purchase) => {
    setSelectedPurchase(purchase);
    setShowPurchaseModal(true);
  };

  const getTotalOrderValue = () => {
    return form.items.reduce((total, item) => total + (parseFloat(item.quantity) * parseFloat(item.cost_price)), 0).toFixed(2);
  };

  return (
    <div className="page-container">
      {/* Professional Header with Analytics */}
      <div className="page-header" style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '0 0 24px 24px',
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
              📦 Purchase Management
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8, fontSize: '1.1rem' }}>Manage inventory purchases and supplier orders</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '1rem',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              textAlign: 'center',
              minWidth: '120px'
            }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Total Purchases</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stats.totalPurchases}</div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '1rem',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              textAlign: 'center',
              minWidth: '120px'
            }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Total Value</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>PKR {stats.totalValue.toLocaleString()}</div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '1rem',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              textAlign: 'center',
              minWidth: '120px'
            }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Avg Order Value</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>PKR {stats.avgOrderValue.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="main-content" style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>

        {/* Dashboard Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPurchases}</p>
                </div>
                <div className="bg-primary-100 p-3 rounded-lg">
                  <span className="text-primary-600 text-xl">📋</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">PKR {stats.totalValue.toFixed(2)}</p>
                </div>
                <div className="bg-success-100 p-3 rounded-lg">
                  <span className="text-success-600 text-xl">💰</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">PKR {stats.avgOrderValue.toFixed(2)}</p>
                </div>
                <div className="bg-warning-100 p-3 rounded-lg">
                  <span className="text-warning-600 text-xl">📊</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Top Supplier</p>
                  <p className="text-lg font-bold text-gray-900">{stats.topSupplier || 'None'}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <span className="text-purple-600 text-xl">🏪</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Order Form */}
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="card-title">Create New Purchase Order</h2>
            <p className="card-subtitle">Add products to create a new purchase order</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="card-body">
              {/* Supplier Selection */}
              <div className="mb-6">
                <label className="form-label">
                  <span className="text-lg">🏪</span> Supplier *
                </label>
                {suppliers.length > 0 ? (
                  <select
                    name="supplier_id"
                    value={form.supplier_id}
                    onChange={e => setForm({ ...form, supplier_id: String(e.target.value) })}
                    className="form-select"
                    required
                  >
                    <option value="" disabled>Select a supplier...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={String(s.id)}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="loading-spinner"></div>
                    <span>Loading suppliers...</span>
                  </div>
                )}
              </div>

              {/* Product Addition Section */}
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  <span className="text-lg">📦</span> Add Products to Order
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="form-label">Product</label>
                    <select
                      name="product_id"
                      value={item.product_id}
                      onChange={handleItemChange}
                      className="form-select"
                    >
                      <option value="">Select product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Quantity</label>
                    <input
                      name="quantity"
                      type="number"
                      placeholder="0"
                      value={item.quantity}
                      onChange={handleItemChange}
                      className="form-input"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="form-label">Cost Price (PKR)</label>
                    <input
                      name="cost_price"
                      type="number"
                      placeholder="0.00"
                      value={item.cost_price}
                      onChange={handleItemChange}
                      className="form-input"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addItem}
                      className="btn btn-primary w-full"
                    >
                      <span>➕</span> Add Item
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Items List */}
              {form.items.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    <span className="text-lg">📋</span> Order Items ({form.items.length})
                  </h3>

                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Cost Price</th>
                          <th>Total</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((orderItem, idx) => {
                          const product = products.find(p => p.id === Number(orderItem.product_id));
                          const itemTotal = (parseFloat(orderItem.quantity) * parseFloat(orderItem.cost_price)).toFixed(2);

                          return (
                            <tr key={idx}>
                              <td className="font-medium">{product ? product.name : orderItem.product_id}</td>
                              <td>{orderItem.quantity}</td>
                              <td>PKR {parseFloat(orderItem.cost_price).toFixed(2)}</td>
                              <td className="font-semibold text-success-600">PKR {itemTotal}</td>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => removeItem(idx)}
                                  className="btn btn-sm btn-danger"
                                  title="Remove item"
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50">
                          <td colSpan="3" className="font-bold text-right">Total Order Value:</td>
                          <td className="font-bold text-success-600 text-lg">PKR {getTotalOrderValue()}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Alert Messages */}
              {error && (
                <div className="alert alert-error mb-4">
                  <span>{error}</span>
                </div>
              )}

              {message && (
                <div className="alert alert-success mb-4">
                  <span>{message}</span>
                </div>
              )}
            </div>

            <div className="card-footer">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading || !form.supplier_id || form.items.length === 0}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <span>📦</span> Create Purchase Order
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Purchase History */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Purchase History</h2>
            <p className="card-subtitle">View all previous purchase orders</p>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="loading-spinner"></div>
                <span className="ml-2 text-gray-600">Loading purchases...</span>
              </div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Purchases Yet</h3>
                <p className="text-gray-500">Create your first purchase order to get started</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Supplier</th>
                      <th>Date</th>
                      <th>Total Cost</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map(purchase => {
                      const supplier = suppliers.find(s => String(s.id) === String(purchase.supplier_id));
                      const date = new Date(purchase.date).toLocaleDateString();

                      return (
                        <tr key={purchase.id}>
                          <td className="font-mono">#{purchase.id}</td>
                          <td className="font-medium">{supplier ? supplier.name : `Supplier ${purchase.supplier_id}`}</td>
                          <td>{date}</td>
                          <td className="font-semibold text-success-600">PKR {parseFloat(purchase.total_cost).toFixed(2)}</td>
                          <td>
                            <span className="px-2 py-1 bg-success-100 text-success-800 rounded-full text-xs font-medium">
                              ✅ Completed
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => viewPurchaseDetails(purchase)}
                              className="btn btn-sm btn-secondary"
                              title="View details"
                            >
                              👁️ View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Purchase Details Modal */}
        {showPurchaseModal && selectedPurchase && (
          <div className="modal-overlay" onClick={() => setShowPurchaseModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Purchase Order Details</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowPurchaseModal(false)}
                  title="Close"
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Order Number</p>
                    <p className="font-mono text-lg">#{selectedPurchase.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Date</p>
                    <p className="text-lg">{new Date(selectedPurchase.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Supplier</p>
                    <p className="text-lg">
                      {suppliers.find(s => String(s.id) === String(selectedPurchase.supplier_id))?.name || 'Unknown Supplier'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Cost</p>
                    <p className="text-xl font-bold text-success-600">PKR {parseFloat(selectedPurchase.total_cost).toFixed(2)}</p>
                  </div>
                </div>

                {/* Purchase items would be displayed here if available */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    💡 <strong>Note:</strong> Detailed item breakdown would require additional database schema to store purchase line items.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} export default Purchases;
