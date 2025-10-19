import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { useSaleEdit } from '../hooks/useSaleEdit';
import { getRole } from '../utils/auth';
import wsClient from '../utils/wsClient';
import SaleEditModal from './SaleEditModal';
import UnifiedInvoiceView from './UnifiedInvoiceView';

// Professional utilities
const formatCurrency = (amount) => {
  const validAmount = parseFloat(amount) || 0;
  if (isNaN(validAmount)) return 'PKR 0.00';

  // Use explicit PKR formatting to ensure "PKR" is displayed instead of "Rs"
  return `PKR ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(validAmount)}`;
};

function Sales() {
  const today = new Date().toISOString().slice(0, 10);
  const [sales, setSales] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showUnifiedInvoice, setShowUnifiedInvoice] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [products, setProducts] = useState([]);

  // Ref for UnifiedInvoiceView component
  const unifiedInvoiceRef = useRef();

  // Persistent date range states
  const [from, setFrom] = usePersistentState('sales_filter_from', today);
  const [to, setTo] = usePersistentState('sales_filter_to', today);

  // Enhanced filtering states with persistence
  const [filterCustomerBrand, setFilterCustomerBrand] = usePersistentState('sales_filter_customer_brand', '');
  const [filterCustomerName, setFilterCustomerName] = usePersistentState('sales_filter_customer_name', '');
  const [filterProductName, setFilterProductName] = usePersistentState('sales_filter_product_name', '');
  const [filterStatus, setFilterStatus] = usePersistentState('sales_filter_status', '');

  // Advanced filtering states with persistence
  const [minAmount, setMinAmount] = usePersistentState('sales_filter_min_amount', '');
  const [maxAmount, setMaxAmount] = usePersistentState('sales_filter_max_amount', '');
  const [transactionType, setTransactionType] = usePersistentState('sales_filter_transaction_type', '');
  const [filterCashier, setFilterCashier] = usePersistentState('sales_filter_cashier', '');
  const [globalSearch, setGlobalSearch] = usePersistentState('sales_global_search', '');
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState('sales_show_advanced_filters', false);
  const [sortBy, setSortBy] = usePersistentState('sales_sort_by', 'date');
  const [sortOrder, setSortOrder] = usePersistentState('sales_sort_order', 'desc');

  // Pagination states
  const [currentPage, setCurrentPage] = usePersistentState('sales_current_page', 1);
  const [itemsPerPage, setItemsPerPage] = usePersistentState('sales_items_per_page', 25);

  // Edit modal states
  const [editMode, setEditMode] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [editedCustomer, setEditedCustomer] = useState(null);
  const [editedItems, setEditedItems] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');

  // Unified Edit Modal hook
  const { isEditModalOpen, editingSaleId, openEditModal, closeEditModal } = useSaleEdit();

  // Get user role
  const userRole = getRole() || 'owner';

  const handleSaveSuccess = () => {
    // Refresh sales data after successful edit
    fetchSales();
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingSale(null);
    setEditedCustomer(null);
    setEditedItems([]);
    setCustomerSearch('');
  };

  const handleSaveTransaction = async () => {
    // This would implement the save logic
    console.log('Save transaction not implemented with unified system');
  };

  const token = localStorage.getItem('token');

  const fetchSales = useCallback(async () => {
    setSalesLoading(true);
    try {
      let url = 'http://localhost:5000/sales';
      const params = [];
      if (from) params.push(`start_date=${from}`);
      if (to) params.push(`end_date=${to}`);
      if (filterProductName) params.push(`product_name=${encodeURIComponent(filterProductName)}`);
      if (filterStatus) params.push(`status=${encodeURIComponent(filterStatus)}`);
      if (params.length) url += '?' + params.join('&');

      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      // Sales API Response processed
      // Debug: Check if customer_brand_name exists in the data
      res.data.forEach((sale, index) => {
        if (sale.customer_brand_name) {
          // Processing customer brand name
        }
      });
      setSales(res.data);
    } catch {
      setError('Failed to fetch sales');
    } finally {
      setSalesLoading(false);
    }
  }, [from, to, filterProductName, filterStatus, token]);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/customers', { headers: { Authorization: `Bearer ${token}` } });
      // Customers API Response processed
      // Debug: Check if any customers have brand_name
      res.data.forEach((customer, index) => {
        if (customer.brand_name) {
          // Processing customer brand name
        }
      });
      setCustomers(res.data);
    } catch { }
  }, [token]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/products', { headers: { Authorization: `Bearer ${token}` } });
      setProducts(res.data);
    } catch { }
  }, [token]);

  // Edit transaction handler - now using the unified hook
  const handleEditTransaction = (sale) => {
    openEditModal(sale.id);
  };

  // Professional PDF Report Generation
  const generateSalesReport = async () => {
    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;
      const doc = new jsPDF();

      // Set default font
      doc.setFont('helvetica');
      let yPos = 20;

      // === HEADER SECTION ===
      doc.setFillColor(25, 25, 112);
      doc.rect(0, 0, 210, 30, 'F');

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('SALES REPORT', 105, 15, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('ZAFAR YAQOOB BEDDING STORE', 105, 22, { align: 'center' });

      doc.setTextColor(0, 0, 0);
      yPos = 40;

      // === REPORT INFO ===
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Generated: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`, 15, yPos);
      yPos += 5;
      doc.text(`Total Records: ${getFilteredSales.length}`, 15, yPos);
      yPos += 10;

      // === SUMMARY SECTION ===
      const totalRevenue = getFilteredSales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
      const totalDiscount = getFilteredSales.reduce((sum, sale) => {
        const saleDiscount = Number(sale.discount_amount || 0);
        const itemDiscounts = (sale.items || []).reduce((itemSum, item) =>
          itemSum + Number(item.item_discount_amount || 0), 0);
        return sum + saleDiscount + itemDiscounts;
      }, 0);

      doc.setFillColor(248, 250, 252);
      doc.rect(15, yPos, 180, 25, 'F');
      doc.rect(15, yPos, 180, 25);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SUMMARY', 20, yPos + 7);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Sales: ${getFilteredSales.length}`, 20, yPos + 14);
      doc.text(`Total Revenue: PKR ${totalRevenue.toFixed(2)}`, 20, yPos + 20);
      doc.text(`Total Discounts: PKR ${totalDiscount.toFixed(2)}`, 110, yPos + 14);
      doc.text(`Net Revenue: PKR ${(totalRevenue).toFixed(2)}`, 110, yPos + 20);

      yPos += 35;

      // === SALES TABLE HEADER ===
      doc.setFillColor(25, 25, 112);
      doc.rect(15, yPos, 180, 8, 'F');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('ID', 18, yPos + 5);
      doc.text('Date', 30, yPos + 5);
      doc.text('Customer', 60, yPos + 5);
      doc.text('Items', 100, yPos + 5);
      doc.text('Discount', 125, yPos + 5);
      doc.text('Total', 155, yPos + 5);
      doc.text('Status', 175, yPos + 5);

      doc.setTextColor(0, 0, 0);
      yPos += 8;

      // === SALES TABLE BODY ===
      const maxRows = 25; // Limit rows to fit on one page
      const displaySales = getFilteredSales.slice(0, maxRows);

      displaySales.forEach((sale, idx) => {
        if (yPos > 250) return; // Prevent overflow

        // Alternate row background
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, yPos, 180, 6, 'F');
        }

        const saleDate = new Date(sale.date).toLocaleDateString('en-GB');
        const customerName = customers.find(c => String(c.id) === String(sale.customer_id))?.name || 'Walk-in';
        const itemCount = sale.items ? sale.items.length : 0;
        const saleDiscount = Number(sale.discount_amount || 0);
        const itemDiscounts = (sale.items || []).reduce((sum, item) =>
          sum + Number(item.item_discount_amount || 0), 0);
        const totalDiscountAmount = saleDiscount + itemDiscounts;

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(`#${sale.id}`, 18, yPos + 4);
        doc.text(saleDate, 30, yPos + 4);
        doc.text(customerName.substring(0, 15), 60, yPos + 4);
        doc.text(itemCount.toString(), 100, yPos + 4);
        doc.text(`${totalDiscountAmount.toFixed(0)}`, 125, yPos + 4);
        doc.text(`${Number(sale.total_amount || 0).toFixed(0)}`, 155, yPos + 4);
        doc.text(sale.status || 'completed', 175, yPos + 4);

        yPos += 6;
      });

      // === FOOTER ===
      if (getFilteredSales.length > maxRows) {
        yPos += 5;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(`Note: Showing first ${maxRows} records of ${getFilteredSales.length} total records`, 15, yPos);
      } yPos = 280;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Generated by StoreFlow Inventory Management System', 105, yPos, { align: 'center' });

      // Save PDF
      const reportDate = new Date().toISOString().slice(0, 10);
      doc.save(`Sales_Report_${reportDate}.pdf`);

    } catch (error) {
      console.error('Error generating sales report:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchSales();
      await fetchCustomers();
      await fetchProducts();
    };

    loadData();

    // subscribe to app-level WS events so owner sees new sales in real-time
    const unsub = wsClient.subscribe((msg) => {
      try {
        if (msg && msg.event === 'sale_created') {
          // small debounce/guard: wait a tick to let backend finish any secondary writes
          setTimeout(() => fetchSales(), 200);
        }
      } catch (e) {
        // ignore malformed messages
      }
    });
    return () => unsub();
  }, [fetchSales, fetchCustomers, fetchProducts]);

  // Client-side filtering for enhanced features with memoization for performance
  const getFilteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Customer brand filter
      if (filterCustomerBrand && (!sale.customer_brand_name ||
        !sale.customer_brand_name.toLowerCase().includes(filterCustomerBrand.toLowerCase()))) {
        return false;
      }

      // Customer name filter
      if (filterCustomerName && (!sale.customer_name ||
        !sale.customer_name.toLowerCase().includes(filterCustomerName.toLowerCase()))) {
        return false;
      }

      // Amount range filters
      const saleAmount = parseFloat(sale.total_amount || 0);
      if (minAmount && saleAmount < parseFloat(minAmount)) {
        return false;
      }
      if (maxAmount && saleAmount > parseFloat(maxAmount)) {
        return false;
      }

      // Transaction type filter
      if (transactionType) {
        if (transactionType === 'retail' && sale.customer_id) return false;
        if (transactionType === 'wholesale' && !sale.customer_id) return false;
      }

      // Cashier filter
      if (filterCashier && (!sale.cashier_name ||
        !sale.cashier_name.toLowerCase().includes(filterCashier.toLowerCase()))) {
        return false;
      }

      // Global search filter
      if (globalSearch) {
        const searchTerm = globalSearch.toLowerCase();
        const searchableFields = [
          sale.customer_name || '',
          sale.customer_brand_name || '',
          sale.cashier_name || '',
          sale.id?.toString() || '',
          sale.total_amount?.toString() || '',
          sale.status || ''
        ].join(' ').toLowerCase();

        if (!searchableFields.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case 'amount':
          valueA = parseFloat(a.total_amount || 0);
          valueB = parseFloat(b.total_amount || 0);
          break;
        case 'customer':
          valueA = (a.customer_name || 'Walk-in Customer').toLowerCase();
          valueB = (b.customer_name || 'Walk-in Customer').toLowerCase();
          break;
        case 'status':
          valueA = (a.status || '').toLowerCase();
          valueB = (b.status || '').toLowerCase();
          break;
        case 'date':
        default:
          valueA = new Date(a.date || 0);
          valueB = new Date(b.date || 0);
          break;
      }

      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
  }, [sales, filterCustomerBrand, filterCustomerName, minAmount, maxAmount,
    transactionType, filterCashier, globalSearch, sortBy, sortOrder]);

  const clearFilters = () => {
    setFilterCustomerBrand('');
    setFilterCustomerName('');
    setFilterProductName('');
    setFilterStatus('');
    setMinAmount('');
    setMaxAmount('');
    setTransactionType('');
    setFilterCashier('');
    setGlobalSearch('');
    setSortBy('date');
    setSortOrder('desc');
  };

  // Calculate summary statistics for overall system (not filtered)
  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
  const totalItemsSold = sales.reduce((sum, sale) => {
    return sum + (sale.items ? sale.items.reduce((itemSum, item) => itemSum + parseInt(item.quantity || 0), 0) : 0);
  }, 0);
  const uniqueProducts = sales.reduce((productSet, sale) => {
    if (sale.items) {
      sale.items.forEach(item => {
        productSet.add(item.name);
      });
    }
    return productSet;
  }, new Set()).size;
  const totalDiscounts = sales.reduce((sum, sale) => {
    const saleDiscount = Number(sale.discount_amount || 0);
    const itemDiscounts = (sale.items || []).reduce((itemSum, item) =>
      itemSum + Number(item.item_discount_amount || 0), 0);
    return sum + saleDiscount + itemDiscounts;
  }, 0);
  const totalCustomers = new Set(sales.filter(sale => sale.customer_id).map(sale => sale.customer_id)).size;

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
              📊 Sales Management
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8, fontSize: '1.1rem' }}>Track, analyze, and manage your sales transactions</p>
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
              <div style={{ fontSize: '0.875rem', opacity: 0.8, color: '#374151' }}>Total Sales</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                {formatCurrency(getFilteredSales.reduce((sum, sale) => {
                  const amount = parseFloat(sale.total_amount) || 0;
                  return sum + (isNaN(amount) ? 0 : amount);
                }, 0))}
              </div>
            </div>
            <div style={{
              background: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              padding: '1rem',
              borderRadius: '12px',
              textAlign: 'center',
              minWidth: '120px'
            }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.8, color: '#374151' }}>Transactions</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{sales.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards in One Row */}
      <div style={{
        width: '100%',
        marginBottom: '24px',
        overflowX: 'auto'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: '20px 0',
          tableLayout: 'fixed'
        }}>
          <tbody>
            <tr>
              <td style={{
                width: '20%',
                minWidth: '180px',
                background: '#ffffff',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                textAlign: 'left',
                verticalAlign: 'top'
              }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Revenue</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
                  PKR {totalRevenue.toFixed(2)}
                </div>
              </td>

              <td style={{
                width: '20%',
                minWidth: '140px',
                background: '#ffffff',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                textAlign: 'left',
                verticalAlign: 'top'
              }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Items Sold</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
                  {totalItemsSold}
                </div>
              </td>

              <td style={{
                width: '20%',
                minWidth: '160px',
                background: '#ffffff',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                textAlign: 'left',
                verticalAlign: 'top'
              }}>
                <div style={{ fontSize: '14px', color: 'purple', marginBottom: '8px' }}>Unique Products</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
                  {uniqueProducts}
                </div>
              </td>

              <td style={{
                width: '20%',
                minWidth: '180px',
                background: '#ffffff',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                textAlign: 'left',
                verticalAlign: 'top'
              }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Discounts</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
                  PKR {totalDiscounts.toFixed(2)}
                </div>
              </td>

              <td style={{
                width: '20%',
                minWidth: '140px',
                background: '#ffffff',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                textAlign: 'left',
                verticalAlign: 'top'
              }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Customers</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
                  {totalCustomers}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}>
        <div className="card-header" style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: 'white',
          borderRadius: '16px 16px 0 0',
          padding: '1.5rem'
        }}>
          <h3 className="card-title" style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🔍 Transaction Filters
          </h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="btn"
              style={{
                background: showAdvancedFilters ? '#22c55e' : '#64748b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {showAdvancedFilters ? '📊 Hide Advanced' : '⚡ Show Advanced'}
            </button>
            <button
              onClick={clearFilters}
              className="btn"
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🗑️ Clear All
            </button>
          </div>
        </div>

        <div className="card-body" style={{ padding: '2rem' }}>
          {/* Enhanced Global Search */}
          <div className="mb-4" style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '2px solid #0ea5e9'
          }}>
            <div className="input-group" style={{ maxWidth: '100%' }}>
              <label className="input-label" style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#0c4a6e',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🔎 Quick Search
              </label>
              <input
                type="text"
                placeholder="🔍 Search transactions (ID, customer, amount, cashier, product...)"
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                className="input"
                style={{
                  background: 'white',
                  border: '2px solid #0ea5e9',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
              />
            </div>
          </div>

          {/* Enhanced Basic Filters */}
          <div className="filter-section" style={{
            background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '2px solid #eab308',
            marginBottom: '1rem'
          }}>
            <h4 className="filter-section-title" style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#92400e',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📅 Date & Status Filters
            </h4>
            <div className="filter-row" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div className="input-group">
                <label className="input-label" style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#92400e',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  📅 From Date
                </label>
                <input
                  type="date"
                  value={from}
                  onChange={e => setFrom(e.target.value)}
                  className="input"
                  style={{
                    border: '2px solid #eab308',
                    borderRadius: '8px',
                    padding: '10px',
                    background: 'white'
                  }}
                />
              </div>
              <div className="input-group">
                <label className="input-label" style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#92400e',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  📅 To Date
                </label>
                <input
                  type="date"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  className="input"
                  style={{
                    border: '2px solid #eab308',
                    borderRadius: '8px',
                    padding: '10px',
                    background: 'white'
                  }}
                />
              </div>
              <div className="input-group">
                <label className="input-label" style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#92400e',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  ✅ Status
                </label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="input"
                  style={{
                    border: '2px solid #eab308',
                    borderRadius: '8px',
                    padding: '10px',
                    background: 'white'
                  }}
                >
                  <option value="">All Status</option>
                  <option value="completed">✅ Completed</option>
                  <option value="pending">⏳ Pending</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label" style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#92400e',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  🏪 Transaction Type
                </label>
                <select
                  value={transactionType}
                  onChange={e => setTransactionType(e.target.value)}
                  className="input"
                  style={{
                    border: '2px solid #eab308',
                    borderRadius: '8px',
                    padding: '10px',
                    background: 'white'
                  }}
                >
                  <option value="">All Types</option>
                  <option value="retail">🛍️ Retail Sales</option>
                  <option value="wholesale">📦 Wholesale Sales</option>
                </select>
              </div>
            </div>
          </div>

          {/* Enhanced Advanced Filters */}
          {showAdvancedFilters && (
            <div className="filter-section" style={{
              marginTop: '1.5rem',
              padding: '2rem',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '16px',
              border: '2px solid #0ea5e9',
              boxShadow: '0 8px 25px rgba(14, 165, 233, 0.15)'
            }}>
              <h4 className="filter-section-title" style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#0c4a6e',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textAlign: 'center'
              }}>
                ⚡ Advanced Filters & Analytics
              </h4>

              {/* Amount Range Section */}
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                border: '1px solid #0ea5e9'
              }}>
                <h5 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#0c4a6e',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  💰 Amount Range
                </h5>
                <div className="filter-row" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}>
                  <div className="input-group">
                    <label className="input-label" style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#0c4a6e',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      ⬇️ Min Amount (PKR)
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={minAmount}
                      onChange={e => setMinAmount(e.target.value)}
                      className="input"
                      min="0"
                      step="0.01"
                      style={{
                        border: '2px solid #0ea5e9',
                        borderRadius: '8px',
                        padding: '10px',
                        background: 'white'
                      }}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#0c4a6e',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      ⬆️ Max Amount (PKR)
                    </label>
                    <input
                      type="number"
                      placeholder="No limit"
                      value={maxAmount}
                      onChange={e => setMaxAmount(e.target.value)}
                      className="input"
                      min="0"
                      step="0.01"
                      style={{
                        border: '2px solid #0ea5e9',
                        borderRadius: '8px',
                        padding: '10px',
                        background: 'white'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Staff and Product Filters */}
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                border: '1px solid #0ea5e9'
              }}>
                <h5 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#0c4a6e',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  👥 Staff & Product Filters
                </h5>
                <div className="filter-row" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  <div className="input-group">
                    <label className="input-label" style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#0c4a6e',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      👤 Cashier
                    </label>
                    <input
                      type="text"
                      placeholder="Filter by cashier name..."
                      value={filterCashier}
                      onChange={e => setFilterCashier(e.target.value)}
                      className="input"
                      style={{
                        border: '2px solid #0ea5e9',
                        borderRadius: '8px',
                        padding: '10px',
                        background: 'white'
                      }}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#0c4a6e',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      📦 Product Name
                    </label>
                    <input
                      type="text"
                      placeholder="Filter by product name..."
                      value={filterProductName}
                      onChange={e => setFilterProductName(e.target.value)}
                      className="input"
                      style={{
                        border: '2px solid #0ea5e9',
                        borderRadius: '8px',
                        padding: '10px',
                        background: 'white'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Customer Filters */}
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                border: '1px solid #0ea5e9'
              }}>
                <h5 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#0c4a6e',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  👥 Customer Filters
                </h5>
                <div className="filter-row" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  <div className="input-group">
                    <label className="input-label" style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#0c4a6e',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      🏢 Customer Brand
                    </label>
                    <input
                      type="text"
                      placeholder="Filter by customer brand..."
                      value={filterCustomerBrand}
                      onChange={e => setFilterCustomerBrand(e.target.value)}
                      className="input"
                      style={{
                        border: '2px solid #0ea5e9',
                        borderRadius: '8px',
                        padding: '10px',
                        background: 'white'
                      }}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#0c4a6e',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      👤 Customer Name
                    </label>
                    <input
                      type="text"
                      placeholder="Filter by customer name..."
                      value={filterCustomerName}
                      onChange={e => setFilterCustomerName(e.target.value)}
                      className="input"
                      style={{
                        border: '2px solid #0ea5e9',
                        borderRadius: '8px',
                        padding: '10px',
                        background: 'white'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Sorting Options */}
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #0ea5e9'
              }}>
                <h5 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#0c4a6e',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🔄 Sorting Options
                </h5>
                <div className="filter-row" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}>
                  <div className="input-group">
                    <label className="input-label" style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#0c4a6e',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      📈 Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      className="input"
                      style={{
                        border: '2px solid #0ea5e9',
                        borderRadius: '8px',
                        padding: '10px',
                        background: 'white'
                      }}
                    >
                      <option value="date">📅 Date</option>
                      <option value="amount">💰 Amount</option>
                      <option value="customer">👥 Customer</option>
                      <option value="status">✅ Status</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#0c4a6e',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      🔄 Sort Order
                    </label>
                    <select
                      value={sortOrder}
                      onChange={e => setSortOrder(e.target.value)}
                      className="input"
                      style={{
                        border: '2px solid #0ea5e9',
                        borderRadius: '8px',
                        padding: '10px',
                        background: 'white'
                      }}
                    >
                      <option value="desc">⬇️ Newest First</option>
                      <option value="asc">⬆️ Oldest First</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Action Buttons */}
          <div className="filter-actions" style={{
            marginTop: '2rem',
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={fetchSales}
              className="btn"
              disabled={salesLoading}
              style={{
                background: salesLoading ? '#94a3b8' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: salesLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)',
                minWidth: '140px'
              }}
            >
              {salesLoading ? '⏳ Loading...' : '🔍 Apply Filters'}
            </button>
            <button
              onClick={clearFilters}
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)',
                minWidth: '140px'
              }}
            >
              🗑️ Clear All
            </button>
            <button
              onClick={generateSalesReport}
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 6px rgba(139, 92, 246, 0.3)',
                minWidth: '140px'
              }}
            >
              � Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Active Filters Summary */}
      {(globalSearch || filterCustomerBrand || filterCustomerName || filterProductName ||
        filterStatus || transactionType || minAmount || maxAmount || filterCashier ||
        sortBy !== 'date' || sortOrder !== 'desc') && (
          <div className="card" style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '2px solid #f59e0b',
            borderRadius: '16px',
            marginTop: '1.5rem',
            boxShadow: '0 4px 6px rgba(245, 158, 11, 0.2)'
          }}>
            <div className="card-body" style={{ padding: '1.5rem' }}>
              <h4 style={{
                color: '#92400e',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1.125rem',
                fontWeight: '600'
              }}>
                🔍 Active Filters
              </h4>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                {globalSearch && (
                  <span style={{
                    background: '#0ea5e9',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    🔍 Search: "{globalSearch}"
                  </span>
                )}
                {filterCustomerBrand && (
                  <span style={{
                    background: '#f97316',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    🏢 Brand: {filterCustomerBrand}
                  </span>
                )}
                {filterCustomerName && (
                  <span style={{
                    background: '#84cc16',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    👥 Customer: {filterCustomerName}
                  </span>
                )}
                {filterProductName && (
                  <span style={{
                    background: '#ec4899',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    📦 Product: {filterProductName}
                  </span>
                )}
                {filterStatus && (
                  <span style={{
                    background: '#10b981',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    ✅ Status: {filterStatus === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                )}
                {transactionType && (
                  <span style={{
                    background: '#8b5cf6',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    🏪 Type: {transactionType === 'retail' ? 'Retail' : 'Wholesale'}
                  </span>
                )}
                {minAmount && (
                  <span style={{
                    background: '#f59e0b',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    💰 Min: PKR {parseFloat(minAmount || 0).toFixed(2)}
                  </span>
                )}
                {maxAmount && (
                  <span style={{
                    background: '#f59e0b',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    💰 Max: PKR {parseFloat(maxAmount || 0).toFixed(2)}
                  </span>
                )}
                {filterCashier && (
                  <span style={{
                    background: '#06b6d4',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    👤 Cashier: {filterCashier}
                  </span>
                )}
                {(sortBy !== 'date' || sortOrder !== 'desc') && (
                  <span style={{
                    background: '#6366f1',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    🔄 Sort: {sortBy} ({sortOrder === 'desc' ? 'Newest First' : 'Oldest First'})
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <span className="icon"></span>
            Sales Records ({getFilteredSales.length} of {sales.length})
          </h3>
        </div>

        {/* Overall Business Analytics - Always show ALL sales data */}
        {sales.length > 0 && (
          <div className="card-body" style={{ padding: '1rem', background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="stat-card">
                <div className="stat-value">PKR {sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0).toFixed(2)}</div>
                <div className="stat-label">Total Revenue</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{sales.length}</div>
                <div className="stat-label">Total Transactions</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">PKR {sales.length > 0 ? (sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0) / sales.length).toFixed(2) : '0.00'}</div>
                <div className="stat-label">Average Sale</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{sales.filter(sale => sale.customer_type === 'wholesale' || sale.customer_type === 'longterm').length}</div>
                <div className="stat-label">Wholesale Sales</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{sales.filter(sale => sale.customer_type === 'retail' || !sale.customer_type).length}</div>
                <div className="stat-label">Retail Sales</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{sales.filter(sale => sale.status === 'pending').length}</div>
                <div className="stat-label">Pending</div>
              </div>
            </div>
          </div>
        )}

        {/* Filtered Results Analytics - Show only when filters are applied */}
        {(filterCustomerBrand || filterCustomerName || minAmount || maxAmount || transactionType || filterCashier || globalSearch) && getFilteredSales.length !== sales.length && (
          <div className="card-body" style={{ padding: '1rem', background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <h4 style={{ margin: 0, color: '#d97706', fontSize: '1rem', fontWeight: '600' }}>
                📊 Filtered Results ({getFilteredSales.length} of {sales.length} transactions)
              </h4>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div className="stat-card" style={{ background: 'rgba(255,255,255,0.8)' }}>
                <div className="stat-value" style={{ color: '#d97706' }}>PKR {getFilteredSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0).toFixed(2)}</div>
                <div className="stat-label">Filtered Revenue</div>
              </div>
              <div className="stat-card" style={{ background: 'rgba(255,255,255,0.8)' }}>
                <div className="stat-value" style={{ color: '#d97706' }}>PKR {getFilteredSales.length > 0 ? (getFilteredSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0) / getFilteredSales.length).toFixed(2) : '0.00'}</div>
                <div className="stat-label">Avg per Transaction</div>
              </div>
              <div className="stat-card" style={{ background: 'rgba(255,255,255,0.8)' }}>
                <div className="stat-value" style={{ color: '#d97706' }}>
                  {getFilteredSales.reduce((sum, sale) => {
                    if (sale.items) {
                      return sum + sale.items.reduce((itemSum, item) => itemSum + (parseFloat(item.item_discount_amount) || 0), 0);
                    }
                    return sum;
                  }, 0).toFixed(2)}
                </div>
                <div className="stat-label">Total Discounts</div>
              </div>
              <div className="stat-card" style={{ background: 'rgba(255,255,255,0.8)' }}>
                <div className="stat-value" style={{ color: '#d97706' }}>{getFilteredSales.filter(sale => sale.status === 'completed').length}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>
          </div>
        )}

        {salesLoading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 2rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid #e2e8f0',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '1.5rem'
            }}></div>
            <h3 style={{ color: '#374151', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Loading Sales Data</h3>
            <p style={{ color: '#6b7280', fontSize: '1rem' }}>Please wait while we fetch your sales records...</p>
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>
        ) : getFilteredSales.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>📊</div>
            <h3 style={{ color: '#374151', marginBottom: '1rem' }}>No Sales Found</h3>
            <p style={{ color: '#6b7280', fontSize: '1.1rem', marginBottom: '2rem' }}>Try adjusting your filters or date range to see sales data.</p>
            <button
              onClick={clearFilters}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)'
              }}
            >
              🔄 Clear All Filters
            </button>
          </div>
        ) : (
          <div className="table-container">
            {/* Pagination Controls - Top */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Showing {itemsPerPage === 'all' ? `all ${getFilteredSales.length}` : `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, getFilteredSales.length)} of ${getFilteredSales.length}`} sales
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

            <table className="table" style={{
              background: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: 'none'
            }}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white'
                }}>
                  <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem', letterSpacing: '0.05em' }}>📄 Bill No.</th>
                  <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem', letterSpacing: '0.05em', cursor: 'pointer' }}
                    onClick={() => {
                      if (sortBy === 'date') {
                        setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                      } else {
                        setSortBy('date');
                        setSortOrder('desc');
                      }
                    }}>
                    📅 Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem', letterSpacing: '0.05em' }}>👤 Customer</th>
                  <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem', letterSpacing: '0.05em' }}>🏢 Brand</th>
                  <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem', letterSpacing: '0.05em' }}>🏪 Type</th>
                  <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem', letterSpacing: '0.05em' }}>📦 Items</th>
                  <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem', letterSpacing: '0.05em', cursor: 'pointer' }}
                    onClick={() => {
                      if (sortBy === 'amount') {
                        setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                      } else {
                        setSortBy('amount');
                        setSortOrder('desc');
                      }
                    }}>
                    💰 Amount {sortBy === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem', letterSpacing: '0.05em' }}>⭐ Status</th>
                  <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem', letterSpacing: '0.05em' }}>👨‍💼 Cashier</th>
                  <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem', letterSpacing: '0.05em' }}>🏷️ Discount</th>
                  <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem', letterSpacing: '0.05em' }}>⚡ Actions</th>
                </tr>
              </thead>
              <tbody>
                {(itemsPerPage === 'all' ? getFilteredSales : getFilteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)).map(sale => {
                  // Format items with UOM and historical integrity indicators
                  const formatItems = (items) => {
                    if (!items || items.length === 0) return 'No items';
                    return items.map(item => {
                      const brandPart = item.brand ? ` (${item.brand})` : '';
                      const uomPart = item.uom ? ` ${item.uom}` : '';
                      let itemDisplay = `${item.name}${uomPart}${brandPart} x ${item.quantity}`;

                      // Add historical integrity indicators
                      const indicators = [];
                      if (item.product_deleted) {
                        indicators.push('🗑️ DELETED');
                      } else if (item.has_changes) {
                        const changes = [];
                        if (item.name_changed) changes.push('name');
                        if (item.brand_changed) changes.push('brand');
                        if (item.uom_changed) changes.push('uom');
                        indicators.push(`🔄 ${changes.join(', ')} changed`);
                      }

                      if (indicators.length > 0) {
                        itemDisplay += ` [${indicators.join(', ')}]`;
                      }

                      return itemDisplay;
                    }).join(', ');
                  };

                  // Calculate discount and total from sale.items if available
                  let itemDiscountTotal = 0;
                  let saleDiscountAmount = parseFloat(sale.discount_amount) || 0;
                  let total = parseFloat(sale.total_amount) || 0;

                  if (sale.items && sale.items.length > 0) {
                    // Calculate total of all item-level discounts
                    itemDiscountTotal = sale.items.reduce((sum, item) => {
                      const itemDiscount = parseFloat(item.item_discount_amount) || parseFloat(item.discount) || 0;
                      return sum + (isNaN(itemDiscount) ? 0 : itemDiscount);
                    }, 0);

                    // Calculate subtotal before any discounts
                    const subtotal = sale.items.reduce((sum, item) => {
                      const originalPrice = parseFloat(item.original_price) || parseFloat(item.price) || 0;
                      const quantity = parseFloat(item.quantity) || 0;
                      return sum + (originalPrice * quantity);
                    }, 0);

                    // Total discount is item discounts + sale discount
                    const totalDiscount = itemDiscountTotal + saleDiscountAmount;
                    total = subtotal - totalDiscount;
                  }

                  // Combined discount amount for display - ensure it's a valid number
                  const totalDiscountAmount = (isNaN(itemDiscountTotal) ? 0 : itemDiscountTotal) +
                    (isNaN(saleDiscountAmount) ? 0 : saleDiscountAmount);

                  return (
                    <tr
                      key={sale.id}
                      onClick={() => handleEditTransaction(sale)}
                      style={{ cursor: 'pointer' }}
                      className="transaction-row"
                      title="Click to edit transaction"
                    >
                      <td>
                        <span className="table-id">#{sale.id}</span>
                      </td>
                      <td>{new Date(sale.date).toLocaleDateString()}</td>
                      <td>
                        <span className={sale.customer_id ? "customer-name" : "walk-in-customer"}>
                          {sale.customer_name}
                        </span>
                      </td>
                      <td>
                        <span className="customer-brand">
                          {sale.customer_brand_name || '-'}
                        </span>
                      </td>
                      <td>
                        {sale.customer_id ? (
                          <span className="badge badge-success" style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            🏪 Wholesale
                          </span>
                        ) : (
                          <span className="badge badge-info" style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: 'white',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            🚶 Retail
                          </span>
                        )}
                      </td>
                      <td className="items-column">
                        <div className="items-display">
                          {formatItems(sale.items)}
                        </div>
                      </td>
                      <td>
                        <span className="amount-total">
                          {formatCurrency(total)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${sale.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                          {sale.status || 'completed'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-secondary">
                          {sale.cashier_name || `Cashier ${sale.cashier_id}`}
                        </span>
                      </td>
                      <td>
                        {totalDiscountAmount > 0
                          ? <span className="discount-amount">{formatCurrency(totalDiscountAmount)}</span>
                          : <span className="no-discount">No Discount</span>
                        }
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelected(sale); setShowUnifiedInvoice(true); }}
                            className="btn btn-primary btn-sm"
                          >
                            <span className="icon">🖨️</span>
                            Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls - Bottom */}
            {itemsPerPage !== 'all' && getFilteredSales.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', padding: '0.5rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Page {currentPage} of {Math.ceil(getFilteredSales.length / itemsPerPage)}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    disabled={currentPage === 1}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      background: currentPage === 1 ? '#e5e7eb' : '#6366f1',
                      color: currentPage === 1 ? '#9ca3af' : 'white',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontWeight: '500'
                    }}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    ← Previous
                  </button>
                  <button
                    disabled={currentPage * itemsPerPage >= getFilteredSales.length}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      background: currentPage * itemsPerPage >= getFilteredSales.length ? '#e5e7eb' : '#6366f1',
                      color: currentPage * itemsPerPage >= getFilteredSales.length ? '#9ca3af' : 'white',
                      cursor: currentPage * itemsPerPage >= getFilteredSales.length ? 'not-allowed' : 'pointer',
                      fontWeight: '500'
                    }}
                    onClick={() => setCurrentPage(p => (p * itemsPerPage < getFilteredSales.length ? p + 1 : p))}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Professional Data Insights */}
            {getFilteredSales.length > 0 && (
              <div style={{
                marginTop: '2rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  border: '2px solid #f59e0b',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  boxShadow: '0 4px 6px rgba(245, 158, 11, 0.3)'
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📈</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d97706' }}>
                    {getFilteredSales.length > 0 ? formatCurrency(
                      getFilteredSales.reduce((sum, sale) => {
                        const amount = parseFloat(sale.total_amount) || 0;
                        return sum + amount;
                      }, 0) / getFilteredSales.length
                    ) : formatCurrency(0)}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#92400e', fontWeight: '600' }}>Average Sale Value</div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                  border: '2px solid #22c55e',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  boxShadow: '0 4px 6px rgba(34, 197, 94, 0.3)'
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💎</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>
                    {getFilteredSales.length > 0 ? formatCurrency(
                      Math.max(...getFilteredSales.map(sale => parseFloat(sale.total_amount) || 0))
                    ) : formatCurrency(0)}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#15803d', fontWeight: '600' }}>Highest Sale</div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  border: '2px solid #3b82f6',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)'
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏷️</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>
                    {formatCurrency(getFilteredSales.reduce((sum, sale) => {
                      // Safe parsing of discount amounts - match backend calculation
                      const saleDiscount = parseFloat(sale.discount_amount) || 0;
                      const itemDiscounts = sale.items ? sale.items.reduce((itemSum, item) => {
                        // Only use item_discount_amount (not legacy discount field) to match backend
                        const itemDiscount = parseFloat(item.item_discount_amount) || 0;
                        return itemSum + itemDiscount;
                      }, 0) : 0;
                      const totalDiscount = saleDiscount + itemDiscounts;
                      return sum + (isNaN(totalDiscount) ? 0 : totalDiscount);
                    }, 0))}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#1d4ed8', fontWeight: '600' }}>Total Discounts</div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                  border: '2px solid #8b5cf6',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  boxShadow: '0 4px 6px rgba(139, 92, 246, 0.3)'
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#7c3aed' }}>
                    {getFilteredSales.filter(sale => sale.status === 'completed').length}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6d28d9', fontWeight: '600' }}>Completed Sales</div>
                </div>
              </div>
            )}

            {getFilteredSales.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                marginTop: '2rem'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.6 }}>📊</div>
                <h3 style={{
                  color: '#374151',
                  marginBottom: '1rem',
                  fontSize: '1.5rem',
                  fontWeight: '700'
                }}>No Sales Found</h3>
                <p style={{
                  color: '#6b7280',
                  fontSize: '1.1rem',
                  marginBottom: '2rem',
                  maxWidth: '400px',
                  margin: '0 auto 2rem auto'
                }}>
                  Try adjusting your filters or date range to see sales data.
                </p>
                <button
                  onClick={clearFilters}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 12px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.3)';
                  }}
                >
                  🔄 Clear All Filters
                </button>
              </div>
            )}

            {/* Product Performance Dictionary */}
            {getFilteredSales.length > 0 && (
              <div className="mt-6">
                <div className="card">
                  <div className="card-header">
                    <h4 className="card-title">
                      <span className="icon"></span>
                      Product Performance Dictionary
                    </h4>
                    <p className="text-sm text-gray-600 mt-2">
                      Comprehensive analysis of product sales across all filtered transactions
                    </p>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Product Statistics */}
                      <div>
                        <h5 className="font-bold text-gray-700 mb-4 flex items-center">
                          <span className="mr-2"></span>
                          Products Sold - Detailed Analysis
                        </h5>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {(() => {
                            const productStats = {};
                            getFilteredSales.forEach(sale => {
                              if (sale.items) {
                                sale.items.forEach(item => {
                                  const key = `${item.name} ${item.uom} ${item.brand ? `(${item.brand})` : ''}`;
                                  if (!productStats[key]) {
                                    productStats[key] = {
                                      name: item.name,
                                      uom: item.uom,
                                      brand: item.brand,
                                      totalQuantity: 0,
                                      totalRevenue: 0,
                                      transactionCount: 0,
                                      customers: new Set()
                                    };
                                  }
                                  productStats[key].totalQuantity += parseInt(item.quantity);
                                  productStats[key].totalRevenue += parseFloat(item.price) * parseInt(item.quantity);
                                  productStats[key].transactionCount += 1;
                                  if (sale.customer_brand_name) {
                                    productStats[key].customers.add(sale.customer_brand_name);
                                  }
                                });
                              }
                            });

                            return Object.entries(productStats)
                              .sort((a, b) => b[1].totalQuantity - a[1].totalQuantity)
                              .map(([key, stats]) => (
                                <div key={key} className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="font-bold text-blue-900 text-lg">{key}</div>
                                      <div className="grid grid-cols-2 gap-4 mt-3">
                                        <div className="text-sm">
                                          <div className="text-blue-700">
                                            <span className="font-semibold">Quantity Sold:</span> {stats.totalQuantity} units
                                          </div>
                                          <div className="text-blue-700">
                                            <span className="font-semibold">Revenue:</span> PKR {stats.totalRevenue.toFixed(2)}
                                          </div>
                                        </div>
                                        <div className="text-sm">
                                          <div className="text-blue-700">
                                            <span className="font-semibold">Transactions:</span> {stats.transactionCount}
                                          </div>
                                          <div className="text-blue-700">
                                            <span className="font-semibold">Customer Brands:</span> {stats.customers.size}
                                          </div>
                                        </div>
                                      </div>
                                      {stats.customers.size > 0 && (
                                        <div className="mt-2">
                                          <div className="text-xs text-blue-600 font-medium">Purchased by:</div>
                                          <div className="text-xs text-blue-500 mt-1">
                                            {Array.from(stats.customers).join(', ') || 'Retail customers'}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ));
                          })()}
                        </div>
                      </div>

                      {/* Customer Brand Performance */}
                      <div>
                        <h5 className="font-bold text-gray-700 mb-4 flex items-center">

                          Customer Brand Analysis
                        </h5>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {(() => {
                            const brandStats = {};
                            getFilteredSales.forEach(sale => {
                              const brand = sale.customer_brand_name || 'Retail Customers';
                              if (!brandStats[brand]) {
                                brandStats[brand] = {
                                  totalAmount: 0,
                                  uniqueProducts: new Set(),
                                  transactions: 0,
                                  productDetails: {}
                                };
                              }
                              brandStats[brand].totalAmount += parseFloat(sale.total_amount || 0);
                              brandStats[brand].transactions += 1;
                              if (sale.items) {
                                sale.items.forEach(item => {
                                  const productKey = `${item.name} ${item.uom} ${item.brand ? `(${item.brand})` : ''}`;
                                  brandStats[brand].uniqueProducts.add(productKey);
                                  if (!brandStats[brand].productDetails[productKey]) {
                                    brandStats[brand].productDetails[productKey] = 0;
                                  }
                                  brandStats[brand].productDetails[productKey] += parseInt(item.quantity);
                                });
                              }
                            });

                            return Object.entries(brandStats)
                              .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
                              .map(([brand, stats]) => (
                                <div key={brand} className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200 shadow-sm">
                                  <div className="font-bold text-green-900 text-lg">{brand}</div>
                                  <div className="grid grid-cols-2 gap-4 mt-3">
                                    <div className="text-sm">
                                      <div className="text-green-700">
                                        <span className="font-semibold">Total Revenue:</span> PKR {stats.totalAmount.toFixed(2)}
                                      </div>
                                      <div className="text-green-700">
                                        <span className="font-semibold">Transactions:</span> {stats.transactions}
                                      </div>
                                    </div>
                                    <div className="text-sm">
                                      <div className="text-green-700">
                                        <span className="font-semibold">Unique Products:</span> {stats.uniqueProducts.size}
                                      </div>
                                      <div className="text-green-700">
                                        <span className="font-semibold">Avg per Transaction:</span> PKR {(stats.totalAmount / stats.transactions).toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <div className="text-xs text-green-600 font-medium">Products purchased:</div>
                                    <div className="text-xs text-green-500 mt-1 max-h-20 overflow-y-auto">
                                      {Object.entries(stats.productDetails)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 5)
                                        .map(([product, qty]) => `${product} (${qty} units)`)
                                        .join(', ')}
                                      {stats.uniqueProducts.size > 5 && ` +${stats.uniqueProducts.size - 5} more...`}
                                    </div>
                                  </div>
                                </div>
                              ));
                          })()}
                        </div>
                      </div>

                      {/* Customer Performance Dictionary */}
                      <div>
                        <h5 className="font-bold text-gray-700 mb-4 flex items-center">
                          <span className="mr-2">ðŸ‘¤</span>
                          Customer Performance Dictionary
                        </h5>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {(() => {
                            const customerStats = {};
                            getFilteredSales.forEach(sale => {
                              const customerKey = sale.customer_name || 'Walk-in Customer';
                              if (!customerStats[customerKey]) {
                                customerStats[customerKey] = {
                                  name: sale.customer_name,
                                  brand: sale.customer_brand_name,
                                  totalAmount: 0,
                                  transactions: 0,
                                  uniqueProducts: new Set(),
                                  totalQuantity: 0,
                                  productDetails: {},
                                  lastPurchase: null
                                };
                              }
                              customerStats[customerKey].totalAmount += parseFloat(sale.total_amount || 0);
                              customerStats[customerKey].transactions += 1;
                              customerStats[customerKey].lastPurchase = sale.created_at;

                              if (sale.items) {
                                sale.items.forEach(item => {
                                  const productKey = `${item.name} ${item.uom}`;
                                  customerStats[customerKey].uniqueProducts.add(productKey);
                                  customerStats[customerKey].totalQuantity += parseInt(item.quantity);
                                  if (!customerStats[customerKey].productDetails[productKey]) {
                                    customerStats[customerKey].productDetails[productKey] = 0;
                                  }
                                  customerStats[customerKey].productDetails[productKey] += parseInt(item.quantity);
                                });
                              }
                            });

                            return Object.entries(customerStats)
                              .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
                              .map(([customerKey, stats]) => (
                                <div key={customerKey} className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 shadow-sm">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="font-bold text-purple-900 text-lg">{stats.name || 'Walk-in Customer'}</div>
                                      {stats.brand && (
                                        <div className="text-sm text-purple-600 font-medium">{stats.brand}</div>
                                      )}
                                      <div className="grid grid-cols-2 gap-4 mt-3">
                                        <div className="text-sm">
                                          <div className="text-purple-700">
                                            <span className="font-semibold">Total Spent:</span> PKR {stats.totalAmount.toFixed(2)}
                                          </div>
                                          <div className="text-purple-700">
                                            <span className="font-semibold">Transactions:</span> {stats.transactions}
                                          </div>
                                        </div>
                                        <div className="text-sm">
                                          <div className="text-purple-700">
                                            <span className="font-semibold">Products Bought:</span> {stats.uniqueProducts.size}
                                          </div>
                                          <div className="text-purple-700">
                                            <span className="font-semibold">Avg per Visit:</span> PKR {(stats.totalAmount / stats.transactions).toFixed(2)}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="mt-3">
                                        <div className="text-xs text-purple-600 font-medium">Top products purchased:</div>
                                        <div className="text-xs text-purple-500 mt-1 max-h-16 overflow-y-auto">
                                          {Object.entries(stats.productDetails)
                                            .sort((a, b) => b[1] - a[1])
                                            .slice(0, 3)
                                            .map(([product, qty]) => `${product} (${qty} units)`)
                                            .join(', ')}
                                          {stats.uniqueProducts.size > 3 && ` +${stats.uniqueProducts.size - 3} more...`}
                                        </div>
                                      </div>
                                      {stats.lastPurchase && (
                                        <div className="mt-2">
                                          <div className="text-xs text-purple-600">
                                            <span className="font-medium">Last Purchase:</span> {new Date(stats.lastPurchase).toLocaleDateString()}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ));
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Summary Statistics */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h5 className="font-bold text-gray-700 mb-4 flex items-center">

                        Overall Summary
                      </h5>

                      {/* Quick Stats in One Line */}
                      <div className="flex flex-wrap gap-6 justify-center items-center bg-gray-50 p-4 rounded-lg mb-6">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-purple-600">Total Unique Products:</span>
                          <span className="text-lg font-bold text-purple-900">
                            {(() => {
                              const uniqueProducts = new Set();
                              getFilteredSales.forEach(sale => {
                                if (sale.items) {
                                  sale.items.forEach(item => {
                                    uniqueProducts.add(`${item.name} ${item.uom} ${item.brand ? `(${item.brand})` : ''}`);
                                  });
                                }
                              });
                              return uniqueProducts.size;
                            })()}
                          </span>
                        </div>
                        <div className="w-px h-8 bg-gray-300"></div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-indigo-600">Total Customer Brands:</span>
                          <span className="text-lg font-bold text-indigo-900">
                            {(() => {
                              const uniqueBrands = new Set();
                              getFilteredSales.forEach(sale => {
                                if (sale.customer_brand_name) {
                                  uniqueBrands.add(sale.customer_brand_name);
                                }
                              });
                              return uniqueBrands.size;
                            })()}
                          </span>
                        </div>
                        <div className="w-px h-8 bg-gray-300"></div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-pink-600">Total Revenue:</span>
                          <span className="text-lg font-bold text-pink-900">
                            PKR {getFilteredSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="w-px h-8 bg-gray-300"></div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-cyan-600">Total Transactions:</span>
                          <span className="text-lg font-bold text-cyan-900">
                            {getFilteredSales.length}
                          </span>
                        </div>
                      </div>

                      {/* Detailed Product Sales Summary */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h6 className="font-bold text-blue-900 mb-3 flex items-center">

                          All Products Sold (Filtered Results)
                        </h6>
                        <div className="text-sm text-blue-800">
                          {(() => {
                            const productSummary = {};
                            let totalUnits = 0;

                            getFilteredSales.forEach(sale => {
                              if (sale.items) {
                                sale.items.forEach(item => {
                                  const key = `${item.name} ${item.uom}${item.brand ? ` (${item.brand})` : ''}`;
                                  if (!productSummary[key]) {
                                    productSummary[key] = 0;
                                  }
                                  const qty = parseInt(item.quantity || 0);
                                  productSummary[key] += qty;
                                  totalUnits += qty;
                                });
                              }
                            });

                            const sortedProducts = Object.entries(productSummary)
                              .sort((a, b) => b[1] - a[1])
                              .map(([product, units]) => `${product} (${units} units)`)
                              .join(', ');

                            return (
                              <div>
                                <div className="font-semibold mb-2">
                                  Total Units Sold: {totalUnits} | Products: {Object.keys(productSummary).length}
                                </div>
                                <div className="leading-relaxed">
                                  {sortedProducts || 'No products sold in selected filters'}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Shop Performance Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <h6 className="font-bold text-green-900 mb-2 flex items-center">

                            Revenue Analysis
                          </h6>
                          <div className="text-sm text-green-800 space-y-1">
                            <div>Total Revenue: PKR {getFilteredSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0).toFixed(2)}</div>
                            <div>Avg per Transaction: PKR {getFilteredSales.length > 0 ? (getFilteredSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0) / getFilteredSales.length).toFixed(2) : '0.00'}</div>
                            <div>Highest Sale: PKR {getFilteredSales.length > 0 ? Math.max(...getFilteredSales.map(s => parseFloat(s.total_amount || 0))).toFixed(2) : '0.00'}</div>
                            <div>Lowest Sale: PKR {getFilteredSales.length > 0 ? Math.min(...getFilteredSales.map(s => parseFloat(s.total_amount || 0))).toFixed(2) : '0.00'}</div>
                          </div>
                        </div>

                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                          <h6 className="font-bold text-orange-900 mb-2 flex items-center">

                            Inventory Movement
                          </h6>
                          <div className="text-sm text-orange-800 space-y-1">
                            <div>Avg Items per Sale: {getFilteredSales.length > 0 ? (getFilteredSales.reduce((sum, sale) => sum + (sale.items ? sale.items.reduce((itemSum, item) => itemSum + parseInt(item.quantity || 0), 0) : 0), 0) / getFilteredSales.length).toFixed(1) : '0'}</div>
                            <div>Most Sold Product: {(() => {
                              const productCounts = {};
                              getFilteredSales.forEach(sale => {
                                if (sale.items) {
                                  sale.items.forEach(item => {
                                    const key = `${item.name} ${item.uom}`;
                                    productCounts[key] = (productCounts[key] || 0) + parseInt(item.quantity || 0);
                                  });
                                }
                              });
                              const topProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0];
                              return topProduct ? `${topProduct[0]} (${topProduct[1]} units)` : 'None';
                            })()}</div>
                          </div>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <h6 className="font-bold text-purple-900 mb-2 flex items-center">

                            Customer Analysis
                          </h6>
                          <div className="text-sm text-purple-800 space-y-1">
                            <div>Wholesale Sales: {getFilteredSales.filter(s => s.customer_brand_name).length}</div>
                            <div>Retail Sales: {getFilteredSales.filter(s => !s.customer_brand_name).length}</div>
                            <div>Top Customer: {(() => {
                              const customerRevenue = {};
                              getFilteredSales.forEach(sale => {
                                const customer = sale.customer_brand_name || 'Retail';
                                customerRevenue[customer] = (customerRevenue[customer] || 0) + parseFloat(sale.total_amount || 0);
                              });
                              const topCustomer = Object.entries(customerRevenue).sort((a, b) => b[1] - a[1])[0];
                              return topCustomer ? `${topCustomer[0]} (PKR ${topCustomer[1].toFixed(2)})` : 'None';
                            })()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Unified Invoice Modal */}
      {
        selected && showUnifiedInvoice && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '95vw', width: '1200px', maxHeight: '95vh', overflow: 'auto' }}>
              <div className="modal-header">
                <h3>
                  📊 Unified Invoice - #{selected.id}
                </h3>
                <button
                  onClick={() => setShowUnifiedInvoice(false)}
                  className="btn btn-danger btn-sm"
                >
                  ✕
                </button>
              </div>
              <div className="modal-body" style={{ padding: '0' }}>
                <UnifiedInvoiceView
                  ref={unifiedInvoiceRef}
                  sale={selected}
                  customer={customers.find(c => c.id === selected.customer_id)}
                  products={products}
                  onClose={() => setShowUnifiedInvoice(false)}
                />
              </div>
            </div>
          </div>
        )
      }

      {/* Edit Transaction Modal */}
      {
        editMode && editingSale && (
          <div className="modal-overlay">
            <div className="modal modal-xl" style={{ maxWidth: '1400px', width: '95vw' }}>
              <div className="modal-header">
                <h3 className="modal-title">

                  Edit Transaction - #{editingSale.id}
                </h3>
                <button onClick={handleCancelEdit} className="modal-close">×</button>
              </div>

              <div className="modal-body" style={{ display: 'flex', gap: '20px', maxHeight: '70vh', overflow: 'hidden' }}>
                {/* Main Edit Area */}
                <div style={{ flex: 1, overflow: 'auto', paddingRight: '10px' }}>
                  {/* Customer Selection */}
                  <div className="card" style={{ marginBottom: '20px' }}>
                    <div className="card-header">
                      <h4 className="card-title">Customer Information</h4>
                    </div>
                    <div className="card-body">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ flex: 1 }}>
                          <strong>Selected Customer:</strong>
                          <div style={{
                            padding: '12px',
                            background: editedCustomer ? '#e8f5e8' : '#fff3cd',
                            border: `2px solid ${editedCustomer ? '#10b981' : '#ffc107'}`,
                            borderRadius: '8px',
                            marginTop: '5px'
                          }}>
                            {editedCustomer ? (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '20px' }}>🏪</span>
                                  <strong style={{ fontSize: '16px' }}>{editedCustomer.brand_name || editedCustomer.name}</strong>
                                </div>
                                <div style={{ fontSize: '0.9em', color: '#059669', fontWeight: '500' }}>
                                  📞 {editedCustomer.phone} | 📍 {editedCustomer.address}
                                </div>
                                <div style={{
                                  marginTop: '8px',
                                  padding: '6px 10px',
                                  background: '#dcfce7',
                                  borderRadius: '4px',
                                  fontSize: '0.85em',
                                  color: '#166534',
                                  fontWeight: '600'
                                }}>
                                  ✅ Wholesale/Long-term Customer (Type Cannot Be Changed)
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '20px' }}>🚶</span>
                                  <strong style={{ fontSize: '16px', color: '#856404' }}>Walk-in Customer (Retail Sale)</strong>
                                </div>
                                <div style={{
                                  marginTop: '8px',
                                  padding: '6px 10px',
                                  background: '#fff3cd',
                                  borderRadius: '4px',
                                  fontSize: '0.85em',
                                  color: '#856404',
                                  fontWeight: '600'
                                }}>
                                  ⚠️ Customer Type Cannot Be Changed After Creation
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        marginTop: '12px',
                        padding: '10px',
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        borderRadius: '6px',
                        fontSize: '0.9em',
                        color: '#0c4a6e'
                      }}>
                        <strong>ℹ️ Note:</strong> Customer type (Retail vs Wholesale) is locked and cannot be modified when editing a transaction. This ensures data integrity and prevents pricing conflicts.
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="card">
                    <div className="card-header">
                      <h4 className="card-title">Transaction Items</h4>
                    </div>
                    <div className="card-body">
                      <div className="table-container">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>UOM</th>
                              <th>Quantity</th>
                              <th>Price</th>
                              <th>Total</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {editedItems.map((item, index) => (
                              <tr key={index}>
                                <td>{item.name}</td>
                                <td>{item.uom || 'pcs'}</td>
                                <td>
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const newItems = [...editedItems];
                                      newItems[index].quantity = parseFloat(e.target.value) || 0;
                                      setEditedItems(newItems);
                                    }}
                                    className="input"
                                    style={{ width: '80px' }}
                                    min="0"
                                    step="0.01"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    value={item.price}
                                    onChange={(e) => {
                                      const newItems = [...editedItems];
                                      newItems[index].price = parseFloat(e.target.value) || 0;
                                      setEditedItems(newItems);
                                    }}
                                    className="input"
                                    style={{ width: '100px' }}
                                    min="0"
                                    step="0.01"
                                  />
                                </td>
                                <td>PKR {(item.quantity * item.price).toFixed(2)}</td>
                                <td>
                                  <button
                                    onClick={() => {
                                      const newItems = editedItems.filter((_, i) => i !== index);
                                      setEditedItems(newItems);
                                    }}
                                    className="btn btn-danger btn-sm"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ fontWeight: 'bold', background: '#f9f9f9' }}>
                              <td colSpan="4">Total Amount:</td>
                              <td>PKR {editedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}</td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Info Sidebar (Locked in Edit Mode) */}
                <div style={{
                  width: '350px',
                  borderLeft: '1px solid #ddd',
                  paddingLeft: '20px',
                  overflow: 'auto'
                }}>
                  <div className="card">
                    <div className="card-header" style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white'
                    }}>
                      <h4 className="card-title" style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🔒 Customer Type Locked
                      </h4>
                    </div>
                    <div className="card-body">
                      {/* Locked Message */}
                      <div style={{
                        padding: '20px',
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        border: '2px solid #fbbf24',
                        borderRadius: '12px',
                        textAlign: 'center',
                        marginBottom: '20px'
                      }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                          🔒
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#92400e', marginBottom: '8px' }}>
                          Customer Selection Disabled
                        </div>
                        <div style={{ fontSize: '14px', color: '#78350f', lineHeight: '1.6' }}>
                          Customer type cannot be changed when editing a sale. This prevents pricing conflicts and maintains transaction integrity.
                        </div>
                      </div>

                      {/* Current Customer Type Info */}
                      <div style={{
                        padding: '16px',
                        background: editedCustomer ? '#f0fdf4' : '#fff7ed',
                        border: `2px solid ${editedCustomer ? '#86efac' : '#fed7aa'}`,
                        borderRadius: '8px'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 'bold',
                          marginBottom: '10px',
                          color: editedCustomer ? '#166534' : '#9a3412'
                        }}>
                          📊 Current Transaction Type:
                        </div>
                        {editedCustomer ? (
                          <div>
                            <div style={{
                              padding: '10px',
                              background: '#dcfce7',
                              borderRadius: '6px',
                              marginBottom: '10px'
                            }}>
                              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#166534', marginBottom: '6px' }}>
                                🏪 Wholesale/Long-term Sale
                              </div>
                              <div style={{ fontSize: '13px', color: '#059669' }}>
                                Customer: <strong>{editedCustomer.brand_name || editedCustomer.name}</strong>
                              </div>
                            </div>
                            <div style={{ fontSize: '12px', color: '#047857', lineHeight: '1.5' }}>
                              ✅ Uses wholesale pricing<br />
                              ✅ Linked to customer account<br />
                              ✅ Affects customer balance
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{
                              padding: '10px',
                              background: '#ffedd5',
                              borderRadius: '6px',
                              marginBottom: '10px'
                            }}>
                              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#9a3412', marginBottom: '6px' }}>
                                🚶 Retail Sale (Walk-in)
                              </div>
                              <div style={{ fontSize: '13px', color: '#c2410c' }}>
                                No customer linked
                              </div>
                            </div>
                            <div style={{ fontSize: '12px', color: '#c2410c', lineHeight: '1.5' }}>
                              ✅ Uses retail pricing<br />
                              ✅ Cash transaction<br />
                              ✅ No customer account impact
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Why Locked Info */}
                      <div style={{
                        marginTop: '20px',
                        padding: '12px',
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#1e40af',
                        lineHeight: '1.6'
                      }}>
                        <strong>💡 Why is this locked?</strong><br />
                        • Prevents pricing inconsistencies<br />
                        • Maintains accurate customer records<br />
                        • Ensures proper accounting<br />
                        • Protects transaction integrity
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button onClick={handleCancelEdit} className="btn btn-secondary">

                  Cancel
                </button>
                <button onClick={handleSaveTransaction} className="btn btn-primary">

                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Unified Sale Edit Modal */}
      <SaleEditModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        saleId={editingSaleId}
        onSaveSuccess={handleSaveSuccess}
        userRole={userRole}
      />
    </div >
  );
}

export default Sales;