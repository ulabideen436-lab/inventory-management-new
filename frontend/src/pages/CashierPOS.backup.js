import axios from 'axios';
import { useEffect, useState } from 'react';

// Data Integrity Validation Functions
const validateSaleData = (cart, total) => {
  const errors = [];

  // Validate cart has items
  if (!cart || cart.length === 0) {
    errors.push('Cart cannot be empty');
    return errors;
  }

  // Validate each cart item
  cart.forEach((item, index) => {
    if (!item.id || !item.name) {
      errors.push(`Item ${index + 1}: Missing product information`);
    }

    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Invalid quantity (${item.quantity})`);
    }

    if (item.price === undefined || item.price < 0) {
      errors.push(`Item ${index + 1}: Invalid price (${item.price})`);
    }

    if (!Number.isInteger(item.quantity) || item.quantity > 1000) {
      errors.push(`Item ${index + 1}: Quantity must be a reasonable integer`);
    }
  });

  // Validate total calculation
  const calculatedTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tolerance = 0.01;

  if (Math.abs(calculatedTotal - total) > tolerance) {
    errors.push(`Total mismatch: Expected ${calculatedTotal.toFixed(2)}, got ${total.toFixed(2)}`);
  }

  return errors;
};

const validateProductData = (product) => {
  const errors = [];

  if (!product) {
    errors.push('Product data is required');
    return errors;
  }

  if (!product.id || !product.name) {
    errors.push('Product must have valid ID and name');
  }

  if (product.retail_price === undefined || product.retail_price < 0) {
    errors.push('Product must have valid retail price');
  }

  if (product.stock_quantity !== undefined && product.stock_quantity < 0) {
    errors.push('Product stock quantity cannot be negative');
  }

  return errors;
};

const validateSessionData = (sessionData) => {
  const errors = [];

  if (!sessionData.currentSaleNumber || sessionData.currentSaleNumber <= 0) {
    errors.push('Invalid sale number');
  }

  if (!sessionData.sessionStartTime || isNaN(new Date(sessionData.sessionStartTime).getTime())) {
    errors.push('Invalid session start time');
  }

  return errors;
};

function CashierPOS() {
  const [customerType, setCustomerType] = useState('retail');
  const [search, setSearch] = useState('');
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  // New states for multiple sales management
  const [completedSales, setCompletedSales] = useState([]);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [currentSaleNumber, setCurrentSaleNumber] = useState(1);
  const [sessionStartTime, setSessionStartTime] = useState(new Date());

  // Search product by ID or name or barcode
  const handleSearch = async () => {
    setError('');
    setProduct(null);
    if (!search) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/products?search=${encodeURIComponent(search)}`,
        { headers: { Authorization: `Bearer ${token}` } });
      // Try to match by id, name, or design_no
      let found = res.data.find(
        p => p.id === search || p.name.toLowerCase() === search.toLowerCase() || p.design_no === search
      );
      // If not found, but only one result, use it
      if (!found && res.data.length === 1) found = res.data[0];
      if (found) setProduct(found);
      else setError('Product not found');
    } catch {
      setError('Error searching product');
    }
  };

  // Always use the latest customerType when adding to cart
  const handleAddToCart = () => {
    if (!product) return;

    // Data integrity validation for product
    const productErrors = validateProductData(product);
    if (productErrors.length > 0) {
      return setError(`Product validation failed: ${productErrors.join(', ')}`);
    }

    // Quantity validation with enhanced checks
    if (quantity < 1) return setError('Quantity must be at least 1');
    if (!Number.isInteger(quantity) || quantity > 1000) {
      return setError('Quantity must be a reasonable integer (1-1000)');
    }

    // Check available stock with integrity validation
    const availableStock = parseInt(product.stock_quantity) || 0;

    // Prevent adding zero-stock products
    if (availableStock === 0) {
      return setError(`Product "${product.name}" is out of stock and cannot be added to cart`);
    }

    const currentInCart = cart.filter(item => item.id === product.id)
      .reduce((total, item) => total + item.quantity, 0);

    if (quantity > availableStock) {
      return setError(`Stock integrity violation: Only ${availableStock} items available`);
    }

    if (currentInCart + quantity > availableStock) {
      return setError(`Stock integrity violation: Cannot add ${quantity} items. Only ${availableStock - currentInCart} more available`);
    }

    // Price validation and calculation with integrity checks
    let retail = parseFloat(product.retail_price);
    let wholesale = parseFloat(product.wholesale_price);

    if (isNaN(retail) || retail < 0) {
      return setError(`Price integrity violation: Invalid retail price for ${product.name}`);
    }

    if (isNaN(wholesale)) wholesale = 0;
    if (wholesale < 0) wholesale = 0;

    let price = customerType === 'long-term' ? wholesale : retail;

    // Validate final price
    if (price <= 0) {
      return setError(`Price integrity violation: Invalid final price (${price}) for ${product.name}`);
    }

    // Create validated cart item
    const cartItem = {
      ...product,
      quantity,
      price,
      retail_price: retail,
      wholesale_price: wholesale,
      added_at: new Date().toISOString() // Add timestamp for audit
    };

    // Validate cart item before adding
    const itemErrors = validateProductData(cartItem);
    if (itemErrors.length > 0) {
      return setError(`Cart item validation failed: ${itemErrors.join(', ')}`);
    }

    setCart(cart => [...cart, cartItem]);
    setProduct(null);
    setSearch('');
    setQuantity(1);
    setError('');

    // Log successful add to cart for audit
    console.log(`[AUDIT] Product added to cart: ${product.name} x${quantity} at ${price}`);
  };

  // Auto-search and add to cart if ID matches
  useEffect(() => {
    if (!search) return;
    const isId = /^\d+$/.test(search) || search.startsWith('ZY');
    if (!isId) return;
    const fetchAndAutoAdd = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/products?search=${encodeURIComponent(search)}`,
          { headers: { Authorization: `Bearer ${token}` } });
        let found = res.data.find(p => p.id === search);
        if (found) {
          // Defensive: always parse and fallback to 0
          let retail = parseFloat(found.retail_price);
          let wholesale = parseFloat(found.wholesale_price);
          if (isNaN(retail)) retail = 0;
          if (isNaN(wholesale)) wholesale = 0;
          let price = customerType === 'long-term' ? wholesale : retail;
          setCart(cart => [...cart, { ...found, quantity: 1, price, retail_price: retail, wholesale_price: wholesale }]);
          setSearch('');
        }
      } catch { }
    };
    fetchAndAutoAdd();
    // eslint-disable-next-line
  }, [search]);

  // Update cart prices when customerType changes (always use stored retail/wholesale)
  useEffect(() => {
    setCart(cart => cart.map(item => {
      let priceRaw = customerType === 'long-term' ? item.wholesale_price : item.retail_price;
      let price = parseFloat(priceRaw);
      if (isNaN(price)) price = 0;
      return { ...item, price };
    }));
  }, [customerType]);

  // Increase quantity in cart
  const handleIncreaseQty = idx => {
    const item = cart[idx];
    const availableStock = parseInt(item.stock_quantity) || 0;
    const currentInCart = cart.filter(cartItem => cartItem.id === item.id)
      .reduce((total, cartItem) => total + cartItem.quantity, 0);

    if (currentInCart >= availableStock) {
      setError(`Cannot add more. Only ${availableStock} items available in stock`);
      return;
    }

    setCart(cart => cart.map((cartItem, i) => i === idx ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem));
    setError(''); // Clear any previous errors
  };

  // Decrease quantity in cart
  const handleDecreaseQty = idx => {
    setCart(cart => cart.map((item, i) => i === idx && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item));
  };

  // Get session summary statistics
  const getSessionSummary = () => {
    const totalSales = completedSales.length;
    const totalRevenue = completedSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalItems = completedSales.reduce((sum, sale) =>
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );

    return {
      totalSales,
      totalRevenue,
      totalItems,
      averageSale: totalSales > 0 ? totalRevenue / totalSales : 0
    };
  };

  // Clear current sale and prepare for next
  const clearCurrentSale = () => {
    setCart([]);
    setMessage('');
    setError('');
  };

  // Remove item from cart
  const handleRemoveFromCart = (index) => {
    setCart(cart => cart.filter((_, i) => i !== index));
  };

  // Complete sale with comprehensive data integrity validation
  const handleCompleteSale = async () => {
    setMessage('');
    setError('');

    // Pre-sale validation
    if (cart.length === 0) return setError('Data integrity violation: Cart cannot be empty');

    // Calculate total before validation
    const calculatedTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Comprehensive data integrity validation
    const validationErrors = validateSaleData(cart, calculatedTotal);
    if (validationErrors.length > 0) {
      return setError(`Data integrity violations: ${validationErrors.join('; ')}`);
    }

    // Session data validation
    const sessionErrors = validateSessionData({
      currentSaleNumber,
      sessionStartTime
    });
    if (sessionErrors.length > 0) {
      return setError(`Session integrity violations: ${sessionErrors.join('; ')}`);
    }

    try {
      const token = localStorage.getItem('token');

      // Validate token exists
      if (!token) {
        return setError('Authentication integrity violation: No valid session token');
      }

      // Prepare sale items with validation
      const saleItems = cart.map((item, index) => {
        if (!item.id || !item.quantity || item.price === undefined) {
          throw new Error(`Item ${index + 1} missing required data`);
        }

        return {
          product_id: item.id,
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price)
        };
      });

      // Validate sale data structure
      const saleData = {
        customer_type: customerType,
        items: saleItems,
        sale_number: currentSaleNumber,
        session_start_time: sessionStartTime.toISOString(),
        total_calculated: calculatedTotal
      };

      // Additional validation before sending
      if (saleData.items.length === 0) {
        return setError('Data integrity violation: No valid items to process');
      }

      console.log(`[AUDIT] Attempting sale completion: Sale #${currentSaleNumber}, Items: ${saleData.items.length}, Total: ${calculatedTotal.toFixed(2)}`);

      const response = await axios.post(
        'http://localhost:5000/sales',
        saleData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Validate response data
      if (!response.data || (!response.data.id && !response.data.sale_id)) {
        return setError('Sale processing error: Invalid response from server');
      }

      // Create completed sale record with integrity checks
      const completedSale = {
        id: response.data.sale_id || response.data.id || Date.now(),
        saleNumber: currentSaleNumber,
        customerType,
        items: cart.map(item => ({
          ...item,
          sale_timestamp: new Date().toISOString()
        })),
        total: calculatedTotal,
        timestamp: new Date(),
        receiptGenerated: false,
        integrity_validated: true,
        server_response: response.data
      };

      // Validate completed sale data
      if (!completedSale.id || !completedSale.items || completedSale.total <= 0) {
        return setError('Sale completion integrity violation: Invalid sale record created');
      }

      // Add to completed sales and increment sale number
      setCompletedSales(prev => [...prev, completedSale]);
      setCurrentSaleNumber(prev => prev + 1);

      setMessage(`Sale #${currentSaleNumber} completed successfully! Total: PKR ${completedSale.total.toFixed(2)}`);
      setLastSale(completedSale);
      setShowReceipt(true);
      setCart([]);

      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);

    } catch (err) {
      console.error('Sale completion error:', err);
      setError('Error completing sale. Please try again.');
    }
  };

  // Start a new sale (clear current cart)
  const handleNewSale = () => {
    setCart([]);
    setProduct(null);
    setSearch('');
    setQuantity(1);
    setMessage('');
    setError('');
    setShowReceipt(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
      {/* Header with session info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Cashier POS - Sale #{currentSaleNumber}</h2>
          <small>Session started: {sessionStartTime.toLocaleTimeString()}</small>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div><strong>Sales Today: {getSessionSummary().totalSales}</strong></div>
          <div><strong>Revenue: PKR {getSessionSummary().totalRevenue.toFixed(2)}</strong></div>
        </div>

        {/* Sales History Modal */}
        {showSalesHistory && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#007bff' }}>Sales History - Session</h2>
                <button
                  onClick={() => setShowSalesHistory(false)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>

              {completedSales.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  No sales completed in this session yet.
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span><strong>Total Sales:</strong> {completedSales.length}</span>
                      <span><strong>Session Total:</strong> PKR {completedSales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      Session started: {sessionStartTime ? new Date(sessionStartTime).toLocaleString() : 'Unknown'}
                    </div>
                  </div>

                  {completedSales.map((sale, index) => (
                    <div key={index} style={{
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      marginBottom: '16px',
                      backgroundColor: '#f8f9fa'
                    }}>
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        borderRadius: '6px 6px 0 0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontWeight: 'bold' }}>Sale #{sale.id}</span>
                        <span style={{ fontSize: '14px' }}>{new Date(sale.timestamp).toLocaleString()}</span>
                      </div>

                      <div style={{ padding: '12px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#e9ecef' }}>
                              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #dee2e6' }}>Product</th>
                              <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>Qty</th>
                              <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #dee2e6' }}>Price</th>
                              <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #dee2e6' }}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sale.items.map((item, itemIndex) => (
                              <tr key={itemIndex}>
                                <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>{item.name}</td>
                                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>{item.quantity}</td>
                                <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #dee2e6' }}>PKR {item.price.toFixed(2)}</td>
                                <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #dee2e6' }}>PKR {(item.price * item.quantity).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div style={{
                          marginTop: '12px',
                          padding: '8px',
                          backgroundColor: '#d4edda',
                          borderRadius: '4px',
                          textAlign: 'right',
                          fontWeight: 'bold',
                          color: '#155724'
                        }}>
                          Sale Total: PKR {sale.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>      {/* Action buttons */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={handleNewSale}
          style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          disabled={cart.length === 0}
        >
          New Sale
        </button>
        <button
          onClick={() => setShowSalesHistory(true)}
          style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          disabled={completedSales.length === 0}
        >
          View Sales History ({completedSales.length})
        </button>
      </div>

      {/* Customer Type Selection */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontWeight: 'bold' }}>Customer Type: </label>
        <select
          value={customerType}
          onChange={e => setCustomerType(e.target.value)}
          style={{ padding: '4px 8px', marginLeft: '8px' }}
        >
          <option value="retail">Retail Customer</option>
          <option value="long-term">Wholesale Customer</option>
        </select>
      </div>

      {/* Product Search */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Scan barcode or enter product name/ID"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            style={{ padding: '8px 16px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Search
          </button>
        </div>
      </div>
      {product && (
        <div style={{ border: '1px solid #ccc', padding: 12, marginTop: 16 }}>
          <div><b>Brand:</b> {product.brand}</div>
          <div><b>Design No.:</b> {product.design_no}</div>
          <div><b>Name:</b> {product.name}</div>
          <div><b>Retail Price:</b> PKR {Number(product.retail_price).toFixed(2)}</div>
          <div><b>Wholesale Price:</b> PKR {Number(product.wholesale_price).toFixed(2)}</div>
          <div><b>Location:</b> {product.location}</div>
          <div><b>Available:</b>
            <span style={{
              color: product.stock_quantity > 0 ? '#28a745' : '#dc3545',
              fontWeight: 'bold'
            }}>
              {product.stock_quantity}
              {product.stock_quantity === 0 && ' (OUT OF STOCK)'}
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            <input
              type="number"
              min={1}
              max={product.stock_quantity}
              value={quantity}
              disabled={product.stock_quantity === 0}
              onChange={e => {
                const newQty = Number(e.target.value);
                const availableStock = parseInt(product.stock_quantity) || 0;
                const currentInCart = cart.filter(item => item.id === product.id)
                  .reduce((total, item) => total + item.quantity, 0);

                if (newQty > availableStock - currentInCart) {
                  setError(`Only ${availableStock - currentInCart} more items can be added`);
                  return;
                }

                setQuantity(newQty);
                setError('');
              }}
            />
            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              style={{
                backgroundColor: product.stock_quantity === 0 ? '#6c757d' : '#28a745',
                cursor: product.stock_quantity === 0 ? 'not-allowed' : 'pointer',
                opacity: product.stock_quantity === 0 ? 0.6 : 1
              }}
            >
              {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>
      )}
      {/* Shopping Cart */}
      <div style={{ marginTop: '24px' }}>
        <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '8px' }}>Shopping Cart</h3>
        {cart.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666', fontStyle: 'italic' }}>
            Cart is empty. Scan or search for products to add them.
          </div>
        )}
        {cart.length > 0 && (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Product</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6', width: '120px' }}>Quantity</th>
                  <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6', width: '100px' }}>Price</th>
                  <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6', width: '100px' }}>Total</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6', width: '80px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>ID: {item.id}</div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <button
                          onClick={() => handleDecreaseQty(idx)}
                          style={{ width: '24px', height: '24px', border: '1px solid #ccc', background: '#f8f9fa', cursor: 'pointer' }}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                        <button
                          onClick={() => handleIncreaseQty(idx)}
                          style={{ width: '24px', height: '24px', border: '1px solid #ccc', background: '#f8f9fa', cursor: 'pointer' }}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6' }}>
                      PKR {typeof item.price === 'number' && !isNaN(item.price) ? item.price.toFixed(2) : '0.00'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6', fontWeight: 'bold' }}>
                      PKR {!isNaN(item.price * item.quantity) ? (item.price * item.quantity).toFixed(2) : '0.00'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                      <button
                        onClick={() => handleRemoveFromCart(idx)}
                        style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Cart Summary */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px', textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
                Grand Total: PKR {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                {cart.reduce((sum, item) => sum + item.quantity, 0)} items in cart
              </div>
            </div>
          </div>
        )}

        {/* Complete Sale Button */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={handleCompleteSale}
            disabled={cart.length === 0}
            style={{
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: cart.length > 0 ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
              minWidth: '200px'
            }}
          >
            Complete Sale #{currentSaleNumber}
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#d4edda',
            color: '#155724',
            border: '1px solid #c3e6cb',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
      </div>
      {showReceipt && lastSale && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div id="receipt-print" style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 320, maxWidth: 400 }}>
            <h3>Receipt</h3>
            <div><b>Customer Type:</b> {lastSale.customerType}</div>
            <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {lastSale.cart.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>PKR {typeof item.price === 'number' && !isNaN(item.price) ? item.price.toFixed(2) : '0.00'}</td>
                    <td>PKR {!isNaN(item.price * item.quantity) ? (item.price * item.quantity).toFixed(2) : '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 12 }}>
              <b>Grand Total: </b>
              PKR {lastSale.cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
            </div>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => {
                const printContents = document.getElementById('receipt-print').innerHTML;
                const printWindow = window.open('', '', 'width=800,height=1120');
                printWindow.document.write(`
                  <html>
                  <head>
                    <title>Print Receipt</title>
                    <style>
                      @media print {
                        body, #receipt-print {
                          width: 210mm;
                          height: 297mm;
                          margin: 0;
                          padding: 20mm;
                        }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ccc; padding: 4px; }
                      }
                    </style>
                  </head>
                  <body>
                    <div id='receipt-print' style='width:210mm;min-height:297mm;padding:20mm;'>${printContents}</div>
                  </body>
                  </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => printWindow.print(), 500);
              }}>Print (A4)</button>
              <button style={{ marginLeft: 8 }} onClick={() => setShowReceipt(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CashierPOS;
