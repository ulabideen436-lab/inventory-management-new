import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useCustomerContext } from '../context/CustomerContext';
import { usePersistentState } from '../hooks/usePersistentState';
import { useSaleEdit } from '../hooks/useSaleEdit';
import SaleEditModal from './SaleEditModal';
import UnifiedInvoiceView from './UnifiedInvoiceView';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = usePersistentState('customers_selected', null);
  const [ledger, setLedger] = useState([]);
  const [history, setHistory] = useState([]);
  const [filters, setFilters] = usePersistentState('customers_filters', { search: "", startDate: "", endDate: "" });

  // Use customer context for floating panel
  const { selectCustomer } = useCustomerContext();
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    brand_name: "",
    contact: "",
    opening_balance: 0,
    opening_balance_type: "Dr",
    address: "",
    phone: "",
    email: "",
    credit_limit: ""
  });
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);

  // Unified Sale Edit Modal using the custom hook
  const {
    isEditModalOpen: isSaleEditModalOpen,
    editingSaleId,
    openEditModal: openSaleEditModal,
    closeEditModal: closeSaleEditModal,
    handleSaveSuccess: handleSaleEditSuccess
  } = useSaleEdit(() => {
    // Refresh data after successful edit
    fetchLedger();
    fetchHistory();
  });

  const [productIdToAdd, setProductIdToAdd] = useState("");
  const [showPaymentEditor, setShowPaymentEditor] = useState(false);
  const [editingPayment, setEditingPayment] = useState({ customerId: null, paymentId: null, amount: '', description: '' });
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceSale, setInvoiceSale] = useState(null);
  const unifiedInvoiceRef = useRef();
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({ amount: '', description: '' });
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [rowsPerPage, setRowsPerPage] = usePersistentState('customers_rowsPerPage', 10);
  const [currentPage, setCurrentPage] = usePersistentState('customers_currentPage', 1);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all'); // all | debit | credit

  // Advanced filter states
  const [balanceFilter, setBalanceFilter] = usePersistentState('customers_balance_filter', 'all'); // all | debit | credit | zero
  const [minBalance, setMinBalance] = usePersistentState('customers_min_balance', '');
  const [maxBalance, setMaxBalance] = usePersistentState('customers_max_balance', '');
  const [creditLimitFilter, setCreditLimitFilter] = usePersistentState('customers_credit_limit_filter', 'all'); // all | near-limit | exceeded | no-limit
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState('customers_show_advanced_filters', false);
  const allColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'brand_name', label: 'Brand' },
    { key: 'address', label: 'Address' },
    { key: 'credit_limit', label: 'Credit Limit' },
    { key: 'created_at', label: 'Created At' }
  ];
  const [visibleColumns, setVisibleColumns] = useState(allColumns.map(c => c.key));
  const token = localStorage.getItem('token');

  // Fetch customers (inline in effect to avoid ESLint dependency warning)
  const fetchCustomers = async (searchTerm) => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      const res = await axios.get(`http://localhost:5000/customers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(res.data);
    } catch (err) {
      console.error('Customers fetch failed:', err?.response?.status, err?.response?.data || err?.message);
    }
  };

  // Filter customers based on advanced filters
  const getFilteredCustomers = () => {
    return customers.filter(customer => {
      const balance = parseFloat(customer.balance || 0);
      const creditLimit = parseFloat(customer.credit_limit || 0);

      // Current balance sign determines type: positive = Dr (debit), negative = Cr (credit)
      // Dr = customer owes you money (positive balance)
      // Cr = you owe customer money (negative balance)

      // Balance filter
      if (balanceFilter === 'debit' && balance <= 0) return false; // Debit: positive balance
      if (balanceFilter === 'credit' && balance >= 0) return false; // Credit: negative balance
      if (balanceFilter === 'zero' && balance !== 0) return false;

      // Balance range filter (use absolute value for range)
      if (minBalance && Math.abs(balance) < parseFloat(minBalance)) return false;
      if (maxBalance && Math.abs(balance) > parseFloat(maxBalance)) return false;

      // Credit limit filter (only applies to debit balances - when customer owes money)
      if (creditLimitFilter === 'near-limit') {
        if (!creditLimit || creditLimit === 0) return false;
        if (balance <= 0) return false; // Only check debit balances
        const usedPercentage = (Math.abs(balance) / creditLimit) * 100;
        if (usedPercentage < 80) return false;
      }
      if (creditLimitFilter === 'exceeded') {
        if (!creditLimit || creditLimit === 0) return false;
        if (balance <= 0) return false; // Only check debit balances
        if (Math.abs(balance) <= creditLimit) return false;
      }
      if (creditLimitFilter === 'no-limit' && creditLimit > 0) return false;

      return true;
    });
  };

  const filteredCustomers = getFilteredCustomers();

  // fetch customers
  useEffect(() => {
    fetchCustomers(filters.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  const fetchLedger = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/customers/${id}/ledger`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLedger(res.data);
    } catch (err) {
      console.error("Error fetching ledger:", err);
    }
  };

  const fetchHistory = async (id) => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      const res = await axios.get(`http://localhost:5000/customers/${id}/history?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('History API response:', res.data);
      console.log('History data length:', res.data.length);
      setHistory(res.data || []); // Backend returns array directly, not wrapped in {history: []}
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const handleRowClick = (cust) => {
    if (selected && String(selected.id) === String(cust.id) && !showHistoryModal) {
      setShowHistoryModal(true);
      return;
    }
    setSelected(cust);
    fetchLedger(cust.id);
    fetchHistory(cust.id);
    // do not open history yet; require second click per requirement
  };

  // Open customer in floating panel (stays open across pages)
  const handleOpenInPanel = (cust) => {
    selectCustomer(cust);
  };

  const handleAddCustomer = async () => {
    try {
      await axios.post("http://localhost:5000/customers", newCustomer, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCustomers(filters.search);
      setShowForm(false);
      setNewCustomer({ name: "", brand_name: "", contact: "", opening_balance: 0, opening_balance_type: "Dr", address: "", phone: "", email: "", credit_limit: "" });
    } catch (err) {
      console.error("Error adding customer:", err);
    }
  };

  // Sale editing functions - now using unified system
  const handleEditSale = (saleId) => {
    openSaleEditModal(saleId);
  };

  // Payment editing
  const openPaymentEditor = (customerId, paymentId, amount, description) => {
    setEditingPayment({ customerId, paymentId, amount, description });
    setShowPaymentEditor(true);
  };
  const savePayment = async () => {
    const { customerId, paymentId, amount, description } = editingPayment;
    try {
      await axios.put(`http://localhost:5000/customers/${customerId}/payments/${paymentId}`, { amount, description }, { headers: { Authorization: `Bearer ${token}` } });
      setShowPaymentEditor(false);
      if (selected) fetchHistory(selected.id);
    } catch { }
  };

  // Record new payment
  const openAddPayment = (customer) => {
    setSelected(customer);
    setNewPayment({ amount: '', description: '' });
    setShowAddPayment(true);
  };
  const saveNewPayment = async () => {
    if (!selected) return;
    try {
      await axios.post(`http://localhost:5000/customers/${selected.id}/payments`, newPayment, { headers: { Authorization: `Bearer ${token}` } });
      setShowAddPayment(false);
      fetchHistory(selected.id);
    } catch { }
  };

  // Invoice modal
  const openInvoice = async (saleId) => {
    try {
      const res = await axios.get(`http://localhost:5000/sales/${saleId}`, { headers: { Authorization: `Bearer ${token}` } });
      setInvoiceSale(res.data);
      setShowInvoice(true);
    } catch { }
  };

  // Ledger PDF (print) - formatted per provided rules
  const downloadLedgerPdf = () => {
    if (!selected) return;

    // Use backend history data with proper debit/credit/running_balance
    const entries = [...(history || [])];

    // Calculate totals from backend data
    let totalDr = 0;
    let totalCr = 0;

    // Build rows using backend-calculated amounts and running balances
    let rowsHtml = entries.map(h => {
      const debit = Number(h.debit || 0);
      const credit = Number(h.credit || 0);
      const runningBalance = Number(h.running_balance || 0);

      totalDr += debit;
      totalCr += credit;

      const txNo = h.trans_no || (h.transaction_type === 'sale' ? `SALE-${h.id}` : `PAY-${h.id}`);
      const typeLabel = h.transaction_type === 'opening' ? 'Opening' :
        h.transaction_type === 'sale' ? 'Sale' : 'Payment';
      const dateStr = h.created_at && h.created_at !== '1900-01-01' ?
        new Date(h.created_at).toLocaleDateString() : '';

      return `<tr>
        <td>${dateStr}</td>
        <td>${txNo}</td>
        <td>${typeLabel}</td>
        <td>${h.description || ''}</td>
        <td class="debit">${debit ? 'PKR ' + debit.toFixed(2) : ''}</td>
        <td>${credit ? 'PKR ' + credit.toFixed(2) : ''}</td>
        <td>PKR ${Math.abs(runningBalance).toFixed(2)} ${runningBalance >= 0 ? 'Dr' : 'Cr'}</td>
      </tr>`;
    }).join('');

    // Use backend-calculated final balance
    const finalBalance = history.length > 0 ? Number(history[history.length - 1].running_balance || 0) : 0;
    const openingBalance = history.length > 0 ? Number(history[0].running_balance || 0) : 0;
    const openingLine = `PKR ${Math.abs(openingBalance).toFixed(2)} ${openingBalance >= 0 ? 'Dr' : 'Cr'}`;
    const closingLine = `PKR ${Math.abs(finalBalance).toFixed(2)} ${finalBalance >= 0 ? 'Dr' : 'Cr'}`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Customer Ledger - ${selected.name}</title>
          <style>
            body { font-family: 'Arial', sans-serif; color: #111827; padding: 40px 48px; }
            .title { text-align: center; font-size: 28px; font-weight: 800; letter-spacing: .5px; }
            .company { text-align: center; font-size: 16px; margin-top: 6px; font-weight: 600; }
            .rule { height: 2px; background: #0f172a; margin: 10px 0 24px; }
            .meta { margin: 8px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th { border-bottom: 2px solid #111; text-align: left; padding: 8px; font-size: 13px; }
            td { border-bottom: 1px solid #ddd; padding: 8px; font-size: 13px; }
            td.debit { color: #e11d48; font-weight: 600; }
            .totals { display: flex; gap: 40px; font-weight: 700; margin-top: 18px; }
            .footer { margin-top: 24px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="title">CUSTOMER LEDGER STATEMENT</div>
          <div class="company">ZAFAR YAQOOB Bedding Store</div>
          <div class="rule"></div>
          <div class="meta">Customer: ${selected.name || ''}</div>
          <div class="meta">Brand: ${selected.brand_name || ''}</div>
          <div class="meta">Phone: ${selected.phone || ''}</div>
          <div class="meta">Address: ${selected.address || ''}</div>
          <div class="meta">Opening Balance: ${openingLine}</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction No</th>
                <th>Type</th>
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
          <div class="totals">
            <div>TOTALS:</div>
            <div>PKR ${totalDr.toFixed(2)}</div>
            <div>PKR ${totalCr.toFixed(2)}</div>
          </div>
          <h3>Closing Balance: ${closingLine}</h3>
          <div class="footer">Generated on: ${new Date().toLocaleString()}</div>
          <script>window.print()</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // ✅ helper function for rendering ledger
  const renderLedger = () => {
    if (!selected) return null;

    let runningBalance =
      selected.balanceType === "Dr"
        ? parseFloat(selected.openingBalance)
        : -parseFloat(selected.openingBalance);

    return (
      <div
        style={{
          marginTop: 20,
          padding: 20,
          background: "#f8f9fa",
          borderRadius: 8,
          border: "1px solid #dee2e6",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 16, color: "#2980b9" }}>
          Ledger for {selected.name}
        </h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <thead style={{ background: "#f1f3f5" }}>
            <tr>
              <th style={th}>Date</th>
              <th style={th}>Description</th>
              <th style={th}>Debit</th>
              <th style={th}>Credit</th>
              <th style={th}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {/* Opening Balance */}
            <tr>
              <td style={td}></td>
              <td style={td}>Opening Balance</td>
              <td style={td}>
                {selected.balanceType === "Dr"
                  ? selected.openingBalance
                  : "-"}
              </td>
              <td style={td}>
                {selected.balanceType === "Cr"
                  ? selected.openingBalance
                  : "-"}
              </td>
              <td style={td}>
                {Math.abs(runningBalance)}{" "}
                {runningBalance >= 0 ? "Dr" : "Cr"}
              </td>
            </tr>

            {/* Transactions */}
            {ledger.map((entry, idx) => {
              if (entry.type === "Dr") {
                runningBalance += parseFloat(entry.amount);
              } else {
                runningBalance -= parseFloat(entry.amount);
              }

              return (
                <tr key={idx}>
                  <td style={td}>{entry.date}</td>
                  <td style={td}>{entry.description}</td>
                  <td style={{ ...td, color: "red" }}>
                    {entry.type === "Dr" ? entry.amount : "-"}
                  </td>
                  <td style={{ ...td, color: "black" }}>
                    {entry.type === "Cr" ? entry.amount : "-"}
                  </td>
                  <td style={td}>
                    {Math.abs(runningBalance)}{" "}
                    {runningBalance >= 0 ? "Dr" : "Cr"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <h4 style={{ marginTop: 16, color: "#27ae60" }}>
          Closing Balance: {Math.abs(runningBalance)}{" "}
          {runningBalance >= 0 ? "Dr" : "Cr"}
        </h4>
      </div>
    );
  };

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
              👥 Customer Management
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8, fontSize: '1.1rem' }}>Manage customer accounts, track balances, and handle transactions</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', margin: '10px 0' }}>
          <input
            type="text"
            placeholder="Search by name or brand..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ ...input, maxWidth: 320 }}
          />

          <button style={{ ...btn, background: '#2563eb' }} onClick={() => { setCurrentPage(1); fetchCustomers(filters.search); }}>Apply</button>
          <button style={{ ...btn, background: '#64748b' }} onClick={() => { setFilters({ ...filters, search: '' }); setCurrentPage(1); fetchCustomers(''); }}>Clear</button>

          <button
            style={{ ...btn, background: showAdvancedFilters ? '#8b5cf6' : '#64748b' }}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            {showAdvancedFilters ? '🔽' : '▶️'} Advanced Filters
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div style={{
            background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
            borderRadius: '12px',
            padding: '1.5rem',
            margin: '10px 0',
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
                  style={{ ...input, width: '100%' }}
                >
                  <option value="all">All Customers</option>
                  <option value="debit">Debit Balance (Owes Money)</option>
                  <option value="credit">Credit Balance (Advance Payment)</option>
                  <option value="zero">Zero Balance</option>
                </select>
              </div>

              {/* Balance Range */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#4b5563', fontWeight: '500' }}>
                  📊 Balance Range (Min)
                </label>
                <input
                  type="number"
                  placeholder="Min balance..."
                  value={minBalance}
                  onChange={(e) => { setMinBalance(e.target.value); setCurrentPage(1); }}
                  style={{ ...input, width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#4b5563', fontWeight: '500' }}>
                  📊 Balance Range (Max)
                </label>
                <input
                  type="number"
                  placeholder="Max balance..."
                  value={maxBalance}
                  onChange={(e) => { setMaxBalance(e.target.value); setCurrentPage(1); }}
                  style={{ ...input, width: '100%' }}
                />
              </div>

              {/* Credit Limit Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#4b5563', fontWeight: '500' }}>
                  ⚠️ Credit Risk
                </label>
                <select
                  value={creditLimitFilter}
                  onChange={(e) => { setCreditLimitFilter(e.target.value); setCurrentPage(1); }}
                  style={{ ...input, width: '100%' }}
                >
                  <option value="all">All Customers</option>
                  <option value="near-limit">Near Credit Limit (&gt;80%)</option>
                  <option value="exceeded">Exceeded Credit Limit</option>
                  <option value="no-limit">No Credit Limit Set</option>
                </select>
              </div>
            </div>

            {/* Clear Advanced Filters Button */}
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button
                style={{ ...btn, background: '#ef4444' }}
                onClick={() => {
                  setBalanceFilter('all');
                  setMinBalance('');
                  setMaxBalance('');
                  setCreditLimitFilter('all');
                  setCurrentPage(1);
                }}
              >
                🗑️ Clear Advanced Filters
              </button>

              {(balanceFilter !== 'all' || minBalance || maxBalance || creditLimitFilter !== 'all') && (
                <div style={{
                  padding: '0.5rem 1rem',
                  background: '#fef3c7',
                  border: '2px solid #f59e0b',
                  borderRadius: '8px',
                  color: '#92400e',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  ⚡ {filteredCustomers.length} of {customers.length} customers match filters
                </div>
              )}
            </div>
          </div>
        )}

        {/* Customers Table with Column Selector */}
        <div style={{ margin: '10px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setColumnsOpen(!columnsOpen)} style={{ ...btn, background: '#7f8c8d' }}>Columns</button>
          {columnsOpen && (
            <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 6, padding: 10 }}>
              {allColumns.map(col => (
                <label key={col.key} style={{ display: 'inline-flex', alignItems: 'center', marginRight: 12 }}>
                  <input type="checkbox" checked={visibleColumns.includes(col.key)} onChange={(e) => {
                    if (e.target.checked) setVisibleColumns(prev => Array.from(new Set([...prev, col.key])));
                    else setVisibleColumns(prev => prev.filter(k => k !== col.key));
                  }} />
                  <span style={{ marginLeft: 6 }}>{col.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="table-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>Rows per page</span>
              <select value={rowsPerPage} onChange={e => { const value = e.target.value === 'all' ? 'all' : Number(e.target.value); setRowsPerPage(value); setCurrentPage(1); }} style={{ ...input, width: 100 }}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>
          <table className="table" style={{ width: '100%', background: 'white', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {allColumns.filter(c => visibleColumns.includes(c.key)).map(col => (
                  <th key={col.key} style={th}>{col.label}</th>
                ))}
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(rowsPerPage === 'all' ? filteredCustomers : filteredCustomers.slice((currentPage - 1) * rowsPerPage, (currentPage - 1) * rowsPerPage + rowsPerPage)).map(c => (
                <tr key={c.id} style={{ cursor: 'pointer', background: selected && String(selected.id) === String(c.id) ? '#eef2ff' : 'transparent' }}>
                  {allColumns.filter(col => visibleColumns.includes(col.key)).map(col => (
                    <td key={col.key} style={td} onClick={() => handleRowClick(c)}>
                      {col.key === 'created_at' && c[col.key] ? (
                        new Date(c[col.key]).toLocaleDateString()
                      ) : (
                        c[col.key] ?? ''
                      )}
                    </td>
                  ))}
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button style={{ ...btn, background: '#2980b9' }} onClick={() => handleRowClick(c)}>Select</button>
                      <button
                        style={{ ...btn, background: '#3b82f6', fontWeight: '600' }}
                        onClick={() => handleOpenInPanel(c)}
                        title="Open in floating panel - stays open across pages"
                      >
                        📌 Pin Panel
                      </button>
                      <button style={{ ...btn, background: '#8e44ad' }} onClick={() => { setEditCustomer(c); setShowEditForm(true); }}>Edit</button>
                      <button style={{ ...btn, background: '#27ae60' }} onClick={() => openAddPayment(c)}>Record Payment</button>
                      <button style={{ ...btn, background: '#2c3e50' }} onClick={() => { handleRowClick(c); setShowHistoryModal(true); }}>View History</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              {rowsPerPage === 'all' ? `Showing all ${filteredCustomers.length} customers` : `Showing ${(currentPage - 1) * rowsPerPage + 1}–${Math.min(currentPage * rowsPerPage, filteredCustomers.length)} of ${filteredCustomers.length}`}
              {filteredCustomers.length !== customers.length && (
                <span style={{ color: '#f59e0b', fontWeight: '600', marginLeft: 8 }}>
                  (filtered from {customers.length} total)
                </span>
              )}
            </div>
            {rowsPerPage !== 'all' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button disabled={currentPage === 1} style={{ ...btn, background: currentPage === 1 ? '#cbd5e1' : '#64748b' }} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Prev</button>
                <button disabled={currentPage * rowsPerPage >= filteredCustomers.length} style={{ ...btn, background: currentPage * rowsPerPage >= filteredCustomers.length ? '#cbd5e1' : '#64748b' }} onClick={() => setCurrentPage(p => (p * rowsPerPage < filteredCustomers.length ? p + 1 : p))}>Next</button>
              </div>
            )}
          </div>
        </div>

        {/* Add New Customer Button */}
        <button
          onClick={() => setShowForm(true)}
          style={{
            marginTop: 15,
            padding: "10px 15px",
            background: "#2980b9",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          + Add Customer
        </button>
        {selected && (
          <div style={{ display: 'inline-flex', gap: 8, marginLeft: 8 }}>
            <button onClick={() => { setEditCustomer(selected); setShowEditForm(true); }} style={{ ...btn, background: '#8e44ad' }}>Edit Customer</button>
            <button onClick={downloadLedgerPdf} style={{ ...btn, background: '#16a085' }}>Download Ledger PDF</button>
          </div>
        )}

        {/* Inline history removed - use fullscreen view */}

        {/* Add Customer Form Modal */}
        {showForm && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 2000,
            }}
          >
            <div
              style={{
                background: "white",
                padding: 20,
                borderRadius: 8,
                width: 400,
                maxHeight: '90vh',
                overflow: 'auto',
              }}
            >
              <h3>Add New Customer</h3>
              <input type="text" placeholder="Customer Name" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} style={input} />
              <input type="text" placeholder="Brand Name" value={newCustomer.brand_name} onChange={e => setNewCustomer({ ...newCustomer, brand_name: e.target.value })} style={input} />
              <input type="text" placeholder="Contact Person" value={newCustomer.contact} onChange={e => setNewCustomer({ ...newCustomer, contact: e.target.value })} style={input} />
              <input type="number" placeholder="Opening Balance" value={newCustomer.opening_balance} onChange={e => setNewCustomer({ ...newCustomer, opening_balance: e.target.value })} style={input} />
              <select value={newCustomer.opening_balance_type} onChange={e => setNewCustomer({ ...newCustomer, opening_balance_type: e.target.value })} style={input}>
                <option value="Dr">Debit</option>
                <option value="Cr">Credit</option>
              </select>
              <input type="text" placeholder="Address" value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} style={input} />
              <input type="text" placeholder="Phone" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} style={input} />
              <input type="email" placeholder="Email" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} style={input} />
              <input type="number" placeholder="Credit Limit (optional)" value={newCustomer.credit_limit} onChange={e => setNewCustomer({ ...newCustomer, credit_limit: e.target.value })} style={input} />
              <button
                onClick={handleAddCustomer}
                style={{
                  ...btn,
                  background: "#27ae60",
                }}
              >
                Save
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  ...btn,
                  background: "#c0392b",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {showEditForm && editCustomer && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'white', padding: 20, borderRadius: 8, width: 420, maxHeight: '90vh', overflow: 'auto' }}>
              <h3>Edit Customer</h3>
              <label style={{ fontSize: 12, color: '#6b7280' }}>Name</label>
              <input type="text" placeholder="Name" value={editCustomer.name || ''} onChange={e => setEditCustomer({ ...editCustomer, name: e.target.value })} style={input} />
              <label style={{ fontSize: 12, color: '#6b7280' }}>Brand Name</label>
              <input type="text" placeholder="Brand Name" value={editCustomer.brand_name || ''} onChange={e => setEditCustomer({ ...editCustomer, brand_name: e.target.value })} style={input} />
              <label style={{ fontSize: 12, color: '#6b7280' }}>Contact Person</label>
              <input type="text" placeholder="Contact Person" value={editCustomer.contact || ''} onChange={e => setEditCustomer({ ...editCustomer, contact: e.target.value })} style={input} />
              <label style={{ fontSize: 12, color: '#6b7280' }}>Phone</label>
              <input type="text" placeholder="Phone" value={editCustomer.phone || ''} onChange={e => setEditCustomer({ ...editCustomer, phone: e.target.value })} style={input} />
              <label style={{ fontSize: 12, color: '#6b7280' }}>Email</label>
              <input type="email" placeholder="Email" value={editCustomer.email || ''} onChange={e => setEditCustomer({ ...editCustomer, email: e.target.value })} style={input} />
              <label style={{ fontSize: 12, color: '#6b7280' }}>Address</label>
              <input type="text" placeholder="Address" value={editCustomer.address || ''} onChange={e => setEditCustomer({ ...editCustomer, address: e.target.value })} style={input} />
              <label style={{ fontSize: 12, color: '#6b7280' }}>Credit Limit (PKR)</label>
              <input type="number" placeholder="Credit Limit" value={editCustomer.credit_limit || ''} onChange={e => setEditCustomer({ ...editCustomer, credit_limit: e.target.value })} style={input} />
              <label style={{ fontSize: 12, color: '#6b7280' }}>Opening Balance (PKR)</label>
              <input type="number" step="0.01" placeholder="Opening Balance" value={editCustomer.opening_balance || 0} onChange={e => setEditCustomer({ ...editCustomer, opening_balance: e.target.value })} style={input} />
              <label style={{ fontSize: 12, color: '#6b7280' }}>Opening Type</label>
              <select value={editCustomer.opening_balance_type || 'Dr'} onChange={e => setEditCustomer({ ...editCustomer, opening_balance_type: e.target.value })} style={input}>
                <option value="Dr">Debit (Dr)</option>
                <option value="Cr">Credit (Cr)</option>
              </select>
              <label style={{ fontSize: 12, color: '#6b7280' }}>Current Balance (PKR)</label>
              <input type="number" step="0.01" placeholder="Current Balance" value={editCustomer.balance || 0} readOnly style={{ ...input, background: '#f3f4f6', cursor: 'not-allowed' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...btn, background: '#27ae60' }} onClick={async () => {
                  try {
                    console.log('Attempting to save customer:', editCustomer);
                    console.log('Token:', token);

                    // Only send fields that should be updatable (exclude calculated fields like balance and id)
                    const updateData = {
                      name: editCustomer.name,
                      brand_name: editCustomer.brand_name,
                      contact: editCustomer.contact,
                      phone: editCustomer.phone,
                      email: editCustomer.email,
                      address: editCustomer.address,
                      credit_limit: editCustomer.credit_limit,
                      opening_balance: editCustomer.opening_balance,
                      opening_balance_type: editCustomer.opening_balance_type
                    };

                    const response = await axios.put(`http://localhost:5000/customers/${editCustomer.id}`, updateData, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log('Save successful:', response.data);
                    setShowEditForm(false);
                    // Use the updated customer data returned from server instead of local editCustomer
                    if (response.data.customer) {
                      setSelected(response.data.customer);
                    }
                    fetchCustomers(filters.search);
                    // Refresh history if customer history is currently being viewed
                    if (selected && selected.id === editCustomer.id) {
                      fetchHistory(editCustomer.id);
                    }
                  } catch (error) {
                    console.error('Save error:', error);
                    console.error('Error response:', error.response?.data);
                    console.error('Error status:', error.response?.status);
                    alert(`Failed to save customer: ${error.response?.data?.message || error.message}`);
                  }
                }}>Save</button>
                <button style={{ ...btn, background: '#c0392b' }} onClick={() => setShowEditForm(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Unified Sale Edit Modal */}
        <SaleEditModal
          isOpen={isSaleEditModalOpen}
          onClose={closeSaleEditModal}
          saleId={editingSaleId}
          onSaveSuccess={handleSaleEditSuccess}
          userRole="owner"
        />

        {/* Payment Editor Modal */}
        {showPaymentEditor && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'white', padding: 20, borderRadius: 8, width: 420, maxHeight: '90vh', overflow: 'auto' }}>
              <h3>Edit Payment</h3>
              <input type="number" step="0.01" placeholder="Amount" value={editingPayment.amount} onChange={e => setEditingPayment({ ...editingPayment, amount: e.target.value })} style={input} />
              <input type="text" placeholder="Description" value={editingPayment.description} onChange={e => setEditingPayment({ ...editingPayment, description: e.target.value })} style={input} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...btn, background: '#27ae60' }} onClick={savePayment}>Save</button>
                <button style={{ ...btn, background: '#7f8c8d' }} onClick={() => setShowPaymentEditor(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Record Payment Modal */}
        {showAddPayment && selected && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'white', padding: 20, borderRadius: 8, width: 420, maxHeight: '90vh', overflow: 'auto' }}>
              <h3>Record Payment - {selected.name}</h3>
              <input type="number" step="0.01" placeholder="Amount" value={newPayment.amount} onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })} style={input} />
              <input type="text" placeholder="Description" value={newPayment.description} onChange={e => setNewPayment({ ...newPayment, description: e.target.value })} style={input} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...btn, background: '#27ae60' }} onClick={saveNewPayment}>Save</button>
                <button style={{ ...btn, background: '#7f8c8d' }} onClick={() => setShowAddPayment(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Modal */}
        {showInvoice && invoiceSale && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'white', padding: 20, borderRadius: 8, width: 900, maxHeight: '90vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Invoice #{invoiceSale.id}</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ ...btn, background: '#2980b9' }} onClick={() => window.print()}>Download PDF</button>
                  <button style={{ ...btn, background: '#7f8c8d' }} onClick={() => setShowInvoice(false)}>Close</button>
                </div>
              </div>
              <UnifiedInvoiceView
                ref={unifiedInvoiceRef}
                sale={invoiceSale}
                customer={{ brand_name: selected?.brand_name || 'Walk-in Customer', name: selected?.name }}
                onClose={() => setShowInvoice(false)}
              />
            </div>
          </div>
        )}

        {/* History - Fullscreen View */}
        {showHistoryModal && selected && (
          <div style={{ position: 'fixed', inset: 0, background: '#ffffff', display: 'flex', flexDirection: 'column', zIndex: 900 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span role="img" aria-label="details">📊</span>
                <div style={{ fontSize: 20, fontWeight: 800 }}>Customer History</div>
                <div style={{ color: '#6b7280' }}>|</div>
                <div style={{ fontSize: 14 }}>
                  <strong>{selected.name}</strong>
                  {selected.brand_name ? ` · ${selected.brand_name}` : ''}
                  {selected.phone ? ` · ${selected.phone}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} style={{ ...input, width: 150 }} />
                <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} style={{ ...input, width: 150 }} />
                <select value={historyTypeFilter} onChange={e => setHistoryTypeFilter(e.target.value)} style={{ ...input, width: 160 }}>
                  <option value="all">All</option>
                  <option value="debit">Debit (Sales)</option>
                  <option value="credit">Credit (Payments)</option>
                </select>
                <button style={{ ...btn, background: '#2563eb' }} onClick={() => fetchHistory(selected.id)}>Apply</button>
                <button style={{ ...btn, background: '#16a085' }} onClick={downloadLedgerPdf}>Download Ledger PDF</button>
                <button style={{ ...btn, background: '#8e44ad' }} onClick={() => {
                  setEditCustomer({
                    id: selected.id,
                    name: selected.name || '',
                    brand_name: selected.brand_name || '',
                    contact: selected.contact || '',
                    phone: selected.phone || '',
                    email: selected.email || '',
                    address: selected.address || '',
                    credit_limit: selected.credit_limit || '',
                    balance: selected.balance || '',
                    opening_balance: selected.openingBalance || selected.opening_balance || 0,
                    opening_balance_type: selected.balanceType || selected.opening_balance_type || 'Dr'
                  }); setShowEditForm(true);
                }}>Edit Info</button>
                <button style={{ ...btn, background: '#6b7280' }} onClick={() => setShowHistoryModal(false)}>Close</button>
              </div>
            </div>
            <div style={{ padding: '12px 20px', color: '#374151' }}>
              Opening Balance: <strong>PKR {Number(selected.openingBalance || selected.opening_balance || 0).toFixed(2)} {(selected.balanceType || selected.opening_balance_type) || 'Dr'}</strong>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px 20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f7f7f7' }}>
                    <th style={th}>Date</th>
                    <th style={th}>Transaction No</th>
                    <th style={th}>Type</th>
                    <th style={th}>Description</th>
                    <th style={th}>Debit</th>
                    <th style={th}>Credit</th>
                    <th style={th}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Filter entries if needed but preserve backend order and running balance
                    let entries = [...history];
                    if (historyTypeFilter === 'debit') entries = entries.filter(h => h.transaction_type === 'sale');
                    if (historyTypeFilter === 'credit') entries = entries.filter(h => h.transaction_type === 'payment');

                    const rows = [];

                    entries.forEach((h, idx) => {
                      // Use backend-calculated amounts and running balance
                      const debit = Number(h.debit || 0);
                      const credit = Number(h.credit || 0);
                      const runningBalance = Number(h.running_balance || 0);
                      const txNo = h.trans_no || (h.transaction_type === 'sale' ? `SALE-${h.id}` : `PAY-${h.id}`);
                      const typeLabel = h.transaction_type === 'opening' ? 'Opening' :
                        h.transaction_type === 'sale' ? 'Sale' : 'Payment';

                      // Use backend description
                      let desc = h.description || '';

                      rows.push(
                        <tr key={`${h.transaction_type}-${h.id || 'opening'}-${idx}`} onDoubleClick={() => {
                          if (h.transaction_type === 'sale') {
                            handleEditSale(h.id);
                          } else if (h.transaction_type === 'payment') {
                            openPaymentEditor(selected.id, h.id, credit, h.description);
                          }
                        }}>
                          <td style={td}>{h.created_at && h.created_at !== '1900-01-01' ? new Date(h.created_at).toLocaleDateString() : ''}</td>
                          <td style={td}>{txNo}</td>
                          <td style={td}>{typeLabel}</td>
                          <td style={td}>{desc}</td>
                          <td style={{ ...td, color: '#e11d48', fontWeight: 600 }}>
                            {debit > 0 ? `PKR ${debit.toFixed(2)}` : '-'}
                          </td>
                          <td style={{ ...td, color: '#059669', fontWeight: 600 }}>
                            {credit > 0 ? `PKR ${credit.toFixed(2)}` : '-'}
                          </td>
                          <td style={{ ...td, fontWeight: 700, color: runningBalance >= 0 ? '#e11d48' : '#059669' }}>
                            PKR {Math.abs(runningBalance).toFixed(2)} {runningBalance >= 0 ? 'Dr' : 'Cr'}
                          </td>
                        </tr>
                      );
                    });

                    return rows;
                  })()}
                </tbody>
              </table>
            </div>
            {(() => {
              // Use backend-calculated totals and final running balance
              let totalDr = 0;
              let totalCr = 0;

              // Sum up all debits and credits from backend data
              history.forEach(h => {
                totalDr += Number(h.debit || 0);
                totalCr += Number(h.credit || 0);
              });

              // Use the backend-calculated final running balance from the last entry
              const finalBalance = history.length > 0 ? Number(history[history.length - 1].running_balance || 0) : 0;
              const closing = `${Math.abs(finalBalance).toFixed(2)} ${finalBalance >= 0 ? 'Dr' : 'Cr'}`;

              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid #eee' }}>
                  <div style={{ fontWeight: 700 }}>Total Debits: <span style={{ color: '#e11d48' }}>PKR {Number(totalDr).toFixed(2)}</span></div>
                  <div style={{ fontWeight: 700 }}>Total Credits: <span>PKR {Number(totalCr).toFixed(2)}</span></div>
                  <div style={{ fontWeight: 700 }}>Closing Balance: <span style={{ color: finalBalance >= 0 ? '#e11d48' : '#059669' }}>PKR {closing}</span></div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};      // styles
const th = {
  border: "1px solid #dee2e6",
  padding: "8px 12px",
  textAlign: "left",
};
const td = {
  border: "1px solid #dee2e6",
  padding: "8px 12px",
};
const input = {
  width: "100%",
  padding: 8,
  margin: "8px 0",
  borderRadius: 6,
  border: "1px solid #ccc",
};
const btn = {
  padding: "10px 15px",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  marginRight: 10,
};

export default Customers;

