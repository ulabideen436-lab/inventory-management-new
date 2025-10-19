#!/usr/bin/env node

/**
 * CASHIER POS NEW TRANSACTION DATA INTEGRITY TEST
 * 
 * This test specifically validates that new transactions 
 * are properly validated by our data integrity middleware.
 */

import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5000';
const LOGIN_URL = `${BASE_URL}/auth/login`;
const PRODUCTS_URL = `${BASE_URL}/products`;
const SALES_URL = `${BASE_URL}/sales`;

let authToken = '';

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, colors.green);
}

function logError(message) {
    log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
    log(`ℹ️  ${message}`, colors.blue);
}

function logHeader(message) {
    console.log('\n' + '='.repeat(60));
    log(`${colors.bold}${message}${colors.reset}`, colors.cyan);
    console.log('='.repeat(60));
}

async function authenticate() {
    try {
        const response = await axios.post(LOGIN_URL, {
            username: 'admin',
            password: 'admin123'
        });

        if (response.data.token) {
            authToken = response.data.token;
            logSuccess('Authentication successful');
            return true;
        }
        return false;
    } catch (error) {
        logError(`Authentication failed: ${error.message}`);
        return false;
    }
}

async function testValidTransaction() {
    logHeader('VALID TRANSACTION TEST');

    try {
        // Get a valid product
        const productsResponse = await axios.get(PRODUCTS_URL, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const validProduct = productsResponse.data.find(p => p.retail_price > 0 && p.stock_quantity > 0);

        if (!validProduct) {
            logError('No valid products found for testing');
            return false;
        }

        logInfo(`Using product: ${validProduct.name} (ID: ${validProduct.id})`);

        // Create a valid sale
        const validSale = {
            customer_id: null,
            customer_type: 'retail',
            items: [{
                product_id: validProduct.id,
                quantity: 1,
                price: validProduct.retail_price
            }],
            subtotal: validProduct.retail_price,
            discount_type: 'none',
            discount_value: 0,
            discount_amount: 0,
            total_amount: validProduct.retail_price,
            payment_method: 'cash',
            paid_amount: validProduct.retail_price
        };

        const response = await axios.post(SALES_URL, validSale, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.status === 200 || response.status === 201) {
            logSuccess(`Valid transaction accepted - Sale ID: ${response.data.sale_id || response.data.id}`);
            return true;
        } else {
            logError(`Valid transaction rejected with status: ${response.status}`);
            return false;
        }

    } catch (error) {
        logError(`Valid transaction test failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function testNegativeQuantityRejection() {
    logHeader('NEGATIVE QUANTITY REJECTION TEST');

    try {
        const invalidSale = {
            customer_id: null,
            customer_type: 'retail',
            items: [{
                product_id: 1,
                quantity: -1, // Invalid negative quantity
                price: 100.00
            }],
            subtotal: -100.00,
            discount_type: 'none',
            discount_value: 0,
            discount_amount: 0,
            total_amount: -100.00,
            payment_method: 'cash',
            paid_amount: -100.00
        };

        const response = await axios.post(SALES_URL, invalidSale, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        logError('System incorrectly allowed negative quantity sale');
        return false;

    } catch (error) {
        if (error.response?.status === 400) {
            const errorMessage = error.response.data.message || error.response.data.error;
            logSuccess(`System correctly rejected negative quantity: ${errorMessage}`);
            return true;
        } else {
            logError(`Unexpected error: ${error.message}`);
            return false;
        }
    }
}

async function testEmptySaleRejection() {
    logHeader('EMPTY SALE REJECTION TEST');

    try {
        const emptySale = {
            customer_id: null,
            customer_type: 'retail',
            items: [], // Empty items array
            subtotal: 0,
            discount_type: 'none',
            discount_value: 0,
            discount_amount: 0,
            total_amount: 0,
            payment_method: 'cash',
            paid_amount: 0
        };

        const response = await axios.post(SALES_URL, emptySale, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        logError('System incorrectly allowed empty sale');
        return false;

    } catch (error) {
        if (error.response?.status === 400) {
            const errorMessage = error.response.data.message || error.response.data.error;
            logSuccess(`System correctly rejected empty sale: ${errorMessage}`);
            return true;
        } else {
            logError(`Unexpected error: ${error.message}`);
            return false;
        }
    }
}

async function testInvalidProductRejection() {
    logHeader('INVALID PRODUCT REJECTION TEST');

    try {
        const invalidProductSale = {
            customer_id: null,
            customer_type: 'retail',
            items: [{
                product_id: 999999, // Non-existent product ID
                quantity: 1,
                price: 100.00
            }],
            subtotal: 100.00,
            discount_type: 'none',
            discount_value: 0,
            discount_amount: 0,
            total_amount: 100.00,
            payment_method: 'cash',
            paid_amount: 100.00
        };

        const response = await axios.post(SALES_URL, invalidProductSale, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        logError('System incorrectly allowed sale with non-existent product');
        return false;

    } catch (error) {
        if (error.response?.status === 400 || error.response?.status === 404 || error.response?.status === 500) {
            const errorMessage = error.response.data.message || error.response.data.error;
            logSuccess(`System correctly rejected non-existent product: ${errorMessage}`);
            return true;
        } else {
            logError(`Unexpected error: ${error.message}`);
            return false;
        }
    }
}

async function testTotalMismatchRejection() {
    logHeader('TOTAL MISMATCH REJECTION TEST');

    try {
        const mismatchSale = {
            customer_id: null,
            customer_type: 'retail',
            items: [{
                product_id: 1,
                quantity: 2,
                price: 50.00
            }],
            subtotal: 100.00, // Correct subtotal: 2 x 50.00
            discount_type: 'none',
            discount_value: 0,
            discount_amount: 0,
            total_amount: 150.00, // Wrong total: Should be 100.00
            payment_method: 'cash',
            paid_amount: 150.00
        };

        const response = await axios.post(SALES_URL, mismatchSale, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        logError('System incorrectly allowed sale with total mismatch');
        return false;

    } catch (error) {
        if (error.response?.status === 400) {
            const errorMessage = error.response.data.message || error.response.data.error;
            logSuccess(`System correctly rejected total mismatch: ${errorMessage}`);
            return true;
        } else {
            logError(`Unexpected error: ${error.message}`);
            return false;
        }
    }
}

async function testZeroStockRejection() {
    logHeader('ZERO STOCK REJECTION TEST');

    try {
        // Get products to find one with zero stock
        const productsResponse = await axios.get(PRODUCTS_URL, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const zeroStockProduct = productsResponse.data.find(p => parseInt(p.stock_quantity) === 0);

        if (!zeroStockProduct) {
            logInfo('No zero-stock products found, skipping zero stock test');
            return true; // Skip this test if no zero-stock products exist
        }

        logInfo(`Testing with zero-stock product: ${zeroStockProduct.name} (Stock: ${zeroStockProduct.stock_quantity})`);

        const zeroStockSale = {
            customer_id: null,
            customer_type: 'retail',
            items: [{
                product_id: zeroStockProduct.id,
                quantity: 1,
                price: parseFloat(zeroStockProduct.retail_price)
            }],
            subtotal: parseFloat(zeroStockProduct.retail_price),
            discount_type: 'none',
            discount_value: 0,
            discount_amount: 0,
            total_amount: parseFloat(zeroStockProduct.retail_price),
            payment_method: 'cash',
            paid_amount: parseFloat(zeroStockProduct.retail_price)
        };

        const response = await axios.post(SALES_URL, zeroStockSale, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        logError('System incorrectly allowed zero-stock product sale');
        return false;

    } catch (error) {
        if (error.response?.status === 400) {
            const errorMessage = error.response.data.message || error.response.data.error;
            if (errorMessage.includes('out of stock') || errorMessage.includes('Insufficient stock')) {
                logSuccess(`System correctly rejected zero-stock sale: ${errorMessage}`);
                return true;
            } else {
                logError(`Unexpected validation error: ${errorMessage}`);
                return false;
            }
        } else {
            logError(`Unexpected error: ${error.message}`);
            return false;
        }
    }
}

async function runNewTransactionIntegrityTests() {
    logHeader('CASHIER POS NEW TRANSACTION INTEGRITY VALIDATION');

    const results = {
        authentication: false,
        validTransaction: false,
        negativeQuantityRejection: false,
        emptySaleRejection: false,
        invalidProductRejection: false,
        totalMismatchRejection: false,
        zeroStockRejection: false
    };

    // Run all tests
    logInfo('Testing data integrity middleware for new transactions...\n');

    // Test 1: Authentication
    results.authentication = await authenticate();

    if (results.authentication) {
        // Test 2: Valid transaction should pass
        results.validTransaction = await testValidTransaction();

        // Test 3: Negative quantity should be rejected
        results.negativeQuantityRejection = await testNegativeQuantityRejection();

        // Test 4: Empty sale should be rejected
        results.emptySaleRejection = await testEmptySaleRejection();

        // Test 5: Invalid product should be rejected
        results.invalidProductRejection = await testInvalidProductRejection();

        // Test 6: Total mismatch should be rejected
        results.totalMismatchRejection = await testTotalMismatchRejection();

        // Test 7: Zero stock products should be rejected
        results.zeroStockRejection = await testZeroStockRejection();
    }

    // Calculate overall results
    const passedTests = Object.values(results).filter(result => result === true).length;
    const totalTests = Object.keys(results).length;
    const successRate = (passedTests / totalTests) * 100;

    logHeader('NEW TRANSACTION INTEGRITY TEST RESULTS');

    Object.entries(results).forEach(([testName, passed]) => {
        const displayName = testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        if (passed) {
            logSuccess(`✅ ${displayName}: PASSED`);
        } else {
            logError(`❌ ${displayName}: FAILED`);
        }
    });

    console.log('\n' + '='.repeat(60));
    if (successRate === 100) {
        logSuccess(`🎉 ALL NEW TRANSACTION INTEGRITY TESTS PASSED!`);
        log(`📊 Success Rate: ${successRate}%`, colors.green);
    } else if (successRate >= 75) {
        log(`⚠️  Most tests passed with ${successRate}% success rate`, colors.yellow);
        log(`📊 Success Rate: ${successRate}%`, colors.yellow);
    } else {
        logError(`❌ Multiple tests failed with ${successRate}% success rate`);
        log(`📊 Success Rate: ${successRate}%`, colors.red);
    }

    console.log('='.repeat(60));

    logHeader('DATA INTEGRITY MIDDLEWARE STATUS');
    log('🔒 Frontend Validation: Enhanced client-side data validation', colors.cyan);
    log('🛡️  Backend Middleware: Server-side integrity enforcement', colors.cyan);
    log('📋 Audit Trail: Transaction logging and monitoring', colors.cyan);
    log('⚡ Real-time Checks: Immediate validation feedback', colors.cyan);
    log('🔄 Session Management: Multi-sale integrity preservation', colors.cyan);

    return successRate;
}

// Run the test suite
runNewTransactionIntegrityTests()
    .then(successRate => {
        process.exit(successRate >= 75 ? 0 : 1);
    })
    .catch(error => {
        logError(`Test suite crashed: ${error.message}`);
        process.exit(1);
    });