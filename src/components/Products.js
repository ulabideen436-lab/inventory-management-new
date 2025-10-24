import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useCallback, useEffect, useState } from 'react';
import Barcode from 'react-barcode';
import { usePersistentState } from '../hooks/usePersistentState';

function Products() {
  const [view, setView] = useState('products'); // 'products' or 'sold'
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ id: '', name: '', brand: '', design_no: '', location: '', uom: '', retail_price: '', wholesale_price: '', cost_price: '', stock_quantity: '', supplier: '' });
  const [suppliers, setSuppliers] = useState([]);

  // Additional state for form and error handling
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Product filters with persistent state
  const [search, setSearch] = usePersistentState('products_search', '');
  const [supplierSearch, setSupplierSearch] = usePersistentState('products_supplier_search', '');
  const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false);
  const [supplierFilter, setSupplierFilter] = usePersistentState('products_supplier_filter', '');
  const [sortField, setSortField] = usePersistentState('products_sort_field', 'id');
  const [sortOrder, setSortOrder] = usePersistentState('products_sort_order', 'desc');

  // Pagination state for products
  const [currentPage, setCurrentPage] = usePersistentState('products_current_page', 1);
  const [itemsPerPage, setItemsPerPage] = usePersistentState('products_items_per_page', 25);

  // Sold products state and filters
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

  // Pagination state for sold products
  const [soldCurrentPage, setSoldCurrentPage] = usePersistentState('products_sold_current_page', 1);
  const [soldItemsPerPage, setSoldItemsPerPage] = usePersistentState('products_sold_items_per_page', 25);
  const [salesLoading, setSalesLoading] = useState(false);

  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [barcodeCount, setBarcodeCount] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  // Column visibility for products table
  const allProductColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Product Name' },
    { key: 'uom', label: 'Unit of Measure' },
    { key: 'brand', label: 'Brand' },
    { key: 'design_no', label: 'Design Number' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'location', label: 'Location' },
    { key: 'retail_price', label: 'Retail Price' },
    { key: 'wholesale_price', label: 'Wholesale Price' },
    { key: 'cost_price', label: 'Cost Price' },
    { key: 'stock_quantity', label: 'Stock Quantity' },
    { key: 'total_sold', label: 'Total Sold' },
    { key: 'actions', label: 'Actions' },
  ];
  const [productColumnsOpen, setProductColumnsOpen] = useState(false);
  const [visibleProductColumns, setVisibleProductColumns] = useState(['id', 'name', 'brand', 'supplier', 'retail_price', 'stock_quantity', 'actions']);

  // PDF export states
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [pdfColumns, setPdfColumns] = useState(['id', 'name', 'brand', 'supplier', 'retail_price', 'stock_quantity']);

  // Token for API requests
  const token = localStorage.getItem('token');



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

  // PDF Download function
  const downloadProductsPDF = useCallback(() => {
    if (filteredProducts.length === 0) {
      alert('No products to download. Please check your filters.');
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a4'); // landscape orientation
    const currentDate = new Date().toLocaleDateString();

    // Add title
    doc.setFontSize(16);
    doc.text('Products Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${currentDate}`, 14, 22);
    doc.text(`Total Products: ${filteredProducts.length}`, 14, 27);

    // Filter applied text
    const activeFilters = [];
    if (search) activeFilters.push(`Search: "${search}"`);
    if (supplierFilter) {
      activeFilters.push(`Supplier: "${supplierFilter}"`);
    }
    if (activeFilters.length > 0) {
      doc.text(`Filters Applied: ${activeFilters.join(', ')}`, 14, 32);
    }

    // Manual table creation without autoTable
    let y = activeFilters.length > 0 ? 42 : 37;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    const rowHeight = 6;
    const headerHeight = 8;

    // Prepare columns based on selection
    const columns = [];
    if (pdfColumns.includes('id')) columns.push({ key: 'id', header: 'ID', width: 20 });
    if (pdfColumns.includes('name')) columns.push({ key: 'name', header: 'Product Name', width: 50 });
    if (pdfColumns.includes('uom')) columns.push({ key: 'uom', header: 'UOM', width: 20 });
    if (pdfColumns.includes('brand')) columns.push({ key: 'brand', header: 'Brand', width: 30 });
    if (pdfColumns.includes('design_no')) columns.push({ key: 'design_no', header: 'Design No', width: 25 });
    if (pdfColumns.includes('supplier')) columns.push({ key: 'supplier', header: 'Supplier', width: 35 });
    if (pdfColumns.includes('location')) columns.push({ key: 'location', header: 'Location', width: 25 });
    if (pdfColumns.includes('retail_price')) columns.push({ key: 'retail_price', header: 'Retail Price', width: 25 });
    if (pdfColumns.includes('wholesale_price')) columns.push({ key: 'wholesale_price', header: 'Wholesale Price', width: 30 });
    if (pdfColumns.includes('cost_price')) columns.push({ key: 'cost_price', header: 'Cost Price', width: 25 });
    if (pdfColumns.includes('stock_quantity')) columns.push({ key: 'stock_quantity', header: 'Stock Qty', width: 20 });
    if (pdfColumns.includes('total_sold')) columns.push({ key: 'total_sold', header: 'Total Sold', width: 20 });

    // Calculate column positions
    let x = margin;
    columns.forEach(col => {
      col.x = x;
      x += col.width;
    });

    // Function to add new page if needed
    const checkNewPage = (currentY) => {
      if (currentY > pageHeight - 20) {
        doc.addPage();
        return margin + 10; // Start position on new page
      }
      return currentY;
    };

    // Draw table header
    doc.setFillColor(79, 70, 229);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.rect(margin, y, pageWidth - 2 * margin, headerHeight, 'F');

    columns.forEach(col => {
      doc.text(col.header, col.x + 2, y + 5);
    });

    y += headerHeight;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7);

    // Draw table rows
    filteredProducts.forEach((product, index) => {
      y = checkNewPage(y);

      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, y, pageWidth - 2 * margin, rowHeight, 'F');
      }

      // Draw row data
      columns.forEach(col => {
        let value = '';
        switch (col.key) {
          case 'id':
            value = product.id || '';
            break;
          case 'name':
            value = product.name || '';
            break;
          case 'uom':
            value = product.uom || '';
            break;
          case 'brand':
            value = product.brand || '';
            break;
          case 'design_no':
            value = product.design_no || '';
            break;
          case 'supplier':
            value = product.supplier || '';
            break;
          case 'location':
            value = product.location || '';
            break;
          case 'retail_price':
            value = `PKR ${parseFloat(product.retail_price || 0).toFixed(2)}`;
            break;
          case 'wholesale_price':
            value = `PKR ${parseFloat(product.wholesale_price || 0).toFixed(2)}`;
            break;
          case 'cost_price':
            value = `PKR ${parseFloat(product.cost_price || 0).toFixed(2)}`;
            break;
          case 'stock_quantity':
            value = product.stock_quantity || '0';
            break;
          case 'total_sold':
            value = product.total_sold || '0';
            break;
          default:
            value = '';
        }

        // Truncate text if too long
        const maxWidth = col.width - 4;
        const textWidth = doc.getTextWidth(value.toString());
        if (textWidth > maxWidth) {
          const ratio = maxWidth / textWidth;
          const maxLength = Math.floor(value.length * ratio) - 3;
          value = value.substring(0, maxLength) + '...';
        }

        doc.text(value.toString(), col.x + 2, y + 4);
      });

      y += rowHeight;
    });

    // Add footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
    }

    // Save the PDF
    const fileName = `products-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    // Show success message
    setMessage(`PDF report "${fileName}" has been downloaded successfully!`);
  }, [filteredProducts, pdfColumns, search, supplierFilter]);

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
        supplier.name && supplier.name.toLowerCase().includes(supplierSearch.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    }
  }, [supplierSearch, suppliers, supplierDropdownOpen]);

  // Filter products for table with pagination reset
  useEffect(() => {
    let filtered = products.filter(product => {
      const matchesSearch = (product.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (product.brand || '').toLowerCase().includes(search.toLowerCase()) ||
        (product.design_no || '').toLowerCase().includes(search.toLowerCase());
      const matchesSupplier = !supplierFilter || product.supplier === supplierFilter;
      return matchesSearch && matchesSupplier;
    });

    // Sort products
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle numeric fields
      if (sortField === 'retail_price' || sortField === 'wholesale_price' || sortField === 'stock_quantity') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }
      // Handle ID field (numeric)
      else if (sortField === 'id') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      }
      // Handle string fields
      else {
        aValue = (aValue || '').toString().toLowerCase();
        bValue = (bValue || '').toString().toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    setFilteredProducts(filtered);
  }, [products, search, supplierFilter, sortField, sortOrder]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, supplierFilter, sortField, sortOrder, setCurrentPage]);

  // Calculate paginated products
  const paginatedProducts = itemsPerPage === 'all'
    ? filteredProducts
    : filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Calculate total pages
  const totalPages = itemsPerPage === 'all' || filteredProducts.length === 0
    ? 1
    : Math.ceil(filteredProducts.length / itemsPerPage);

  // Create filtered products for summary cards (excludes sorting, includes only search and supplier filters)
  const summaryFilteredProducts = products.filter(product => {
    const matchesSearch = (product.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (product.brand || '').toLowerCase().includes(search.toLowerCase()) ||
      (product.design_no || '').toLowerCase().includes(search.toLowerCase());
    const matchesSupplier = !supplierFilter || product.supplier === supplierFilter;
    return matchesSearch && matchesSupplier;
  });

  // Reset sortField if it's set to 'name' (since name sorting is no longer available)
  useEffect(() => {
    if (sortField === 'name') {
      setSortField('id');
    }
  }, [sortField, setSortField]);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Extract unique suppliers from products data
  useEffect(() => {
    if (products.length > 0) {
      const uniqueSuppliers = [];
      const supplierNames = new Set();

      products.forEach(product => {
        if (product.supplier && product.supplier.trim() !== '' && !supplierNames.has(product.supplier)) {
          supplierNames.add(product.supplier);
          uniqueSuppliers.push({
            id: uniqueSuppliers.length + 1, // Simple incremental ID
            name: product.supplier,
            brand_name: null, // Not available from products data
            deleted_at: null // Assume active since they're in products
          });
        }
      });

      // Sort suppliers alphabetically
      uniqueSuppliers.sort((a, b) => a.name.localeCompare(b.name));
      setSuppliers(uniqueSuppliers);

      console.log('Extracted unique suppliers from products:', uniqueSuppliers.map(s => s.name));
    }
  }, [products]);

  // Fetch sold products when filters change or view changes to sold
  useEffect(() => {
    if (view === 'sold') {
      fetchSoldProducts();
    }
  }, [fetchSoldProducts, view]);

  // Reset to first page when sold filters change
  useEffect(() => {
    setSoldCurrentPage(1);
  }, [soldFilters, setSoldCurrentPage]);

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

  // Handle sold products filter change with page reset
  function handleSoldFilterChange(e) {
    const { name, value } = e.target;
    setSoldFilters(prev => ({ ...prev, [name]: value }));
    setSoldCurrentPage(1); // Reset to first page when filter changes
  }

  // Handle form submit (add or update product)
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      if (editing) {
        await axios.put(`http://localhost:5000/products/${editing}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Product updated successfully');
        setEditing(null);
      } else {
        await axios.post('http://localhost:5000/products', form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Product added successfully');
      }

      setForm({ id: '', name: '', brand: '', design_no: '', location: '', uom: '', retail_price: '', wholesale_price: '', cost_price: '', stock_quantity: '', supplier: '' });
      setShowAddForm(false);
      fetchProducts();
    } catch (error) {
      setError(editing ? 'Failed to update product' : 'Failed to add product');
    }
  }

  // Handle edit
  function handleEdit(product) {
    setForm(product);
    setEditing(product.id);
    setShowAddForm(true);
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

  return (
    <>
      <div className="page-container">
        {/* Enhanced Professional Header */}
        <div className="page-header">
          <h1 className="page-title professional-header">
            <span className="icon">📦</span>
            Product Management
          </h1>
          <p className="page-subtitle professional-subtitle">
            Manage your inventory, track stock levels, and generate professional barcodes
          </p>

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
                📦 {summaryFilteredProducts.length}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>Total Products</div>
              <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>Matching filters</div>
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
                ✅ {summaryFilteredProducts.filter(p => (p.stock_quantity || 0) > 0).length}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>In Stock</div>
              <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>Available items</div>
            </div>            <div style={{
              background: summaryFilteredProducts.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 5).length > 0
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              color: 'white',
              padding: '16px',
              borderRadius: '12px',
              boxShadow: summaryFilteredProducts.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 5).length > 0
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
                const isLowStock = summaryFilteredProducts.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 5).length > 0;
                e.currentTarget.style.boxShadow = isLowStock
                  ? '0 8px 25px rgba(245, 158, 11, 0.4)'
                  : '0 8px 25px rgba(107, 114, 128, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                const isLowStock = summaryFilteredProducts.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 5).length > 0;
                e.currentTarget.style.boxShadow = isLowStock
                  ? '0 6px 20px rgba(245, 158, 11, 0.3)'
                  : '0 6px 20px rgba(107, 114, 128, 0.3)';
              }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '6px' }}>
                {summaryFilteredProducts.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 5).length > 0 ? '⚠️' : '🎉'} {summaryFilteredProducts.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 5).length}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>Low Stock</div>
              <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>
                {summaryFilteredProducts.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 5).length > 0 ? 'Needs attention' : 'All good!'}
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
                💰 {summaryFilteredProducts.length > 0 ? summaryFilteredProducts.reduce((sum, p) => sum + ((parseFloat(p.stock_quantity) || 0) * (parseFloat(p.cost_price) || 0)), 0).toLocaleString('en-PK', { style: 'currency', currency: 'PKR' }).replace('PKR', '') : '0'}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>Total Value</div>
              <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>Stock × Cost Price</div>
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
          <div className="alert alert-error">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* Enhanced Search and Filter Section */}
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
                      display: 'flex',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px',
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
                /* Sales/Sold Products Filters */
                <>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name
                    </label>
                    <input
                      name="product_name"
                      placeholder="Search by product name..."
                      value={soldFilters.product_name}
                      onChange={handleSoldFilterChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name
                    </label>
                    <input
                      name="customer_name"
                      placeholder="Search by customer name..."
                      value={soldFilters.customer_name}
                      onChange={handleSoldFilterChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sale Type
                    </label>
                    <select
                      name="sale_type"
                      value={soldFilters.sale_type}
                      onChange={handleSoldFilterChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    >
                      <option value="">All Types</option>
                      <option value="retail">Retail</option>
                      <option value="wholesale">Wholesale</option>
                    </select>
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Range
                    </label>
                    <input
                      name="start_date"
                      type="date"
                      value={soldFilters.start_date}
                      onChange={handleSoldFilterChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      placeholder="Start date"
                    />
                  </div>

                  <div className="professional-search-group">
                    <label className="professional-label">
                      <span className="label-icon"> </span>
                      Customer Brand
                    </label>
                    <div className="input-wrapper">
                      <input
                        name="customer_brand"
                        placeholder="Search by customer brand..."
                        value={soldFilters.customer_brand || ''}
                        onChange={handleSoldFilterChange}
                        className="professional-input"
                      />
                      <div className="input-focus-border"></div>
                    </div>
                  </div>

                  <div className="professional-search-group">
                    <label className="professional-label">
                      <span className="label-icon"> 🏪</span>
                      Sale Type
                    </label>
                    <div className="input-wrapper">
                      <select
                        name="sale_type"
                        value={soldFilters.sale_type}
                        onChange={handleSoldFilterChange}
                        className="professional-select"
                      >
                        <option value="">All Types</option>
                        <option value="retail">Retail</option>
                        <option value="wholesale">Wholesale</option>
                      </select>
                      <div className="select-arrow">▼</div>
                    </div>
                  </div>

                  <div className="professional-search-group">
                    <label className="professional-label">
                      <span className="label-icon"> 📅</span>
                      Start Date
                    </label>
                    <div className="input-wrapper">
                      <input
                        name="start_date"
                        type="date"
                        value={soldFilters.start_date}
                        onChange={handleSoldFilterChange}
                        className="professional-input"
                      />
                      <div className="input-focus-border"></div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <span className="mr-2">📅</span>
                      End Date
                    </label>
                    <input
                      name="end_date"
                      type="date"
                      value={soldFilters.end_date}
                      onChange={handleSoldFilterChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <span className="mr-2">📊</span>
                      Status
                    </label>
                    <select
                      name="status"
                      value={soldFilters.status}
                      onChange={handleSoldFilterChange}
                      className="form-input"
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">
              {view === 'products' ? (
                <>
                  Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
                  {(search || supplierFilter) && (
                    <span className="ml-2 text-blue-600">
                      (filtered)
                      <button
                        onClick={() => {
                          setSearch('');
                          setSupplierFilter('');
                          setCurrentPage(1);
                        }}
                        className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        Clear Filters
                      </button>
                    </span>
                  )}
                </>
              ) : (
                <>Showing <strong>{sales.length}</strong> sales records</>
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
              {/* Column selector and PDF download */}
              <div className="mb-3" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowPDFModal(true)}
                  disabled={filteredProducts.length === 0}
                  title="Download filtered products as PDF"
                  style={{
                    backgroundColor: filteredProducts.length === 0 ? '#9ca3af' : '#4f46e5',
                    cursor: filteredProducts.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  📄 Download PDF
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
                    {visibleProductColumns.includes('name') && (<th>📦 Product Name</th>)}
                    {visibleProductColumns.includes('uom') && (<th>📏 Unit</th>)}
                    {visibleProductColumns.includes('brand') && (<th>🏷️ Brand</th>)}
                    {visibleProductColumns.includes('design_no') && (<th>🎨 Design No</th>)}
                    {visibleProductColumns.includes('supplier') && (<th>🏭 Supplier</th>)}
                    {visibleProductColumns.includes('location') && (<th>📍 Location</th>)}
                    {visibleProductColumns.includes('retail_price') && (<th>💰 Retail Price</th>)}
                    {visibleProductColumns.includes('wholesale_price') && (<th>🏪 Wholesale Price</th>)}
                    {visibleProductColumns.includes('cost_price') && (<th>🧾 Cost Price</th>)}
                    {visibleProductColumns.includes('stock_quantity') && (<th>📊 Stock Qty</th>)}
                    {visibleProductColumns.includes('total_sold') && (<th>📈 Total Sold</th>)}
                    {visibleProductColumns.includes('actions') && (<th>⚡ Actions</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-8 text-gray-500">
                        {search || supplierFilter ? 'No products found matching your criteria.' : 'No products added yet.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map(prod => (
                      <tr key={prod.id}>
                        {visibleProductColumns.includes('id') && (
                          <td>
                            <div className="font-mono text-sm">{prod.id}</div>
                          </td>
                        )}
                        {visibleProductColumns.includes('name') && (
                          <td>
                            <div className="font-semibold text-gray-900">{prod.name}</div>
                          </td>
                        )}
                        {visibleProductColumns.includes('uom') && (
                          <td>
                            <div className="text-sm text-gray-600">{prod.uom}</div>
                          </td>
                        )}
                        {visibleProductColumns.includes('brand') && (
                          <td>
                            <div className="text-sm">{prod.brand || 'No brand'}</div>
                          </td>
                        )}
                        {visibleProductColumns.includes('design_no') && (
                          <td>
                            <div className="text-sm text-gray-500">{prod.design_no || 'No design'}</div>
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
                        {visibleProductColumns.includes('retail_price') && (
                          <td>
                            <div className="font-semibold text-success">PKR {parseFloat(prod.retail_price || 0).toFixed(2)}</div>
                          </td>
                        )}
                        {visibleProductColumns.includes('wholesale_price') && (
                          <td>
                            <div className="text-sm text-gray-600">PKR {parseFloat(prod.wholesale_price || 0).toFixed(2)}</div>
                          </td>
                        )}
                        {visibleProductColumns.includes('cost_price') && (
                          <td>
                            <div className="text-sm">PKR {parseFloat(prod.cost_price || 0).toFixed(2)}</div>
                          </td>
                        )}
                        {visibleProductColumns.includes('stock_quantity') && (
                          <td>
                            <div className={`text-center px-2 py-1 rounded ${prod.stock_quantity <= 5 ? 'bg-red-100 text-red-800' :
                              prod.stock_quantity <= 20 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                              {prod.stock_quantity || 0}
                            </div>
                          </td>
                        )}
                        {visibleProductColumns.includes('total_sold') && (
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

              {/* Pagination Controls for Products */}
              <div className="pagination-section">
                <div className="pagination-info">
                  <span className="text-sm text-gray-600">
                    Showing {itemsPerPage === 'all' ? filteredProducts.length : Math.min((currentPage - 1) * itemsPerPage + 1, filteredProducts.length)} to {itemsPerPage === 'all' ? filteredProducts.length : Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                  </span>
                </div>

                <div className="pagination-controls">
                  {/* Items per page selector */}
                  <div className="pagination-selector">
                    <label className="text-sm text-gray-600 mr-2">Show:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        const newItemsPerPage = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
                        setItemsPerPage(newItemsPerPage);
                        setCurrentPage(1);
                      }}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value="all">All</option>
                    </select>
                  </div>

                  {/* Page navigation */}
                  {itemsPerPage !== 'all' && totalPages > 1 && (
                    <div className="pagination-buttons">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="btn btn-outline btn-sm disabled:opacity-50"
                      >
                        Previous
                      </button>

                      <div className="pagination-numbers">
                        {/* Show page numbers */}
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
                              onClick={() => setCurrentPage(pageNum)}
                              className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-outline'}`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="btn btn-outline btn-sm disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

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
                (() => {
                  // Calculate paginated sold products
                  const paginatedSoldProducts = soldItemsPerPage === 'all'
                    ? soldProducts
                    : soldProducts.slice((soldCurrentPage - 1) * soldItemsPerPage, soldCurrentPage * soldItemsPerPage);

                  // Calculate total pages for sold products
                  const soldTotalPages = soldItemsPerPage === 'all'
                    ? 1
                    : Math.ceil(soldProducts.length / soldItemsPerPage);

                  return (
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
                          {!soldProducts || soldProducts.length === 0 ? (
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
                                    <div className="font-semibold text-gray-900 text-lg">{product.product_name}</div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      {product.product_brand && `${product.product_brand} • `}
                                      {product.product_design && `${product.product_design} • `}
                                      <span className="font-medium">{product.product_uom}</span>
                                    </div>
                                    {product.product_category && (
                                      <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-2 inline-block">
                                        {product.product_category}
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-500 mt-1">
                                      Stock: <span className="font-medium">{product.current_stock || 0}</span>
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
                                    <div className="text-xs text-gray-500 mt-2">
                                      Current Prices:
                                    </div>
                                    <div className="text-xs">
                                      Retail: PKR {parseFloat(product.current_retail_price || 0).toFixed(2)}
                                    </div>
                                    <div className="text-xs">
                                      Wholesale: PKR {parseFloat(product.current_wholesale_price || 0).toFixed(2)}
                                    </div>
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
                                      Cost: PKR {parseFloat(product.current_cost_price || 0).toFixed(2)}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>

                      {/* Pagination Controls for Sold Products */}
                      <div className="pagination-section">
                        <div className="pagination-info">
                          <span className="text-sm text-gray-600">
                            Showing {soldItemsPerPage === 'all' ? soldProducts.length : Math.min((soldCurrentPage - 1) * soldItemsPerPage + 1, soldProducts.length)} to {soldItemsPerPage === 'all' ? soldProducts.length : Math.min(soldCurrentPage * soldItemsPerPage, soldProducts.length)} of {soldProducts.length} sold products
                          </span>
                        </div>

                        <div className="pagination-controls">
                          {/* Items per page selector */}
                          <div className="pagination-selector">
                            <label className="text-sm text-gray-600 mr-2">Show:</label>
                            <select
                              value={soldItemsPerPage}
                              onChange={(e) => {
                                const newItemsPerPage = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
                                setSoldItemsPerPage(newItemsPerPage);
                                setSoldCurrentPage(1);
                              }}
                              className="border border-gray-300 rounded px-2 py-1 text-sm"
                            >
                              <option value={10}>10</option>
                              <option value={25}>25</option>
                              <option value={50}>50</option>
                              <option value={100}>100</option>
                              <option value="all">All</option>
                            </select>
                          </div>

                          {/* Page navigation */}
                          {soldItemsPerPage !== 'all' && soldTotalPages > 1 && (
                            <div className="pagination-buttons">
                              <button
                                onClick={() => setSoldCurrentPage(Math.max(1, soldCurrentPage - 1))}
                                disabled={soldCurrentPage === 1}
                                className="btn btn-outline btn-sm disabled:opacity-50"
                              >
                                Previous
                              </button>

                              <div className="pagination-numbers">
                                {/* Show page numbers */}
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
                                      onClick={() => setSoldCurrentPage(pageNum)}
                                      className={`btn btn-sm ${soldCurrentPage === pageNum ? 'btn-primary' : 'btn-outline'}`}
                                    >
                                      {pageNum}
                                    </button>
                                  );
                                })}
                              </div>

                              <button
                                onClick={() => setSoldCurrentPage(Math.min(soldTotalPages, soldCurrentPage + 1))}
                                disabled={soldCurrentPage === soldTotalPages}
                                className="btn btn-outline btn-sm disabled:opacity-50"
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
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
      </div>

      {/* PDF Column Selection Modal */}
      {showPDFModal && (
        <div className="modal-overlay" onClick={() => setShowPDFModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header">
              <h3>📄 Export Products to PDF</h3>
              <button onClick={() => setShowPDFModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: '#6b7280' }}>
                Select the columns you want to include in your PDF report:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {allProductColumns.filter(col => col.key !== 'actions').map(col => (
                  <label key={col.key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    backgroundColor: pdfColumns.includes(col.key) ? '#f0f9ff' : '#f9fafb',
                    border: pdfColumns.includes(col.key) ? '2px solid #0ea5e9' : '1px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={pdfColumns.includes(col.key)}
                      onChange={e => {
                        if (e.target.checked) {
                          setPdfColumns(prev => [...prev, col.key]);
                        } else {
                          setPdfColumns(prev => prev.filter(k => k !== col.key));
                        }
                      }}
                      style={{ margin: 0 }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{col.label}</span>
                  </label>
                ))}
              </div>
              <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                  <strong>Export Summary:</strong>
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  • {filteredProducts.length} products will be exported
                  • {pdfColumns.length} columns selected
                  • Filters applied: {[
                    search && `Search: "${search}"`,
                    supplierFilter && `Supplier: "${supplierFilter}"`
                  ].filter(Boolean).join(', ') || 'None'}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowPDFModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => {
                  downloadProductsPDF();
                  setShowPDFModal(false);
                }}
                className="btn btn-primary"
                disabled={pdfColumns.length === 0}
                style={{
                  backgroundColor: pdfColumns.length === 0 ? '#9ca3af' : '#4f46e5',
                  cursor: pdfColumns.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                📄 Generate PDF ({pdfColumns.length} columns)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


export default Products;