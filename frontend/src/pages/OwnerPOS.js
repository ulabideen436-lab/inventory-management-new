import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UnifiedInvoiceView from '../components/UnifiedInvoiceView';

// Import the dashboard components for full owner functionality
import BusinessIntelligence from '../components/BusinessIntelligence';
import Customers from '../components/Customers';
import Payments from '../components/Payments';
import Products from '../components/Products';
import Purchases from '../components/Purchases';
import Sales from '../components/Sales';
import Suppliers from '../components/Suppliers';
import Transactions from '../components/Transactions';
import UserManagement from '../components/UserManagement';

// Import unified sale edit system
import SaleEditModal from '../components/SaleEditModal';
import { useSaleEdit } from '../hooks/useSaleEdit';

function OwnerPOS() {
  const navigate = useNavigate();

  // Multi-Sale POS States
  const [activeSales, setActiveSales] = useState([{
    id: 1,
    customerName: 'Walk-in Customer',
    customerId: null,
    customerType: 'retail',
    cart: [],
    discountType: 'amount',
    discountValue: 0,
    showDiscountInput: false,
    created: new Date()
  }]);
  const [currentSaleId, setCurrentSaleId] = useState(1);
  const [nextSaleId, setNextSaleId] = useState(2);

  // Global POS States
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState(null);

  // Invoice modal state - exactly like Sales component
  const [showUnifiedInvoice, setShowUnifiedInvoice] = useState(false);

  // Management View States - now full screen when not in POS mode
  const [activeView, setActiveView] = useState('pos'); // 'pos', 'products', 'customers', 'suppliers', 'transactions', etc.

  // Invoice functionality ref
  const unifiedInvoiceRef = useRef(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  // Legacy single sale states (kept for compatibility)
  const [search, setSearch] = useState('');
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Live Search States
  const [liveSearch, setLiveSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Keyboard Navigation States
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  const [selectedCartIndex, setSelectedCartIndex] = useState(-1);
  const [focusMode, setFocusMode] = useState('search'); // 'search', 'cart', 'actions'

  // Barcode scanner debounce timer
  const searchTimeoutRef = useRef(null);

  // Unified Sale Edit Modal using the custom hook
  const {
    isEditModalOpen,
    editingSaleId,
    openEditModal,
    closeEditModal,
    handleSaveSuccess
  } = useSaleEdit(() => {
    // Refresh any relevant data after successful edit
    if (activeView === 'sales') {
      // This will refresh the sales view if it's active
    }
  });

  // Helper function to determine customer type
  const getCustomerType = (customer) => {
    if (!customer) return 'retail';
    // Check various possible field names for customer type
    // Note: Database uses 'long-term' with hyphen, we convert to 'longterm' for consistency
    const customerType = customer.type || customer.customer_type || customer.balance_type;
    return customerType === 'long-term' || customerType === 'longterm' || customerType === 'wholesale'
      ? 'longterm' : 'retail';
  };  // Load customers and products for POS
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/customers', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCustomers(res.data);
      } catch (err) {
        console.error('Failed to fetch customers:', err);
      }
    };

    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/products', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(res.data);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      }
    };

    fetchCustomers();
    fetchProducts();

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Multi-Sale Management Functions - moved here to avoid initialization issues
  const getCurrentSale = () => activeSales.find(sale => sale.id === currentSaleId);

  const updateCurrentSale = (updates) => {
    setActiveSales(sales => sales.map(sale =>
      sale.id === currentSaleId ? { ...sale, ...updates } : sale
    ));
  };

  // Handler functions - moved here to avoid initialization issues
  const handleAddFromSearch = (product, isBarcodeScan = false) => {
    console.log('🎯 handleAddFromSearch called with product:', product.name, isBarcodeScan ? '(Barcode Scan)' : '(Manual)');

    const currentSale = getCurrentSale();
    if (!currentSale) {
      setError('No active sale found');
      return;
    }

    const availableStock = parseInt(product.stock_quantity) || 0;
    const currentInCart = currentSale.cart.filter(item => item.id === product.id)
      .reduce((total, item) => total + item.quantity, 0);

    if (currentInCart >= availableStock) {
      setError(`Cannot add more. Only ${availableStock} items available in stock`);
      return;
    }

    let retail = parseFloat(product.retail_price);
    let wholesale = parseFloat(product.wholesale_price);
    if (isNaN(retail)) retail = 0;
    if (isNaN(wholesale)) wholesale = 0;

    let price = currentSale.customerType === 'longterm' ? wholesale : retail;

    // Debug pricing
    console.log(`Adding ${product.name}:`, {
      customerType: currentSale.customerType,
      retailPrice: retail,
      wholesalePrice: wholesale,
      selectedPrice: price
    });

    updateCurrentSale({
      cart: [...currentSale.cart, {
        ...product,
        quantity: 1,
        price,
        retail_price: retail,
        wholesale_price: wholesale,
        itemDiscountType: 'none',
        itemDiscountValue: 0,
        itemDiscountAmount: 0,
        originalPrice: price,
        showItemDiscount: false
      }]
    });

    // Clear search after adding
    setLiveSearch('');
    setSearchResults([]);
    setShowSearchResults(false);
    setError('');

    // Show success message temporarily with different messages for barcode vs manual
    const successMessage = isBarcodeScan
      ? `📱 Barcode scanned! Added ${product.name} to cart!`
      : `✅ Added ${product.name} to cart!`;
    setMessage(successMessage);
    setTimeout(() => setMessage(''), isBarcodeScan ? 3000 : 2000); // Show barcode message longer

    // Audio feedback for barcode scans
    if (isBarcodeScan) {
      try {
        // Create a simple beep sound for successful barcode scan
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800; // Higher pitch for success
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      } catch (error) {
        // Audio might not be supported, ignore error
        console.log('Audio feedback not available');
      }
    }
  }; const handleIncreaseQty = idx => {
    const currentSale = getCurrentSale();
    if (!currentSale) return;

    const item = currentSale.cart[idx];
    const availableStock = parseInt(item.stock_quantity) || 0;
    const currentInCart = currentSale.cart.filter(cartItem => cartItem.id === item.id)
      .reduce((total, cartItem) => total + cartItem.quantity, 0);

    if (currentInCart >= availableStock) {
      setError(`Cannot add more. Only ${availableStock} items available in stock`);
      return;
    }

    updateCurrentSale({
      cart: currentSale.cart.map((cartItem, i) =>
        i === idx ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
      )
    });
    setError('');
  };

  const handleDecreaseQty = idx => {
    const currentSale = getCurrentSale();
    if (!currentSale) return;

    updateCurrentSale({
      cart: currentSale.cart.map((item, i) =>
        i === idx && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
      )
    });
  };

  const handleRemoveFromCart = idx => {
    const currentSale = getCurrentSale();
    if (!currentSale) return;

    updateCurrentSale({
      cart: currentSale.cart.filter((_, i) => i !== idx)
    });
  };

  // Item-level discount handlers
  const handleToggleItemDiscount = (itemIndex) => {
    const currentSale = getCurrentSale();
    if (!currentSale) return;

    const updatedCart = currentSale.cart.map((item, index) => {
      if (index === itemIndex) {
        return {
          ...item,
          showItemDiscount: !item.showItemDiscount
        };
      }
      return item;
    });

    updateCurrentSale({ cart: updatedCart });
  };

  const handleUpdateItemDiscount = (itemIndex, discountType, discountValue) => {
    const currentSale = getCurrentSale();
    if (!currentSale) return;

    const updatedCart = currentSale.cart.map((item, index) => {
      if (index === itemIndex) {
        return {
          ...item,
          itemDiscountType: discountType,
          itemDiscountValue: discountValue
        };
      }
      return item;
    });

    updateCurrentSale({ cart: updatedCart });
  };

  const handleClearItemDiscount = (itemIndex) => {
    const currentSale = getCurrentSale();
    if (!currentSale) return;

    const updatedCart = currentSale.cart.map((item, index) => {
      if (index === itemIndex) {
        return {
          ...item,
          itemDiscountType: 'none',
          itemDiscountValue: 0,
          showItemDiscount: false
        };
      }
      return item;
    });

    updateCurrentSale({ cart: updatedCart });
  };

  const handleCompleteSale = async () => {
    const currentSale = getCurrentSale();
    if (!currentSale || currentSale.cart.length === 0) {
      setError('Cannot complete empty sale');
      return;
    }

    console.log('Starting sale completion for:', currentSale);

    try {
      const token = localStorage.getItem('token');

      // For Owner POS, always set cashier as "Owner" to clearly identify owner-completed sales
      const cashierName = 'Owner';

      const subtotal = calculateSubtotal(currentSale.cart);
      const totalAmount = calculateTotal(currentSale.cart, currentSale.discountType, currentSale.discountValue);

      const saleData = {
        customer_name: currentSale.customerName,
        customer_id: currentSale.customerId,
        customer_type: currentSale.customerType,
        cashier: cashierName, // Always "Owner" for Owner POS
        items: currentSale.cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.originalPrice || item.price, // Send original price for backend validation
          item_discount_type: item.itemDiscountType || 'none',
          item_discount_value: item.itemDiscountValue || 0
        })),
        payment_method: 'cash', // Default for now
        paid_amount: totalAmount, // Add paid amount for validation
        overall_discount_type: currentSale.discountType,
        overall_discount_value: currentSale.discountValue || 0,
        subtotal: subtotal,
        total_amount: totalAmount
      };

      console.log('Sending sale data to backend:', saleData);

      const response = await axios.post('http://localhost:5000/sales', saleData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Sale completed successfully
      setLastCompletedSale({
        ...response.data,
        items: currentSale.cart,
        customer_name: currentSale.customerName
      });

      // Show success message
      setMessage(`✅ Sale #${response.data.id} completed successfully! Total: PKR ${saleData.total_amount.toFixed(2)}`);

      // Reset or remove current sale
      if (activeSales.length > 1) {
        removeSale(currentSale.id);
      } else {
        // Reset the single sale
        updateCurrentSale({
          customerName: 'Walk-in Customer',
          customerId: null,
          customerType: 'retail',
          cart: [],
          discountType: 'amount',
          discountValue: 0,
          showDiscountInput: false
        });
      }

      // Optionally show receipt
      setShowReceipt(true);

    } catch (error) {
      console.error('Error completing sale:', error);
      console.error('Error response:', error.response?.data);
      setError(`Failed to complete sale: ${error.response?.data?.message || error.message}`);
    }
  };

  // Calculation functions
  const calculateItemFinalPrice = (item) => {
    const originalPrice = item.originalPrice || item.price || 0;
    const quantity = item.quantity || 1;
    const itemTotal = originalPrice * quantity;

    if (item.itemDiscountType === 'percentage') {
      const discountAmount = (itemTotal * parseFloat(item.itemDiscountValue || 0)) / 100;
      return Math.max(0, itemTotal - discountAmount);
    } else if (item.itemDiscountType === 'amount') {
      const discountAmount = parseFloat(item.itemDiscountValue || 0);
      return Math.max(0, itemTotal - discountAmount);
    }
    return itemTotal;
  };

  const calculateSubtotal = (cart) => {
    return cart.reduce((sum, item) => {
      return sum + calculateItemFinalPrice(item);
    }, 0);
  };

  const calculateTotal = (cart, discountType, discountValue) => {
    const subtotal = calculateSubtotal(cart);
    let saleDiscountAmount = 0;

    console.log('💰 Calculating total:', {
      subtotal,
      discountType,
      discountValue,
      cartItems: cart.length
    });

    if (discountType === 'percentage') {
      saleDiscountAmount = (subtotal * parseFloat(discountValue || 0)) / 100;
    } else if (discountType === 'amount') {
      saleDiscountAmount = parseFloat(discountValue || 0);
    }

    console.log('💰 Discount calculation:', {
      saleDiscountAmount,
      finalTotal: Math.max(0, subtotal - saleDiscountAmount)
    });

    return Math.max(0, subtotal - saleDiscountAmount);
  };

  // Utility function for currency formatting
  const formatCurrency = (amount) => {
    const validAmount = parseFloat(amount) || 0;
    if (isNaN(validAmount)) return 'PKR 0.00';
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2
    }).format(validAmount);
  };

  // Invoice Generation Function - exactly like Sales component
  const handleDownloadInvoice = (saleData) => {
    if (!saleData) {
      setError('No sale data available for invoice generation');
      return;
    }

    // Show the unified invoice modal - same as Sales component
    setShowUnifiedInvoice(true);
  };

  // Close search results when clicking outside (but not on search results themselves)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearchResults) {
        // Check if the click is within the search results container
        const searchContainer = event.target.closest('.search-results-container');
        const searchInput = event.target.closest('.live-search-input');

        // Don't close if clicking within search results or search input
        if (!searchContainer && !searchInput) {
          setTimeout(() => {
            setShowSearchResults(false);
          }, 200); // Delay to allow double-click to register
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSearchResults]);

  // Enhanced Keyboard shortcuts and navigation
  useEffect(() => {
    const handleKeyboardShortcuts = (event) => {
      // Don't handle shortcuts if user is typing in an input field (except our search)
      const isTyping = event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT';
      const isSearchInput = event.target.classList.contains('live-search-input');

      // Focus search on Ctrl+K or Ctrl+F
      if ((event.ctrlKey && (event.key === 'k' || event.key === 'f')) || event.key === 'F3') {
        event.preventDefault();
        const searchInput = document.querySelector('.live-search-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
          setFocusMode('search');
          setSelectedSearchIndex(-1);
        }
        return;
      }

      // Don't handle navigation keys if typing in non-search inputs
      if (isTyping && !isSearchInput) {
        return;
      }

      const currentSale = getCurrentSale();

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          if (focusMode === 'search' && searchResults.length > 0) {
            setSelectedSearchIndex(prev => {
              const newIndex = prev < searchResults.length - 1 ? prev + 1 : 0;
              console.log('🔽 Arrow Down - Search selection:', prev, '→', newIndex);
              return newIndex;
            });
          } else if (focusMode === 'cart' && currentSale.cart.length > 0) {
            setSelectedCartIndex(prev => {
              const newIndex = prev < currentSale.cart.length - 1 ? prev + 1 : 0;
              console.log('🔽 Arrow Down - Cart selection:', prev, '→', newIndex);
              return newIndex;
            });
          }
          break;

        case 'ArrowUp':
          event.preventDefault();
          if (focusMode === 'search' && searchResults.length > 0) {
            setSelectedSearchIndex(prev => {
              const newIndex = prev > 0 ? prev - 1 : searchResults.length - 1;
              console.log('🔼 Arrow Up - Search selection:', prev, '→', newIndex);
              return newIndex;
            });
          } else if (focusMode === 'cart' && currentSale.cart.length > 0) {
            setSelectedCartIndex(prev => {
              const newIndex = prev > 0 ? prev - 1 : currentSale.cart.length - 1;
              console.log('🔼 Arrow Up - Cart selection:', prev, '→', newIndex);
              return newIndex;
            });
          }
          break;

        case 'ArrowRight':
          event.preventDefault();
          if (focusMode === 'search' && currentSale.cart.length > 0) {
            setFocusMode('cart');
            setSelectedCartIndex(0);
            setSelectedSearchIndex(-1);
          } else if (focusMode === 'cart') {
            setFocusMode('actions');
            setSelectedCartIndex(-1);
          }
          break;

        case 'ArrowLeft':
          event.preventDefault();
          if (focusMode === 'cart' && searchResults.length > 0) {
            setFocusMode('search');
            setSelectedSearchIndex(0);
            setSelectedCartIndex(-1);
          } else if (focusMode === 'actions') {
            setFocusMode('cart');
            setSelectedCartIndex(0);
          }
          break;

        case 'Enter':
          event.preventDefault();
          if (focusMode === 'search' && selectedSearchIndex >= 0 && searchResults[selectedSearchIndex]) {
            handleAddFromSearch(searchResults[selectedSearchIndex]);
          } else if (focusMode === 'cart' && selectedCartIndex >= 0) {
            // Enter on cart item - increase quantity
            handleIncreaseQty(selectedCartIndex);
          }
          break;

        case 'Delete':
        case 'Backspace':
          if (!isSearchInput) {
            event.preventDefault();
            if (focusMode === 'cart' && selectedCartIndex >= 0) {
              handleRemoveFromCart(selectedCartIndex);
              // Adjust selection if item was removed
              setSelectedCartIndex(prev =>
                prev >= currentSale.cart.length - 1 ? Math.max(0, currentSale.cart.length - 2) : prev
              );
            }
          }
          break;

        case '+':
        case '=':
          if (!isTyping) {
            event.preventDefault();
            if (focusMode === 'cart' && selectedCartIndex >= 0) {
              handleIncreaseQty(selectedCartIndex);
            }
          }
          break;

        case '-':
          if (!isTyping) {
            event.preventDefault();
            if (focusMode === 'cart' && selectedCartIndex >= 0) {
              handleDecreaseQty(selectedCartIndex);
            }
          }
          break;

        case 'Tab':
          event.preventDefault();
          // Cycle through focus modes
          if (focusMode === 'search' && currentSale.cart.length > 0) {
            setFocusMode('cart');
            setSelectedCartIndex(0);
            setSelectedSearchIndex(-1);
          } else if (focusMode === 'cart') {
            setFocusMode('actions');
            setSelectedCartIndex(-1);
          } else {
            setFocusMode('search');
            setSelectedSearchIndex(searchResults.length > 0 ? 0 : -1);
            const searchInput = document.querySelector('.live-search-input');
            if (searchInput) searchInput.focus();
          }
          break;

        case 'Escape':
          event.preventDefault();
          setShowSearchResults(false);
          setSelectedSearchIndex(-1);
          setSelectedCartIndex(-1);
          setFocusMode('search');
          break;

        case 'F2':
          event.preventDefault();
          if (currentSale.cart.length > 0) {
            handleCompleteSale();
          }
          break;

        case 'F4':
          event.preventDefault();
          updateCurrentSale({
            showDiscountInput: !currentSale.showDiscountInput
          });
          break;

        case 'F5':
          event.preventDefault();
          // Toggle item discount for selected cart item
          if (focusMode === 'cart' && selectedCartIndex >= 0 && currentSale.cart[selectedCartIndex]) {
            handleToggleItemDiscount(selectedCartIndex);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [searchResults, selectedSearchIndex, selectedCartIndex, focusMode, getCurrentSale, handleAddFromSearch, handleIncreaseQty, handleDecreaseQty, handleRemoveFromCart, handleCompleteSale, updateCurrentSale]);

  // Auto-clear messages
  useEffect(() => {
    if (message) {
      const timeoutId = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [message]);

  useEffect(() => {
    if (error) {
      const timeoutId = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [error]);

  // Auto-scroll selected items into view
  useEffect(() => {
    if (selectedSearchIndex >= 0 && focusMode === 'search') {
      const selectedElement = document.querySelector(`[data-search-index="${selectedSearchIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }
  }, [selectedSearchIndex, focusMode]);

  useEffect(() => {
    if (selectedCartIndex >= 0 && focusMode === 'cart') {
      const selectedElement = document.querySelector(`[data-cart-index="${selectedCartIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }
  }, [selectedCartIndex, focusMode]);

  // Function to update cart prices when customer type changes
  const updateCartPricesForCustomerType = (newCustomerType) => {
    const currentSale = getCurrentSale();
    if (!currentSale || !currentSale.cart.length) {
      updateCurrentSale({ customerType: newCustomerType });
      const priceType = newCustomerType === 'longterm' ? 'wholesale' : 'retail';
      setMessage(`✅ Switched to ${priceType} pricing`);
      return;
    }

    // Update prices for all items in cart based on new customer type
    const updatedCart = currentSale.cart.map(item => {
      const retail = parseFloat(item.retail_price) || 0;
      const wholesale = parseFloat(item.wholesale_price) || 0;
      const newPrice = newCustomerType === 'longterm' ? wholesale : retail;

      return {
        ...item,
        price: newPrice,
        originalPrice: newPrice
      };
    });

    updateCurrentSale({
      customerType: newCustomerType,
      cart: updatedCart
    });

    // Show feedback message
    const priceType = newCustomerType === 'longterm' ? 'wholesale' : 'retail';
    setMessage(`✅ Cart prices updated to ${priceType} pricing`);
  }; const createNewSale = (customerName = 'Walk-in Customer', customerType = 'retail', customerId = null) => {
    const newSale = {
      id: nextSaleId,
      customerName,
      customerId,
      customerType,
      cart: [],
      discountType: 'amount',
      discountValue: 0,
      showDiscountInput: false,
      created: new Date()
    };
    setActiveSales(sales => [...sales, newSale]);
    setCurrentSaleId(nextSaleId);
    setNextSaleId(nextSaleId + 1);
    return newSale;
  };

  const switchToSale = (saleId) => {
    setCurrentSaleId(saleId);
  };

  const removeSale = (saleId) => {
    if (activeSales.length <= 1) return; // Keep at least one sale

    setActiveSales(sales => sales.filter(sale => sale.id !== saleId));

    // Switch to another sale if current one is being removed
    if (currentSaleId === saleId) {
      const remainingSales = activeSales.filter(sale => sale.id !== saleId);
      setCurrentSaleId(remainingSales[0]?.id || 1);
    }
  };

  // Live Search API Implementation with Barcode Scanner Support
  const handleLiveSearch = async (searchTerm) => {
    setLiveSearch(searchTerm);

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
      setSelectedSearchIndex(-1); // Reset selection when clearing search
      return;
    }

    // For barcode scanners - if the input looks like a product ID (numeric), process immediately
    // For manual typing - add a small delay to avoid too many API calls
    const isNumericId = /^\d+$/.test(searchTerm.trim());
    const delay = isNumericId ? 100 : 300; // Shorter delay for potential barcodes

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      setShowSearchResults(true);

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/products?search=${encodeURIComponent(searchTerm)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Filter products that match the search term more broadly
        const filteredResults = response.data.filter(product =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.design_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.id.toString().includes(searchTerm)
        );

        // Check for exact ID match (for barcode scanning)
        const exactIdMatch = response.data.find(product =>
          product.id.toString() === searchTerm.trim()
        );

        if (exactIdMatch) {
          // Exact ID match found - auto-add to cart (perfect for barcode scanning)
          console.log('🔍 Exact ID match found for barcode:', searchTerm, 'Product:', exactIdMatch.name);

          // Clear search immediately
          setLiveSearch('');
          setSearchResults([]);
          setShowSearchResults(false);
          setSelectedSearchIndex(-1);

          // Auto-add the product to cart with barcode flag
          handleAddFromSearch(exactIdMatch, true);

          // Focus back on search input for next scan
          setTimeout(() => {
            const searchInput = document.querySelector('.live-search-input');
            if (searchInput) {
              searchInput.focus();
              searchInput.select();
            }
          }, 100);

          return; // Exit early, don't show search results
        } setSearchResults(filteredResults);
        // Reset search selection when results change
        setSelectedSearchIndex(filteredResults.length > 0 ? (focusMode === 'search' ? 0 : -1) : -1);
      } catch (error) {
        console.error('Live search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, delay);
  }; const highlightSearchTerm = (text, term) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ?
        <span key={index} style={{ backgroundColor: '#fff3cd', fontWeight: 'bold' }}>{part}</span> :
        part
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto'
    }}>
      {activeView === 'pos' ? (
        // Full-Screen Multi-Sale POS Interface
        <>
          {/* Top Navigation Bar */}
          <div style={{
            backgroundColor: '#2c3e50',
            color: 'white',
            padding: '10px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>🏪 StoreFlow POS - Owner Mode</h2>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>
                {new Date().toLocaleDateString()} | {new Date().toLocaleTimeString()}
              </div>
            </div>
            <div style={{ color: '#ecf0f1', fontSize: '14px', fontWeight: '500' }}>
              StoreFlow Professional - Owner POS
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* POS Button - Always highlighted as current */}
              <button
                onClick={() => setActiveView('pos')}
                style={{
                  color: 'white',
                  textDecoration: 'none',
                  backgroundColor: activeView === 'pos' ? '#e74c3c' : '#c0392b',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                � POS {activeView === 'pos' && '← Current'}
              </button>

              <span style={{ color: '#bdc3c7', margin: '0 8px' }}>|</span>

              <Link
                to="/owner/products"
                style={{
                  color: '#ecf0f1',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#34495e';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                📦 Products
              </Link>              <span style={{ color: '#bdc3c7', margin: '0 8px' }}>|</span>

              <Link
                to="/owner/sales"
                style={{
                  color: '#ecf0f1',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#34495e';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                💰 Sales
              </Link>              <span style={{ color: '#bdc3c7', margin: '0 8px' }}>|</span>

              <button
                onClick={() => setActiveView('customers')}
                style={{
                  color: activeView === 'customers' ? '#ffffff' : '#ecf0f1',
                  textDecoration: 'none',
                  backgroundColor: activeView === 'customers' ? '#3498db' : 'transparent',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: activeView === 'customers' ? 'bold' : 'normal',
                  fontSize: '14px',
                  boxShadow: activeView === 'customers' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                  border: activeView === 'customers' ? '2px solid #2980b9' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  if (activeView !== 'customers') {
                    e.target.style.backgroundColor = '#34495e';
                  }
                }}
                onMouseOut={(e) => {
                  if (activeView !== 'customers') {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                � Customers {activeView === 'customers' && '← Current'}
              </button>

              <span style={{ color: '#bdc3c7', margin: '0 8px' }}>|</span>

              <Link
                to="/owner/suppliers"
                style={{
                  color: '#ecf0f1',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#34495e';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                🏭 Suppliers
              </Link>

              <span style={{ color: '#bdc3c7', margin: '0 8px' }}>|</span>

              <Link
                to="/owner/transactions"
                style={{
                  color: '#ecf0f1',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#34495e';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                📊 Transactions
              </Link>

              <span style={{ color: '#bdc3c7', margin: '0 8px' }}>|</span>

              <Link
                to="/owner/settings"
                style={{
                  color: '#ecf0f1',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#34495e';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                ⚙️ Settings
              </Link>
            </div>
          </div>

          {/* Sales Tabs */}
          <div style={{
            backgroundColor: '#34495e',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderBottom: '2px solid #2c3e50'
          }}>
            <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
              Active Sales:
            </div>
            {activeSales.map((sale) => (
              <div
                key={sale.id}
                onClick={() => switchToSale(sale.id)}
                style={{
                  backgroundColor: currentSaleId === sale.id ? '#3498db' : '#7f8c8d',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  border: currentSaleId === sale.id ? '2px solid #2980b9' : '2px solid transparent'
                }}
              >
                <span>👤 {sale.customerName}</span>
                <span style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '10px'
                }}>
                  {sale.cart.length} items
                </span>
                {activeSales.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSale(sale.id);
                    }}
                    style={{
                      backgroundColor: '#e74c3c',
                      border: 'none',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Close Sale"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => createNewSale()}
              style={{
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              ➕ New Sale
            </button>
          </div>

          {/* Main POS Layout */}
          <div style={{
            flex: 1,
            display: 'flex',
            overflow: 'auto',
            minHeight: 0
          }}>
            {/* Left Panel - Product Search & Selection */}
            <div style={{
              width: '300px',
              minWidth: '280px',
              padding: '15px',
              backgroundColor: 'white',
              borderRight: '2px solid #ecf0f1',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto'
            }}>
              <h3 style={{
                margin: '0 0 15px 0',
                color: '#2c3e50',
                fontSize: '16px'
              }}>
                🔍 Product Search
              </h3>

              {/* Focus Mode Indicator */}
              <div style={{
                display: 'flex',
                gap: '5px',
                marginBottom: '15px',
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                fontSize: '11px'
              }}>
                <div
                  onClick={() => setFocusMode('search')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: focusMode === 'search' ? '#3498db' : '#e9ecef',
                    color: focusMode === 'search' ? 'white' : '#6c757d',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}>
                  🔍 Search {focusMode === 'search' && '(Active)'}
                </div>
                <div
                  onClick={() => setFocusMode('cart')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: focusMode === 'cart' ? '#3498db' : '#e9ecef',
                    color: focusMode === 'cart' ? 'white' : '#6c757d',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}>
                  🛒 Cart {focusMode === 'cart' && '(Active)'}
                </div>
                <div
                  onClick={() => setFocusMode('actions')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: focusMode === 'actions' ? '#3498db' : '#e9ecef',
                    color: focusMode === 'actions' ? 'white' : '#6c757d',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}>
                  ⚡ Actions {focusMode === 'actions' && '(Active)'}
                </div>
              </div>

              {/* Product Search Input */}
              <div style={{ position: 'relative', marginBottom: '15px' }}>
                {/* Barcode Scanner Status */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  padding: '6px 12px',
                  backgroundColor: '#e8f5e9',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#2e7d32'
                }}>
                  <span>📱</span>
                  <span>Barcode Scanner Ready - Scan or type product ID for instant add</span>
                </div>

                <input
                  type="text"
                  className="live-search-input"
                  value={liveSearch}
                  onChange={(e) => handleLiveSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchResults.length > 0) {
                      e.preventDefault();
                      console.log('🎯 Enter key pressed - Adding first search result to cart!');
                      handleAddFromSearch(searchResults[0]);
                    }
                  }}
                  placeholder="Search products or scan barcode... (Exact ID auto-adds to cart)"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.3s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
                {searchResults.length > 0 && liveSearch && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '10px',
                    backgroundColor: '#e8f5e8',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: '#27ae60',
                    fontWeight: 'bold',
                    marginTop: '5px',
                    border: '1px solid #27ae60'
                  }}>
                    ⏎ Press Enter to add "{searchResults[0]?.name?.substring(0, 20)}{searchResults[0]?.name?.length > 20 ? '...' : ''}"
                  </div>
                )}
              </div>

              {/* Search Results */}
              {showSearchResults && (
                <div
                  className="search-results-container"
                  style={{
                    maxHeight: '350px',
                    overflowY: 'auto',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: '#f9f9f9',
                    marginBottom: '15px'
                  }}>
                  {searchResults.length === 0 && !isSearching ? (
                    <div style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: '#666',
                      fontSize: '14px'
                    }}>
                      No products found for "{liveSearch}"
                    </div>
                  ) : isSearching ? (
                    <div style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: '#3498db',
                      fontSize: '14px'
                    }}>
                      🔄 Searching...
                    </div>
                  ) : (
                    searchResults.map((product, index) => (
                      <div
                        key={product.id}
                        data-search-index={index}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #e0e0e0',
                          cursor: 'pointer',
                          backgroundColor: selectedSearchIndex === index ? '#d4edda' : 'white',
                          borderLeft: selectedSearchIndex === index ? '6px solid #28a745' : 'none',
                          border: selectedSearchIndex === index ? '2px solid #28a745' : '1px solid #e0e0e0',
                          transition: 'all 0.2s',
                          userSelect: 'none',
                          boxShadow: selectedSearchIndex === index ? '0 4px 12px rgba(40, 167, 69, 0.3)' : 'none',
                          transform: selectedSearchIndex === index ? 'translateX(4px)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedSearchIndex !== index) {
                            e.target.style.backgroundColor = '#e8f5e8';
                            e.target.style.borderLeft = '4px solid #28a745';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedSearchIndex !== index) {
                            e.target.style.backgroundColor = 'white';
                            e.target.style.borderLeft = 'none';
                          }
                        }}
                        onClick={() => {
                          setSelectedSearchIndex(index);
                          setFocusMode('search');
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#2c3e50', marginBottom: '3px' }}>
                              {highlightSearchTerm(product.name, liveSearch)}
                            </div>
                            <div style={{ fontSize: '11px', color: '#7f8c8d', marginBottom: '3px' }}>
                              Brand: {product.brand} | Design: {product.design_no}
                            </div>
                            <div style={{ fontSize: '12px', color: '#27ae60' }}>
                              Stock: {product.stock_quantity} units
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', marginRight: '10px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e74c3c' }}>
                              PKR {parseFloat(product.retail_price).toFixed(2)}
                            </div>
                            {product.wholesale_price && (
                              <div style={{ fontSize: '11px', color: '#7f8c8d' }}>
                                WS: PKR {parseFloat(product.wholesale_price).toFixed(2)}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('🛒 Adding product to cart:', product.name);
                                handleAddFromSearch(product);
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#218838';
                                e.target.style.transform = 'scale(1.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#28a745';
                                e.target.style.transform = 'scale(1)';
                              }}
                              style={{
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <span>+</span>
                              <span>Add</span>
                            </button>
                            <select
                              onChange={(e) => {
                                const qty = parseInt(e.target.value);
                                if (qty > 1) {
                                  console.log(`🛒 Adding ${qty} of product to cart:`, product.name);
                                  for (let i = 0; i < qty; i++) {
                                    handleAddFromSearch(product);
                                  }
                                  e.target.value = '1'; // Reset to 1
                                }
                              }}
                              style={{
                                padding: '6px 8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                backgroundColor: 'white'
                              }}
                              title="Quick add multiple quantities"
                            >
                              <option value="1">Qty</option>
                              <option value="2">+2</option>
                              <option value="3">+3</option>
                              <option value="5">+5</option>
                              <option value="10">+10</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {!showSearchResults && !liveSearch && (
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '25px',
                  textAlign: 'center',
                  borderRadius: '8px',
                  color: '#7f8c8d',
                  border: '2px dashed #e0e0e0',
                  fontSize: '14px'
                }}>
                  🔍 Start typing to search products...<br />
                  <div style={{ marginTop: '10px', fontSize: '12px' }}>
                    <div>💡 <strong>Quick Tips & Keyboard Shortcuts:</strong></div>
                    <div>• Type product name, brand, or design number</div>
                    <div>• <kbd style={{ padding: '2px 6px', backgroundColor: '#e9ecef', borderRadius: '3px' }}>Ctrl+K</kbd> Focus search</div>
                    <div>• <kbd style={{ padding: '2px 6px', backgroundColor: '#e9ecef', borderRadius: '3px' }}>↑↓</kbd> Navigate items</div>
                    <div>• <kbd style={{ padding: '2px 6px', backgroundColor: '#e9ecef', borderRadius: '3px' }}>←→</kbd> Switch between search/cart</div>
                    <div>• <kbd style={{ padding: '2px 6px', backgroundColor: '#e9ecef', borderRadius: '3px' }}>Enter</kbd> Add selected item or increase qty</div>
                    <div>• <kbd style={{ padding: '2px 6px', backgroundColor: '#e9ecef', borderRadius: '3px' }}>Tab</kbd> Cycle focus areas</div>
                    <div>• <kbd style={{ padding: '2px 6px', backgroundColor: '#e9ecef', borderRadius: '3px' }}>Del</kbd> Remove cart item</div>
                    <div>• <kbd style={{ padding: '2px 6px', backgroundColor: '#e9ecef', borderRadius: '3px' }}>+/-</kbd> Increase/decrease quantity</div>
                    <div>• <kbd style={{ padding: '2px 6px', backgroundColor: '#e9ecef', borderRadius: '3px' }}>F2</kbd> Complete sale</div>
                    <div>• <kbd style={{ padding: '2px 6px', backgroundColor: '#e9ecef', borderRadius: '3px' }}>F4</kbd> Toggle sale discount</div>
                    <div>• <kbd style={{ padding: '2px 6px', backgroundColor: '#e9ecef', borderRadius: '3px' }}>F5</kbd> Toggle item discount</div>
                    <div>• <kbd style={{ padding: '2px 6px', backgroundColor: '#e9ecef', borderRadius: '3px' }}>Esc</kbd> Clear selection</div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel - Current Sale Cart */}
            <div style={{
              flex: 1,
              minWidth: '600px',
              backgroundColor: 'white',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
              overflow: 'auto'
            }}>
              {(() => {
                const currentSale = getCurrentSale();
                if (!currentSale) return <div>No active sale</div>;

                return (
                  <>
                    {/* Current Sale Header */}
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '15px',
                      borderRadius: '10px',
                      marginBottom: '20px',
                      border: '2px solid #3498db'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{ margin: 0, color: '#2c3e50' }}>
                          🛒 Sale #{currentSale.id}
                        </h3>
                        <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                          {currentSale.created.toLocaleTimeString()}
                        </div>
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <strong>Customer: </strong>
                            <select
                              value={currentSale.customerName === 'Walk-in Customer' ? '' : currentSale.customerName}
                              onChange={(e) => {
                                const selectedCustomer = customers.find(c => c.name === e.target.value);
                                if (selectedCustomer) {
                                  updateCurrentSale({
                                    customerName: selectedCustomer.name,
                                    customerId: selectedCustomer.id
                                  });
                                  updateCartPricesForCustomerType(getCustomerType(selectedCustomer));
                                } else {
                                  updateCurrentSale({
                                    customerName: 'Walk-in Customer',
                                    customerId: null
                                  });
                                  updateCartPricesForCustomerType('retail');
                                }
                              }}
                              style={{
                                padding: '5px 10px',
                                border: '1px solid #ddd',
                                borderRadius: '5px',
                                marginLeft: '10px',
                                width: '200px'
                              }}
                            >
                              <option value="">Walk-in Customer</option>
                              {customers.filter(customer => getCustomerType(customer) === 'longterm').map(customer => (
                                <option key={customer.id} value={customer.name}>
                                  🏢 {customer.name} (Long-term)
                                </option>
                              ))}
                              {customers.filter(customer => getCustomerType(customer) === 'retail').map(customer => (
                                <option key={customer.id} value={customer.name}>
                                  🛍️ {customer.name} (Retail)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ fontSize: '12px', color: '#7f8c8d' }}>or enter custom:</span>
                            <input
                              type="text"
                              value={currentSale.customerName}
                              onChange={(e) => updateCurrentSale({ customerName: e.target.value })}
                              placeholder="Enter customer name"
                              style={{
                                padding: '5px 10px',
                                border: '1px solid #ddd',
                                borderRadius: '5px',
                                width: '150px'
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div>
                          <strong>Customer Type: </strong>
                          <select
                            value={currentSale.customerType}
                            onChange={(e) => updateCartPricesForCustomerType(e.target.value)}
                            style={{
                              padding: '5px 10px',
                              border: '1px solid #ddd',
                              borderRadius: '5px',
                              marginLeft: '10px'
                            }}
                          >
                            <option value="retail">Retail Customer</option>
                            <option value="longterm">Long-term Customer (Wholesale)</option>
                          </select>
                        </div>
                        <div style={{
                          padding: '5px 10px',
                          backgroundColor: currentSale.customerType === 'longterm' ? '#e74c3c' : '#3498db',
                          color: 'white',
                          borderRadius: '5px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {currentSale.customerType === 'longterm' ? '🏢 WHOLESALE PRICING' : '🛍️ RETAIL PRICING'}
                        </div>
                      </div>
                    </div>

                    {/* Cart Items */}
                    <div style={{
                      flex: 1,
                      overflowY: 'auto',
                      marginBottom: '20px',
                      minHeight: '400px',
                      maxHeight: 'calc(100vh - 400px)'
                    }}>
                      <h4 style={{ margin: '0 0 15px 0', color: '#34495e' }}>
                        Cart Items ({currentSale.cart.length})
                      </h4>

                      {currentSale.cart.length === 0 ? (
                        <div style={{
                          textAlign: 'center',
                          padding: '40px 20px',
                          color: '#7f8c8d',
                          fontSize: '14px'
                        }}>
                          🛒 Cart is empty<br />
                          Search and double-click products to add them
                        </div>
                      ) : (
                        currentSale.cart.map((item, index) => (
                          <div
                            key={index}
                            data-cart-index={index}
                            style={{
                              backgroundColor: selectedCartIndex === index ? '#e3f2fd' : '#f8f9fa',
                              padding: '15px',
                              borderRadius: '8px',
                              marginBottom: '10px',
                              border: selectedCartIndex === index ? '3px solid #2196f3' : '1px solid #e0e0e0',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: selectedCartIndex === index ? '0 4px 12px rgba(33, 150, 243, 0.3)' : 'none',
                              transform: selectedCartIndex === index ? 'scale(1.02)' : 'none'
                            }}
                            onClick={() => {
                              setSelectedCartIndex(index);
                              setFocusMode('cart');
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px' }}>
                                  {item.name}
                                </div>
                                <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                                  {item.brand} | {item.design_no}
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveFromCart(index)}
                                style={{
                                  backgroundColor: '#e74c3c',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '25px',
                                  height: '25px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                                title="Remove item"
                              >
                                ✕
                              </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button
                                  onClick={() => handleDecreaseQty(index)}
                                  style={{
                                    backgroundColor: '#95a5a6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    width: '25px',
                                    height: '25px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  -
                                </button>
                                <span style={{ fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleIncreaseQty(index)}
                                  style={{
                                    backgroundColor: '#27ae60',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    width: '25px',
                                    height: '25px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  +
                                </button>

                                {/* Item Discount Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleItemDiscount(index);
                                  }}
                                  style={{
                                    backgroundColor: item.itemDiscountValue > 0 ? '#27ae60' : '#e67e22',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '5px 8px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    marginLeft: '5px',
                                    position: 'relative'
                                  }}
                                  title="Item Discount"
                                >
                                  🏷️
                                  {item.itemDiscountValue > 0 && (
                                    <span style={{
                                      position: 'absolute',
                                      top: '-3px',
                                      right: '-3px',
                                      backgroundColor: '#fff',
                                      color: '#27ae60',
                                      borderRadius: '50%',
                                      width: '12px',
                                      height: '12px',
                                      fontSize: '8px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 'bold'
                                    }}>
                                      ✓
                                    </span>
                                  )}
                                </button>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#27ae60' }}>
                                  PKR {calculateItemFinalPrice(item).toFixed(2)}
                                  {item.itemDiscountValue > 0 && (
                                    <div style={{ fontSize: '10px', color: '#e74c3c', textDecoration: 'line-through' }}>
                                      PKR {(item.price * item.quantity).toFixed(2)}
                                    </div>
                                  )}
                                </div>
                                <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                                  PKR {item.price.toFixed(2)} each
                                  <span style={{
                                    marginLeft: '5px',
                                    fontSize: '10px',
                                    backgroundColor: currentSale.customerType === 'longterm' ? '#e74c3c' : '#3498db',
                                    color: 'white',
                                    padding: '2px 5px',
                                    borderRadius: '3px'
                                  }}>
                                    {currentSale.customerType === 'longterm' ? 'WHOLESALE' : 'RETAIL'}
                                  </span>
                                  {item.itemDiscountValue > 0 && (
                                    <span style={{
                                      marginLeft: '5px',
                                      fontSize: '10px',
                                      backgroundColor: '#e74c3c',
                                      color: 'white',
                                      padding: '2px 5px',
                                      borderRadius: '3px'
                                    }}>
                                      -{item.itemDiscountType === 'percentage' ? `${item.itemDiscountValue}%` : `PKR ${item.itemDiscountValue}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Item Discount Panel */}
                            {item.showItemDiscount && (
                              <div style={{
                                backgroundColor: '#fff3cd',
                                padding: '12px',
                                borderRadius: '6px',
                                marginTop: '10px',
                                border: '1px solid #ffeaa7'
                              }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#856404' }}>
                                  Item Discount for {item.name}
                                </div>

                                {/* Discount Type Toggle Buttons */}
                                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                                  <button
                                    onClick={() => handleUpdateItemDiscount(index, 'none', 0)}
                                    style={{
                                      padding: '8px 12px',
                                      border: `2px solid ${(item.itemDiscountType || 'none') === 'none' ? '#27ae60' : '#ddd'}`,
                                      borderRadius: '6px',
                                      backgroundColor: (item.itemDiscountType || 'none') === 'none' ? '#27ae60' : 'white',
                                      color: (item.itemDiscountType || 'none') === 'none' ? 'white' : '#374151',
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      flex: 1,
                                      textAlign: 'center'
                                    }}
                                  >
                                    🚫 No Discount
                                  </button>

                                  <button
                                    onClick={() => handleUpdateItemDiscount(index, 'percentage', item.itemDiscountValue || 0)}
                                    style={{
                                      padding: '8px 12px',
                                      border: `2px solid ${item.itemDiscountType === 'percentage' ? '#3498db' : '#ddd'}`,
                                      borderRadius: '6px',
                                      backgroundColor: item.itemDiscountType === 'percentage' ? '#3498db' : 'white',
                                      color: item.itemDiscountType === 'percentage' ? 'white' : '#374151',
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      flex: 1,
                                      textAlign: 'center'
                                    }}
                                  >
                                    📊 Percentage (%)
                                  </button>

                                  <button
                                    onClick={() => handleUpdateItemDiscount(index, 'amount', item.itemDiscountValue || 0)}
                                    style={{
                                      padding: '8px 12px',
                                      border: `2px solid ${item.itemDiscountType === 'amount' ? '#e74c3c' : '#ddd'}`,
                                      borderRadius: '6px',
                                      backgroundColor: item.itemDiscountType === 'amount' ? '#e74c3c' : 'white',
                                      color: item.itemDiscountType === 'amount' ? 'white' : '#374151',
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      flex: 1,
                                      textAlign: 'center'
                                    }}
                                  >
                                    � Fixed Amount
                                  </button>
                                </div>

                                {/* Input Field */}
                                {item.itemDiscountType !== 'none' && (
                                  <div style={{ marginBottom: '8px' }}>
                                    <input
                                      type="number"
                                      min="0"
                                      max={item.itemDiscountType === 'percentage' ? 100 : (item.price * item.quantity)}
                                      step={item.itemDiscountType === 'percentage' ? 0.1 : 1}
                                      value={item.itemDiscountValue || 0}
                                      onChange={(e) => {
                                        const value = parseFloat(e.target.value) || 0;
                                        const maxValue = item.itemDiscountType === 'percentage' ? 100 : (item.price * item.quantity);
                                        handleUpdateItemDiscount(index, item.itemDiscountType, Math.min(Math.max(0, value), maxValue));
                                      }}
                                      placeholder={item.itemDiscountType === 'percentage' ? 'Enter %' : 'Enter PKR'}
                                      style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        color: '#374151',
                                        backgroundColor: '#f9fafb',
                                        textAlign: 'center'
                                      }}
                                    />
                                  </div>
                                )}

                                {/* Quick Item Discount Presets */}
                                {item.itemDiscountType !== 'none' && (
                                  <div style={{ marginBottom: '8px' }}>
                                    <div style={{ fontSize: '10px', color: '#856404', marginBottom: '5px' }}>Quick:</div>
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                      {item.itemDiscountType === 'percentage' ? (
                                        [5, 10, 15, 20].map(percent => (
                                          <button
                                            key={percent}
                                            onClick={() => handleUpdateItemDiscount(index, 'percentage', percent)}
                                            style={{
                                              padding: '3px 6px',
                                              backgroundColor: item.itemDiscountValue === percent ? '#27ae60' : '#ecf0f1',
                                              color: item.itemDiscountValue === percent ? 'white' : '#2c3e50',
                                              border: 'none',
                                              borderRadius: '3px',
                                              cursor: 'pointer',
                                              fontSize: '10px'
                                            }}
                                          >
                                            {percent}%
                                          </button>
                                        ))
                                      ) : (
                                        [50, 100, 200].map(amount => (
                                          <button
                                            key={amount}
                                            onClick={() => handleUpdateItemDiscount(index, 'amount', amount)}
                                            style={{
                                              padding: '3px 6px',
                                              backgroundColor: item.itemDiscountValue === amount ? '#27ae60' : '#ecf0f1',
                                              color: item.itemDiscountValue === amount ? 'white' : '#2c3e50',
                                              border: 'none',
                                              borderRadius: '3px',
                                              cursor: 'pointer',
                                              fontSize: '10px'
                                            }}
                                          >
                                            {amount}
                                          </button>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                )}

                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    onClick={() => handleClearItemDiscount(index)}
                                    style={{
                                      flex: 1,
                                      padding: '6px',
                                      backgroundColor: '#95a5a6',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '3px',
                                      cursor: 'pointer',
                                      fontSize: '11px'
                                    }}
                                  >
                                    Clear
                                  </button>
                                  <button
                                    onClick={() => handleToggleItemDiscount(index)}
                                    style={{
                                      flex: 1,
                                      padding: '6px',
                                      backgroundColor: '#3498db',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '3px',
                                      cursor: 'pointer',
                                      fontSize: '11px'
                                    }}
                                  >
                                    Done
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Sale Summary & Actions */}
                    {currentSale.cart.length > 0 && (
                      <div style={{
                        borderTop: '2px solid #ecf0f1',
                        paddingTop: '20px'
                      }}>
                        {/* Sale Totals */}
                        <div style={{
                          backgroundColor: '#f8f9fa',
                          padding: '15px',
                          borderRadius: '8px',
                          marginBottom: '15px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span>Subtotal:</span>
                            <span>PKR {calculateSubtotal(currentSale.cart).toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span>Discount:</span>
                            <span style={{
                              color: (calculateSubtotal(currentSale.cart) - calculateTotal(currentSale.cart, currentSale.discountType, currentSale.discountValue)) > 0 ? '#e74c3c' : '#7f8c8d'
                            }}>
                              - PKR {((calculateSubtotal(currentSale.cart) - calculateTotal(currentSale.cart, currentSale.discountType, currentSale.discountValue))).toFixed(2)}
                              {currentSale.discountValue > 0 && (
                                <span style={{ fontSize: '12px', marginLeft: '5px' }}>
                                  ({currentSale.discountType === 'percentage' ? `${currentSale.discountValue}%` : `PKR ${currentSale.discountValue}`})
                                </span>
                              )}
                            </span>
                          </div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontWeight: 'bold',
                            fontSize: '18px',
                            borderTop: '1px solid #ddd',
                            paddingTop: '10px',
                            color: '#27ae60'
                          }}>
                            <span>Total:</span>
                            <span>PKR {calculateTotal(currentSale.cart, currentSale.discountType, currentSale.discountValue).toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={handleCompleteSale}
                            style={{
                              flex: 1,
                              padding: '15px',
                              backgroundColor: '#3498db',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '16px',
                              fontWeight: 'bold'
                            }}
                          >
                            💳 Complete Sale - PKR {calculateTotal(currentSale.cart, currentSale.discountType, currentSale.discountValue).toFixed(2)}
                          </button>
                          <button
                            onClick={() => updateCurrentSale({
                              showDiscountInput: !currentSale.showDiscountInput
                            })}
                            style={{
                              padding: '15px',
                              backgroundColor: currentSale.discountValue > 0 ? '#27ae60' : '#e67e22',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              position: 'relative'
                            }}
                          >
                            🏷️ Discount
                            <span style={{ fontSize: '11px', marginLeft: '5px', opacity: 0.8 }}>(F4)</span>
                            {currentSale.discountValue > 0 && (
                              <span style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                backgroundColor: '#fff',
                                color: '#27ae60',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold'
                              }}>
                                ✓
                              </span>
                            )}
                          </button>
                        </div>

                        {/* Discount Input */}
                        {currentSale.showDiscountInput && (
                          <div style={{
                            backgroundColor: '#fff3cd',
                            padding: '12px',
                            borderRadius: '8px',
                            marginTop: '10px',
                            border: '1px solid #ffeaa7',
                            maxHeight: '200px',
                            overflowY: 'auto'
                          }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#856404', fontSize: '14px' }}>
                              Sale Discount
                              <span style={{ fontSize: '11px', fontWeight: 'normal', marginLeft: '8px' }}>
                                (Applied to entire sale)
                              </span>
                            </h4>

                            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                              <select
                                value={currentSale.discountType}
                                onChange={(e) => updateCurrentSale({ discountType: e.target.value })}
                                style={{
                                  padding: '6px',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  backgroundColor: 'white',
                                  fontSize: '12px'
                                }}
                              >
                                <option value="amount">Fixed Amount (PKR)</option>
                                <option value="percentage">Percentage (%)</option>
                              </select>
                              <input
                                type="number"
                                min="0"
                                max={currentSale.discountType === 'percentage' ? 100 : calculateSubtotal(currentSale.cart)}
                                step={currentSale.discountType === 'percentage' ? 0.1 : 1}
                                value={currentSale.discountValue}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  const maxValue = currentSale.discountType === 'percentage' ? 100 : calculateSubtotal(currentSale.cart);
                                  updateCurrentSale({
                                    discountValue: Math.min(Math.max(0, value), maxValue)
                                  });
                                }}
                                placeholder={currentSale.discountType === 'percentage' ? 'Enter %' : 'Enter amount'}
                                style={{
                                  flex: 1,
                                  padding: '6px',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  fontSize: '12px'
                                }}
                              />
                            </div>

                            {/* Quick Discount Presets */}
                            <div style={{ marginBottom: '10px' }}>
                              <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#856404' }}>Quick Discounts:</p>
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {currentSale.discountType === 'percentage' ? (
                                  <>
                                    {[5, 10, 15, 20, 25].map(percent => (
                                      <button
                                        key={percent}
                                        onClick={() => updateCurrentSale({ discountValue: percent })}
                                        style={{
                                          padding: '4px 8px',
                                          backgroundColor: currentSale.discountValue === percent ? '#27ae60' : '#ecf0f1',
                                          color: currentSale.discountValue === percent ? 'white' : '#2c3e50',
                                          border: 'none',
                                          borderRadius: '3px',
                                          cursor: 'pointer',
                                          fontSize: '11px'
                                        }}
                                      >
                                        {percent}%
                                      </button>
                                    ))}
                                  </>
                                ) : (
                                  <>
                                    {[50, 100, 200, 500].map(amount => (
                                      <button
                                        key={amount}
                                        onClick={() => updateCurrentSale({ discountValue: amount })}
                                        style={{
                                          padding: '4px 8px',
                                          backgroundColor: currentSale.discountValue === amount ? '#27ae60' : '#ecf0f1',
                                          color: currentSale.discountValue === amount ? 'white' : '#2c3e50',
                                          border: 'none',
                                          borderRadius: '3px',
                                          cursor: 'pointer',
                                          fontSize: '11px'
                                        }}
                                      >
                                        PKR {amount}
                                      </button>
                                    ))}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Discount Summary */}
                            <div style={{
                              backgroundColor: 'rgba(255,255,255,0.7)',
                              padding: '8px',
                              borderRadius: '4px',
                              marginBottom: '10px',
                              fontSize: '12px'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Subtotal:</span>
                                <span>PKR {calculateSubtotal(currentSale.cart).toFixed(2)}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e74c3c' }}>
                                <span>Discount Amount:</span>
                                <span>-PKR {(calculateSubtotal(currentSale.cart) - calculateTotal(currentSale.cart, currentSale.discountType, currentSale.discountValue)).toFixed(2)}</span>
                              </div>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontWeight: 'bold',
                                borderTop: '1px solid #ddd',
                                paddingTop: '4px',
                                marginTop: '4px'
                              }}>
                                <span>Final Total:</span>
                                <span>PKR {calculateTotal(currentSale.cart, currentSale.discountType, currentSale.discountValue).toFixed(2)}</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => updateCurrentSale({
                                  showDiscountInput: false,
                                  discountValue: 0
                                })}
                                style={{
                                  flex: 1,
                                  padding: '8px',
                                  backgroundColor: '#95a5a6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                Clear Discount
                              </button>
                              <button
                                onClick={() => updateCurrentSale({ showDiscountInput: false })}
                                style={{
                                  flex: 1,
                                  padding: '8px',
                                  backgroundColor: '#27ae60',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                Apply Discount
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </>
      ) : (
        // Management Views (Full Screen)
        <div style={{ flex: 1, backgroundColor: 'white' }}>
          {/* Top Navigation */}
          <div style={{
            backgroundColor: '#2c3e50',
            color: 'white',
            padding: '15px 30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ margin: 0 }}>
              {activeView === 'products' && '📦 Product Management'}
              {activeView === 'customers' && '👥 Customer Management'}
              {activeView === 'suppliers' && '🏭 Supplier Management'}
              {activeView === 'sales' && '📊 Sales Management'}
              {activeView === 'transactions' && '💰 Transaction Management'}
              {activeView === 'purchases' && '🛒 Purchase Management'}
              {activeView === 'payments' && '💳 Payment Management'}
              {activeView === 'users' && '👤 User Management'}
              {activeView === 'reports' && '📈 Business Intelligence & Reports'}
            </h2>
            <button
              onClick={() => setActiveView('pos')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              ← Back to POS
            </button>
          </div>

          {/* Management Content */}
          <div style={{ padding: '30px' }}>
            {activeView === 'products' && <Products />}
            {activeView === 'customers' && <Customers />}
            {activeView === 'suppliers' && <Suppliers />}
            {activeView === 'sales' && <Sales />}
            {activeView === 'transactions' && <Transactions />}
            {activeView === 'purchases' && <Purchases />}
            {activeView === 'payments' && <Payments />}
            {activeView === 'users' && <UserManagement />}
            {activeView === 'reports' && <BusinessIntelligence />}
          </div>
        </div>
      )}

      {/* Global Messages & Modals */}
      {message && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#27ae60',
          color: 'white',
          padding: '15px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000,
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#e74c3c',
          color: 'white',
          padding: '15px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000,
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastCompletedSale && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>🧾 Sale Receipt</h2>
              <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                Sale ID: #{lastCompletedSale.id} | {new Date().toLocaleString()}
              </div>
            </div>

            <div style={{ marginBottom: '20px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span><strong>Customer:</strong></span>
                <span>{lastCompletedSale.customer_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span><strong>Customer Type:</strong></span>
                <span>{lastCompletedSale.customer_type === 'retail' ? 'Retail' : 'Long-term (Wholesale)'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span><strong>Payment Method:</strong></span>
                <span>Cash</span>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Item</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lastCompletedSale.items.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px' }}>
                      <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>{item.brand}</div>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>PKR {item.price.toFixed(2)}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      PKR {(item.quantity * item.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginBottom: '20px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Subtotal:</span>
                <span>PKR {lastCompletedSale.subtotal.toFixed(2)}</span>
              </div>
              {lastCompletedSale.overall_discount_value > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#e74c3c' }}>
                  <span>Discount:</span>
                  <span>- PKR {(lastCompletedSale.subtotal - lastCompletedSale.total_amount).toFixed(2)}</span>
                </div>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '18px',
                fontWeight: 'bold',
                borderTop: '2px solid #e0e0e0',
                paddingTop: '10px',
                color: '#27ae60'
              }}>
                <span>Total:</span>
                <span>PKR {lastCompletedSale.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleDownloadInvoice(lastCompletedSale)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                📄 Generate Invoice
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Sale Edit Modal */}
      <SaleEditModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        saleId={editingSaleId}
        onSaveSuccess={handleSaveSuccess}
        userRole="owner"
      />

      {/* Unified Invoice Modal - exactly like Sales component */}
      {
        lastCompletedSale && showUnifiedInvoice && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '95vw', width: '1200px', maxHeight: '95vh', overflow: 'auto' }}>
              <div className="modal-header">
                <h3>
                  📊 Unified Invoice - #{lastCompletedSale.id}
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
                  sale={lastCompletedSale}
                  customer={customers.find(c => c.id === lastCompletedSale.customer_id) || { name: 'Walk-in Customer' }}
                  products={products}
                  onClose={() => setShowUnifiedInvoice(false)}
                />
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
}

export default OwnerPOS;