/**
 * CASHIER POS DATA INTEGRITY MIDDLEWARE
 * 
 * This middleware enforces comprehensive data integrity rules
 * for all Cashier POS operations to ensure consistent data.
 */

// Sale Data Validation Middleware
export const validateSaleData = (req, res, next) => {
    const { items, total_amount, payment_method, paid_amount, customer_id, subtotal, discount_amount } = req.body;
    const errors = [];

    try {
        // Rule 1: Sale must have items
        if (!items || !Array.isArray(items) || items.length === 0) {
            errors.push('Sale must contain at least one item');
        }

        // Rule 2: Validate each item in the sale
        if (items && Array.isArray(items)) {
            items.forEach((item, index) => {
                // Check required fields
                if (!item.product_id || !item.quantity || item.price === undefined) {
                    errors.push(`Item ${index + 1}: Missing required fields (product_id, quantity, or price)`);
                }

                // Check positive quantity
                if (item.quantity && parseInt(item.quantity) <= 0) {
                    errors.push(`Item ${index + 1}: Quantity must be positive (got ${item.quantity})`);
                }

                // Check non-negative price
                if (item.price !== undefined && parseFloat(item.price) < 0) {
                    errors.push(`Item ${index + 1}: Price cannot be negative (got ${item.price})`);
                }

                // Check product_id is provided and not empty
                if (!item.product_id || item.product_id.toString().trim() === '') {
                    errors.push(`Item ${index + 1}: Product ID is required`);
                }
            });

            // Rule 3: Validate total calculation (accounting for discounts)
            if (total_amount !== undefined && items.length > 0) {
                // Calculate subtotal from items
                const calculatedSubtotal = items.reduce((sum, item) => {
                    return sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 0));
                }, 0);

                // If subtotal is provided, validate it
                if (subtotal !== undefined) {
                    const tolerance = 0.01; // 1 cent tolerance for floating point
                    if (Math.abs(parseFloat(subtotal) - calculatedSubtotal) > tolerance) {
                        errors.push(`Subtotal mismatch: Expected ${calculatedSubtotal.toFixed(2)}, got ${parseFloat(subtotal).toFixed(2)}`);
                    }
                }

                // Calculate expected total (subtotal - discount)
                const actualSubtotal = subtotal !== undefined ? parseFloat(subtotal) : calculatedSubtotal;
                const actualDiscount = discount_amount !== undefined ? parseFloat(discount_amount) : 0;
                const expectedTotal = actualSubtotal - actualDiscount;

                const tolerance = 0.01; // 1 cent tolerance for floating point
                if (Math.abs(parseFloat(total_amount) - expectedTotal) > tolerance) {
                    errors.push(`Total mismatch: Expected ${expectedTotal.toFixed(2)}, got ${parseFloat(total_amount).toFixed(2)}`);
                }
            }
        }

        // Rule 4: Validate payment data
        if (payment_method) {
            const validMethods = ['cash', 'card', 'credit', 'mobile_payment', 'bank_transfer'];
            if (!validMethods.includes(payment_method)) {
                errors.push(`Invalid payment method: ${payment_method}`);
            }

            // Rule 5: Payment amount validation (except for credit sales)
            if (payment_method !== 'credit' && paid_amount !== undefined && total_amount !== undefined) {
                if (parseFloat(paid_amount) < parseFloat(total_amount)) {
                    errors.push(`Paid amount (${paid_amount}) cannot be less than total (${total_amount}) for ${payment_method} payment`);
                }
            }
        }

        // Rule 6: Customer ID validation
        if (customer_id !== null && customer_id !== undefined) {
            if (!Number.isInteger(parseInt(customer_id))) {
                errors.push('Customer ID must be a valid integer or null');
            }
        }

        // Rule 7: Total must be positive for non-refund transactions
        if (total_amount !== undefined && parseFloat(total_amount) < 0) {
            errors.push('Sale total cannot be negative');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                error: 'Data Integrity Violation',
                message: 'Sale data validation failed',
                details: errors
            });
        }

        // Add validation flag for downstream processing
        req.saleValidated = true;
        next();

    } catch (error) {
        return res.status(500).json({
            error: 'Validation Error',
            message: 'Failed to validate sale data',
            details: [error.message]
        });
    }
};

// Product Data Validation Middleware
export const validateProductData = (req, res, next) => {
    const { name, retail_price, stock_quantity, sku, category } = req.body;
    const errors = [];

    try {
        // Rule 1: Required fields
        if (!name || name.trim().length === 0) {
            errors.push('Product name is required and cannot be empty');
        }

        if (retail_price === undefined) {
            errors.push('Retail price is required');
        }

        // Rule 2: Price validation
        if (retail_price !== undefined && parseFloat(retail_price) < 0) {
            errors.push('Retail price cannot be negative');
        }

        // Rule 3: Stock quantity validation
        if (stock_quantity !== undefined && parseInt(stock_quantity) < 0) {
            errors.push('Stock quantity cannot be negative');
        }

        // Rule 4: SKU format validation
        if (sku && sku.trim().length === 0) {
            errors.push('SKU cannot be empty if provided');
        }

        // Rule 5: Category validation
        if (category && typeof category !== 'string') {
            errors.push('Category must be a string if provided');
        }

        // Rule 6: Name length validation
        if (name && name.length > 255) {
            errors.push('Product name cannot exceed 255 characters');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                error: 'Data Integrity Violation',
                message: 'Product data validation failed',
                details: errors
            });
        }

        req.productValidated = true;
        next();

    } catch (error) {
        return res.status(500).json({
            error: 'Validation Error',
            message: 'Failed to validate product data',
            details: [error.message]
        });
    }
};

// Customer Data Validation Middleware
export const validateCustomerData = (req, res, next) => {
    const { name, email, phone, credit_limit, balance } = req.body;
    const errors = [];

    try {
        // Rule 1: Name validation
        if (!name || name.trim().length === 0) {
            errors.push('Customer name is required and cannot be empty');
        }

        if (name && name.length > 255) {
            errors.push('Customer name cannot exceed 255 characters');
        }

        // Rule 2: Email validation
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                errors.push('Invalid email format');
            }
        }

        // Rule 3: Phone validation
        if (phone) {
            const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
            if (!phoneRegex.test(phone)) {
                errors.push('Invalid phone number format');
            }
        }

        // Rule 4: Credit limit validation
        if (credit_limit !== undefined && parseFloat(credit_limit) < 0) {
            errors.push('Credit limit cannot be negative');
        }

        // Rule 5: Balance validation
        if (balance !== undefined && credit_limit !== undefined) {
            if (parseFloat(balance) > parseFloat(credit_limit)) {
                errors.push('Customer balance cannot exceed credit limit');
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                error: 'Data Integrity Violation',
                message: 'Customer data validation failed',
                details: errors
            });
        }

        req.customerValidated = true;
        next();

    } catch (error) {
        return res.status(500).json({
            error: 'Validation Error',
            message: 'Failed to validate customer data',
            details: [error.message]
        });
    }
};

// Session Data Validation Middleware
export const validateSessionData = (req, res, next) => {
    const { sale_number, session_id, cashier_id } = req.body;
    const errors = [];

    try {
        // Rule 1: Sale number validation
        if (sale_number !== undefined && (!Number.isInteger(parseInt(sale_number)) || parseInt(sale_number) <= 0)) {
            errors.push('Sale number must be a positive integer');
        }

        // Rule 2: Session ID validation
        if (session_id && typeof session_id !== 'string') {
            errors.push('Session ID must be a string');
        }

        // Rule 3: Cashier ID validation
        if (cashier_id !== undefined && !Number.isInteger(parseInt(cashier_id))) {
            errors.push('Cashier ID must be a valid integer');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                error: 'Data Integrity Violation',
                message: 'Session data validation failed',
                details: errors
            });
        }

        req.sessionValidated = true;
        next();

    } catch (error) {
        return res.status(500).json({
            error: 'Validation Error',
            message: 'Failed to validate session data',
            details: [error.message]
        });
    }
};

// Database Integrity Check Middleware
export const checkDatabaseIntegrity = async (req, res, next) => {
    try {
        const { items } = req.body;

        if (items && Array.isArray(items)) {
            // Import database connection
            const { pool } = await import('../models/db.js');
            const conn = await pool.getConnection();

            try {
                // Check product existence and availability
                for (const item of items) {
                    const [productRows] = await conn.query(
                        'SELECT id, name, retail_price, stock_quantity FROM products WHERE id = ? AND deleted_at IS NULL',
                        [item.product_id]
                    );

                    if (productRows.length === 0) {
                        return res.status(400).json({
                            error: 'Data Integrity Violation',
                            message: `Product with ID ${item.product_id} not found or inactive`
                        });
                    }

                    const product = productRows[0];

                    // Validate price consistency (allow some tolerance for price updates)
                    const dbPrice = parseFloat(product.retail_price);
                    const salePrice = parseFloat(item.price);
                    const priceDiscrepancy = Math.abs(dbPrice - salePrice);
                    const maxDiscrepancy = dbPrice * 0.1; // Allow 10% price difference

                    if (priceDiscrepancy > maxDiscrepancy) {
                        return res.status(400).json({
                            error: 'Data Integrity Violation',
                            message: `Price mismatch for product ${product.name}. Database: ${dbPrice}, Sale: ${salePrice}`
                        });
                    }

                    // Check stock availability (if stock tracking is enabled)
                    if (product.stock_quantity !== null) {
                        const availableStock = parseInt(product.stock_quantity);
                        const requestedQuantity = parseInt(item.quantity);

                        // Prevent sales when stock is 0
                        if (availableStock === 0) {
                            return res.status(400).json({
                                error: 'Data Integrity Violation',
                                message: `Product "${product.name}" is out of stock and cannot be sold`
                            });
                        }

                        // Check if requested quantity exceeds available stock
                        if (availableStock < requestedQuantity) {
                            return res.status(400).json({
                                error: 'Data Integrity Violation',
                                message: `Insufficient stock for product "${product.name}". Available: ${availableStock}, Requested: ${requestedQuantity}`
                            });
                        }
                    }
                }

                conn.release();
            } catch (dbError) {
                if (conn) conn.release();
                throw dbError;
            }
        }

        req.databaseIntegrityChecked = true;
        next();

    } catch (error) {
        return res.status(500).json({
            error: 'Database Integrity Check Failed',
            message: 'Failed to verify database integrity',
            details: [error.message]
        });
    }
};

// Audit Trail Middleware
export const createAuditTrail = (req, res, next) => {
    try {
        // Add audit information to request
        req.auditInfo = {
            timestamp: new Date().toISOString(),
            user_id: req.user?.id || null,
            username: req.user?.username || 'anonymous',
            action: `${req.method} ${req.originalUrl}`,
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get('User-Agent') || 'unknown'
        };

        // Log the action
        console.log(`[AUDIT] ${req.auditInfo.timestamp} - ${req.auditInfo.username} - ${req.auditInfo.action}`);

        next();

    } catch (error) {
        console.error('Audit trail creation failed:', error);
        // Don't block the request for audit trail failures
        next();
    }
};

// Comprehensive Data Integrity Middleware Stack
export const cashierPOSIntegrityStack = [
    createAuditTrail,
    validateSaleData,
    checkDatabaseIntegrity
];

export const productIntegrityStack = [
    createAuditTrail,
    validateProductData
];

export const customerIntegrityStack = [
    createAuditTrail,
    validateCustomerData
];

export const sessionIntegrityStack = [
    createAuditTrail,
    validateSessionData
];