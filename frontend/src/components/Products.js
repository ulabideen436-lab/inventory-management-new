import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useCallback, useEffect, useState } from 'react';
import Barcode from 'react-barcode';
import { usePersistentState } from '../hooks/usePersistentState';

function Products() {
  const [view, setView] = usePersistentState('products_view', 'products'); // 'products' or 'sold'
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ id: '', name: '', brand: '', design_no: '', location: '', uom: '', retail_price: '', wholesale_price: '', cost_price: '', stock_quantity: '', supplier: '' });
  const [suppliers, setSuppliers] = useState([]);

  // Additional state for form and error handling
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Product filters with persistence
  const [search, setSearch] = usePersistentState('products_search', '');
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false);
  const [supplierFilter, setSupplierFilter] = usePersistentState('products_supplier_filter', '');
  const [stockFilter, setStockFilter] = usePersistentState('products_stock_filter', 'all'); // all | in-stock | low-stock | out-of-stock
  const [sortField, setSortField] = usePersistentState('products_sort_field', 'id');
  const [sortOrder, setSortOrder] = usePersistentState('products_sort_order', 'desc');

  // Sold products state and filters with persistence
  const [sales, setSales] = useState([]);
  const [soldProducts, setSoldProducts] = useState([]);
  const [soldProductsSummary, setSoldProductsSummary] = useState({});
  const [soldFilters, setSoldFilters] = usePersistentState('products_sold_filters', {
    product_name: '',
    brand: '',
    customer_name: '',
    customer_brand: '',
    sale_type: '',
    start_date: '',
    end_date: '',
    status: '',
    sort_by: 'sale_date',
    sort_order: 'desc'
  });
  const [salesLoading, setSalesLoading] = useState(false);

  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [barcodeCount, setBarcodeCount] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Pagination state with persistence
  const [currentPage, setCurrentPage] = usePersistentState('products_current_page', 1);
  const [itemsPerPage, setItemsPerPage] = usePersistentState('products_items_per_page', 20);
  const [paginatedProducts, setPaginatedProducts] = useState([]);

  // Sold products pagination state with persistence
  const [soldCurrentPage, setSoldCurrentPage] = usePersistentState('products_sold_current_page', 1);
  const [soldItemsPerPage, setSoldItemsPerPage] = usePersistentState('products_sold_items_per_page', 20);
  const [paginatedSoldProducts, setPaginatedSoldProducts] = useState([]);

  // Column visibility for products table
  const allProductColumns = [
    { key: 'id', label: 'ID' },
    { key: 'product', label: 'Product' },
    { key: 'brand', label: 'Brand & Design' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'location', label: 'Location' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'cost', label: 'Cost' },
    { key: 'stock', label: 'Stock' },
    { key: 'sales', label: 'Sales' },
    { key: 'actions', label: 'Actions' },
  ];
  const [productColumnsOpen, setProductColumnsOpen] = useState(false);
  const [visibleProductColumns, setVisibleProductColumns] = useState(allProductColumns.map(c => c.key));

  // PDF Export state
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfColumns, setPdfColumns] = useState({
    id: true,
    name: true,
    brand: true,
    design_no: true,
    supplier: true,
    location: true,
    uom: true,
    retail_price: true,
    wholesale_price: true,
    cost_price: true,
    stock_quantity: true
  });

  // Token for API requests
  const token = localStorage.getItem('token');

  // Fetch suppliers for dropdown
  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/suppliers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuppliers(response.data);
    } catch (error) {
      setError('Failed to fetch suppliers');
    }
  }, [token]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      setError('Failed to fetch products');
    }
  }, [token]);

  // Fetch sold products for sold products view (separate from sales history)
  const fetchSoldProducts = useCallback(async () => {
    setSalesLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(soldFilters).forEach(key => {
        if (soldFilters[key]) {
          params.append(key, soldFilters[key]);
        }
      });

      const response = await axios.get(`http://localhost:5000/sales/sold-products?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Set the sold products data (not sales data)
      setSoldProducts(response.data.soldProducts || []);
      setSoldProductsSummary(response.data.summary || {});
    } catch (error) {
      setError('Failed to fetch sold products');
    } finally {
      setSalesLoading(false);
    }
  }, [soldFilters, token]);

  // Fetch sales for sold products view
  const fetchSales = useCallback(async () => {
    setSalesLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(soldFilters).forEach(key => {
        if (soldFilters[key]) {
          params.append(key, soldFilters[key]);
        }
      });

      const response = await axios.get(`http://localhost:5000/sales?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSales(response.data);
    } catch (error) {
      setError('Failed to fetch sales');
    } finally {
      setSalesLoading(false);
    }
  }, [soldFilters, token]);

  // Filter suppliers for dropdown search
  useEffect(() => {
    if (supplierDropdownOpen) {
      const filtered = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(supplierSearch.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    }
  }, [supplierSearch, suppliers, supplierDropdownOpen]);

  // Filter products for table
  useEffect(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.brand.toLowerCase().includes(search.toLowerCase()) ||
        product.design_no.toLowerCase().includes(search.toLowerCase());
      const matchesSupplier = !supplierFilter || product.supplier === supplierFilter;

      // Stock status filter
      const stockQty = parseFloat(product.stock_quantity || 0);
      let matchesStock = true;
      if (stockFilter === 'in-stock') matchesStock = stockQty > 0;
      else if (stockFilter === 'low-stock') matchesStock = stockQty > 0 && stockQty < 10;
      else if (stockFilter === 'out-of-stock') matchesStock = stockQty === 0;

      return matchesSearch && matchesSupplier && matchesStock;
    });

    // Sort products
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProducts(filtered);
  }, [products, search, supplierFilter, stockFilter, sortField, sortOrder]);

  // Pagination logic - runs when filteredProducts, currentPage, or itemsPerPage changes
  useEffect(() => {
    if (itemsPerPage === 'all') {
      setPaginatedProducts(filteredProducts);
    } else {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginated = filteredProducts.slice(startIndex, endIndex);
      setPaginatedProducts(paginated);
    }
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, supplierFilter, sortField, sortOrder]);

  // Calculate pagination info
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(filteredProducts.length / itemsPerPage);
  const startItem = itemsPerPage === 'all' ? 1 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = itemsPerPage === 'all' ? filteredProducts.length : Math.min(currentPage * itemsPerPage, filteredProducts.length);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  // Sold products pagination logic
  useEffect(() => {
    if (soldItemsPerPage === 'all') {
      setPaginatedSoldProducts(soldProducts);
    } else {
      const startIndex = (soldCurrentPage - 1) * soldItemsPerPage;
      const endIndex = startIndex + soldItemsPerPage;
      const paginated = soldProducts.slice(startIndex, endIndex);
      setPaginatedSoldProducts(paginated);
    }
  }, [soldProducts, soldCurrentPage, soldItemsPerPage]);

  // Reset sold products to first page when filters change
  useEffect(() => {
    setSoldCurrentPage(1);
  }, [soldFilters]);

  // Calculate sold products pagination info
  const soldTotalPages = soldItemsPerPage === 'all' ? 1 : Math.ceil(soldProducts.length / soldItemsPerPage);
  const soldStartItem = soldItemsPerPage === 'all' ? 1 : (soldCurrentPage - 1) * soldItemsPerPage + 1;
  const soldEndItem = soldItemsPerPage === 'all' ? soldProducts.length : Math.min(soldCurrentPage * soldItemsPerPage, soldProducts.length);

  // Sold products pagination handlers
  const handleSoldPageChange = (page) => {
    setSoldCurrentPage(page);
  };

  const handleSoldItemsPerPageChange = (items) => {
    setSoldItemsPerPage(items);
    setSoldCurrentPage(1);
  };

  // Initial fetch
  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
  }, [fetchSuppliers, fetchProducts]);

  // Fetch sold products when filters change or view changes to sold
  useEffect(() => {
    if (view === 'sold') {
      fetchSoldProducts();
    }
  }, [fetchSoldProducts, view]);

  // Fetch sales when sold filters change or view changes to sold
  useEffect(() => {
    if (view === 'sold') {
      fetchSales();
    }
  }, [fetchSales, view]);

  // Handle form input change
  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  // Handle sold products filter change
  function handleSoldFilterChange(e) {
    const { name, value } = e.target;

    // If it's the main search field, also set customer_name for broader search
    if (name === 'product_name') {
      setSoldFilters(prev => ({
        ...prev,
        [name]: value,
        customer_name: value // Also search customer names with the same value
      }));
    } else {
      setSoldFilters(prev => ({ ...prev, [name]: value }));
    }
  }

  // Handle form submit (add or update product)
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // Client-side validation
    if (!form.name || form.name.trim() === '') {
      setError('Product name is required');
      return;
    }

    if (!form.uom || form.uom.trim() === '') {
      setError('Unit of measure is required');
      return;
    }

    // Validate numeric fields
    const validateNumericField = (value, fieldName) => {
      if (value !== '' && value !== null && value !== undefined) {
        const parsed = parseFloat(value);
        if (isNaN(parsed) || parsed < 0) {
          setError(`${fieldName} must be a valid positive number`);
          return false;
        }
      }
      return true;
    };

    if (!validateNumericField(form.retail_price, 'Retail price')) return;
    if (!validateNumericField(form.wholesale_price, 'Wholesale price')) return;
    if (!validateNumericField(form.cost_price, 'Cost price')) return;
    if (!validateNumericField(form.stock_quantity, 'Stock quantity')) return;

    // Check authentication token
    if (!token) {
      setError('Authentication required. Please login again.');
      return;
    }

    try {
      // Prepare form data (remove id field for updates as it's in the URL)
      const formData = { ...form };
      delete formData.id; // Remove id from body as it's passed in URL params

      console.log('Submitting product data:', {
        editing,
        productId: editing,
        formData
      });

      if (editing) {
        await axios.put(`http://localhost:5000/products/${editing}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Product updated successfully');
        setEditing(null);
        setShowEditPopup(false); // Close popup on successful update
      } else {
        await axios.post('http://localhost:5000/products', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Product added successfully');
        setShowEditPopup(false); // Close popup on successful add
      }

      setForm({ id: '', name: '', brand: '', design_no: '', location: '', uom: '', retail_price: '', wholesale_price: '', cost_price: '', stock_quantity: '', supplier: '' });
      setShowAddForm(false);
      fetchProducts();
    } catch (error) {
      console.error('Product update error:', error);

      // Enhanced error handling with more specific messages
      let errorMessage = editing ? 'Failed to update product' : 'Failed to add product';

      if (error.response) {
        // Server responded with error status
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 404) {
          errorMessage = 'Product not found';
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid product data. Please check all fields.';
        } else if (error.response.status === 401) {
          errorMessage = 'Unauthorized. Please login again.';
        } else if (error.response.status === 403) {
          errorMessage = 'Access denied. Owner permissions required.';
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }

      setError(errorMessage);
    }
  }

  // Handle edit
  function handleEdit(product) {
    setForm(product);
    setEditing(product.id);
    setShowAddForm(true);
  }

  // Handle double-click to open edit popup
  function handleDoubleClick(product) {
    setForm(product);
    setEditing(product.id);
    setShowEditPopup(true);
    setShowAddForm(false); // Close inline form if open
  }

  // Handle delete
  async function handleDelete(id) {
    if (window.confirm('Are you sure you want to delete this product?')) {
      // Prompt for password
      const password = prompt('Please enter your password to delete this product:');
      if (!password) {
        return;
      }

      try {
        await axios.delete(`http://localhost:5000/products/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: { password }
        });
        setMessage('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete product');
      }
    }
  }

  // Handle barcode generation
  function handleShowBarcode(product) {
    setBarcodeProduct(product);
  }

  function handlePrintBarcode() {
    const printWindow = window.open('', '_blank');
    const barcodeDiv = document.getElementById('barcode-to-print');
    if (barcodeDiv && printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Barcode - ${barcodeProduct.name}</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; margin: 20px; }
              .barcode-container { text-align: center; margin: 10px; page-break-after: always; }
            </style>
          </head>
          <body>
            ${Array(barcodeCount).fill().map(() => `
              <div class="barcode-container">
                ${barcodeDiv.innerHTML}
              </div>
            `).join('')}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  // PDF Export Function (Manual Table Drawing)
  function handleExportPDF() {
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Stock Details Report', 14, 15);

    // Add date and info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
    doc.text(`Total Products: ${filteredProducts.length}`, 14, 28);

    // Prepare columns and data
    const selectedColumns = [];
    const columnMapping = {
      id: 'ID',
      name: 'Product Name',
      brand: 'Brand',
      design_no: 'Design No',
      supplier: 'Supplier',
      location: 'Location',
      uom: 'UOM',
      retail_price: 'Retail Price',
      wholesale_price: 'Wholesale Price',
      cost_price: 'Cost Price',
      stock_quantity: 'Stock Qty'
    };

    Object.keys(pdfColumns).forEach(key => {
      if (pdfColumns[key]) {
        selectedColumns.push({ key, header: columnMapping[key] });
      }
    });

    if (selectedColumns.length === 0) {
      alert('Please select at least one column');
      return;
    }

    // Calculate column widths
    const tableWidth = pageWidth - 28; // 14px margin on each side
    const colWidth = tableWidth / selectedColumns.length;

    // Table starting position
    let startX = 14;
    let startY = 35;
    const rowHeight = 8;
    const headerHeight = 10;

    // Draw header
    doc.setFillColor(37, 99, 235); // Blue header
    doc.rect(startX, startY, tableWidth, headerHeight, 'F');

    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');

    selectedColumns.forEach((col, index) => {
      const x = startX + (index * colWidth) + 2;
      const y = startY + 7;
      doc.text(col.header, x, y);
    });

    // Reset text color for data rows
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    // Draw data rows
    let currentY = startY + headerHeight;
    let rowIndex = 0;

    filteredProducts.forEach((product, productIndex) => {
      // Check if we need a new page
      if (currentY + rowHeight > pageHeight - 20) {
        doc.addPage();
        currentY = 20;

        // Redraw header on new page
        doc.setFillColor(37, 99, 235);
        doc.rect(startX, currentY, tableWidth, headerHeight, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');

        selectedColumns.forEach((col, index) => {
          const x = startX + (index * colWidth) + 2;
          const y = currentY + 7;
          doc.text(col.header, x, y);
        });

        currentY += headerHeight;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        rowIndex = 0;
      }

      // Alternate row colors
      if (rowIndex % 2 === 1) {
        doc.setFillColor(245, 247, 250);
        doc.rect(startX, currentY, tableWidth, rowHeight, 'F');
      }

      // Draw cell data
      selectedColumns.forEach((col, index) => {
        const x = startX + (index * colWidth) + 2;
        const y = currentY + 6;
        let cellValue = '';

        if (col.key === 'supplier') {
          const supplier = suppliers.find(s => s.id === product.supplier_id);
          cellValue = supplier ? supplier.name : 'N/A';
        } else if (col.key === 'retail_price' || col.key === 'wholesale_price' || col.key === 'cost_price') {
          cellValue = `PKR ${parseFloat(product[col.key] || 0).toLocaleString()}`;
        } else if (col.key === 'stock_quantity') {
          cellValue = String(product[col.key] || 0);
        } else {
          cellValue = String(product[col.key] || '-');
        }

        // Truncate text if too long
        const maxWidth = colWidth - 4;
        const textWidth = doc.getTextWidth(cellValue);
        if (textWidth > maxWidth) {
          while (doc.getTextWidth(cellValue + '...') > maxWidth && cellValue.length > 0) {
            cellValue = cellValue.slice(0, -1);
          }
          cellValue += '...';
        }

        doc.text(cellValue, x, y);
      });

      // Draw row border
      doc.setDrawColor(200, 200, 200);
      doc.line(startX, currentY + rowHeight, startX + tableWidth, currentY + rowHeight);

      currentY += rowHeight;
      rowIndex++;
    });

    // Draw table border
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.rect(startX, startY, tableWidth, currentY - startY);

    // Draw vertical lines
    selectedColumns.forEach((col, index) => {
      if (index > 0) {
        const x = startX + (index * colWidth);
        doc.line(x, startY, x, currentY);
      }
    });

    // Save PDF
    const fileName = `stock-details-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    setShowPdfModal(false);
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
              📦 Product Management
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8, fontSize: '1.1rem' }}>Manage your inventory, track stock levels, and generate professional barcodes</p>
          </div>
        </div>

        {/* Enhanced Summary Cards */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginTop: '24px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 6px 20px rgba(59, 130, 246, 0.3)',
            textAlign: 'center',
            minWidth: '150px',
            flex: '1',
            maxWidth: '200px',
            transform: 'translateY(0)',
            transition: 'all 0.3s ease'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.3)';
            }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '6px' }}>
              📦 {products.length}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>Total Products</div>
            <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>Complete inventory</div>
          </div>            <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
            textAlign: 'center',
            minWidth: '150px',
            flex: '1',
            maxWidth: '200px',
            transform: 'translateY(0)',
            transition: 'all 0.3s ease'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.3)';
            }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '6px' }}>
              ✅ {products.filter(p => (p.stock_quantity || 0) > 0).length}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>In Stock</div>
            <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>Available items</div>
          </div>            <div style={{
            background: products.filter(p => (p.stock_quantity || 0) <= 5).length > 0
              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
              : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
            color: 'white',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: products.filter(p => (p.stock_quantity || 0) <= 5).length > 0
              ? '0 6px 20px rgba(245, 158, 11, 0.3)'
              : '0 6px 20px rgba(107, 114, 128, 0.3)',
            textAlign: 'center',
            minWidth: '150px',
            flex: '1',
            maxWidth: '200px',
            transform: 'translateY(0)',
            transition: 'all 0.3s ease'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              const isLowStock = products.filter(p => (p.stock_quantity || 0) <= 5).length > 0;
              e.currentTarget.style.boxShadow = isLowStock
                ? '0 8px 25px rgba(245, 158, 11, 0.4)'
                : '0 8px 25px rgba(107, 114, 128, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              const isLowStock = products.filter(p => (p.stock_quantity || 0) <= 5).length > 0;
              e.currentTarget.style.boxShadow = isLowStock
                ? '0 6px 20px rgba(245, 158, 11, 0.3)'
                : '0 6px 20px rgba(107, 114, 128, 0.3)';
            }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '6px' }}>
              {products.filter(p => (p.stock_quantity || 0) <= 5).length > 0 ? '⚠️' : '🎉'} {products.filter(p => (p.stock_quantity || 0) <= 5).length}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>Low Stock</div>
            <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>
              {products.filter(p => (p.stock_quantity || 0) <= 5).length > 0 ? 'Needs attention' : 'All good!'}
            </div>
          </div>

          {/* Additional Value Cards */}
          <div style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: 'white',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 6px 20px rgba(139, 92, 246, 0.3)',
            textAlign: 'center',
            minWidth: '150px',
            flex: '1',
            maxWidth: '200px',
            transform: 'translateY(0)',
            transition: 'all 0.3s ease'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.3)';
            }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '6px' }}>
              💰 PKR {products.length > 0 ? products.reduce((sum, p) => sum + (parseFloat(p.retail_price) || 0), 0).toLocaleString('en-PK') : '0'}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>Total Value</div>
            <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>Retail pricing</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="alert alert-success">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="flex-1">{message}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px'
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Product Update Failed</div>
            <div>{error}</div>
            {error.includes('Network') && (
              <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
                💡 Check your internet connection and try again
              </div>
            )}
            {error.includes('Unauthorized') && (
              <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
                💡 Please login again - your session may have expired
              </div>
            )}
            {error.includes('validation') && (
              <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
                💡 Check that all required fields are filled correctly
              </div>
            )}
          </div>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '16px',
              opacity: 0.7
            }}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}      {/* Enhanced Search and Filter Section */}
      <div style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        border: '2px solid #cbd5e1',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '32px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>🔍</div>
          <div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1e293b',
              margin: 0
            }}>Search & Filter</h3>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              margin: '4px 0 0 0'
            }}>Find and organize your products efficiently</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          <div className="col-span-1">
            {/* Product Search Filters */}
            {view === 'products' ? (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>🔍 Search Products</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search by name, brand, or ID..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '16px 48px 16px 16px',
                        border: '2px solid #d1d5db',
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: '#ffffff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                      }}
                    />
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          width: '24px',
                          height: '24px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >✖</button>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'flex',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px',
                    alignItems: 'center',
                    gap: '8px'
                  }}>🏭 Filter by Supplier</label>
                  <select
                    value={supplierFilter}
                    onChange={e => setSupplierFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '2px solid #d1d5db',
                      borderRadius: '12px',
                      fontSize: '16px',
                      background: '#ffffff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                    }}
                  >
                    <option value="">🌟 All Suppliers</option>
                    {suppliers.map(sup => (
                      <option key={sup.name || sup.id || Math.random()} value={sup.name || ''}>
                        🏪 {sup.name || 'Unnamed Supplier'}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'flex',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px',
                    alignItems: 'center',
                    gap: '8px'
                  }}>📦 Stock Status</label>
                  <select
                    value={stockFilter}
                    onChange={e => { setStockFilter(e.target.value); setCurrentPage(1); }}
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '2px solid #d1d5db',
                      borderRadius: '12px',
                      fontSize: '16px',
                      background: '#ffffff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                    }}
                  >
                    <option value="all">📊 All Products</option>
                    <option value="in-stock">✅ In Stock (Qty &gt; 0)</option>
                    <option value="low-stock">⚠️ Low Stock (Qty &lt; 10)</option>
                    <option value="out-of-stock">❌ Out of Stock (Qty = 0)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'flex',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px',
                      alignItems: 'center',
                      gap: '8px'
                    }}>📊 Sort by</label>
                    <select
                      value={sortField}
                      onChange={e => setSortField(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        background: '#ffffff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="id">🆔 ID (Recent First)</option>
                      <option value="name">🔤 Name</option>
                      <option value="retail_price">💰 Retail Price</option>
                      <option value="wholesale_price">🏪 Wholesale Price</option>
                      <option value="stock_quantity">📦 Stock Quantity</option>
                    </select>
                  </div>

                  <div>
                    <label style={{
                      display: 'flex',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px',
                      alignItems: 'center',
                      gap: '8px'
                    }}>🔄 Sort Order</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        style={{
                          flex: 1,
                          padding: '12px',
                          fontSize: '14px',
                          fontWeight: '600',
                          borderRadius: '8px',
                          border: '2px solid',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          ...(sortOrder === 'desc' ? {
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: 'white',
                            borderColor: '#3b82f6'
                          } : {
                            background: '#ffffff',
                            color: '#374151',
                            borderColor: '#d1d5db'
                          })
                        }}
                        onClick={() => setSortOrder('desc')}
                      >⬇️ Desc</button>
                      <button
                        style={{
                          flex: 1,
                          padding: '12px',
                          fontSize: '14px',
                          fontWeight: '600',
                          borderRadius: '8px',
                          border: '2px solid',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          ...(sortOrder === 'asc' ? {
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: 'white',
                            borderColor: '#3b82f6'
                          } : {
                            background: '#ffffff',
                            color: '#374151',
                            borderColor: '#d1d5db'
                          })
                        }}
                        onClick={() => setSortOrder('asc')}
                      >⬆️ Asc</button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Concise Sales/Sold Products Filters */
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>🔍 Quick Search</label>
                  <input
                    name="product_name"
                    placeholder="Search products or customers..."
                    value={soldFilters.product_name}
                    onChange={handleSoldFilterChange}
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '2px solid #d1d5db',
                      borderRadius: '12px',
                      fontSize: '16px',
                      background: '#ffffff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>📅 From</label>
                    <input
                      name="start_date"
                      type="date"
                      value={soldFilters.start_date}
                      onChange={handleSoldFilterChange}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        background: '#ffffff'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>📅 To</label>
                    <input
                      name="end_date"
                      type="date"
                      value={soldFilters.end_date}
                      onChange={handleSoldFilterChange}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        background: '#ffffff'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>🏪 Sale Type</label>
                  <select
                    name="sale_type"
                    value={soldFilters.sale_type}
                    onChange={handleSoldFilterChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">All Types</option>
                    <option value="retail">Retail</option>
                    <option value="wholesale">Wholesale</option>
                  </select>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setSoldFilters({
                      product_name: '',
                      brand: '',
                      customer_name: '',
                      customer_brand: '',
                      sale_type: '',
                      start_date: '',
                      end_date: '',
                      status: '',
                      sort_by: 'sale_date',
                      sort_order: 'desc'
                    })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = '#e5e7eb';
                      e.target.style.borderColor = '#9ca3af';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = '#f3f4f6';
                      e.target.style.borderColor = '#d1d5db';
                    }}
                  >
                    🗑️ Clear All Filters
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">
            {view === 'products' ? (
              <>
                Showing <strong>{startItem}-{endItem}</strong> of <strong>{filteredProducts.length}</strong> products
                {filteredProducts.length !== products.length && (
                  <span> (filtered from {products.length} total)</span>
                )}
                <span className="ml-4">Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
              </>
            ) : (
              <>
                Showing <strong>{soldStartItem}-{soldEndItem}</strong> of <strong>{soldProducts.length}</strong> sold products
                <span className="ml-4">Page <strong>{soldCurrentPage}</strong> of <strong>{soldTotalPages}</strong></span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Navigation Tabs */}
      <div className="card professional-nav-card">
        <div className="card-body">
          <div className="professional-nav-tabs">
            <button
              onClick={() => setView('products')}
              className={`nav-tab transition-colors ${view === 'products'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                }`}
              style={{
                backgroundColor: view === 'products' ? '#2563eb' : '#ffffff',
                color: view === 'products' ? '#ffffff' : '#374151',
                borderColor: view === 'products' ? '#2563eb' : '#d1d5db'
              }}
            >
              <span className="nav-icon">📦</span>
              <span className="nav-text">Product List</span>
              <span
                className="nav-badge"
                style={{
                  backgroundColor: view === 'products' ? '#1d4ed8' : '#e5e7eb',
                  color: view === 'products' ? '#ffffff' : '#6b7280'
                }}
              >
                {products.length}
              </span>
            </button>
            <button
              onClick={() => setView('sold')}
              className={`nav-tab transition-colors ${view === 'sold'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                }`}
              style={{
                backgroundColor: view === 'sold' ? '#2563eb' : '#ffffff',
                color: view === 'sold' ? '#ffffff' : '#374151',
                borderColor: view === 'sold' ? '#2563eb' : '#d1d5db'
              }}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-text">Sold Products</span>
              <span
                className="nav-badge"
                style={{
                  backgroundColor: view === 'sold' ? '#1d4ed8' : '#e5e7eb',
                  color: view === 'sold' ? '#ffffff' : '#6b7280'
                }}
              >
                {sales.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Content sections for both views */}
      {view === 'products' ? (
        <div>
          {/* Product Form Dropdown */}
          <div className="card mb-8">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="card-title">
                    {editing ? '✏️ Edit Product' : '📦 Product Management'}
                  </h2>
                  <p className="card-subtitle">
                    {editing ? 'Update product information and inventory details' : 'Manage your product inventory and information'}
                  </p>
                </div>
                {!editing && (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className={`btn ${showAddForm ? 'btn-secondary' : 'btn-primary'} flex items-center gap-2`}
                  >
                    {showAddForm ? (
                      <>
                        ✖️ <span>Cancel</span>
                      </>
                    ) : (
                      <>
                        ➕ <span>Add New Product</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Collapsible Form */}
            {(showAddForm || editing) && (
              <div className="card-body border-t border-gray-200">
                <form onSubmit={handleSubmit} className="professional-form">
                  <div className="professional-form-grid">
                    <div className="professional-input-group">
                      <label className="professional-label">
                        <span className="label-icon">📝</span>
                        Product Name *
                      </label>
                      <div className="input-wrapper">
                        <input
                          name="name"
                          placeholder="Enter product name"
                          aria-label="Product Name"
                          value={form.name}
                          onChange={handleChange}
                          required
                          className="professional-input"
                        />
                        <div className="input-focus-border"></div>
                      </div>
                    </div>

                    <div className="professional-input-group">
                      <label className="professional-label">
                        <span className="label-icon">📏</span>
                        Unit of Measure *
                      </label>
                      <div className="input-wrapper">
                        <input
                          name="uom"
                          placeholder="e.g., pieces, kg, liters"
                          value={form.uom}
                          onChange={handleChange}
                          required
                          className="professional-input"
                        />
                        <div className="input-focus-border"></div>
                      </div>
                    </div>

                    <div className="professional-input-group">
                      <label className="professional-label">
                        <span className="label-icon">🏷️</span>
                        Brand
                      </label>
                      <div className="input-wrapper">
                        <input
                          name="brand"
                          placeholder="Product brand"
                          value={form.brand}
                          onChange={handleChange}
                          className="professional-input"
                        />
                        <div className="input-focus-border"></div>
                      </div>
                    </div>

                    <div className="professional-input-group">
                      <label className="professional-label">
                        <span className="label-icon">🎨</span>
                        Design Number
                      </label>
                      <div className="input-wrapper">
                        <input
                          name="design_no"
                          placeholder="Model/Design number"
                          value={form.design_no}
                          onChange={handleChange}
                          className="professional-input"
                        />
                        <div className="input-focus-border"></div>
                      </div>
                    </div>

                    <div className="professional-input-group">
                      <label className="professional-label">
                        <span className="label-icon">📍</span>
                        Storage Location
                      </label>
                      <div className="input-wrapper">
                        <input
                          name="location"
                          placeholder="Warehouse location"
                          value={form.location}
                          onChange={handleChange}
                          className="professional-input"
                        />
                        <div className="input-focus-border"></div>
                      </div>
                    </div>

                    <div className="professional-input-group">
                      <label className="professional-label">
                        <span className="label-icon">💰</span>
                        Retail Price *
                      </label>
                      <div className="input-wrapper price-input" style={{ position: 'relative' }}>
                        <span className="currency-symbol" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>PKR</span>
                        <input
                          name="retail_price"
                          placeholder="0.00"
                          type="number"
                          step="0.01"
                          inputMode="decimal"
                          value={form.retail_price}
                          onChange={handleChange}
                          onBlur={(e) => { const v = e.target.value; if (v !== '' && !isNaN(v)) setForm(prev => ({ ...prev, retail_price: Number(v).toFixed(2) })); }}
                          required
                          className="professional-input price-field" style={{ paddingLeft: 52 }}
                        />
                        <div className="input-focus-border"></div>
                      </div>
                    </div>

                    {/* Removed earlier duplicate Cost Price group to avoid duplication */}

                    <div className="professional-input-group">
                      <label className="professional-label">
                        <span className="label-icon">💵</span>
                        Wholesale Price
                      </label>
                      <div className="input-wrapper price-input" style={{ position: 'relative' }}>
                        <span className="currency-symbol" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>PKR</span>
                        <input
                          name="wholesale_price"
                          placeholder="0.00"
                          type="number"
                          step="0.01"
                          inputMode="decimal"
                          value={form.wholesale_price}
                          onChange={handleChange}
                          onBlur={(e) => { const v = e.target.value; if (v !== '' && !isNaN(v)) setForm(prev => ({ ...prev, wholesale_price: Number(v).toFixed(2) })); }}
                          className="professional-input price-field" style={{ paddingLeft: 52 }}
                        />
                        <div className="input-focus-border"></div>
                      </div>
                    </div>

                    <div className="professional-input-group">
                      <label className="professional-label">
                        <span className="label-icon">🧾</span>
                        Cost Price *
                      </label>
                      <div className="input-wrapper price-input" style={{ position: 'relative' }}>
                        <span className="currency-symbol" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>PKR</span>
                        <input
                          name="cost_price"
                          placeholder="0.00"
                          type="number"
                          step="0.01"
                          inputMode="decimal"
                          value={form.cost_price || ''}
                          onChange={handleChange}
                          onBlur={(e) => { const v = e.target.value; if (v !== '' && !isNaN(v)) setForm(prev => ({ ...prev, cost_price: Number(v).toFixed(2) })); }}
                          required
                          className="professional-input price-field" style={{ paddingLeft: 52 }}
                        />
                        <div className="input-focus-border"></div>
                      </div>
                    </div>

                    <div className="professional-input-group">
                      <label className="professional-label">
                        <span className="label-icon">📦</span>
                        Stock Quantity *
                      </label>
                      <div className="input-wrapper">
                        <input
                          name="stock_quantity"
                          placeholder="0"
                          type="number"
                          min="0"
                          step="1"
                          value={form.stock_quantity}
                          onChange={e => {
                            const value = e.target.value;
                            // Prevent negative values and allow only integers
                            if (value === '' || (Number(value) >= 0 && Number.isInteger(Number(value)))) {
                              setForm({ ...form, stock_quantity: value });
                            }
                          }}
                          required
                          className="professional-input"
                        />
                        <div className="input-focus-border"></div>
                      </div>
                    </div>

                    <div className="professional-input-group supplier-input-group">
                      <label className="professional-label">
                        <span className="label-icon">🏭</span>
                        Supplier
                      </label>
                      <div className="input-wrapper">
                        <div className="supplier-search-wrapper">
                          <span className="search-icon">🔍</span>
                          <input
                            name="supplier"
                            placeholder="Search suppliers..."
                            value={supplierSearch || form.supplier || ''}
                            onChange={e => {
                              const value = e.target.value;
                              setSupplierSearch(value);
                              setForm({ ...form, supplier: value });
                              setSupplierDropdownOpen(true);
                            }}
                            autoComplete="off"
                            className="professional-input supplier-search"
                            onFocus={() => setSupplierDropdownOpen(true)}
                          />
                          <button
                            type="button"
                            className="dropdown-toggle-btn"
                            onClick={() => setSupplierDropdownOpen(!supplierDropdownOpen)}
                            title="Toggle supplier dropdown"
                          >
                            <span className={`dropdown-arrow ${supplierDropdownOpen ? 'open' : ''}`}>▼</span>
                          </button>
                          <div className="input-focus-border"></div>
                        </div>
                        {supplierDropdownOpen && (filteredSuppliers.length > 0 || suppliers.length > 0) && (
                          <div className="professional-dropdown">
                            {filteredSuppliers.map(sup => (
                              <div
                                key={sup.name}
                                className="dropdown-option"
                                onClick={() => {
                                  setForm({ ...form, supplier: sup.name, brand: sup.brand_name });
                                  setSupplierSearch(sup.name);
                                  setSupplierDropdownOpen(false);
                                }}
                              >
                                <div className="supplier-option-name">{sup.name}</div>
                                {sup.brand_name && <div className="supplier-option-brand">{sup.brand_name}</div>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="professional-form-actions">
                    <button type="submit" className="btn-professional btn-professional-primary" style={{ fontSize: '16px', padding: '10px 18px' }} title={editing ? 'Save changes' : 'Add new product'}>
                      <span className="btn-icon">{editing ? '💾' : '➕'}</span>
                      <span className="btn-text">{editing ? 'Update Product' : 'Add Product'}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-professional btn-professional-secondary"
                      onClick={() => {
                        setEditing(null);
                        setShowAddForm(false);
                        setForm({ id: '', name: '', brand: '', design_no: '', location: '', uom: '', retail_price: '', wholesale_price: '', cost_price: '', stock_quantity: '', supplier: '' });
                        setSupplierSearch('');
                        setSupplierDropdownOpen(false);
                        setError(null);
                        setMessage(null);
                      }}
                    >
                      <span className="btn-icon">✖️</span>
                      <span className="btn-text">Cancel</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Products Table */}
          <div className="table-container">
            {/* Column selector and PDF Export */}
            <div className="mb-3" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className="btn btn-success"
                onClick={() => setShowPdfModal(true)}
                title="Export to PDF"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#047857';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#059669';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                📄 Export PDF
              </button>
              <button className="btn btn-outline" onClick={() => setProductColumnsOpen(!productColumnsOpen)} title="Choose table columns">Columns</button>
            </div>
            {productColumnsOpen && (
              <div className="card" style={{ padding: 12, marginBottom: 12 }}>
                {allProductColumns.map(col => (
                  <label key={col.key} style={{ marginRight: 12 }}>
                    <input type="checkbox" checked={visibleProductColumns.includes(col.key)} onChange={e => {
                      if (e.target.checked) setVisibleProductColumns(prev => Array.from(new Set([...prev, col.key])));
                      else setVisibleProductColumns(prev => prev.filter(k => k !== col.key));
                    }} /> {col.label}
                  </label>
                ))}
              </div>
            )}
            <table className="table">
              <thead>
                <tr>
                  {visibleProductColumns.includes('id') && (<th>🔢 ID</th>)}
                  {visibleProductColumns.includes('product') && (<th>📦 Product</th>)}
                  {visibleProductColumns.includes('brand') && (<th>🏷️ Brand & Design</th>)}
                  {visibleProductColumns.includes('supplier') && (<th>🏭 Supplier</th>)}
                  {visibleProductColumns.includes('location') && (<th>📍 Location</th>)}
                  {visibleProductColumns.includes('pricing') && (<th>💰 Pricing</th>)}
                  {visibleProductColumns.includes('cost') && (<th>🧾 Cost</th>)}
                  {visibleProductColumns.includes('stock') && (<th>📊 Stock</th>)}
                  {visibleProductColumns.includes('sales') && (<th>📈 Sales</th>)}
                  {visibleProductColumns.includes('actions') && (<th>⚡ Actions</th>)}
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-gray-500">
                      {search || supplierFilter ? 'No products found matching your criteria.' : 'No products added yet.'}
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map(prod => (
                    <tr
                      key={prod.id}
                      onDoubleClick={() => handleDoubleClick(prod)}
                      style={{
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      title="Double-click to edit this product"
                    >
                      {visibleProductColumns.includes('id') && (
                        <td>
                          <div className="font-mono text-sm">{prod.id}</div>
                        </td>
                      )}
                      {visibleProductColumns.includes('product') && (
                        <td>
                          <div>
                            <div className="font-semibold text-gray-900">{prod.name}</div>
                            <div className="text-sm text-gray-500">{prod.uom}</div>
                          </div>
                        </td>
                      )}
                      {visibleProductColumns.includes('brand') && (
                        <td>
                          <div>
                            <div className="text-sm">{prod.brand || 'No brand'}</div>
                            <div className="text-sm text-gray-500">{prod.design_no || 'No design'}</div>
                          </div>
                        </td>
                      )}
                      {visibleProductColumns.includes('supplier') && (
                        <td>
                          <div className="text-sm font-medium text-blue-600">
                            {prod.supplier || 'No supplier'}
                          </div>
                        </td>
                      )}
                      {visibleProductColumns.includes('location') && (
                        <td>
                          <div className="text-sm">{prod.location || 'Not specified'}</div>
                        </td>
                      )}
                      {visibleProductColumns.includes('pricing') && (
                        <td>
                          <div>
                            <div className="font-semibold text-success">PKR {parseFloat(prod.retail_price || 0).toFixed(2)}</div>
                            <div className="text-sm text-gray-500">PKR {parseFloat(prod.wholesale_price || 0).toFixed(2)} wholesale</div>
                          </div>
                        </td>
                      )}
                      {visibleProductColumns.includes('cost') && (
                        <td>
                          <div className="text-sm">PKR {parseFloat(prod.cost_price || 0).toFixed(2)}</div>
                        </td>
                      )}
                      {visibleProductColumns.includes('stock') && (
                        <td>
                          <div className={`text-center px-2 py-1 rounded ${prod.stock_quantity <= 5 ? 'bg-red-100 text-red-800' :
                            prod.stock_quantity <= 20 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                            {prod.stock_quantity || 0}
                          </div>
                        </td>
                      )}
                      {visibleProductColumns.includes('sales') && (
                        <td>
                          <div className="text-center font-semibold">{prod.total_sold || 0}</div>
                        </td>
                      )}
                      {visibleProductColumns.includes('actions') && (
                        <td>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEdit(prod)}
                              className="btn btn-sm btn-secondary"
                              title="Edit product"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(prod.id)}
                              className="btn btn-sm btn-danger"
                              title="Delete product"
                            >
                              🗑️
                            </button>
                            <button
                              onClick={() => handleShowBarcode(prod)}
                              className="btn btn-sm btn-outline"
                              title="Generate barcode"
                            >
                              📊
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {view === 'products' && itemsPerPage !== 'all' && totalPages > 1 && (
            <div style={{
              marginTop: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              padding: '1rem',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              {/* Items per page selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
                  Show:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  style={{
                    padding: '6px 12px',
                    border: '2px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="all">All</option>
                </select>
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>per page</span>
              </div>

              {/* Page navigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* First page */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 12px',
                    border: '2px solid #d1d5db',
                    borderRadius: '6px',
                    background: currentPage === 1 ? '#f3f4f6' : 'white',
                    color: currentPage === 1 ? '#9ca3af' : '#374151',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  ««
                </button>

                {/* Previous page */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 12px',
                    border: '2px solid #d1d5db',
                    borderRadius: '6px',
                    background: currentPage === 1 ? '#f3f4f6' : 'white',
                    color: currentPage === 1 ? '#9ca3af' : '#374151',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  ‹ Prev
                </button>

                {/* Page numbers */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        style={{
                          padding: '8px 12px',
                          border: `2px solid ${currentPage === pageNum ? '#3b82f6' : '#d1d5db'}`,
                          borderRadius: '6px',
                          background: currentPage === pageNum ? '#3b82f6' : 'white',
                          color: currentPage === pageNum ? 'white' : '#374151',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          minWidth: '40px'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next page */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 12px',
                    border: '2px solid #d1d5db',
                    borderRadius: '6px',
                    background: currentPage === totalPages ? '#f3f4f6' : 'white',
                    color: currentPage === totalPages ? '#9ca3af' : '#374151',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Next ›
                </button>

                {/* Last page */}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 12px',
                    border: '2px solid #d1d5db',
                    borderRadius: '6px',
                    background: currentPage === totalPages ? '#f3f4f6' : 'white',
                    color: currentPage === totalPages ? '#9ca3af' : '#374151',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  »»
                </button>
              </div>

              {/* Page info */}
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}

          {/* Barcode Modal */}
          {barcodeProduct && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title">📊 Barcode for {barcodeProduct.name}</h3>
                </div>
                <div className="modal-body">
                  <div id="barcode-to-print" className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg mb-4">
                    <Barcode value={barcodeProduct.id} width={2} height={60} fontSize={16} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Print Count</label>
                    <input
                      type="number"
                      min={1}
                      value={barcodeCount}
                      onChange={e => setBarcodeCount(Number(e.target.value))}
                      className="form-input w-20"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-primary" onClick={handlePrintBarcode}>
                    🖨️ Print
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={async () => {
                      const barcodeDiv = document.getElementById('barcode-to-print');
                      if (!barcodeDiv) return;
                      const canvas = await html2canvas(barcodeDiv, { width: 192, height: 96, scale: 2 });
                      const link = document.createElement('a');
                      link.download = `${barcodeProduct.id}-barcode.png`;
                      link.href = canvas.toDataURL('image/png');
                      link.click();
                    }}
                  >
                    💾 Save PNG
                  </button>
                  <button className="btn btn-outline" onClick={() => setBarcodeProduct(null)}>
                    ✖️ Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Sold Products View - Product-Centric */
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="icon">📊</span>
              Sold Products Analysis
            </h2>
            <p className="card-subtitle">
              Track individual product sales and movement history
            </p>
          </div>
          <div className="card-body">
            {/* Sold Products Summary Cards */}
            {soldProductsSummary && Object.keys(soldProductsSummary).length > 0 && (
              <div style={{
                width: '100%',
                marginBottom: '24px',
                overflowX: 'auto'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: '16px 0',
                  tableLayout: 'fixed'
                }}>
                  <tbody>
                    <tr>
                      <td style={{
                        width: '20%',
                        minWidth: '180px',
                        background: 'linear-gradient(to right, #eff6ff, #dbeafe)',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #bfdbfe',
                        textAlign: 'left',
                        verticalAlign: 'top'
                      }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#2563eb', marginBottom: '4px' }}>Total Revenue</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a' }}>
                          PKR {(soldProductsSummary.totalRevenue || 0).toFixed(2)}
                        </div>
                      </td>

                      <td style={{
                        width: '20%',
                        minWidth: '150px',
                        background: 'linear-gradient(to right, #f0fdf4, #dcfce7)',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #bbf7d0',
                        textAlign: 'left',
                        verticalAlign: 'top'
                      }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#16a34a', marginBottom: '4px' }}>Items Sold</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#14532d' }}>
                          {soldProductsSummary.totalQuantity || 0}
                        </div>
                      </td>

                      <td style={{
                        width: '20%',
                        minWidth: '170px',
                        background: 'linear-gradient(to right, #faf5ff, #f3e8ff)',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #c4b5fd',
                        textAlign: 'left',
                        verticalAlign: 'top'
                      }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#9333ea', marginBottom: '4px' }}>Unique Products</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#581c87' }}>
                          {soldProductsSummary.uniqueProducts || 0}
                        </div>
                      </td>

                      <td style={{
                        width: '20%',
                        minWidth: '180px',
                        background: 'linear-gradient(to right, #fff7ed, #fed7aa)',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #fdba74',
                        textAlign: 'left',
                        verticalAlign: 'top'
                      }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#ea580c', marginBottom: '4px' }}>Total Discounts</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9a3412' }}>
                          PKR {(soldProductsSummary.totalDiscount || 0).toFixed(2)}
                        </div>
                      </td>

                      <td style={{
                        width: '20%',
                        minWidth: '150px',
                        background: 'linear-gradient(to right, #f0fdfa, #ccfbf1)',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #5eead4',
                        textAlign: 'left',
                        verticalAlign: 'top'
                      }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#0d9488', marginBottom: '4px' }}>Customers</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#134e4a' }}>
                          {soldProductsSummary.uniqueCustomers || 0}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Enhanced Sort and Filter Controls */}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              border: '2px solid #cbd5e1',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                gap: '24px',
                alignItems: 'end',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <label style={{
                    display: 'flex',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px',
                    alignItems: 'center',
                    gap: '8px'
                  }}>📊 Sort by</label>
                  <select
                    name="sort_by"
                    value={soldFilters.sort_by}
                    onChange={handleSoldFilterChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #d1d5db',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      background: '#ffffff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                    }}
                  >
                    <option value="total_quantity">📦 Total Quantity Sold</option>
                    <option value="product_name">🔤 Product Name</option>
                    <option value="total_revenue">💰 Total Revenue</option>
                    <option value="profit">📈 Estimated Profit</option>
                    <option value="transactions_count">🛒 Sales Count</option>
                    <option value="last_sale_date">📅 Last Sale Date</option>
                  </select>
                </div>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <label style={{
                    display: 'flex',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px',
                    alignItems: 'center',
                    gap: '8px'
                  }}>🔄 Sort Order</label>
                  <select
                    name="sort_order"
                    value={soldFilters.sort_order}
                    onChange={handleSoldFilterChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #d1d5db',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      background: '#ffffff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                    }}
                  >
                    <option value="desc">⬇️ Highest to Lowest</option>
                    <option value="asc">⬆️ Lowest to Highest</option>
                  </select>
                </div>
              </div>
            </div>

            {salesLoading ? (
              <div className="text-center py-8">
                <div className="loading-spinner"></div>
                <p>Loading sold products data...</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>📦 Product Details</th>
                      <th>📅 Sale Date</th>
                      <th>👤 Customer</th>
                      <th>🏪 Sale Type</th>
                      <th>📊 Quantity</th>
                      <th>💰 Unit Price</th>
                      <th>🎯 Item Discount</th>
                      <th>📈 Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!paginatedSoldProducts || paginatedSoldProducts.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-8 text-gray-500">
                          No sold products found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedSoldProducts.map(product => (
                        <tr key={product.product_id} className="hover:bg-gray-50">
                          {/* Product Details */}
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                                {product.display_name || product.product_name}
                                {product.is_deleted_product && (
                                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full border border-red-200">
                                    Deleted Product
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {(product.display_brand || product.product_brand) && `${product.display_brand || product.product_brand} • `}
                                {(product.display_design || product.product_design) && `${product.display_design || product.product_design} • `}
                                <span className="font-medium">{product.display_uom || product.product_uom}</span>
                              </div>
                              {(product.display_category || product.product_category) && (
                                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-2 inline-block">
                                  {product.display_category || product.product_category}
                                </div>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                {product.is_deleted_product ? (
                                  <span className="text-red-600 font-medium">Product no longer exists</span>
                                ) : (
                                  <>Stock: <span className="font-medium">{product.current_stock || 0}</span></>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Sales Overview */}
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="font-bold text-2xl text-blue-600">
                                {product.total_quantity_sold || 0}
                              </div>
                              <div className="text-xs text-gray-500">Total Sold</div>
                              <div className="text-sm">
                                <span className="font-medium">{product.total_sales_transactions || 0}</span> transactions
                              </div>
                              <div className="text-xs text-gray-500">
                                {product.unique_customers_count || 0} unique customers
                              </div>
                            </div>
                          </td>

                          {/* Revenue Analysis */}
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="font-bold text-lg text-green-600">
                                PKR {parseFloat(product.total_net_revenue || 0).toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500">Net Revenue</div>
                              <div className="text-sm text-gray-600">
                                Gross: PKR {parseFloat(product.total_gross_revenue || 0).toFixed(2)}
                              </div>
                              <div className="text-sm text-orange-600">
                                Discounts: PKR {parseFloat(product.total_discounts_given || 0).toFixed(2)}
                              </div>
                            </div>
                          </td>

                          {/* Price Analysis */}
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="text-sm">
                                <span className="text-gray-500">Avg:</span> PKR {parseFloat(product.average_sale_price || 0).toFixed(2)}
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-500">Range:</span> PKR {parseFloat(product.lowest_sale_price || 0).toFixed(2)} - PKR {parseFloat(product.highest_sale_price || 0).toFixed(2)}
                              </div>
                              {!product.is_deleted_product ? (
                                <>
                                  <div className="text-xs text-gray-500 mt-2">
                                    Current Prices:
                                  </div>
                                  <div className="text-xs">
                                    Retail: PKR {parseFloat(product.current_retail_price || 0).toFixed(2)}
                                  </div>
                                  <div className="text-xs">
                                    Wholesale: PKR {parseFloat(product.current_wholesale_price || 0).toFixed(2)}
                                  </div>
                                </>
                              ) : (
                                <div className="text-xs text-red-600 mt-2">
                                  <span className="font-medium">Product deleted</span><br />
                                  Current prices unavailable
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Sales Breakdown */}
                          <td className="px-4 py-3">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-400 rounded"></div>
                                <div className="text-sm">
                                  <span className="font-medium">{product.retail_quantity || 0}</span> Retail
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                PKR {parseFloat(product.retail_revenue || 0).toFixed(2)}
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-blue-400 rounded"></div>
                                <div className="text-sm">
                                  <span className="font-medium">{product.wholesale_quantity || 0}</span> Wholesale
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                PKR {parseFloat(product.wholesale_revenue || 0).toFixed(2)}
                              </div>
                            </div>
                          </td>

                          {/* Customer Base */}
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="font-medium text-sm">
                                {product.unique_customers_count || 0} customers
                              </div>
                              {product.wholesale_customers && (
                                <div className="text-xs text-gray-600 max-w-32">
                                  <div className="truncate" title={product.wholesale_customers}>
                                    {product.wholesale_customers}
                                  </div>
                                </div>
                              )}
                              {(product.retail_quantity || 0) > 0 && (
                                <div className="text-xs text-gray-500">
                                  + Walk-in customers
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Timeline */}
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="text-sm font-medium">
                                Last Sale:
                              </div>
                              <div className="text-sm text-gray-600">
                                {product.last_sale_date ? new Date(product.last_sale_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                }) : 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                First Sale:
                              </div>
                              <div className="text-xs text-gray-600">
                                {product.first_sale_date ? new Date(product.first_sale_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                }) : 'N/A'}
                              </div>
                            </div>
                          </td>

                          {/* Profitability */}
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className={`font-bold text-lg ${parseFloat(product.estimated_profit || 0) >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                                }`}>
                                PKR {parseFloat(product.estimated_profit || 0).toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500">Estimated Profit</div>
                              <div className={`text-sm font-medium ${parseFloat(product.profit_margin_percentage || 0) >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                                }`}>
                                {parseFloat(product.profit_margin_percentage || 0).toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-500">Margin</div>
                              <div className="text-xs text-gray-600 mt-2">
                                {product.is_deleted_product ? (
                                  <span className="text-red-600">Cost data unavailable</span>
                                ) : (
                                  <>Cost: PKR {parseFloat(product.current_cost_price || 0).toFixed(2)}</>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sold Products Pagination Controls */}
            {soldItemsPerPage !== 'all' && soldTotalPages > 1 && (
              <div style={{
                marginTop: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                padding: '1rem',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                borderRadius: '12px',
                border: '1px solid #f59e0b'
              }}>
                {/* Items per page selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#92400e', fontWeight: '500' }}>
                    Show:
                  </span>
                  <select
                    value={soldItemsPerPage}
                    onChange={(e) => handleSoldItemsPerPageChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    style={{
                      padding: '6px 12px',
                      border: '2px solid #f59e0b',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value="all">All</option>
                  </select>
                  <span style={{ fontSize: '0.875rem', color: '#92400e' }}>per page</span>
                </div>

                {/* Page navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* First page */}
                  <button
                    onClick={() => handleSoldPageChange(1)}
                    disabled={soldCurrentPage === 1}
                    style={{
                      padding: '8px 12px',
                      border: '2px solid #f59e0b',
                      borderRadius: '6px',
                      background: soldCurrentPage === 1 ? '#fef3c7' : 'white',
                      color: soldCurrentPage === 1 ? '#92400e' : '#92400e',
                      cursor: soldCurrentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    ««
                  </button>

                  {/* Previous page */}
                  <button
                    onClick={() => handleSoldPageChange(soldCurrentPage - 1)}
                    disabled={soldCurrentPage === 1}
                    style={{
                      padding: '8px 12px',
                      border: '2px solid #f59e0b',
                      borderRadius: '6px',
                      background: soldCurrentPage === 1 ? '#fef3c7' : 'white',
                      color: soldCurrentPage === 1 ? '#92400e' : '#92400e',
                      cursor: soldCurrentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    ‹ Prev
                  </button>

                  {/* Page numbers */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {Array.from({ length: Math.min(5, soldTotalPages) }, (_, i) => {
                      let pageNum;
                      if (soldTotalPages <= 5) {
                        pageNum = i + 1;
                      } else if (soldCurrentPage <= 3) {
                        pageNum = i + 1;
                      } else if (soldCurrentPage >= soldTotalPages - 2) {
                        pageNum = soldTotalPages - 4 + i;
                      } else {
                        pageNum = soldCurrentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handleSoldPageChange(pageNum)}
                          style={{
                            padding: '8px 12px',
                            border: `2px solid ${soldCurrentPage === pageNum ? '#f59e0b' : '#f59e0b'}`,
                            borderRadius: '6px',
                            background: soldCurrentPage === pageNum ? '#f59e0b' : 'white',
                            color: soldCurrentPage === pageNum ? 'white' : '#92400e',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            minWidth: '40px'
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next page */}
                  <button
                    onClick={() => handleSoldPageChange(soldCurrentPage + 1)}
                    disabled={soldCurrentPage === soldTotalPages}
                    style={{
                      padding: '8px 12px',
                      border: '2px solid #f59e0b',
                      borderRadius: '6px',
                      background: soldCurrentPage === soldTotalPages ? '#fef3c7' : 'white',
                      color: soldCurrentPage === soldTotalPages ? '#92400e' : '#92400e',
                      cursor: soldCurrentPage === soldTotalPages ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    Next ›
                  </button>

                  {/* Last page */}
                  <button
                    onClick={() => handleSoldPageChange(soldTotalPages)}
                    disabled={soldCurrentPage === soldTotalPages}
                    style={{
                      padding: '8px 12px',
                      border: '2px solid #f59e0b',
                      borderRadius: '6px',
                      background: soldCurrentPage === soldTotalPages ? '#fef3c7' : 'white',
                      color: soldCurrentPage === soldTotalPages ? '#92400e' : '#92400e',
                      cursor: soldCurrentPage === soldTotalPages ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    »»
                  </button>
                </div>

                {/* Page info */}
                <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                  Page {soldCurrentPage} of {soldTotalPages}
                </div>
              </div>
            )}
            )
          </div>
        </div>
      )}

      {/* Product Performance Dictionary */}
      {
        sales.length > 0 && (
          <div className="mt-6">
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">
                  <span className="icon">📊</span>
                  Product Performance Dictionary
                </h4>
                <p className="text-sm text-gray-600 mt-2">
                  Comprehensive analysis of product sales across all filtered transactions
                </p>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Product Statistics */}
                  <div>
                    <h5 className="font-bold text-gray-700 mb-4 flex items-center">
                      <span className="mr-2">📦</span>
                      Products Sold - Detailed Analysis
                    </h5>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {(() => {
                        const productStats = {};
                        sales.forEach(sale => {
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
                      <span className="mr-2">🏢</span>
                      Customer Brand Analysis
                    </h5>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {(() => {
                        const brandStats = {};
                        sales.forEach(sale => {
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
                </div>

                {/* Summary Statistics */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h5 className="font-bold text-gray-700 mb-4 flex items-center">
                    <span className="mr-2">📈</span>
                    Overall Summary
                  </h5>

                  {/* Quick Stats in One Line */}
                  <div className="flex flex-wrap gap-6 justify-center items-center bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-purple-600">Total Unique Products:</span>
                      <span className="text-lg font-bold text-purple-900">
                        {(() => {
                          const uniqueProducts = new Set();
                          sales.forEach(sale => {
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
                          sales.forEach(sale => {
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
                        PKR {sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="w-px h-8 bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-cyan-600">Total Transactions:</span>
                      <span className="text-lg font-bold text-cyan-900">
                        {sales.length}
                      </span>
                    </div>
                  </div>

                  {/* Detailed Product Sales Summary */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h6 className="font-bold text-blue-900 mb-3 flex items-center">
                      <span className="mr-2">🛍️</span>
                      All Products Sold (Detailed Summary)
                    </h6>
                    <div className="text-sm text-blue-800">
                      {(() => {
                        const productSummary = {};
                        let totalUnits = 0;

                        sales.forEach(sale => {
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
                              {sortedProducts || 'No products sold yet'}
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
                        <span className="mr-2">💰</span>
                        Revenue Analysis
                      </h6>
                      <div className="text-sm text-green-800 space-y-1">
                        <div>Total Revenue: PKR {sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0).toFixed(2)}</div>
                        <div>Avg per Transaction: PKR {sales.length > 0 ? (sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0) / sales.length).toFixed(2) : '0.00'}</div>
                        <div>Highest Sale: PKR {sales.length > 0 ? Math.max(...sales.map(s => parseFloat(s.total_amount || 0))).toFixed(2) : '0.00'}</div>
                        <div>Lowest Sale: PKR {sales.length > 0 ? Math.min(...sales.map(s => parseFloat(s.total_amount || 0))).toFixed(2) : '0.00'}</div>
                      </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h6 className="font-bold text-orange-900 mb-2 flex items-center">
                        <span className="mr-2">📦</span>
                        Inventory Movement
                      </h6>
                      <div className="text-sm text-orange-800 space-y-1">
                        <div>Avg Items per Sale: {sales.length > 0 ? (sales.reduce((sum, sale) => sum + (sale.items ? sale.items.reduce((itemSum, item) => itemSum + parseInt(item.quantity || 0), 0) : 0), 0) / sales.length).toFixed(1) : '0'}</div>
                        <div>Most Sold Product: {(() => {
                          const productCounts = {};
                          sales.forEach(sale => {
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
                        <span className="mr-2">👥</span>
                        Customer Analysis
                      </h6>
                      <div className="text-sm text-purple-800 space-y-1">
                        <div>Wholesale Sales: {sales.filter(s => s.customer_brand_name).length}</div>
                        <div>Retail Sales: {sales.filter(s => !s.customer_brand_name).length}</div>
                        <div>Top Customer: {(() => {
                          const customerRevenue = {};
                          sales.forEach(sale => {
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
        )
      }

      {/* Edit Product Popup Modal */}
      {showEditPopup && (
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
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '0',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e5e7eb'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f8fafc',
              borderRadius: '12px 12px 0 0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h2 style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    ✏️ Edit Product
                  </h2>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    color: '#64748b'
                  }}>
                    Update product information and inventory details
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEditPopup(false);
                    setEditing(null);
                    setForm({ id: '', name: '', brand: '', design_no: '', location: '', uom: '', retail_price: '', wholesale_price: '', cost_price: '', stock_quantity: '', supplier: '' });
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '8px',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f1f5f9';
                    e.target.style.color = '#334155';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#64748b';
                  }}
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <form onSubmit={handleSubmit} className="professional-form">
                <div className="professional-form-grid">
                  <div className="professional-input-group">
                    <label className="professional-label">
                      <span className="label-icon">📝</span>
                      Product Name *
                    </label>
                    <div className="input-wrapper">
                      <input
                        name="name"
                        placeholder="Enter product name"
                        aria-label="Product Name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                  </div>

                  <div className="professional-input-group">
                    <label className="professional-label">
                      <span className="label-icon">🏷️</span>
                      Brand
                    </label>
                    <div className="input-wrapper">
                      <input
                        name="brand"
                        placeholder="Enter brand name"
                        aria-label="Brand"
                        value={form.brand}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                  </div>

                  <div className="professional-input-group">
                    <label className="professional-label">
                      <span className="label-icon">🎨</span>
                      Design No
                    </label>
                    <div className="input-wrapper">
                      <input
                        name="design_no"
                        placeholder="Enter design number"
                        aria-label="Design Number"
                        value={form.design_no}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                  </div>

                  <div className="professional-input-group">
                    <label className="professional-label">
                      <span className="label-icon">📍</span>
                      Location
                    </label>
                    <div className="input-wrapper">
                      <input
                        name="location"
                        placeholder="Enter storage location"
                        aria-label="Location"
                        value={form.location}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                  </div>

                  <div className="professional-input-group">
                    <label className="professional-label">
                      <span className="label-icon">📏</span>
                      Unit of Measure *
                    </label>
                    <div className="input-wrapper">
                      <input
                        name="uom"
                        placeholder="e.g., pcs, kg, meter"
                        aria-label="Unit of Measure"
                        value={form.uom}
                        onChange={handleChange}
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                  </div>

                  <div className="professional-input-group">
                    <label className="professional-label">
                      <span className="label-icon">💰</span>
                      Retail Price
                    </label>
                    <div className="input-wrapper">
                      <input
                        name="retail_price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        aria-label="Retail Price"
                        value={form.retail_price}
                        onChange={handleChange}
                        onBlur={(e) => { const v = e.target.value; if (v !== '' && !isNaN(v)) setForm(prev => ({ ...prev, retail_price: Number(v).toFixed(2) })); }}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                  </div>

                  <div className="professional-input-group">
                    <label className="professional-label">
                      <span className="label-icon">🏪</span>
                      Wholesale Price
                    </label>
                    <div className="input-wrapper">
                      <input
                        name="wholesale_price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        aria-label="Wholesale Price"
                        value={form.wholesale_price}
                        onChange={handleChange}
                        onBlur={(e) => { const v = e.target.value; if (v !== '' && !isNaN(v)) setForm(prev => ({ ...prev, wholesale_price: Number(v).toFixed(2) })); }}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                  </div>

                  <div className="professional-input-group">
                    <label className="professional-label">
                      <span className="label-icon">🧾</span>
                      Cost Price
                    </label>
                    <div className="input-wrapper">
                      <input
                        name="cost_price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        aria-label="Cost Price"
                        value={form.cost_price}
                        onChange={handleChange}
                        onBlur={(e) => { const v = e.target.value; if (v !== '' && !isNaN(v)) setForm(prev => ({ ...prev, cost_price: Number(v).toFixed(2) })); }}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                  </div>

                  <div className="professional-input-group">
                    <label className="professional-label">
                      <span className="label-icon">📦</span>
                      Stock Quantity
                    </label>
                    <div className="input-wrapper">
                      <input
                        name="stock_quantity"
                        type="number"
                        placeholder="0"
                        aria-label="Stock Quantity"
                        value={form.stock_quantity}
                        onChange={(e) => {
                          const value = e.target.value;
                          setForm({ ...form, stock_quantity: value });
                        }}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                  </div>

                  <div className="professional-input-group">
                    <label className="professional-label">
                      <span className="label-icon">🏭</span>
                      Supplier
                    </label>
                    <div className="input-wrapper" style={{ position: 'relative' }}>
                      <input
                        name="supplier"
                        placeholder="Search suppliers..."
                        aria-label="Supplier"
                        value={form.supplier}
                        onChange={(e) => {
                          const value = e.target.value;
                          setForm({ ...form, supplier: value });
                        }}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div style={{
                  marginTop: '32px',
                  paddingTop: '24px',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditPopup(false);
                      setEditing(null);
                      setForm({ id: '', name: '', brand: '', design_no: '', location: '', uom: '', retail_price: '', wholesale_price: '', cost_price: '', stock_quantity: '', supplier: '' });
                    }}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#f8fafc',
                      color: '#475569',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f1f5f9';
                      e.target.style.borderColor = '#cbd5e1';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#f8fafc';
                      e.target.style.borderColor = '#e2e8f0';
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: '2px solid #2563eb',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#1d4ed8';
                      e.target.style.borderColor = '#1d4ed8';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#2563eb';
                      e.target.style.borderColor = '#2563eb';
                    }}
                  >
                    <span>💾</span>
                    <span>Update Product</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Modal */}
      {showPdfModal && (
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
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
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
                <span style={{ fontSize: '24px' }}>📄</span>
                Export Stock Details to PDF
              </h3>
              <p style={{
                margin: '5px 0 0 0',
                fontSize: '14px',
                color: '#d1fae5'
              }}>
                Select the columns you want to include in your PDF report
              </p>
            </div>

            {/* Content */}
            <div style={{
              padding: '30px',
              maxHeight: 'calc(90vh - 200px)',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px'
              }}>
                {Object.keys(pdfColumns).map(column => (
                  <label key={column} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: pdfColumns[column] ? '#f0fdf4' : '#f9fafb',
                    border: `2px solid ${pdfColumns[column] ? '#86efac' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}
                    onMouseEnter={(e) => {
                      if (!pdfColumns[column]) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!pdfColumns[column]) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }
                    }}>
                    <input
                      type="checkbox"
                      checked={pdfColumns[column]}
                      onChange={(e) => setPdfColumns({
                        ...pdfColumns,
                        [column]: e.target.checked
                      })}
                      style={{
                        marginRight: '10px',
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ textTransform: 'capitalize' }}>
                      {column === 'id' ? 'ID' :
                        column === 'uom' ? 'UOM' :
                          column === 'design_no' ? 'Design Number' :
                            column.replace(/_/g, ' ')}
                    </span>
                  </label>
                ))}
              </div>

              {/* Summary */}
              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#f0f9ff',
                border: '2px solid #bae6fd',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#0c4a6e' }}>
                    📊 Products to export:
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#0369a1' }}>
                    {filteredProducts.length}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <span style={{ fontWeight: '600', color: '#0c4a6e' }}>
                    ✅ Selected columns:
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#0369a1' }}>
                    {Object.values(pdfColumns).filter(Boolean).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '20px 30px',
              backgroundColor: '#f9fafb',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowPdfModal(false)}
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
                onClick={handleExportPDF}
                disabled={Object.values(pdfColumns).filter(Boolean).length === 0}
                style={{
                  padding: '12px 32px',
                  backgroundColor: Object.values(pdfColumns).filter(Boolean).length === 0 ? '#9ca3af' : '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: Object.values(pdfColumns).filter(Boolean).length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  boxShadow: Object.values(pdfColumns).filter(Boolean).length === 0 ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (Object.values(pdfColumns).filter(Boolean).length > 0) {
                    e.target.style.backgroundColor = '#047857';
                    e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (Object.values(pdfColumns).filter(Boolean).length > 0) {
                    e.target.style.backgroundColor = '#059669';
                    e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                📥 Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


export default Products;