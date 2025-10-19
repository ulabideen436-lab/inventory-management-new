import validator from 'validator';

// Simple HTML sanitization function
function sanitizeHTML(input) {
    if (typeof input !== 'string') return input;

    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

// Sanitize object properties
export function sanitizeInput(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return sanitizeHTML(obj);
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeHTML(value.trim());
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeInput(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

// Validate and sanitize product data
export function validateProduct(productData) {
    const errors = [];
    const sanitized = sanitizeInput(productData);

    // Required field validation
    if (!sanitized.id || sanitized.id.length === 0) {
        errors.push('Product ID is required');
    }

    if (!sanitized.name || sanitized.name.length === 0) {
        errors.push('Product name is required');
    }

    if (!sanitized.uom || sanitized.uom.length === 0) {
        errors.push('Unit of measure is required');
    }

    // Price validation
    if (sanitized.retail_price !== undefined && sanitized.retail_price !== null) {
        if (!validator.isFloat(String(sanitized.retail_price), { min: 0 })) {
            errors.push('Valid retail price is required');
        }
    }

    if (sanitized.wholesale_price !== undefined && sanitized.wholesale_price !== null) {
        if (!validator.isFloat(String(sanitized.wholesale_price), { min: 0 })) {
            errors.push('Valid wholesale price is required');
        }
    }

    if (sanitized.cost_price !== undefined && sanitized.cost_price !== null) {
        if (!validator.isFloat(String(sanitized.cost_price), { min: 0 })) {
            errors.push('Valid cost price is required');
        }
    }

    // Stock quantity validation
    if (sanitized.stock_quantity !== undefined && sanitized.stock_quantity !== null) {
        if (!validator.isInt(String(sanitized.stock_quantity), { min: 0 })) {
            errors.push('Valid stock quantity is required');
        }
    }

    return { sanitized, errors };
}

// Validate and sanitize customer data
export function validateCustomer(customerData) {
    const errors = [];
    const sanitized = sanitizeInput(customerData);

    // Required field validation
    if (!sanitized.name || sanitized.name.length === 0) {
        errors.push('Customer name is required');
    }

    if (!sanitized.phone || sanitized.phone.length === 0) {
        errors.push('Customer phone number is required');
    }

    // Email validation if provided
    if (sanitized.email && !validator.isEmail(sanitized.email)) {
        errors.push('Valid email address is required');
    }

    // Credit limit validation
    if (sanitized.credit_limit !== undefined && sanitized.credit_limit !== null) {
        if (!validator.isFloat(String(sanitized.credit_limit), { min: 0 })) {
            errors.push('Valid credit limit is required');
        }
    }

    return { sanitized, errors };
}

export default { sanitizeInput, validateProduct, validateCustomer };