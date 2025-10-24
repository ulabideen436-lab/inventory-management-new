import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Import the dashboard components for full owner functionality
import Customers from '../components/Customers';
import Products from '../components/Products';
import Sales from '../components/Sales';
import Suppliers from '../components/Suppliers';
import Transactions from '../components/Transactions';

// Import unified sale edit system
import SaleEditModal from '../components/SaleEditModal';
import { useSaleEdit } from '../hooks/useSaleEdit';

function OwnerPOS() {
    const navigate = useNavigate();

    // Multi-Sale POS States
    const [activeSales, setActiveSales] = useState([{
        id: 1,
        customerName: 'Walk-in Customer',
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

    // Management View States - now full screen when not in POS mode
    const [activeView, setActiveView] = useState('pos'); // 'pos', 'products', 'customers', 'suppliers', 'transactions', etc.
    const [customers, setCustomers] = useState([]);

    // Legacy single sale states (kept for compatibility)
    const [search, setSearch] = useState('');
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);

    // Live Search States
    const [liveSearch, setLiveSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);

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

    // Load customers for POS customer selection
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
        fetchCustomers();
    }, []);

    // Multi-Sale Management Functions
    const getCurrentSale = () => activeSales.find(sale => sale.id === currentSaleId);

    const updateCurrentSale = (updates) => {
        setActiveSales(sales => sales.map(sale =>
            sale.id === currentSaleId ? { ...sale, ...updates } : sale
        ));
    };

    const createNewSale = (customerName = 'Walk-in Customer', customerType = 'retail') => {
        const newSale = {
            id: nextSaleId,
            customerName,
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

    // Placeholder for additional functions
    const handleLiveSearch = (searchTerm) => {
        setLiveSearch(searchTerm);
        // Add live search logic here
    };

    const highlightSearchTerm = (text, term) => {
        if (!term) return text;
        const regex = new RegExp(`(${term})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, index) =>
            regex.test(part) ?
                <span key={index} style={{ backgroundColor: '#fff3cd', fontWeight: 'bold' }}>{part}</span> :
                part
        );
    };

    const handleAddFromSearch = (product) => {
        console.log('🎯 handleAddFromSearch called with product:', product.name);

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

        let price = currentSale.customerType === 'long-term' ? wholesale : retail;

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
                originalPrice: price
            }]
        });

        // Clear search after adding
        setLiveSearch('');
        setSearchResults([]);
        setShowSearchResults(false);
        setError('');

        // Show success message temporarily
        setMessage(`✅ Added ${product.name} to cart!`);
        setTimeout(() => setMessage(''), 2000);
    };

    // Cart management functions
    const handleIncreaseQty = idx => {
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

        if (discountType === 'percentage') {
            saleDiscountAmount = (subtotal * parseFloat(discountValue || 0)) / 100;
        } else if (discountType === 'amount') {
            saleDiscountAmount = parseFloat(discountValue || 0);
        }

        return Math.max(0, subtotal - saleDiscountAmount);
    };

    return (
        <div style={{
            height: '100vh',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#f8f9fa',
            display: 'flex',
            flexDirection: 'column'
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
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setActiveView('products')}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#3498db',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                📦 Manage Products
                            </button>
                            <button
                                onClick={() => setActiveView('customers')}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#e67e22',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                👥 Manage Customers
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#e74c3c',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                🏠 Dashboard
                            </button>
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
                        overflow: 'hidden'
                    }}>
                        {/* Left Panel - Product Search & Selection */}
                        <div style={{
                            flex: '1',
                            padding: '20px',
                            backgroundColor: 'white',
                            borderRight: '2px solid #ecf0f1',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <h3 style={{
                                margin: '0 0 20px 0',
                                color: '#2c3e50',
                                fontSize: '18px'
                            }}>
                                🔍 Product Search & Selection
                            </h3>

                            {/* Product Search Input */}
                            <div style={{ position: 'relative', marginBottom: '20px' }}>
                                <input
                                    type="text"
                                    className="live-search-input"
                                    value={liveSearch}
                                    onChange={(e) => handleLiveSearch(e.target.value)}
                                    placeholder="Search products by name, brand, or design number..."
                                    style={{
                                        width: '100%',
                                        padding: '15px 20px',
                                        border: '2px solid #e0e0e0',
                                        borderRadius: '10px',
                                        fontSize: '16px',
                                        boxSizing: 'border-box',
                                        outline: 'none',
                                        transition: 'border-color 0.3s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#3498db'}
                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                />
                            </div>

                            {/* Placeholder for search results */}
                            <div style={{
                                backgroundColor: '#f8f9fa',
                                padding: '40px',
                                textAlign: 'center',
                                borderRadius: '10px',
                                color: '#7f8c8d'
                            }}>
                                🔍 Search for products above to see results
                            </div>
                        </div>

                        {/* Right Panel - Current Sale Cart */}
                        <div style={{
                            width: '450px',
                            backgroundColor: 'white',
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '-2px 0 10px rgba(0,0,0,0.1)'
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
                                                <strong>Customer: </strong>
                                                <input
                                                    type="text"
                                                    value={currentSale.customerName}
                                                    onChange={(e) => updateCurrentSale({ customerName: e.target.value })}
                                                    placeholder="Enter customer name"
                                                    style={{
                                                        padding: '5px 10px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '5px',
                                                        marginLeft: '10px',
                                                        width: '200px'
                                                    }}
                                                />
                                            </div>

                                            <div>
                                                <strong>Customer Type: </strong>
                                                <select
                                                    value={currentSale.customerType}
                                                    onChange={(e) => updateCurrentSale({ customerType: e.target.value })}
                                                    style={{
                                                        padding: '5px 10px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '5px',
                                                        marginLeft: '10px'
                                                    }}
                                                >
                                                    <option value="retail">Retail Customer</option>
                                                    <option value="long-term">Long-term Customer (Wholesale)</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Cart Items */}
                                        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
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
                                                        style={{
                                                            backgroundColor: '#f8f9fa',
                                                            padding: '15px',
                                                            borderRadius: '8px',
                                                            marginBottom: '10px',
                                                            border: '1px solid #e0e0e0'
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
                                                            </div>

                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#27ae60' }}>
                                                                    PKR {calculateItemFinalPrice(item).toFixed(2)}
                                                                </div>
                                                                <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                                                                    PKR {item.price.toFixed(2)} each
                                                                </div>
                                                            </div>
                                                        </div>
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
                                                        <span>- PKR {((calculateSubtotal(currentSale.cart) - calculateTotal(currentSale.cart, currentSale.discountType, currentSale.discountValue))).toFixed(2)}</span>
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
                                                        💳 Complete Sale
                                                    </button>
                                                    <button
                                                        onClick={() => updateCurrentSale({
                                                            showDiscountInput: !currentSale.showDiscountInput
                                                        })}
                                                        style={{
                                                            padding: '15px',
                                                            backgroundColor: '#e67e22',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            fontSize: '14px'
                                                        }}
                                                    >
                                                        🏷️ Discount
                                                    </button>
                                                </div>

                                                {/* Discount Input */}
                                                {currentSale.showDiscountInput && (
                                                    <div style={{
                                                        backgroundColor: '#fff3cd',
                                                        padding: '15px',
                                                        borderRadius: '8px',
                                                        marginTop: '15px',
                                                        border: '1px solid #ffeaa7'
                                                    }}>
                                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                                            <select
                                                                value={currentSale.discountType}
                                                                onChange={(e) => updateCurrentSale({ discountType: e.target.value })}
                                                                style={{
                                                                    padding: '5px',
                                                                    border: '1px solid #ddd',
                                                                    borderRadius: '4px'
                                                                }}
                                                            >
                                                                <option value="amount">Amount (PKR)</option>
                                                                <option value="percentage">Percentage (%)</option>
                                                            </select>
                                                            <input
                                                                type="number"
                                                                value={currentSale.discountValue}
                                                                onChange={(e) => updateCurrentSale({
                                                                    discountValue: Math.max(0, parseFloat(e.target.value) || 0)
                                                                })}
                                                                placeholder={currentSale.discountType === 'percentage' ? 'Enter %' : 'Enter amount'}
                                                                style={{
                                                                    flex: 1,
                                                                    padding: '5px',
                                                                    border: '1px solid #ddd',
                                                                    borderRadius: '4px'
                                                                }}
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => updateCurrentSale({ showDiscountInput: false })}
                                                            style={{
                                                                width: '100%',
                                                                padding: '8px',
                                                                backgroundColor: '#27ae60',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Apply Discount
                                                        </button>
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

            {/* Unified Sale Edit Modal */}
            <SaleEditModal
                isOpen={isEditModalOpen}
                onClose={closeEditModal}
                saleId={editingSaleId}
                onSaveSuccess={handleSaveSuccess}
                userRole="owner"
            />
        </div>
    );
}

export default OwnerPOS;