import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import UnifiedInvoiceView from './UnifiedInvoiceView';

// Utility functions
const formatCurrency = (amount) => {
    const validAmount = parseFloat(amount) || 0;
    if (isNaN(validAmount)) return 'PKR 0.00';
    return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 2
    }).format(validAmount);
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Customer-based pricing function
const getCustomerPrice = (product, customer) => {
    if (!product) return 0;

    // Determine customer type
    const customerType = customer?.type?.toLowerCase() || 'retail';

    // Price selection based on customer type
    if (customerType === 'longterm' || customerType === 'wholesale') {
        // Use wholesale price for long-term customers
        return parseFloat(product.wholesale_price) || parseFloat(product.retail_price) || parseFloat(product.selling_price) || 0;
    } else {
        // Use retail price for retail customers (default)
        return parseFloat(product.retail_price) || parseFloat(product.selling_price) || 0;
    }
};

// Invoice generation function
const generateInvoice = (saleData, cart, selectedCustomer, discountType, discountValue, calculateSubtotal, calculateDiscountAmount, calculateItemFinalPrice, calculateItemDiscountAmount) => {
    const itemsSubtotal = cart.reduce((sum, item) => sum + calculateItemFinalPrice(item), 0);
    const totalDiscount = calculateDiscountAmount();
    const finalTotal = itemsSubtotal - totalDiscount;

    // Convert number to words function (simplified)
    const numberToWords = (num) => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        if (num === 0) return 'Zero';
        if (num < 10) return ones[num];
        if (num < 20) return teens[num - 10];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
        if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + numberToWords(num % 100) : '');
        return 'Rupees ' + Math.floor(finalTotal);
    };

    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Sale Invoice</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background: white;
            font-size: 12px;
            line-height: 1.4;
        }
        .invoice-container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            border: 2px solid #000;
            padding: 0;
        }
        .header { 
            text-align: center; 
            padding: 20px;
            border-bottom: 2px solid #000;
        }
        .header h1 { 
            margin: 0 0 10px 0; 
            font-size: 24px; 
            font-weight: bold;
            color: #1e40af;
        }
        .header h2 { 
            margin: 0; 
            font-size: 18px; 
            font-weight: bold;
        }
        .invoice-info { 
            display: flex; 
            justify-content: space-between; 
            padding: 15px 20px;
            border-bottom: 1px solid #000;
        }
        .bill-to {
            padding: 15px 20px;
            border-bottom: 2px solid #000;
        }
        .bill-to h3 {
            margin: 0 0 5px 0;
            font-weight: bold;
        }
        .items-table { 
            width: 100%; 
            border-collapse: collapse; 
        }
        .items-table th { 
            background: #1e40af; 
            color: white; 
            padding: 12px 8px; 
            text-align: center; 
            font-weight: bold;
            border: 1px solid #000;
        }
        .items-table td { 
            padding: 8px; 
            border: 1px solid #000; 
            text-align: center;
        }
        .items-table .description { 
            text-align: left; 
        }
        .items-table .amount, .items-table .net { 
            text-align: right; 
        }
        .totals-row {
            background: #f8fafc;
            font-weight: bold;
        }
        .totals-section {
            padding: 20px;
        }
        .amount-words {
            margin: 20px 0;
            padding: 10px;
            background: #f8fafc;
            border: 1px solid #ddd;
        }
        .terms {
            margin-top: 20px;
            font-size: 11px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding: 15px;
            border-top: 1px solid #000;
        }
        @media print {
            body { margin: 0; }
            .invoice-container { border: 1px solid #000; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <h1>Sale Invoice</h1>
            <h2>Inventory Management System</h2>
        </div>

        <!-- Invoice Info -->
        <div class="invoice-info">
            <div>
                <strong>Date:</strong> ${formatDate(saleData?.created_at || new Date())}
            </div>
            <div>
                <strong>Invoice #:</strong> ${saleData?.bill_number || saleData?.id || 'Draft'}<br>
                <strong>Status:</strong> ${saleData?.status || 'COMPLETED'}
            </div>
        </div>

        <!-- Bill To -->
        <div class="bill-to">
            <h3>BILL TO:</h3>
            <div>${selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}</div>
            ${selectedCustomer?.brand_name ? `<div>${selectedCustomer.brand_name}</div>` : ''}
        </div>

        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 8%;">S#</th>
                    <th style="width: 30%;">Item Description</th>
                    <th style="width: 10%;">UOM</th>
                    <th style="width: 8%;">Qty</th>
                    <th style="width: 12%;">Rate</th>
                    <th style="width: 12%;">Amount</th>
                    <th style="width: 10%;">Discount %</th>
                    <th style="width: 10%;">Discount PKR</th>
                    <th style="width: 12%;">Net</th>
                </tr>
            </thead>
            <tbody>
                ${cart.map((item, index) => {
        const itemTotal = (item.originalPrice || item.price) * item.quantity;
        const discountAmount = calculateItemDiscountAmount(item);
        const netAmount = calculateItemFinalPrice(item);
        const discountPercentage = item.itemDiscountType === 'percentage' ? item.itemDiscountValue :
            (discountAmount > 0 ? ((discountAmount / itemTotal) * 100).toFixed(1) : 0);
        const discountPKR = item.itemDiscountType === 'amount' ? item.itemDiscountValue : discountAmount;

        return `
                        <tr>
                            <td>${index + 1}</td>
                            <td class="description">${item.name}</td>
                            <td>${item.uom || 'pcs'}</td>
                            <td>${item.quantity}</td>
                            <td class="amount">PKR ${(item.originalPrice || item.price).toFixed(2)}</td>
                            <td class="amount">PKR ${itemTotal.toFixed(2)}</td>
                            <td>${item.itemDiscountType === 'percentage' ? discountPercentage + '%' : '-'}</td>
                            <td class="amount">${discountPKR > 0 ? 'PKR ' + discountPKR.toFixed(2) : '-'}</td>
                            <td class="net">PKR ${netAmount.toFixed(2)}</td>
                        </tr>
                    `;
    }).join('')}
                
                <!-- Totals Row -->
                <tr class="totals-row">
                    <td colspan="3"><strong>TOTALS:</strong></td>
                    <td><strong>${cart.reduce((sum, item) => sum + item.quantity, 0)}</strong></td>
                    <td></td>
                    <td class="amount"><strong>PKR ${cart.reduce((sum, item) => sum + ((item.originalPrice || item.price) * item.quantity), 0).toFixed(2)}</strong></td>
                    <td></td>
                    <td class="amount">${totalDiscount > 0 ? 'PKR ' + totalDiscount.toFixed(2) : '-'}</td>
                    <td class="net"><strong>PKR ${finalTotal.toFixed(2)}</strong></td>
                </tr>
            </tbody>
        </table>

        <!-- Amount in Words -->
        <div class="totals-section">
            <div class="amount-words">
                <strong>Amount in Words:</strong><br>
                Rupees ${Math.floor(finalTotal)} and ${Math.round((finalTotal % 1) * 100)} Paisa Only
            </div>

            <!-- Terms -->
            <div class="terms">
                <strong>Terms & Conditions:</strong><br>
                - Payment due within 7 days of invoice date<br>
                - Goods once sold cannot be returned without prior approval<br>
                - Any discrepancy should be reported within 7 days
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <strong>Thank you for your business!</strong><br>
            For queries: contact@inventorymanagement.com | +92-XXX-XXXXXXX
        </div>
    </div>

    <script>
        // Auto-print when opened
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>`;

    return invoiceHTML;
};

const SaleEditModal = ({ isOpen, onClose, saleId, onSaveSuccess, userRole = 'owner' }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Data states
    const [saleData, setSaleData] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);

    // Cart management (like OwnerPOS)
    const [cart, setCart] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Customer search
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    // Product search and add
    const [search, setSearch] = useState('');
    const [quantity, setQuantity] = useState(1);

    // Discount states (like OwnerPOS)
    const [discountType, setDiscountType] = useState('amount');
    const [discountValue, setDiscountValue] = useState(0);
    const [showDiscountInput, setShowDiscountInput] = useState(false);

    // Customer type and sale status controls
    const [customerType, setCustomerType] = useState('retail');
    const [saleStatus, setSaleStatus] = useState('completed');

    const token = localStorage.getItem('token');

    // Reset all state when modal closes or saleId changes
    useEffect(() => {
        if (!isOpen) {
            // Complete state cleanup when modal is closed
            setError('');
            setSuccess('');
            setSaleData(null);
            setCart([]);
            setSelectedCustomer(null);
            setCustomerSearch('');
            setShowCustomerDropdown(false);
            setSearch('');
            setQuantity(1);
            setDiscountType('amount');
            setDiscountValue(0);
            setShowDiscountInput(false);
            setCustomerType('retail');
            setSaleStatus('completed');
            setLoading(false);
            setSaving(false);
        }
    }, [isOpen]);

    // Fetch data when modal opens with a saleId
    useEffect(() => {
        if (isOpen && saleId) {
            // Clear previous data first
            setError('');
            setSuccess('');
            setSaleData(null);
            setCart([]);
            setSelectedCustomer(null);
            setDiscountValue(0);
            setDiscountType('amount');
            setSaleStatus('completed');

            // Fetch data in proper sequence
            const loadData = async () => {
                setLoading(true);
                try {
                    // Fetch customers and products first
                    const [customersData, productsData] = await Promise.all([
                        fetchCustomers(),
                        fetchProducts()
                    ]);

                    console.log('✅ Loaded products:', productsData?.length || 0);
                    console.log('✅ Loaded customers:', customersData?.length || 0);
                    console.log('📝 Loading sale ID:', saleId);

                    // Small delay to ensure state is updated
                    await new Promise(resolve => setTimeout(resolve, 100));

                    // Then fetch sale data (which depends on products)
                    await fetchSaleData();
                } catch (err) {
                    console.error('Error loading modal data:', err);
                    setError('Failed to load sale data');
                    setLoading(false);
                }
            };

            loadData();
        }
    }, [isOpen, saleId]); const fetchSaleData = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.get(`http://localhost:5000/sales/${saleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const sale = response.data;
            setSaleData(sale);

            console.log('🔍 Sale data loaded:', sale);
            console.log('🔍 Sale items:', sale.items);
            if (sale.items && sale.items.length > 0) {
                console.log('🔍 First item data:', sale.items[0]);
            }

            // Convert sale items to cart format with customer-based pricing
            const cartItems = [];

            for (const item of sale.items || []) {
                // Find current product
                const currentProduct = products.find(p => p.id === item.product_id);

                // Get customer from sale data for pricing
                const saleCustomer = sale.customer_id ? {
                    id: sale.customer_id,
                    name: sale.customer_name,
                    type: sale.customer_type,
                    brand_name: sale.customer_brand
                } : null;

                // Use historical pricing for sale editing - don't update prices from products table
                const historicalPrice = parseFloat(item.original_price) || parseFloat(item.price) || 0;

                // Calculate current price only for comparison/debugging
                const currentPrice = currentProduct ?
                    getCustomerPrice(currentProduct, saleCustomer) :
                    historicalPrice;

                // Ensure discount type is properly set
                let discountType = item.item_discount_type || item.discount_type;
                if (!discountType || discountType === null || discountType === undefined) {
                    discountType = 'none';
                }

                console.log('🔍 Item price comparison:', {
                    productName: item.product_name || item.name,
                    historicalPrice: historicalPrice,
                    currentPrice: currentPrice,
                    priceChanged: currentPrice !== historicalPrice,
                    usingHistoricalPrice: true // Confirm we're using historical prices
                });

                const cartItem = {
                    id: item.product_id,
                    name: (item.product_name && item.product_name !== 'null') ? item.product_name :
                        (item.name && item.name !== 'null') ? item.name :
                            (currentProduct?.name) || 'Unknown Product',
                    price: historicalPrice, // Use historical price, not current price
                    quantity: parseInt(item.quantity) || 1,
                    originalPrice: historicalPrice, // Use historical price for calculations
                    historicalPrice: historicalPrice, // Keep track of original sale price
                    currentPrice: currentPrice, // Track current price for comparison
                    priceUpdated: currentPrice !== historicalPrice, // Flag if price changed
                    customerType: saleCustomer?.type || 'retail', // Track what pricing was used
                    itemDiscountType: discountType,
                    itemDiscountValue: parseFloat(item.item_discount_value || item.discount_value) || 0,
                    itemDiscountAmount: parseFloat(item.item_discount_amount || item.discount_amount) || 0,
                    stock_quantity: item.stock_quantity || (currentProduct?.stock_quantity) || 999,
                    uom: (item.uom && item.uom !== 'null') ? item.uom : (currentProduct?.uom) || 'pcs',
                    brand: (item.brand && item.brand !== 'null') ? item.brand : (currentProduct?.brand) || ''
                };

                cartItems.push(cartItem);
            }
            setCart(cartItems);

            // Set customer - but verify it exists first
            if (sale.customer_id) {
                // Check if customer still exists in the customers array
                const customerExists = customers.find(c => c.id === sale.customer_id);

                if (customerExists) {
                    setSelectedCustomer({
                        id: sale.customer_id,
                        name: sale.customer_name,
                        type: sale.customer_type || customerExists.type || 'longterm',
                        brand_name: sale.customer_brand
                    });
                    setCustomerType(sale.customer_type || customerExists.type || 'longterm');
                } else {
                    // Customer was deleted - treat as retail/walk-in sale
                    console.warn('⚠️ Customer ID', sale.customer_id, 'not found. Converting to walk-in sale.');
                    setSelectedCustomer(null);
                    setCustomerType('retail');
                }
            } else {
                // No customer - retail sale
                setSelectedCustomer(null);
                setCustomerType('retail');
            }

            // Set sale status
            setSaleStatus(sale.status || 'completed');

            // Set total discount
            if (sale.discount_amount > 0) {
                setDiscountValue(parseFloat(sale.discount_value) || 0);
                setDiscountType(sale.discount_type || 'amount');
            }

        } catch (err) {
            setError('Failed to fetch sale data');
            console.error('Error fetching sale:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await axios.get('http://localhost:5000/customers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('📋 Fetched customers:', response.data.length, 'customers');
            console.log('📋 Customer types:', response.data.map(c => ({ id: c.id, name: c.name, type: c.type })));
            setCustomers(response.data);
            return response.data;
        } catch (err) {
            console.error('❌ Error fetching customers:', err);
            return [];
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await axios.get('http://localhost:5000/products', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(response.data);
            return response.data;
        } catch (err) {
            console.error('Error fetching products:', err);
            return [];
        }
    };

    // Product search and auto-add (like OwnerPOS)
    const handleSearch = async () => {
        setError('');
        if (!search) return;

        try {
            const res = await axios.get(`http://localhost:5000/products?search=${encodeURIComponent(search)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            let found = res.data.find(p =>
                p.id.toString() === search ||
                p.name.toLowerCase() === search.toLowerCase() ||
                p.design_no === search
            );

            if (!found && res.data.length === 1) found = res.data[0];

            if (found) {
                // Auto-add to cart if ID matches exactly
                if (found.id.toString() === search) {
                    handleAddToCart(found);
                } else {
                    // Just add the product anyway for convenience
                    handleAddToCart(found);
                }
            } else {
                setError('Product not found');
            }
        } catch {
            setError('Error searching product');
        }
    };

    const handleAddToCart = (product) => {
        if (!product) return;
        if (quantity < 1) return setError('Quantity must be at least 1');

        // Use customer-based pricing for new items
        const price = getCustomerPrice(product, selectedCustomer);

        setCart(cart => [...cart, {
            id: product.id,
            name: product.name,
            price,
            quantity,
            originalPrice: price,
            customerType: selectedCustomer?.type || 'retail',
            itemDiscountType: 'none',
            itemDiscountValue: 0,
            itemDiscountAmount: 0,
            stock_quantity: product.stock_quantity || 999,
            uom: product.uom || 'pcs',
            brand: product.brand || ''
        }]);

        setSearch('');
        setQuantity(1);
        setError('');
    };

    // Cart management functions (from OwnerPOS)
    const handleIncreaseQty = idx => {
        setCart(cart => cart.map((cartItem, i) =>
            i === idx ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        ));
    };

    const handleDecreaseQty = idx => {
        setCart(cart => cart.map((item, i) =>
            i === idx && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
        ));
    };

    const handleRemoveFromCart = idx => {
        setCart(cart => cart.filter((_, i) => i !== idx));
    };

    // Update cart prices when customer changes
    const updateCartPricesForCustomer = (newCustomer) => {
        setCart(cart => cart.map(item => {
            const product = products.find(p => p.id === item.id);
            if (product) {
                const newPrice = getCustomerPrice(product, newCustomer);
                return {
                    ...item,
                    price: newPrice,
                    originalPrice: newPrice,
                    customerType: newCustomer?.type || 'retail',
                    priceUpdated: newPrice !== item.historicalPrice
                };
            }
            return item;
        }));
    };

    // Discount calculations (from OwnerPOS)
    const calculateItemDiscountAmount = (item) => {
        const originalPrice = item.originalPrice || item.price || 0;
        const quantity = item.quantity || 1;
        const itemTotal = originalPrice * quantity;

        if (item.itemDiscountType === 'percentage') {
            const discountPercent = parseFloat(item.itemDiscountValue || 0);
            return (itemTotal * discountPercent) / 100;
        } else if (item.itemDiscountType === 'amount') {
            return parseFloat(item.itemDiscountValue || 0);
        }
        return 0;
    };

    const calculateItemFinalPrice = (item) => {
        const originalPrice = item.originalPrice || item.price || 0;
        const quantity = item.quantity || 1;
        const itemTotal = originalPrice * quantity;
        const discountAmount = calculateItemDiscountAmount(item);
        return Math.max(0, itemTotal - discountAmount);
    };

    // Calculate subtotal based on original prices (before item-level discounts)
    const calculateSubtotal = () => {
        return cart.reduce((sum, item) => {
            const originalPrice = item.originalPrice || item.price || 0;
            const quantity = item.quantity || 1;
            return sum + (originalPrice * quantity);
        }, 0);
    };

    // Calculate subtotal after item-level discounts (used for display and final calculations)
    const calculateItemsSubtotal = () => {
        return cart.reduce((sum, item) => {
            return sum + calculateItemFinalPrice(item);
        }, 0);
    };

    const calculateDiscountAmount = () => {
        const itemsSubtotal = calculateItemsSubtotal();
        if (discountType === 'percentage') {
            return (itemsSubtotal * parseFloat(discountValue || 0)) / 100;
        } else {
            return parseFloat(discountValue || 0);
        }
    };

    const calculateFinalTotal = () => {
        const itemsSubtotal = calculateItemsSubtotal();
        const discountAmount = calculateDiscountAmount();
        return Math.max(0, itemsSubtotal - discountAmount);
    };

    // Item discount handler
    const handleItemDiscountChange = (idx, type, value) => {
        const item = cart[idx];
        const originalPrice = item.originalPrice || item.price || 0;
        const itemTotal = originalPrice * item.quantity;

        // Convert value to number
        const numericValue = parseFloat(value) || 0;

        if (numericValue < 0) {
            setError('Discount cannot be negative');
            return;
        }

        if (type === 'percentage' && numericValue > 100) {
            setError('Percentage discount cannot exceed 100%');
            return;
        }

        if (type === 'amount' && numericValue > itemTotal) {
            setError('Discount amount cannot exceed item total');
            return;
        }

        // Calculate discount amount
        let discountAmount = 0;
        if (type === 'percentage') {
            discountAmount = (itemTotal * numericValue) / 100;
        } else if (type === 'amount') {
            discountAmount = numericValue;
        }

        // Update cart with proper values
        setCart(cart => cart.map((cartItem, i) =>
            i === idx ? {
                ...cartItem,
                itemDiscountType: type,
                itemDiscountValue: numericValue,
                itemDiscountAmount: discountAmount,
                originalPrice: originalPrice
            } : cartItem
        ));
        setError('');
    };

    // Save function
    const handleSave = async () => {
        if (cart.length === 0) {
            setError('Cannot save sale with no items');
            return;
        }

        setSaving(true);
        setError('');

        try {
            // NOTE: customer_type is intentionally NOT sent to backend - it's immutable after creation
            // This ensures pricing integrity and prevents unauthorized price manipulation
            const updateData = {
                customer_id: selectedCustomer?.id || null,
                // customer_type: customerType, // REMOVED - Backend rejects customer type changes
                status: saleStatus,
                items: cart.map(item => ({
                    product_id: item.id,
                    quantity: parseInt(item.quantity) || 1,
                    price: parseFloat(item.originalPrice) || 0,
                    discount_type: item.itemDiscountType || 'none',
                    discount_value: parseFloat(item.itemDiscountValue) || 0,
                    discount_amount: calculateItemDiscountAmount(item)
                })),
                discount_type: parseFloat(discountValue) > 0 ? discountType : 'none',
                discount_value: parseFloat(discountValue) > 0 ? parseFloat(discountValue) : 0,
                discount_amount: parseFloat(discountValue) > 0 ? calculateDiscountAmount() : 0,
                total_amount: calculateFinalTotal()
            };

            await axios.put(`http://localhost:5000/sales/${saleId}`, updateData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Sale updated successfully!');
            setTimeout(() => {
                onSaveSuccess?.();
            }, 1000);

        } catch (err) {
            setError('Failed to update sale');
            console.error('Error updating sale:', err);
        } finally {
            setSaving(false);
        }
    };

    // Ref for UnifiedInvoiceView PDF generation
    const unifiedInvoiceRef = useRef();

    // Download Invoice function using UnifiedInvoiceView
    const handleDownloadInvoice = () => {
        if (cart.length === 0) {
            setError('Cannot generate invoice with no items');
            return;
        }

        try {
            // Prepare sale data for UnifiedInvoiceView
            const saleForInvoice = {
                id: saleData?.id || saleData?.bill_number || 'Draft',
                date: saleData?.date || new Date().toISOString(),
                cashier_id: saleData?.cashier_id || 1,
                customer_id: selectedCustomer?.id || null,
                discount_amount: calculateDiscountAmount(),
                total_amount: (calculateSubtotal() - calculateDiscountAmount()).toFixed(2),
                items: cart.map(item => ({
                    name: item.name,
                    product_name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    uom: item.uom || 'pcs',
                    item_discount_amount: calculateItemDiscountAmount(item),
                    final_price: calculateItemFinalPrice(item)
                }))
            };

            // Trigger PDF generation from UnifiedInvoiceView
            if (unifiedInvoiceRef.current && unifiedInvoiceRef.current.handlePrint) {
                unifiedInvoiceRef.current.handlePrint();
                setSuccess('Invoice PDF generated and downloaded successfully!');
            } else {
                setError('PDF generation not available. Please try again.');
            }
        } catch (err) {
            setError('Failed to generate invoice PDF');
            console.error('Error generating invoice PDF:', err);
        }
    };

    // Delete function
    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this sale? This action cannot be undone.')) {
            return;
        }

        // Prompt for password
        const password = prompt('Please enter your password to delete this sale:');
        if (!password) {
            return;
        }

        setSaving(true);
        setError('');

        try {
            await axios.delete(`http://localhost:5000/sales/${saleId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                data: { password }
            });

            setSuccess('Sale deleted successfully!');
            setTimeout(() => {
                onSaveSuccess?.();
            }, 1000);

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete sale');
            console.error('Error deleting sale:', err);
        } finally {
            setSaving(false);
        }
    };

    // Customer filtering
    // Filter customers based on search text
    const filteredCustomers = customers.filter(customer => {
        // If no search text, show all customers
        if (!customerSearch || customerSearch.trim() === '') {
            return true;
        }

        // Filter by name or brand name
        const searchLower = customerSearch.toLowerCase();
        const nameMatch = customer.name?.toLowerCase().includes(searchLower);
        const brandMatch = customer.brand_name?.toLowerCase().includes(searchLower);

        return nameMatch || brandMatch;
    });

    // Debug logging
    if (showCustomerDropdown && isOpen) {
        console.log('🔍 Customer Search Debug:', {
            totalCustomers: customers.length,
            searchText: customerSearch,
            filteredCount: filteredCustomers.length,
            showDropdown: showCustomerDropdown,
            saleId: saleId,
            customerType: customerType,
            customerTypes: customers.map(c => ({ id: c.id, name: c.name, type: c.type }))
        });

        if (saleId && filteredCustomers.length > 0) {
            console.log('🔍 After type filtering:', filteredCustomers.length, 'customers remain');
        }
    } if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                width: '95%',
                maxWidth: '1400px',
                maxHeight: '95vh',
                overflow: 'hidden',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    color: 'white',
                    padding: '1.5rem 2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                            ✏️ Edit Sale #{saleData?.bill_number || saleId}
                        </h2>
                        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8 }}>
                            Full control sale editing for owner
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '1.2rem'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '2rem', maxHeight: 'calc(95vh - 120px)', overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                            <p>Loading sale data...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            {/* Left Column - Customer & Add Product */}
                            <div>
                                {/* Customer Selection - Type Locked but Customer Changeable */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                    marginBottom: '1rem',
                                    position: 'relative'
                                }}>
                                    {saleId && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '1rem',
                                            right: '1rem',
                                            background: '#dcfce7',
                                            color: '#166534',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            {customerType === 'longterm' ? '🏪 Wholesale Only' : '� Retail Only'}
                                        </div>
                                    )}
                                    <h3 style={{ marginTop: 0, color: '#1e293b' }}>
                                        👤 Customer
                                    </h3>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            value={customerSearch}
                                            onChange={(e) => {
                                                setCustomerSearch(e.target.value);
                                                setShowCustomerDropdown(true);
                                            }}
                                            onFocus={() => setShowCustomerDropdown(true)}
                                            placeholder={selectedCustomer ? selectedCustomer.name : "Search customers..."}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '2px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '1rem',
                                                backgroundColor: 'white'
                                            }}
                                        />

                                        {selectedCustomer && (
                                            <div style={{
                                                marginTop: '0.5rem',
                                                padding: '8px 12px',
                                                background: '#10b981',
                                                color: 'white',
                                                borderRadius: '6px',
                                                fontSize: '0.875rem',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <span>👤 {selectedCustomer.name}</span>
                                                <button
                                                    onClick={() => {
                                                        // In edit mode, only allow clearing if it's a wholesale sale
                                                        if (!saleId || customerType === 'longterm') {
                                                            setSelectedCustomer(null);
                                                        }
                                                    }}
                                                    disabled={saleId && customerType === 'retail'}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: 'white',
                                                        cursor: (saleId && customerType === 'retail') ? 'not-allowed' : 'pointer',
                                                        fontSize: '1.1rem',
                                                        opacity: (saleId && customerType === 'retail') ? 0.5 : 1
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}

                                        {selectedCustomer && (
                                            <div style={{
                                                marginTop: '0.5rem',
                                                fontSize: '0.875rem',
                                                color: '#059669',
                                                fontWeight: '600'
                                            }}>
                                                ✅ Customer selected successfully
                                            </div>
                                        )}

                                        {saleId && customerType === 'retail' && (
                                            <div style={{
                                                marginTop: '0.5rem',
                                                padding: '8px 12px',
                                                background: '#fef3c7',
                                                border: '1px solid #fbbf24',
                                                borderRadius: '6px',
                                                fontSize: '0.875rem',
                                                color: '#92400e'
                                            }}>
                                                ℹ️ Retail sales cannot add customers. Customer type is locked to Retail.
                                            </div>
                                        )}

                                        {saleId && customerType === 'longterm' && (
                                            <div style={{
                                                marginTop: '0.5rem',
                                                padding: '8px 12px',
                                                background: '#dcfce7',
                                                border: '1px solid #86efac',
                                                borderRadius: '6px',
                                                fontSize: '0.875rem',
                                                color: '#166534'
                                            }}>
                                                ℹ️ You can change to another wholesale customer, but cannot switch to retail.
                                            </div>
                                        )}

                                        {showCustomerDropdown && filteredCustomers.length > 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                background: 'white',
                                                border: '2px solid #e2e8f0',
                                                borderRadius: '8px',
                                                maxHeight: '200px',
                                                overflowY: 'auto',
                                                zIndex: 100,
                                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                            }}>
                                                {saleId && customerType === 'retail' && (
                                                    <div style={{
                                                        padding: '12px',
                                                        background: '#fef3c7',
                                                        color: '#92400e',
                                                        fontSize: '0.875rem',
                                                        textAlign: 'center'
                                                    }}>
                                                        🚫 Cannot add customer to retail sale
                                                    </div>
                                                )}
                                                {filteredCustomers
                                                    .filter(customer => {
                                                        // In edit mode, only show customers of the same type
                                                        if (saleId) {
                                                            const custType = (customer.type || 'retail').toLowerCase().replace('-', '');
                                                            const currentType = customerType.toLowerCase().replace('-', '');

                                                            console.log('🔍 Customer Type Matching:', {
                                                                customerName: customer.name,
                                                                customerType: customer.type,
                                                                custType,
                                                                currentType,
                                                                matches: custType === currentType
                                                            });

                                                            return custType === currentType;
                                                        }
                                                        return true; // Show all in create mode
                                                    })
                                                    .map(customer => {
                                                        const custType = (customer.type || 'retail').toLowerCase().replace('-', '');
                                                        const currentType = customerType.toLowerCase().replace('-', '');
                                                        const isCompatible = !saleId || custType === currentType;

                                                        return (
                                                            <div
                                                                key={customer.id}
                                                                onClick={() => {
                                                                    if (isCompatible) {
                                                                        setSelectedCustomer(customer);
                                                                        if (!saleId) {
                                                                            // Only update customer type in create mode
                                                                            setCustomerType(customer.type || 'retail');
                                                                        }
                                                                        updateCartPricesForCustomer(customer);
                                                                        setCustomerSearch('');
                                                                        setShowCustomerDropdown(false);
                                                                    }
                                                                }}
                                                                style={{
                                                                    padding: '12px',
                                                                    cursor: isCompatible ? 'pointer' : 'not-allowed',
                                                                    borderBottom: '1px solid #f1f5f9',
                                                                    opacity: isCompatible ? 1 : 0.5
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (isCompatible) e.target.style.background = '#f8fafc';
                                                                }}
                                                                onMouseLeave={(e) => e.target.style.background = 'white'}
                                                            >
                                                                <div style={{ fontWeight: '600' }}>
                                                                    {customer.name}
                                                                    {custType === 'longterm' && ' 🏪'}
                                                                </div>
                                                                {customer.brand_name && (
                                                                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{customer.brand_name}</div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Customer Type and Sale Status Controls */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                    marginBottom: '1rem'
                                }}>
                                    <h3 style={{ marginTop: 0, color: '#0369a1', marginBottom: '1rem' }}>⚙️ Sale Settings</h3>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        {/* Customer Type - LOCKED (Cannot be changed) */}
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                marginBottom: '0.5rem',
                                                fontWeight: '600',
                                                color: '#374151'
                                            }}>
                                                Customer Type 🔒
                                            </label>
                                            <select
                                                value={customerType}
                                                disabled={true}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    border: '2px solid #9ca3af',
                                                    borderRadius: '8px',
                                                    fontSize: '1rem',
                                                    background: '#f3f4f6',
                                                    color: '#6b7280',
                                                    cursor: 'not-allowed',
                                                    opacity: 0.7
                                                }}
                                            >
                                                <option value="retail">Retail Customer</option>
                                                <option value="longterm">Long-term Customer (Wholesale)</option>
                                            </select>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                color: '#dc2626',
                                                marginTop: '0.25rem',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                🔒 Customer type is locked and cannot be changed
                                            </div>
                                        </div>

                                        {/* Sale Status */}
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                marginBottom: '0.5rem',
                                                fontWeight: '600',
                                                color: '#374151'
                                            }}>
                                                Sale Status
                                            </label>
                                            <select
                                                value={saleStatus}
                                                onChange={(e) => setSaleStatus(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    border: `2px solid ${saleStatus === 'completed' ? '#059669' : '#d97706'}`,
                                                    borderRadius: '8px',
                                                    fontSize: '1rem',
                                                    background: 'white'
                                                }}
                                            >
                                                <option value="completed">Completed</option>
                                                <option value="pending">Pending</option>
                                            </select>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                color: saleStatus === 'completed' ? '#059669' : '#d97706',
                                                marginTop: '0.25rem',
                                                fontWeight: '500'
                                            }}>
                                                {saleStatus === 'completed' ? '✅ Sale is completed' : '⏳ Sale needs completion'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Add Product */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                    marginBottom: '1rem'
                                }}>
                                    <h3 style={{ marginTop: 0, color: '#1e40af' }}>➕ Add Product</h3>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                            placeholder="Search by ID, name, or scan barcode..."
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                border: '2px solid #3b82f6',
                                                borderRadius: '8px',
                                                fontSize: '1rem'
                                            }}
                                        />
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                            min="1"
                                            style={{
                                                width: '80px',
                                                padding: '12px',
                                                border: '2px solid #3b82f6',
                                                borderRadius: '8px',
                                                fontSize: '1rem'
                                            }}
                                        />
                                        <button
                                            onClick={handleSearch}
                                            style={{
                                                padding: '12px 20px',
                                                background: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e40af' }}>
                                        💡 If product ID matches exactly, it will be added automatically
                                    </p>
                                </div>

                                {/* Total Discount */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                    borderRadius: '12px',
                                    padding: '1.5rem'
                                }}>
                                    <h3 style={{ marginTop: 0, color: '#92400e' }}>🏷️ Total Discount</h3>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <select
                                            value={discountType}
                                            onChange={(e) => setDiscountType(e.target.value)}
                                            style={{
                                                padding: '12px',
                                                border: '2px solid #f59e0b',
                                                borderRadius: '8px',
                                                fontSize: '1rem'
                                            }}
                                        >
                                            <option value="amount">Fixed Amount</option>
                                            <option value="percentage">Percentage (%)</option>
                                        </select>
                                        <input
                                            type="number"
                                            value={discountValue}
                                            onChange={(e) => setDiscountValue(e.target.value)}
                                            placeholder="0"
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                border: '2px solid #f59e0b',
                                                borderRadius: '8px',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                                        Discount Amount: {parseFloat(discountValue) > 0 ? formatCurrency(calculateDiscountAmount()) : 'No Discount'}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Cart Items */}
                            <div>
                                <div style={{
                                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h3 style={{ margin: 0, color: '#166534' }}>🛒 Cart Items</h3>
                                        <span style={{ background: '#16a34a', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '600' }}>
                                            {cart.length} Items
                                        </span>
                                    </div>

                                    {cart.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
                                            <p>No items in cart. Add some products to get started!</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* DEBUG: Show raw cart data */}
                                            {process.env.NODE_ENV === 'development' && (
                                                <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '4px', padding: '8px', marginBottom: '1rem', fontSize: '0.75rem' }}>
                                                    <strong>🐛 DEBUG - Cart Data:</strong>
                                                    {cart.map((item, i) => (
                                                        <div key={i} style={{ marginTop: '4px' }}>
                                                            Item {i + 1}: name="{item.name}", uom="{item.uom}", product_name="{item.product_name || 'undefined'}"
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                                {cart.map((item, index) => (
                                                    <div key={index} style={{
                                                        background: 'white',
                                                        border: '2px solid #16a34a',
                                                        borderRadius: '8px',
                                                        padding: '1rem',
                                                        marginBottom: '1rem'
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                            <div>
                                                                <div style={{ fontWeight: '600', color: '#166534' }}>{item.name}</div>
                                                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                                                    {item.brand && `${item.brand} • `}{item.uom}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveFromCart(index)}
                                                                style={{
                                                                    background: '#ef4444',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    padding: '6px 10px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.875rem'
                                                                }}
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                            <div>
                                                                <label style={{ fontSize: '0.875rem', color: '#6b7280' }}>Quantity</label>
                                                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                                    <button
                                                                        onClick={() => handleDecreaseQty(index)}
                                                                        style={{
                                                                            background: '#6b7280',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            padding: '4px 8px',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <input
                                                                        type="number"
                                                                        value={item.quantity}
                                                                        onChange={(e) => {
                                                                            const newQty = parseInt(e.target.value) || 1;
                                                                            setCart(cart => cart.map((cartItem, i) =>
                                                                                i === index ? { ...cartItem, quantity: newQty } : cartItem
                                                                            ));
                                                                        }}
                                                                        min="1"
                                                                        style={{
                                                                            flex: 1,
                                                                            padding: '4px',
                                                                            border: '1px solid #d1d5db',
                                                                            borderRadius: '4px',
                                                                            textAlign: 'center'
                                                                        }}
                                                                    />
                                                                    <button
                                                                        onClick={() => handleIncreaseQty(index)}
                                                                        style={{
                                                                            background: '#16a34a',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            padding: '4px 8px',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '0.875rem', color: '#6b7280' }}>Price (PKR)</label>
                                                                <div style={{ fontWeight: '600', color: '#166534' }}>
                                                                    {formatCurrency(item.price)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Item Discount */}
                                                        <div style={{ marginBottom: '0.5rem' }}>
                                                            <label style={{ fontSize: '0.875rem', color: '#6b7280' }}>Item Discount</label>
                                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                <select
                                                                    value={item.itemDiscountType}
                                                                    onChange={(e) => handleItemDiscountChange(index, e.target.value, item.itemDiscountValue)}
                                                                    style={{
                                                                        padding: '4px',
                                                                        border: '1px solid #d1d5db',
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.875rem'
                                                                    }}
                                                                >
                                                                    <option value="none">No Discount</option>
                                                                    <option value="percentage">Percentage (%)</option>
                                                                    <option value="amount">Fixed Amount</option>
                                                                </select>
                                                                <input
                                                                    type="number"
                                                                    value={item.itemDiscountValue}
                                                                    onChange={(e) => handleItemDiscountChange(index, item.itemDiscountType, e.target.value)}
                                                                    disabled={item.itemDiscountType === 'none'}
                                                                    placeholder="0"
                                                                    style={{
                                                                        flex: 1,
                                                                        padding: '4px',
                                                                        border: '1px solid #d1d5db',
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.875rem'
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Debug Info */}
                                                        <div style={{
                                                            fontSize: '0.75rem',
                                                            color: '#6b7280',
                                                            marginBottom: '0.5rem',
                                                            background: '#f9fafb',
                                                            padding: '0.5rem',
                                                            borderRadius: '4px',
                                                            border: '1px solid #e5e7eb'
                                                        }}>
                                                            <div><strong>Debug Info:</strong></div>
                                                            <div>Product ID: {item.id}</div>
                                                            <div>Customer Type: {item.customerType || 'retail'}
                                                                {item.customerType === 'longterm' ? '(Wholesale Pricing)' : '(Retail Pricing)'}
                                                            </div>
                                                            <div>Historical Sale Price: {formatCurrency(item.historicalPrice || 0)}</div>
                                                            <div>Current {item.customerType === 'longterm' ? 'Wholesale' : 'Retail'} Price: {formatCurrency(item.currentPrice || 0)}</div>
                                                            <div>Using Historical Price: {formatCurrency(item.price || 0)}</div>
                                                            {item.priceUpdated && <div style={{ color: '#059669', fontWeight: 'bold' }}>✅ Using historical prices (protected from price changes)</div>}
                                                            {!item.priceUpdated && <div style={{ color: '#6b7280' }}>✅ Price unchanged since sale</div>}
                                                            <div>Calculation: {formatCurrency(item.price)} × {item.quantity} = {formatCurrency(item.price * item.quantity)}</div>
                                                            <div>Discount Type: {item.itemDiscountType}</div>
                                                            <div>Discount Value: {item.itemDiscountValue}</div>
                                                            <div>Discount Amount: {formatCurrency(calculateItemDiscountAmount(item))}</div>
                                                            <div>Final: {formatCurrency(item.price * item.quantity)} - {formatCurrency(calculateItemDiscountAmount(item))} = {formatCurrency(calculateItemFinalPrice(item))}</div>
                                                        </div>                                                    <div style={{ textAlign: 'right', borderTop: '1px solid #e5e7eb', paddingTop: '0.5rem' }}>
                                                            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Line Total: </span>
                                                            <span style={{ fontWeight: '700', color: '#059669', fontSize: '1.1rem' }}>
                                                                {formatCurrency(calculateItemFinalPrice(item))}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {/* Totals */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                                        borderRadius: '12px',
                                        padding: '1.5rem'
                                    }}>
                                        <h3 style={{ marginTop: 0, color: '#3730a3' }}>💰 Payment Summary</h3>
                                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Subtotal:</span>
                                                <span style={{ fontWeight: '600' }}>{formatCurrency(calculateItemsSubtotal())}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Discount:</span>
                                                <span style={{ fontWeight: '600', color: '#dc2626' }}>-{formatCurrency(calculateDiscountAmount())}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '700', color: '#3730a3', borderTop: '2px solid #3730a3', paddingTop: '0.5rem' }}>
                                                <span>Total:</span>
                                                <span>{formatCurrency(calculateFinalTotal())}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error/Success Messages */}
                    {error && (
                        <div style={{
                            background: '#fef2f2',
                            border: '2px solid #fca5a5',
                            borderRadius: '8px',
                            padding: '1rem',
                            margin: '1rem 0',
                            color: '#dc2626'
                        }}>
                            ❌ {error}
                        </div>
                    )}

                    {success && (
                        <div style={{
                            background: '#f0fdf4',
                            border: '2px solid #86efac',
                            borderRadius: '8px',
                            padding: '1rem',
                            margin: '1rem 0',
                            color: '#16a34a'
                        }}>
                            ✅ {success}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '2rem',
                        padding: '1rem',
                        background: '#f8fafc',
                        borderRadius: '12px'
                    }}>
                        <button
                            onClick={handleDelete}
                            disabled={saving}
                            style={{
                                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                opacity: saving ? 0.6 : 1
                            }}
                        >
                            🗑️ Delete Sale
                        </button>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={handleDownloadInvoice}
                                disabled={cart.length === 0}
                                style={{
                                    background: cart.length === 0 ? '#6b7280' : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '12px 24px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                                    opacity: cart.length === 0 ? 0.6 : 1
                                }}
                            >
                                📄 Download Invoice
                            </button>
                            <button
                                onClick={onClose}
                                disabled={saving}
                                style={{
                                    background: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '12px 24px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    opacity: saving ? 0.6 : 1
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || cart.length === 0}
                                style={{
                                    background: saving ? '#6b7280' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '12px 24px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: (saving || cart.length === 0) ? 'not-allowed' : 'pointer',
                                    opacity: (saving || cart.length === 0) ? 0.6 : 1
                                }}
                            >
                                {saving ? '⏳ Saving...' : '💾 Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden UnifiedInvoiceView for PDF generation */}
            <div style={{ display: 'none' }}>
                <UnifiedInvoiceView
                    ref={unifiedInvoiceRef}
                    sale={{
                        id: saleData?.id || saleData?.bill_number || 'Draft',
                        date: saleData?.date || new Date().toISOString(),
                        cashier_id: saleData?.cashier_id || 1,
                        customer_id: selectedCustomer?.id || null,
                        discount_amount: calculateDiscountAmount(),
                        total_amount: (calculateSubtotal() - calculateDiscountAmount()).toFixed(2),
                        items: cart.map(item => ({
                            name: item.name,
                            product_name: item.name,
                            quantity: item.quantity,
                            price: item.price,
                            uom: item.uom || 'pcs',
                            item_discount_amount: calculateItemDiscountAmount(item),
                            final_price: calculateItemFinalPrice(item)
                        }))
                    }}
                    customer={selectedCustomer || { name: 'Walk-in Customer' }}
                />
            </div>
        </div>
    );
};

export default SaleEditModal;