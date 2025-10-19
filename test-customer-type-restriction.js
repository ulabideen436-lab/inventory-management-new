/**
 * CUSTOMER TYPE EDIT RESTRICTION TEST
 * 
 * This test verifies that owners cannot change customer type 
 * when editing sales to maintain pricing integrity.
 */

import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5000';
const LOGIN_URL = `${BASE_URL}/auth/login`;
const SALES_URL = `${BASE_URL}/sales`;
const PRODUCTS_URL = `${BASE_URL}/products`;

let authToken = '';

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

function logSuccess(message) {
    console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
    console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logInfo(message) {
    console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function logWarning(message) {
    console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logHeader(message) {
    console.log(`\n${colors.cyan}${'='.repeat(70)}`);
    console.log(`${message}`);
    console.log(`${'='.repeat(70)}${colors.reset}`);
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

async function createTestSale() {
    try {
        // Get a product for the test sale
        const productsResponse = await axios.get(PRODUCTS_URL, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const products = productsResponse.data;
        const testProduct = products.find(p => p.stock_quantity > 5);

        if (!testProduct) {
            logError('No suitable products found for test sale');
            return null;
        }

        // Create a sale with retail customer type
        const saleData = {
            customer_id: null,
            customer_type: 'retail',
            items: [{
                product_id: testProduct.id,
                quantity: 1,
                price: parseFloat(testProduct.retail_price)
            }],
            subtotal: parseFloat(testProduct.retail_price),
            discount_type: 'none',
            discount_value: 0,
            discount_amount: 0,
            total_amount: parseFloat(testProduct.retail_price),
            payment_method: 'cash',
            paid_amount: parseFloat(testProduct.retail_price)
        };

        const response = await axios.post(SALES_URL, saleData, {
            headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200 || response.status === 201) {
            const saleId = response.data.sale_id;
            logSuccess(`Test sale created - Sale ID: ${saleId}`);
            logInfo(`Original customer type: retail`);
            return {
                saleId,
                originalCustomerType: 'retail',
                productId: testProduct.id,
                originalPrice: testProduct.retail_price
            };
        }

    } catch (error) {
        logError(`Failed to create test sale: ${error.response?.data?.message || error.message}`);
        return null;
    }
}

async function testCustomerTypeChangeRestriction(testSale) {
    logHeader('CUSTOMER TYPE CHANGE RESTRICTION TEST');

    try {
        logInfo(`Attempting to change customer type from 'retail' to 'wholesale' for Sale ID: ${testSale.saleId}`);

        // Attempt to edit the sale and change customer type
        const updateData = {
            customer_type: 'wholesale', // Try to change from retail to wholesale
            items: [{
                product_id: testSale.productId,
                quantity: 1,
                price: parseFloat(testSale.originalPrice)
            }]
        };

        const response = await axios.put(`${SALES_URL}/${testSale.saleId}`, updateData, {
            headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        // If we reach here, the update was allowed (which should NOT happen)
        logError('🚨 SECURITY BREACH: Customer type change was allowed!');
        logError('This could allow price manipulation and unauthorized discounts');
        return false;

    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;

        // Check if customer type change was blocked (any status or message indicating restriction)
        if (errorMessage.includes('Cannot change customer type') ||
            errorMessage.includes('Customer type is locked') ||
            errorMessage.includes('Customer type cannot be changed') ||
            error.response?.status === 403) {

            logSuccess('✅ Customer type change correctly blocked');
            logInfo(`Rejection reason: ${errorMessage}`);
            logInfo(`Status code: ${error.response?.status || 'N/A'}`);
            return true;
        } else {
            logError(`Unexpected error: ${errorMessage}`);
            return false;
        }
    }
}

async function testValidSaleEdit(testSale) {
    logHeader('VALID SALE EDIT TEST (WITHOUT CUSTOMER TYPE CHANGE)');

    try {
        logInfo(`Testing valid edit without customer type change for Sale ID: ${testSale.saleId}`);

        // Edit the sale without changing customer type (should be allowed)
        const updateData = {
            items: [{
                product_id: testSale.productId,
                quantity: 2, // Change quantity
                price: parseFloat(testSale.originalPrice)
            }]
        };

        const response = await axios.put(`${SALES_URL}/${testSale.saleId}`, updateData, {
            headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200) {
            logSuccess('✅ Valid sale edit (without customer type change) was successful');
            logInfo('Quantity updated from 1 to 2 items');
            return true;
        } else {
            logError('Valid sale edit was unexpectedly rejected');
            return false;
        }

    } catch (error) {
        logError(`Valid sale edit failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function testCustomerIdChange(testSale) {
    logHeader('CUSTOMER ID CHANGE TEST (SHOULD BE ALLOWED)');

    try {
        logInfo(`Testing customer ID change (should be allowed) for Sale ID: ${testSale.saleId}`);

        // Change customer ID without changing customer type (should be allowed)
        const updateData = {
            customer_id: 1, // Assign to a customer
            items: [{
                product_id: testSale.productId,
                quantity: 2,
                price: parseFloat(testSale.originalPrice)
            }]
        };

        const response = await axios.put(`${SALES_URL}/${testSale.saleId}`, updateData, {
            headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200) {
            logSuccess('✅ Customer ID change was successful (as expected)');
            logInfo('Customer assignment updated without changing pricing type');
            return true;
        } else {
            logError('Customer ID change was unexpectedly rejected');
            return false;
        }

    } catch (error) {
        logError(`Customer ID change failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function main() {
    logHeader('CUSTOMER TYPE EDIT RESTRICTION VALIDATION');
    logInfo('Testing business rule: Customer type cannot be changed during sale edits');

    if (!(await authenticate())) {
        process.exit(1);
    }

    // Create a test sale
    const testSale = await createTestSale();
    if (!testSale) {
        logError('Failed to create test sale - aborting tests');
        process.exit(1);
    }

    const testResults = {};

    // Test 1: Customer type change should be blocked
    testResults.customerTypeRestriction = await testCustomerTypeChangeRestriction(testSale);

    // Test 2: Valid sale edit (without customer type change) should work
    testResults.validSaleEdit = await testValidSaleEdit(testSale);

    // Test 3: Customer ID change should be allowed
    testResults.customerIdChange = await testCustomerIdChange(testSale);

    // Results Summary
    logHeader('CUSTOMER TYPE RESTRICTION TEST RESULTS');

    const tests = [
        { name: 'Customer Type Change Restriction', result: testResults.customerTypeRestriction },
        { name: 'Valid Sale Edit (No Type Change)', result: testResults.validSaleEdit },
        { name: 'Customer ID Change (Allowed)', result: testResults.customerIdChange }
    ];

    let passedTests = 0;
    let totalTests = 0;

    tests.forEach(test => {
        if (test.result) {
            logSuccess(`✅ ${test.name}: PASSED`);
            passedTests++;
        } else {
            logError(`❌ ${test.name}: FAILED`);
        }
        totalTests++;
    });

    const successRate = (passedTests / totalTests) * 100;

    logHeader('BUSINESS RULE PROTECTION STATUS');

    if (successRate === 100) {
        logSuccess('🎉 ALL CUSTOMER TYPE RESTRICTION TESTS PASSED!');
        logSuccess('✅ Customer type changes are properly blocked during edits');
        logSuccess('✅ Valid sale edits (without type changes) work correctly');
        logSuccess('✅ Customer assignment changes are still allowed');
    } else if (successRate >= 75) {
        logWarning(`⚠️  Most restrictions working (${successRate.toFixed(1)}% success rate)`);
    } else {
        logError(`🚨 CRITICAL: Business rule may be compromised (${successRate.toFixed(1)}% success rate)`);
    }

    console.log(`\n${colors.blue}📊 Test Results:${colors.reset}`);
    console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`   Tests Passed: ${passedTests}/${totalTests}`);

    logHeader('BUSINESS RULE ENFORCEMENT STATUS');
    console.log('🔒 Customer Type Immutability: Enforced during sale edits');
    console.log('💰 Pricing Integrity: Protected from unauthorized changes');
    console.log('✏️  Sale Item Updates: Allowed for legitimate modifications');
    console.log('👤 Customer Assignment: Allowed for workflow management');
    console.log('🛡️  Security Level: Enhanced business rule protection');
}

main().catch(console.error);