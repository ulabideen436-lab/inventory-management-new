import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

// Data Integrity Validation Functions (unchanged)
const validateSaleData = (cart, total) => {
    const errors = [];
    if (!cart || cart.length === 0) {
        errors.push('Cart cannot be empty');
        return errors;
    }
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

function CashierPOS() {
    // Multiple sales state - TAB FUNCTIONALITY
    const [activeSales, setActiveSales] = useState([{
        id: 1,
        customerType: 'retail',
        cart: [],
        saleNumber: 1
    }]);
    const [currentSaleId, setCurrentSaleId] = useState(1);
    const [nextSaleId, setNextSaleId] = useState(2);

    // UI state
    const [search, setSearch] = useState('');
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastSale, setLastSale] = useState(null);

    // Session management
    const [completedSales, setCompletedSales] = useState([]);
    const [showSalesHistory, setShowSalesHistory] = useState(false);
    const [sessionStartTime, setSessionStartTime] = useState(new Date());

    // Barcode scanner support
    const searchInputRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    // Get current sale
    const getCurrentSale = () => {
        return activeSales.find(sale => sale.id === currentSaleId);
    };

    // Update current sale
    const updateCurrentSale = (updates) => {
        setActiveSales(sales => sales.map(sale =>
            sale.id === currentSaleId ? { ...sale, ...updates } : sale
        ));
    };

    // Create new sale tab
    const handleCreateNewSale = () => {
        const newSale = {
            id: nextSaleId,
            customerType: 'retail',
            cart: [],
            saleNumber: completedSales.length + activeSales.length + 1
        };
        setActiveSales([...activeSales, newSale]);
        setCurrentSaleId(nextSaleId);
        setNextSaleId(nextSaleId + 1);
        setError('');
        setMessage('');
        setProduct(null);
        setSearch('');
    };

    // Close sale tab
    const handleCloseSaleTab = (saleId) => {
        if (activeSales.length === 1) {
            setError('Cannot close the last sale. At least one sale must be active.');
            return;
        }
        const sale = activeSales.find(s => s.id === saleId);
        if (sale && sale.cart.length > 0) {
            if (!window.confirm('This sale has items in cart. Are you sure you want to close it?')) {
                return;
            }
        }
        const remainingSales = activeSales.filter(s => s.id !== saleId);
        setActiveSales(remainingSales);
        if (currentSaleId === saleId) {
            setCurrentSaleId(remainingSales[0].id);
        }
    };

    // Search product with barcode support
    const handleSearch = async () => {
        setError('');
        setProduct(null);
        if (!search) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/products?search=${encodeURIComponent(search)}`,
                { headers: { Authorization: `Bearer ${token}` } });

            // Try exact ID match first (for barcode)
            let found = res.data.find(p => p.id.toString() === search.toString());

            // If not found, try name or design number
            if (!found) {
                found = res.data.find(p =>
                    p.name.toLowerCase() === search.toLowerCase() ||
                    p.design_no === search
                );
            }

            // If still not found but only one result, use it
            if (!found && res.data.length === 1) found = res.data[0];

            if (found) {
                setProduct(found);
            } else {
                setError('Product not found');
            }
        } catch {
            setError('Error searching product');
        }
    };

    // Auto-add product when exact ID is scanned (BARCODE SUPPORT)
    useEffect(() => {
        if (!search) return;

        // Check if input is numeric ID (barcode pattern)
        const isNumericId = /^\d+$/.test(search.trim());
        if (!isNumericId) return;

        // Clear any existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Set timeout for barcode scanner (fast input detection)
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`http://localhost:5000/products?search=${encodeURIComponent(search)}`,
                    { headers: { Authorization: `Bearer ${token}` } });

                // Find exact ID match
                const found = res.data.find(p => p.id.toString() === search.toString());

                if (found) {
                    // Auto-add to cart with quantity 1
                    const currentSale = getCurrentSale();
                    if (!currentSale) return;

                    // Check stock availability
                    const availableStock = parseInt(found.stock_quantity) || 0;
                    if (availableStock === 0) {
                        setError(`Product "${found.name}" is out of stock`);
                        playErrorBeep();
                        return;
                    }

                    const currentInCart = currentSale.cart.filter(item => item.id === found.id)
                        .reduce((total, item) => total + item.quantity, 0);

                    if (currentInCart >= availableStock) {
                        setError(`Cannot add more. Only ${availableStock} items available`);
                        playErrorBeep();
                        return;
                    }

                    // Calculate price based on customer type
                    let retail = parseFloat(found.retail_price);
                    let wholesale = parseFloat(found.wholesale_price);
                    if (isNaN(retail)) retail = 0;
                    if (isNaN(wholesale)) wholesale = 0;
                    // Match backend logic: 'longterm' or 'wholesale' use wholesale price
                    let price = (currentSale.customerType === 'longterm' || currentSale.customerType === 'wholesale') ? wholesale : retail;

                    // Add to cart
                    updateCurrentSale({
                        cart: [...currentSale.cart, {
                            ...found,
                            quantity: 1,
                            price,
                            retail_price: retail,
                            wholesale_price: wholesale,
                            added_at: new Date().toISOString()
                        }]
                    });

                    // Clear search and show success
                    setSearch('');
                    setProduct(null);
                    setError('');
                    setMessage(`📱 Barcode scanned! Added ${found.name} to cart`);
                    setTimeout(() => setMessage(''), 2000);

                    // Play success beep
                    playSuccessBeep();

                    // Focus back on search input
                    if (searchInputRef.current) {
                        searchInputRef.current.focus();
                    }
                }
            } catch (err) {
                console.error('Auto-add error:', err);
            }
        }, 100); // Short delay for barcode scanner

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
        // eslint-disable-next-line
    }, [search]);

    // Audio feedback functions
    const playSuccessBeep = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.1;

            oscillator.start();
            setTimeout(() => oscillator.stop(), 100);
        } catch (err) {
            console.log('Audio not available');
        }
    };

    const playErrorBeep = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 400;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.1;

            oscillator.start();
            setTimeout(() => oscillator.stop(), 200);
        } catch (err) {
            console.log('Audio not available');
        }
    };

    // Add to cart manually
    const handleAddToCart = () => {
        if (!product) return;

        const currentSale = getCurrentSale();
        if (!currentSale) return;

        const productErrors = validateProductData(product);
        if (productErrors.length > 0) {
            return setError(`Product validation failed: ${productErrors.join(', ')}`);
        }

        if (quantity < 1) return setError('Quantity must be at least 1');
        if (!Number.isInteger(quantity) || quantity > 1000) {
            return setError('Quantity must be a reasonable integer (1-1000)');
        }

        const availableStock = parseInt(product.stock_quantity) || 0;
        if (availableStock === 0) {
            return setError(`Product "${product.name}" is out of stock`);
        }

        const currentInCart = currentSale.cart.filter(item => item.id === product.id)
            .reduce((total, item) => total + item.quantity, 0);

        if (quantity > availableStock) {
            return setError(`Only ${availableStock} items available`);
        }

        if (currentInCart + quantity > availableStock) {
            return setError(`Cannot add ${quantity} items. Only ${availableStock - currentInCart} more available`);
        }

        let retail = parseFloat(product.retail_price);
        let wholesale = parseFloat(product.wholesale_price);
        if (isNaN(retail) || retail < 0) {
            return setError(`Invalid retail price for ${product.name}`);
        }
        if (isNaN(wholesale)) wholesale = 0;
        if (wholesale < 0) wholesale = 0;

        // Match backend logic: 'longterm' or 'wholesale' use wholesale price
        let price = (currentSale.customerType === 'longterm' || currentSale.customerType === 'wholesale') ? wholesale : retail;
        if (price <= 0) {
            return setError(`Invalid final price for ${product.name}`);
        }

        const cartItem = {
            ...product,
            quantity,
            price,
            retail_price: retail,
            wholesale_price: wholesale,
            added_at: new Date().toISOString()
        };

        updateCurrentSale({
            cart: [...currentSale.cart, cartItem]
        });

        setProduct(null);
        setSearch('');
        setQuantity(1);
        setError('');
        setMessage(`Added ${product.name} to cart`);
        setTimeout(() => setMessage(''), 2000);
    };

    // Update cart prices when customer type changes
    useEffect(() => {
        const currentSale = getCurrentSale();
        if (!currentSale) return;

        updateCurrentSale({
            cart: currentSale.cart.map(item => {
                // Match backend logic: 'longterm' or 'wholesale' use wholesale price
                let priceRaw = (currentSale.customerType === 'longterm' || currentSale.customerType === 'wholesale') ? item.wholesale_price : item.retail_price;
                let price = parseFloat(priceRaw);
                if (isNaN(price)) price = 0;
                return { ...item, price };
            })
        });
        // eslint-disable-next-line
    }, [currentSaleId]);

    // Increase/Decrease quantity in cart
    const handleIncreaseQty = idx => {
        const currentSale = getCurrentSale();
        if (!currentSale) return;

        const item = currentSale.cart[idx];
        const availableStock = parseInt(item.stock_quantity) || 0;
        const currentInCart = currentSale.cart.filter(cartItem => cartItem.id === item.id)
            .reduce((total, cartItem) => total + cartItem.quantity, 0);

        if (currentInCart >= availableStock) {
            setError(`Cannot add more. Only ${availableStock} items available`);
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

    // Remove from cart
    const handleRemoveFromCart = (index) => {
        const currentSale = getCurrentSale();
        if (!currentSale) return;

        updateCurrentSale({
            cart: currentSale.cart.filter((_, i) => i !== index)
        });
    };

    // Get session summary
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

    // Complete sale
    const handleCompleteSale = async () => {
        setMessage('');
        setError('');

        const currentSale = getCurrentSale();
        if (!currentSale || currentSale.cart.length === 0) {
            return setError('Cart cannot be empty');
        }

        const calculatedTotal = currentSale.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const validationErrors = validateSaleData(currentSale.cart, calculatedTotal);
        if (validationErrors.length > 0) {
            return setError(`Data integrity violations: ${validationErrors.join('; ')}`);
        }

        try {
            const token = localStorage.getItem('token');
            const username = localStorage.getItem('username') || 'cashier';

            // Force recalculate prices based on customer type before submitting
            const updatedCart = currentSale.cart.map(item => {
                let correctPrice;
                if (currentSale.customerType === 'wholesale') {
                    correctPrice = parseFloat(item.wholesale_price) || 0;
                } else {
                    correctPrice = parseFloat(item.retail_price) || 0;
                }
                return { ...item, price: correctPrice };
            });

            // Update the current sale with correct prices
            updateCurrentSale({ cart: updatedCart });

            // Calculate totals properly with corrected prices
            const subtotal = updatedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const discountAmount = 0; // No discount applied in this simple version
            const totalAmount = subtotal - discountAmount;

            const saleData = {
                customer_id: null, // Set to null for walk-in customers
                customer_type: currentSale.customerType || 'retail',
                cashier: username,
                items: updatedCart.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    price: item.price
                })),
                subtotal: subtotal,
                discount_amount: discountAmount,
                total_amount: totalAmount,
                payment_method: 'cash',
                paid_amount: totalAmount
            };

            // Log price validation details for debugging
            console.log('[PRICE VALIDATION] Sale details:', {
                customerType: saleData.customer_type,
                cartItems: updatedCart.map(item => ({
                    id: item.id,
                    name: item.name,
                    retail_price: item.retail_price,
                    wholesale_price: item.wholesale_price,
                    selected_price: item.price,
                    quantity: item.quantity
                })),
                submittedItems: saleData.items.map(item => ({
                    product_id: item.product_id,
                    price: item.price,
                    quantity: item.quantity
                }))
            });

            console.log('[AUDIT] Submitting sale:', saleData);

            const response = await axios.post('http://localhost:5000/sales', saleData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('[SUCCESS] Sale completed:', response.data);

            // Add to completed sales
            const completedSale = {
                id: currentSale.saleNumber,
                items: currentSale.cart,
                total: calculatedTotal,
                timestamp: new Date().toISOString(),
                customerType: currentSale.customerType
            };
            setCompletedSales([...completedSales, completedSale]);

            // Show success and receipt
            setLastSale({
                cart: currentSale.cart,
                customerType: currentSale.customerType
            });
            setShowReceipt(true);

            // Remove completed sale tab or clear it
            if (activeSales.length > 1) {
                handleCloseSaleTab(currentSaleId);
            } else {
                // Clear current sale
                updateCurrentSale({
                    cart: [],
                    saleNumber: completedSales.length + 2
                });
            }

            setMessage(`Sale #${currentSale.saleNumber} completed successfully!`);
            playSuccessBeep();

        } catch (err) {
            console.error('[ERROR] Sale completion failed:', err);
            setError(err.response?.data?.error || 'Failed to complete sale');
            playErrorBeep();
        }
    };

    const currentSale = getCurrentSale();

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
            {/* Header with session info */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px'
            }}>
                <div>
                    <h2 style={{ margin: 0 }}>🛒 Cashier POS System</h2>
                    <small>Session: {sessionStartTime.toLocaleTimeString()}</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div><strong>Sales Today: {getSessionSummary().totalSales}</strong></div>
                    <div><strong>Revenue: PKR {getSessionSummary().totalRevenue.toFixed(2)}</strong></div>
                </div>
            </div>

            {/* Sales Tabs */}
            <div style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '16px',
                borderBottom: '2px solid #dee2e6',
                paddingBottom: '4px',
                overflowX: 'auto',
                flexWrap: 'nowrap'
            }}>
                {activeSales.map(sale => (
                    <div
                        key={sale.id}
                        onClick={() => setCurrentSaleId(sale.id)}
                        style={{
                            padding: '10px 16px',
                            backgroundColor: currentSaleId === sale.id ? '#007bff' : '#e9ecef',
                            color: currentSaleId === sale.id ? 'white' : '#495057',
                            borderRadius: '6px 6px 0 0',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: currentSaleId === sale.id ? 'bold' : 'normal',
                            whiteSpace: 'nowrap',
                            minWidth: 'fit-content'
                        }}
                    >
                        <span>Sale #{sale.saleNumber}</span>
                        {sale.cart.length > 0 && (
                            <span style={{
                                backgroundColor: currentSaleId === sale.id ? 'rgba(255,255,255,0.3)' : '#007bff',
                                color: currentSaleId === sale.id ? 'white' : 'white',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                fontSize: '12px'
                            }}>
                                {sale.cart.length}
                            </span>
                        )}
                        {activeSales.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCloseSaleTab(sale.id);
                                }}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: currentSaleId === sale.id ? 'white' : '#dc3545',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    padding: '0 4px'
                                }}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                ))}
                <button
                    onClick={handleCreateNewSale}
                    style={{
                        padding: '10px 16px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px 6px 0 0',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap'
                    }}
                >
                    + New Sale
                </button>
                <button
                    onClick={() => setShowSalesHistory(true)}
                    style={{
                        padding: '10px 16px',
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px 6px 0 0',
                        cursor: 'pointer',
                        marginLeft: 'auto'
                    }}
                    disabled={completedSales.length === 0}
                >
                    📊 History ({completedSales.length})
                </button>
            </div>

            {currentSale && (
                <>
                    {/* Customer Type Selection */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontWeight: 'bold' }}>Customer Type: </label>
                        <select
                            value={currentSale.customerType}
                            onChange={e => updateCurrentSale({ customerType: e.target.value })}
                            style={{ padding: '8px', marginLeft: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            <option value="retail">Retail Customer</option>
                            <option value="wholesale">Wholesale Customer</option>
                        </select>
                    </div>

                    {/* Product Search with Barcode Support */}
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="🔍 Scan barcode or search product ID/name"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    border: '2px solid #007bff',
                                    borderRadius: '6px',
                                    fontSize: '16px'
                                }}
                                onKeyPress={e => e.key === 'Enter' && handleSearch()}
                                autoFocus
                            />
                            <button
                                onClick={handleSearch}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#17a2b8',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Search
                            </button>
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            💡 Tip: Scan barcode for instant add to cart
                        </div>
                    </div>

                    {/* Product Details (WITHOUT STOCK QUANTITY - HIDDEN FROM CASHIER) */}
                    {product && (
                        <div style={{
                            border: '2px solid #007bff',
                            padding: '16px',
                            marginBottom: '16px',
                            borderRadius: '8px',
                            backgroundColor: '#f8f9fa'
                        }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div><b>Product ID:</b> {product.id}</div>
                                <div><b>Brand:</b> {product.brand}</div>
                                <div><b>Design No.:</b> {product.design_no}</div>
                                <div><b>Name:</b> {product.name}</div>
                                <div><b>Retail Price:</b> PKR {Number(product.retail_price).toFixed(2)}</div>
                                <div><b>Wholesale Price:</b> PKR {Number(product.wholesale_price).toFixed(2)}</div>
                                <div><b>Location:</b> {product.location}</div>
                                <div>
                                    <b>Status:</b>
                                    <span style={{
                                        color: product.stock_quantity > 0 ? '#28a745' : '#dc3545',
                                        fontWeight: 'bold',
                                        marginLeft: '8px'
                                    }}>
                                        {product.stock_quantity > 0 ? '✅ Available' : '❌ Out of Stock'}
                                    </span>
                                </div>
                            </div>
                            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <label><b>Quantity:</b></label>
                                <input
                                    type="number"
                                    min={1}
                                    value={quantity}
                                    disabled={product.stock_quantity === 0}
                                    onChange={e => setQuantity(Number(e.target.value))}
                                    style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                                <button
                                    onClick={handleAddToCart}
                                    disabled={product.stock_quantity === 0}
                                    style={{
                                        padding: '10px 24px',
                                        backgroundColor: product.stock_quantity === 0 ? '#6c757d' : '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: product.stock_quantity === 0 ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '16px'
                                    }}
                                >
                                    {product.stock_quantity === 0 ? 'Out of Stock' : '+ Add to Cart'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Shopping Cart */}
                    <div style={{ marginTop: '24px' }}>
                        <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '8px', color: '#007bff' }}>
                            🛒 Shopping Cart - Sale #{currentSale.saleNumber}
                        </h3>
                        {currentSale.cart.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '60px 20px',
                                color: '#666',
                                fontStyle: 'italic',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px',
                                marginTop: '16px'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
                                <div style={{ fontSize: '18px' }}>Cart is empty</div>
                                <div style={{ fontSize: '14px', marginTop: '8px' }}>Scan barcode or search for products to add</div>
                            </div>
                        ) : (
                            <div style={{ marginTop: '16px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                                    <thead style={{ backgroundColor: '#007bff', color: 'white' }}>
                                        <tr>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Product</th>
                                            <th style={{ padding: '12px', textAlign: 'center', width: '150px' }}>Quantity</th>
                                            <th style={{ padding: '12px', textAlign: 'right', width: '120px' }}>Price</th>
                                            <th style={{ padding: '12px', textAlign: 'right', width: '120px' }}>Total</th>
                                            <th style={{ padding: '12px', textAlign: 'center', width: '100px' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentSale.cart.map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #dee2e6', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                                                <td style={{ padding: '12px' }}>
                                                    <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                                                    <div style={{ fontSize: '12px', color: '#666' }}>ID: {item.id} | Brand: {item.brand}</div>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                        <button
                                                            onClick={() => handleDecreaseQty(idx)}
                                                            style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                border: '1px solid #ccc',
                                                                background: '#f8f9fa',
                                                                cursor: 'pointer',
                                                                borderRadius: '4px',
                                                                fontWeight: 'bold'
                                                            }}
                                                            disabled={item.quantity <= 1}
                                                        >
                                                            −
                                                        </button>
                                                        <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => handleIncreaseQty(idx)}
                                                            style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                border: '1px solid #ccc',
                                                                background: '#f8f9fa',
                                                                cursor: 'pointer',
                                                                borderRadius: '4px',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                                    PKR {typeof item.price === 'number' && !isNaN(item.price) ? item.price.toFixed(2) : '0.00'}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>
                                                    PKR {!isNaN(item.price * item.quantity) ? (item.price * item.quantity).toFixed(2) : '0.00'}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleRemoveFromCart(idx)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            backgroundColor: '#dc3545',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Cart Summary */}
                                <div style={{
                                    backgroundColor: '#28a745',
                                    padding: '20px',
                                    borderRadius: '8px',
                                    color: 'white'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '16px' }}>
                                                {currentSale.cart.reduce((sum, item) => sum + item.quantity, 0)} items
                                            </div>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>
                                                TOTAL: PKR {currentSale.cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleCompleteSale}
                                            style={{
                                                padding: '16px 32px',
                                                fontSize: '18px',
                                                fontWeight: 'bold',
                                                backgroundColor: 'white',
                                                color: '#28a745',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            💳 Complete Sale
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        {message && (
                            <div style={{
                                marginTop: '16px',
                                padding: '12px',
                                backgroundColor: '#d4edda',
                                color: '#155724',
                                border: '1px solid #c3e6cb',
                                borderRadius: '6px',
                                textAlign: 'center',
                                fontWeight: 'bold'
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
                                borderRadius: '6px',
                                textAlign: 'center',
                                fontWeight: 'bold'
                            }}>
                                {error}
                            </div>
                        )}
                    </div>
                </>
            )}

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
                        borderRadius: '12px',
                        maxWidth: '900px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, color: '#007bff' }}>📊 Sales History - Today's Session</h2>
                            <button
                                onClick={() => setShowSalesHistory(false)}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Close
                            </button>
                        </div>

                        {completedSales.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                                <div style={{ fontSize: '18px' }}>No sales completed yet</div>
                            </div>
                        ) : (
                            <div>
                                {/* Session Summary */}
                                <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', textAlign: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>Total Sales</div>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                                                {completedSales.length}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>Total Revenue</div>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                                                PKR {completedSales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>Items Sold</div>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#17a2b8' }}>
                                                {completedSales.reduce((sum, sale) =>
                                                    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '12px', textAlign: 'center' }}>
                                        Session started: {sessionStartTime.toLocaleString()}
                                    </div>
                                </div>

                                {/* Individual Sales */}
                                {completedSales.map((sale, index) => (
                                    <div key={index} style={{
                                        border: '1px solid #dee2e6',
                                        borderRadius: '8px',
                                        marginBottom: '16px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            padding: '12px 16px',
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Sale #{sale.id}</span>
                                            <span style={{ fontSize: '14px' }}>{new Date(sale.timestamp).toLocaleString()}</span>
                                        </div>

                                        <div style={{ padding: '16px', backgroundColor: '#f8f9fa' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#e9ecef' }}>
                                                        <th style={{ padding: '8px', textAlign: 'left' }}>Product</th>
                                                        <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
                                                        <th style={{ padding: '8px', textAlign: 'right' }}>Price</th>
                                                        <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sale.items.map((item, itemIndex) => (
                                                        <tr key={itemIndex} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                            <td style={{ padding: '8px' }}>{item.name}</td>
                                                            <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                                                            <td style={{ padding: '8px', textAlign: 'right' }}>PKR {item.price.toFixed(2)}</td>
                                                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                                                                PKR {(item.price * item.quantity).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>

                                            <div style={{
                                                marginTop: '12px',
                                                padding: '12px',
                                                backgroundColor: '#d4edda',
                                                borderRadius: '6px',
                                                textAlign: 'right',
                                                fontWeight: 'bold',
                                                color: '#155724',
                                                fontSize: '16px'
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

            {/* Receipt Modal */}
            {showReceipt && lastSale && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div id="receipt-print" style={{
                        background: '#fff',
                        padding: '32px',
                        borderRadius: '12px',
                        minWidth: '400px',
                        maxWidth: '500px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}>
                        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#007bff' }}>🧾 Receipt</h2>
                        <div style={{ marginBottom: '16px' }}>
                            <div><b>Date:</b> {new Date().toLocaleString()}</div>
                            <div><b>Customer Type:</b> {lastSale.customerType === 'retail' ? 'Retail' : 'Wholesale'}</div>
                        </div>
                        <table style={{ width: '100%', marginTop: '16px', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: '#f8f9fa' }}>
                                <tr>
                                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Item</th>
                                    <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Qty</th>
                                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #dee2e6' }}>Price</th>
                                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #dee2e6' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lastSale.cart.map((item, idx) => (
                                    <tr key={idx}>
                                        <td style={{ padding: '8px', borderBottom: '1px solid #dee2e6' }}>{item.name}</td>
                                        <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>{item.quantity}</td>
                                        <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                                            PKR {typeof item.price === 'number' && !isNaN(item.price) ? item.price.toFixed(2) : '0.00'}
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>
                                            PKR {!isNaN(item.price * item.quantity) ? (item.price * item.quantity).toFixed(2) : '0.00'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#28a745', color: 'white', borderRadius: '8px' }}>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'right' }}>
                                TOTAL: PKR {lastSale.cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                            </div>
                        </div>
                        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                            <button
                                onClick={() => {
                                    const printContents = document.getElementById('receipt-print').innerHTML;
                                    const printWindow = window.open('', '', 'width=800,height=1120');
                                    printWindow.document.write(`
                    <html>
                    <head>
                      <title>Print Receipt</title>
                      <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ccc; padding: 8px; }
                        th { background-color: #f8f9fa; }
                      </style>
                    </head>
                    <body>${printContents}</body>
                    </html>
                  `);
                                    printWindow.document.close();
                                    printWindow.focus();
                                    setTimeout(() => printWindow.print(), 500);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                🖨️ Print Receipt
                            </button>
                            <button
                                onClick={() => setShowReceipt(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CashierPOS;
