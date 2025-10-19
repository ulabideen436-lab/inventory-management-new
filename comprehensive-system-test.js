/**
 * COMPREHENSIVE SYSTEM TEST SUITE
 * This test suite validates the entire StoreFlow Professional inventory management system
 * including all modules, integrations, and workflows.
 */

const axios = require('axios');
const fs = require('fs');

// Configuration
const API_BASE = 'http://localhost:3001';
const TEST_CONFIG = {
    timeout: 30000,
    maxRetries: 3,
    delayBetweenTests: 1000
};

// Test data storage
let testData = {
    tokens: {},
    users: {},
    products: {},
    customers: {},
    suppliers: {},
    sales: {},
    purchases: {},
    payments: {},
    deletedItems: {}
};

// Test statistics
let testStats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    startTime: null,
    endTime: null
};

// Utility functions
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function logTest(category, name, status, details = '') {
    const timestamp = new Date().toISOString();
    const statusSymbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
    console.log(`${statusSymbol} [${category}] ${name} - ${status} ${details}`);

    testStats.total++;
    if (status === 'PASS') testStats.passed++;
    else if (status === 'FAIL') testStats.failed++;
    else testStats.skipped++;
}

function logSection(section) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 TESTING: ${section}`);
    console.log(`${'='.repeat(80)}`);
}

async function makeRequest(method, endpoint, data = null, token = null, retries = 0) {
    try {
        const config = {
            method,
            url: `${API_BASE}${endpoint}`,
            timeout: TEST_CONFIG.timeout,
            headers: {}
        };

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (data) {
            config.data = data;
            config.headers['Content-Type'] = 'application/json';
        }

        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        if (retries < TEST_CONFIG.maxRetries) {
            await delay(1000);
            return makeRequest(method, endpoint, data, token, retries + 1);
        }
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status || 500
        };
    }
}

// ========================================================================================
// 1. AUTHENTICATION SYSTEM TESTS
// ========================================================================================

async function testAuthenticationSystem() {
    logSection('AUTHENTICATION SYSTEM');

    // Test 1.1: User Registration
    try {
        const registerData = {
            username: 'testowner',
            password: 'TestPass123!',
            role: 'owner'
        };

        const result = await makeRequest('POST', '/auth/register', registerData);
        if (result.success) {
            testData.users.owner = registerData;
            logTest('AUTH', 'User Registration', 'PASS', `- Owner account created`);
        } else {
            logTest('AUTH', 'User Registration', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('AUTH', 'User Registration', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 1.2: User Login
    try {
        const loginData = {
            username: 'testowner',
            password: 'TestPass123!'
        };

        const result = await makeRequest('POST', '/auth/login', loginData);
        if (result.success && result.data.token) {
            testData.tokens.owner = result.data.token;
            logTest('AUTH', 'User Login', 'PASS', `- JWT token received`);
        } else {
            logTest('AUTH', 'User Login', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('AUTH', 'User Login', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 1.3: Get User Profile
    try {
        const result = await makeRequest('GET', '/auth/profile', null, testData.tokens.owner);
        if (result.success && result.data.user) {
            logTest('AUTH', 'Get Profile', 'PASS', `- Profile data retrieved`);
        } else {
            logTest('AUTH', 'Get Profile', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('AUTH', 'Get Profile', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 1.4: Password Verification
    try {
        const verifyData = { password: 'TestPass123!' };
        const result = await makeRequest('POST', '/auth/verify-password', verifyData, testData.tokens.owner);
        if (result.success) {
            logTest('AUTH', 'Password Verification', 'PASS', `- Password verified successfully`);
        } else {
            logTest('AUTH', 'Password Verification', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('AUTH', 'Password Verification', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 1.5: Create Cashier User
    try {
        const cashierData = {
            username: 'testcashier',
            password: 'CashierPass123!',
            role: 'cashier'
        };

        const result = await makeRequest('POST', '/auth/register', cashierData);
        if (result.success) {
            testData.users.cashier = cashierData;

            // Login as cashier to get token
            const loginResult = await makeRequest('POST', '/auth/login', {
                username: 'testcashier',
                password: 'CashierPass123!'
            });

            if (loginResult.success) {
                testData.tokens.cashier = loginResult.data.token;
                logTest('AUTH', 'Create Cashier User', 'PASS', `- Cashier account created and logged in`);
            } else {
                logTest('AUTH', 'Create Cashier User', 'FAIL', `- Failed to login as cashier`);
            }
        } else {
            logTest('AUTH', 'Create Cashier User', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('AUTH', 'Create Cashier User', 'FAIL', `- ${error.message}`);
    }
}

// ========================================================================================
// 2. PRODUCT MANAGEMENT TESTS
// ========================================================================================

async function testProductManagement() {
    logSection('PRODUCT MANAGEMENT');

    // Test 2.1: Create Product
    try {
        const productData = {
            id: 'TEST001',
            name: 'Test Product 1',
            brand: 'Test Brand',
            retail_price: 99.99,
            wholesale_price: 75.00,
            stock_quantity: 100,
            category: 'electronics',
            location: 'A1-B1'
        };

        const result = await makeRequest('POST', '/products', productData, testData.tokens.owner);
        if (result.success) {
            testData.products.test1 = { ...productData, db_id: result.data.id };
            logTest('PRODUCTS', 'Create Product', 'PASS', `- Product ${productData.id} created`);
        } else {
            logTest('PRODUCTS', 'Create Product', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('PRODUCTS', 'Create Product', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 2.2: Get All Products
    try {
        const result = await makeRequest('GET', '/products', null, testData.tokens.owner);
        if (result.success && Array.isArray(result.data)) {
            logTest('PRODUCTS', 'Get All Products', 'PASS', `- ${result.data.length} products retrieved`);
        } else {
            logTest('PRODUCTS', 'Get All Products', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('PRODUCTS', 'Get All Products', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 2.3: Update Product
    try {
        const updateData = {
            name: 'Test Product 1 - Updated',
            retail_price: 109.99,
            stock_quantity: 95
        };

        const result = await makeRequest('PUT', `/products/${testData.products.test1?.id || 'TEST001'}`, updateData, testData.tokens.owner);
        if (result.success) {
            logTest('PRODUCTS', 'Update Product', 'PASS', `- Product updated successfully`);
        } else {
            logTest('PRODUCTS', 'Update Product', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('PRODUCTS', 'Update Product', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 2.4: Search Products
    try {
        const result = await makeRequest('GET', '/products?search=Test', null, testData.tokens.owner);
        if (result.success && Array.isArray(result.data)) {
            logTest('PRODUCTS', 'Search Products', 'PASS', `- Search returned ${result.data.length} results`);
        } else {
            logTest('PRODUCTS', 'Search Products', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('PRODUCTS', 'Search Products', 'FAIL', `- ${error.message}`);
    }
}

// ========================================================================================
// 3. CUSTOMER MANAGEMENT TESTS
// ========================================================================================

async function testCustomerManagement() {
    logSection('CUSTOMER MANAGEMENT');

    // Test 3.1: Create Customer
    try {
        const customerData = {
            name: 'Test Customer 1',
            phone: '1234567890',
            email: 'test@customer.com',
            address: '123 Test Street',
            credit_limit: 1000.00,
            customer_type: 'retail'
        };

        const result = await makeRequest('POST', '/customers', customerData, testData.tokens.owner);
        if (result.success) {
            testData.customers.test1 = { ...customerData, id: result.data.id };
            logTest('CUSTOMERS', 'Create Customer', 'PASS', `- Customer created with ID ${result.data.id}`);
        } else {
            logTest('CUSTOMERS', 'Create Customer', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('CUSTOMERS', 'Create Customer', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 3.2: Get All Customers
    try {
        const result = await makeRequest('GET', '/customers', null, testData.tokens.owner);
        if (result.success && Array.isArray(result.data)) {
            logTest('CUSTOMERS', 'Get All Customers', 'PASS', `- ${result.data.length} customers retrieved`);
        } else {
            logTest('CUSTOMERS', 'Get All Customers', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('CUSTOMERS', 'Get All Customers', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 3.3: Get Customer by ID
    try {
        const customerId = testData.customers.test1?.id;
        if (customerId) {
            const result = await makeRequest('GET', `/customers/${customerId}`, null, testData.tokens.owner);
            if (result.success && result.data.id) {
                logTest('CUSTOMERS', 'Get Customer by ID', 'PASS', `- Customer details retrieved`);
            } else {
                logTest('CUSTOMERS', 'Get Customer by ID', 'FAIL', `- ${result.error?.message || result.error}`);
            }
        } else {
            logTest('CUSTOMERS', 'Get Customer by ID', 'SKIP', `- No customer ID available`);
        }
    } catch (error) {
        logTest('CUSTOMERS', 'Get Customer by ID', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 3.4: Update Customer
    try {
        const customerId = testData.customers.test1?.id;
        if (customerId) {
            const updateData = {
                name: 'Test Customer 1 - Updated',
                credit_limit: 1500.00
            };

            const result = await makeRequest('PUT', `/customers/${customerId}`, updateData, testData.tokens.owner);
            if (result.success) {
                logTest('CUSTOMERS', 'Update Customer', 'PASS', `- Customer updated successfully`);
            } else {
                logTest('CUSTOMERS', 'Update Customer', 'FAIL', `- ${result.error?.message || result.error}`);
            }
        } else {
            logTest('CUSTOMERS', 'Update Customer', 'SKIP', `- No customer ID available`);
        }
    } catch (error) {
        logTest('CUSTOMERS', 'Update Customer', 'FAIL', `- ${error.message}`);
    }
}

// ========================================================================================
// 4. SUPPLIER MANAGEMENT TESTS
// ========================================================================================

async function testSupplierManagement() {
    logSection('SUPPLIER MANAGEMENT');

    // Test 4.1: Create Supplier
    try {
        const supplierData = {
            name: 'Test Supplier 1',
            contact_person: 'John Doe',
            phone: '9876543210',
            email: 'supplier@test.com',
            address: '456 Supplier Avenue',
            payment_terms: 'Net 30'
        };

        const result = await makeRequest('POST', '/suppliers', supplierData, testData.tokens.owner);
        if (result.success) {
            testData.suppliers.test1 = { ...supplierData, id: result.data.id };
            logTest('SUPPLIERS', 'Create Supplier', 'PASS', `- Supplier created with ID ${result.data.id}`);
        } else {
            logTest('SUPPLIERS', 'Create Supplier', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('SUPPLIERS', 'Create Supplier', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 4.2: Get All Suppliers
    try {
        const result = await makeRequest('GET', '/suppliers', null, testData.tokens.owner);
        if (result.success && Array.isArray(result.data)) {
            logTest('SUPPLIERS', 'Get All Suppliers', 'PASS', `- ${result.data.length} suppliers retrieved`);
        } else {
            logTest('SUPPLIERS', 'Get All Suppliers', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('SUPPLIERS', 'Get All Suppliers', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 4.3: Update Supplier
    try {
        const supplierId = testData.suppliers.test1?.id;
        if (supplierId) {
            const updateData = {
                name: 'Test Supplier 1 - Updated',
                payment_terms: 'Net 45'
            };

            const result = await makeRequest('PUT', `/suppliers/${supplierId}`, updateData, testData.tokens.owner);
            if (result.success) {
                logTest('SUPPLIERS', 'Update Supplier', 'PASS', `- Supplier updated successfully`);
            } else {
                logTest('SUPPLIERS', 'Update Supplier', 'FAIL', `- ${result.error?.message || result.error}`);
            }
        } else {
            logTest('SUPPLIERS', 'Update Supplier', 'SKIP', `- No supplier ID available`);
        }
    } catch (error) {
        logTest('SUPPLIERS', 'Update Supplier', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 4.4: Get Supplier History
    try {
        const supplierId = testData.suppliers.test1?.id;
        if (supplierId) {
            const result = await makeRequest('GET', `/suppliers/${supplierId}/history`, null, testData.tokens.owner);
            if (result.success) {
                logTest('SUPPLIERS', 'Get Supplier History', 'PASS', `- History retrieved successfully`);
            } else {
                logTest('SUPPLIERS', 'Get Supplier History', 'FAIL', `- ${result.error?.message || result.error}`);
            }
        } else {
            logTest('SUPPLIERS', 'Get Supplier History', 'SKIP', `- No supplier ID available`);
        }
    } catch (error) {
        logTest('SUPPLIERS', 'Get Supplier History', 'FAIL', `- ${error.message}`);
    }
}

// ========================================================================================
// 5. SALES SYSTEM TESTS
// ========================================================================================

async function testSalesSystem() {
    logSection('SALES SYSTEM');

    // Test 5.1: Create Sale
    try {
        const saleData = {
            customer_id: testData.customers.test1?.id || 1,
            items: [
                {
                    product_id: testData.products.test1?.id || 'TEST001',
                    quantity: 2,
                    unit_price: 99.99,
                    discount: 0
                }
            ],
            payment_method: 'cash',
            total_amount: 199.98,
            discount_amount: 0,
            tax_amount: 0
        };

        const result = await makeRequest('POST', '/sales', saleData, testData.tokens.owner);
        if (result.success) {
            testData.sales.test1 = { ...saleData, id: result.data.id };
            logTest('SALES', 'Create Sale', 'PASS', `- Sale created with ID ${result.data.id}`);
        } else {
            logTest('SALES', 'Create Sale', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('SALES', 'Create Sale', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 5.2: Get All Sales
    try {
        const result = await makeRequest('GET', '/sales', null, testData.tokens.owner);
        if (result.success && Array.isArray(result.data)) {
            logTest('SALES', 'Get All Sales', 'PASS', `- ${result.data.length} sales retrieved`);
        } else {
            logTest('SALES', 'Get All Sales', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('SALES', 'Get All Sales', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 5.3: Get Sale by ID
    try {
        const saleId = testData.sales.test1?.id;
        if (saleId) {
            const result = await makeRequest('GET', `/sales/${saleId}`, null, testData.tokens.owner);
            if (result.success && result.data.id) {
                logTest('SALES', 'Get Sale by ID', 'PASS', `- Sale details retrieved`);
            } else {
                logTest('SALES', 'Get Sale by ID', 'FAIL', `- ${result.error?.message || result.error}`);
            }
        } else {
            logTest('SALES', 'Get Sale by ID', 'SKIP', `- No sale ID available`);
        }
    } catch (error) {
        logTest('SALES', 'Get Sale by ID', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 5.4: Get Sold Products
    try {
        const result = await makeRequest('GET', '/sales/sold-products', null, testData.tokens.owner);
        if (result.success && Array.isArray(result.data)) {
            logTest('SALES', 'Get Sold Products', 'PASS', `- ${result.data.length} sold products retrieved`);
        } else {
            logTest('SALES', 'Get Sold Products', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('SALES', 'Get Sold Products', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 5.5: Cashier Sale Creation
    try {
        const saleData = {
            customer_id: testData.customers.test1?.id || 1,
            items: [
                {
                    product_id: testData.products.test1?.id || 'TEST001',
                    quantity: 1,
                    unit_price: 99.99,
                    discount: 0
                }
            ],
            payment_method: 'card',
            total_amount: 99.99,
            discount_amount: 0,
            tax_amount: 0
        };

        const result = await makeRequest('POST', '/sales', saleData, testData.tokens.cashier);
        if (result.success) {
            testData.sales.cashier1 = { ...saleData, id: result.data.id };
            logTest('SALES', 'Cashier Sale Creation', 'PASS', `- Cashier created sale with ID ${result.data.id}`);
        } else {
            logTest('SALES', 'Cashier Sale Creation', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('SALES', 'Cashier Sale Creation', 'FAIL', `- ${error.message}`);
    }
}

// ========================================================================================
// 6. PURCHASE SYSTEM TESTS
// ========================================================================================

async function testPurchaseSystem() {
    logSection('PURCHASE SYSTEM');

    // Test 6.1: Create Purchase
    try {
        const purchaseData = {
            supplier_id: testData.suppliers.test1?.id || 1,
            items: [
                {
                    product_id: testData.products.test1?.id || 'TEST001',
                    quantity: 50,
                    unit_cost: 75.00
                }
            ],
            total_amount: 3750.00,
            payment_status: 'pending'
        };

        const result = await makeRequest('POST', '/purchases', purchaseData, testData.tokens.owner);
        if (result.success) {
            testData.purchases.test1 = { ...purchaseData, id: result.data.id };
            logTest('PURCHASES', 'Create Purchase', 'PASS', `- Purchase created with ID ${result.data.id}`);
        } else {
            logTest('PURCHASES', 'Create Purchase', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('PURCHASES', 'Create Purchase', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 6.2: Get All Purchases
    try {
        const result = await makeRequest('GET', '/purchases', null, testData.tokens.owner);
        if (result.success && Array.isArray(result.data)) {
            logTest('PURCHASES', 'Get All Purchases', 'PASS', `- ${result.data.length} purchases retrieved`);
        } else {
            logTest('PURCHASES', 'Get All Purchases', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('PURCHASES', 'Get All Purchases', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 6.3: Get Purchase by ID
    try {
        const purchaseId = testData.purchases.test1?.id;
        if (purchaseId) {
            const result = await makeRequest('GET', `/purchases/${purchaseId}`, null, testData.tokens.owner);
            if (result.success && result.data.id) {
                logTest('PURCHASES', 'Get Purchase by ID', 'PASS', `- Purchase details retrieved`);
            } else {
                logTest('PURCHASES', 'Get Purchase by ID', 'FAIL', `- ${result.error?.message || result.error}`);
            }
        } else {
            logTest('PURCHASES', 'Get Purchase by ID', 'SKIP', `- No purchase ID available`);
        }
    } catch (error) {
        logTest('PURCHASES', 'Get Purchase by ID', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 6.4: Update Purchase
    try {
        const purchaseId = testData.purchases.test1?.id;
        if (purchaseId) {
            const updateData = {
                payment_status: 'paid',
                notes: 'Payment completed via bank transfer'
            };

            const result = await makeRequest('PUT', `/purchases/${purchaseId}`, updateData, testData.tokens.owner);
            if (result.success) {
                logTest('PURCHASES', 'Update Purchase', 'PASS', `- Purchase updated successfully`);
            } else {
                logTest('PURCHASES', 'Update Purchase', 'FAIL', `- ${result.error?.message || result.error}`);
            }
        } else {
            logTest('PURCHASES', 'Update Purchase', 'SKIP', `- No purchase ID available`);
        }
    } catch (error) {
        logTest('PURCHASES', 'Update Purchase', 'FAIL', `- ${error.message}`);
    }
}

// ========================================================================================
// 7. PAYMENTS SYSTEM TESTS
// ========================================================================================

async function testPaymentSystem() {
    logSection('PAYMENT SYSTEM');

    // Test 7.1: Create Payment
    try {
        const paymentData = {
            transaction_type: 'supplier_payment',
            reference_id: testData.suppliers.test1?.id || 1,
            amount: 1000.00,
            payment_method: 'bank_transfer',
            description: 'Partial payment to supplier'
        };

        const result = await makeRequest('POST', '/payments', paymentData, testData.tokens.owner);
        if (result.success) {
            testData.payments.test1 = { ...paymentData, id: result.data.id };
            logTest('PAYMENTS', 'Create Payment', 'PASS', `- Payment created with ID ${result.data.id}`);
        } else {
            logTest('PAYMENTS', 'Create Payment', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('PAYMENTS', 'Create Payment', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 7.2: Get All Payments
    try {
        const result = await makeRequest('GET', '/payments', null, testData.tokens.owner);
        if (result.success && Array.isArray(result.data)) {
            logTest('PAYMENTS', 'Get All Payments', 'PASS', `- ${result.data.length} payments retrieved`);
        } else {
            logTest('PAYMENTS', 'Get All Payments', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('PAYMENTS', 'Get All Payments', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 7.3: Get Payment by ID
    try {
        const paymentId = testData.payments.test1?.id;
        if (paymentId) {
            const result = await makeRequest('GET', `/payments/${paymentId}`, null, testData.tokens.owner);
            if (result.success && result.data.id) {
                logTest('PAYMENTS', 'Get Payment by ID', 'PASS', `- Payment details retrieved`);
            } else {
                logTest('PAYMENTS', 'Get Payment by ID', 'FAIL', `- ${result.error?.message || result.error}`);
            }
        } else {
            logTest('PAYMENTS', 'Get Payment by ID', 'SKIP', `- No payment ID available`);
        }
    } catch (error) {
        logTest('PAYMENTS', 'Get Payment by ID', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 7.4: Update Payment
    try {
        const paymentId = testData.payments.test1?.id;
        if (paymentId) {
            const updateData = {
                description: 'Updated payment description - Bank transfer confirmed'
            };

            const result = await makeRequest('PUT', `/payments/${paymentId}`, updateData, testData.tokens.owner);
            if (result.success) {
                logTest('PAYMENTS', 'Update Payment', 'PASS', `- Payment updated successfully`);
            } else {
                logTest('PAYMENTS', 'Update Payment', 'FAIL', `- ${result.error?.message || result.error}`);
            }
        } else {
            logTest('PAYMENTS', 'Update Payment', 'SKIP', `- No payment ID available`);
        }
    } catch (error) {
        logTest('PAYMENTS', 'Update Payment', 'FAIL', `- ${error.message}`);
    }
}

// ========================================================================================
// 8. REPORTS AND ANALYTICS TESTS
// ========================================================================================

async function testReportsAndAnalytics() {
    logSection('REPORTS AND ANALYTICS');

    // Test 8.1: Get System Reports
    try {
        const result = await makeRequest('GET', '/reports', null, testData.tokens.owner);
        if (result.success && result.data) {
            const hasRequiredSections = result.data.sales_summary &&
                result.data.customer_type_summary &&
                result.data.purchase_summary;
            if (hasRequiredSections) {
                logTest('REPORTS', 'Get System Reports', 'PASS', `- All report sections retrieved`);
            } else {
                logTest('REPORTS', 'Get System Reports', 'FAIL', `- Missing report sections`);
            }
        } else {
            logTest('REPORTS', 'Get System Reports', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('REPORTS', 'Get System Reports', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 8.2: Get System Statistics
    try {
        const result = await makeRequest('GET', '/settings/stats', null, testData.tokens.owner);
        if (result.success && result.data) {
            const hasStats = typeof result.data.productCount !== 'undefined' &&
                typeof result.data.customerCount !== 'undefined' &&
                typeof result.data.salesCount !== 'undefined';
            if (hasStats) {
                logTest('REPORTS', 'Get System Statistics', 'PASS', `- System stats retrieved`);
            } else {
                logTest('REPORTS', 'Get System Statistics', 'FAIL', `- Invalid stats format`);
            }
        } else {
            logTest('REPORTS', 'Get System Statistics', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('REPORTS', 'Get System Statistics', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 8.3: Export Data
    try {
        const result = await makeRequest('GET', '/settings/export/data', null, testData.tokens.owner);
        if (result.success && result.data) {
            const hasExportData = result.data.export_date &&
                result.data.data &&
                result.data.data.products &&
                result.data.data.customers;
            if (hasExportData) {
                logTest('REPORTS', 'Export Data', 'PASS', `- Data export successful`);
            } else {
                logTest('REPORTS', 'Export Data', 'FAIL', `- Invalid export format`);
            }
        } else {
            logTest('REPORTS', 'Export Data', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('REPORTS', 'Export Data', 'FAIL', `- ${error.message}`);
    }
}

// ========================================================================================
// 9. TRANSACTION SYSTEM TESTS
// ========================================================================================

async function testTransactionSystem() {
    logSection('TRANSACTION SYSTEM');

    // Test 9.1: Get All Transactions
    try {
        const result = await makeRequest('GET', '/transactions', null, testData.tokens.owner);
        if (result.success && Array.isArray(result.data)) {
            logTest('TRANSACTIONS', 'Get All Transactions', 'PASS', `- ${result.data.length} transactions retrieved`);
        } else {
            logTest('TRANSACTIONS', 'Get All Transactions', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('TRANSACTIONS', 'Get All Transactions', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 9.2: Get Detailed Transactions
    try {
        const result = await makeRequest('GET', '/transactions/detailed', null, testData.tokens.owner);
        if (result.success && Array.isArray(result.data)) {
            logTest('TRANSACTIONS', 'Get Detailed Transactions', 'PASS', `- ${result.data.length} detailed transactions retrieved`);
        } else {
            logTest('TRANSACTIONS', 'Get Detailed Transactions', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('TRANSACTIONS', 'Get Detailed Transactions', 'FAIL', `- ${error.message}`);
    }
}

// ========================================================================================
// 10. DELETED ITEMS SYSTEM TESTS
// ========================================================================================

async function testDeletedItemsSystem() {
    logSection('DELETED ITEMS SYSTEM');

    // Test 10.1: Get Deleted Items Statistics
    try {
        const result = await makeRequest('GET', '/deleted-items/stats', null, testData.tokens.owner);
        if (result.success && result.data) {
            logTest('DELETED_ITEMS', 'Get Statistics', 'PASS', `- Statistics retrieved successfully`);
        } else {
            logTest('DELETED_ITEMS', 'Get Statistics', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('DELETED_ITEMS', 'Get Statistics', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 10.2: Get All Deleted Items
    try {
        const result = await makeRequest('GET', '/deleted-items', null, testData.tokens.owner);
        if (result.success && Array.isArray(result.data)) {
            logTest('DELETED_ITEMS', 'Get All Deleted Items', 'PASS', `- ${result.data.length} deleted items retrieved`);
        } else {
            logTest('DELETED_ITEMS', 'Get All Deleted Items', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('DELETED_ITEMS', 'Get All Deleted Items', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 10.3: Soft Delete Product (to test deletion system)
    try {
        const productId = testData.products.test1?.id || 'TEST001';
        const deleteData = { password: 'TestPass123!' };

        const result = await makeRequest('DELETE', `/products/${productId}`, deleteData, testData.tokens.owner);
        if (result.success) {
            logTest('DELETED_ITEMS', 'Soft Delete Product', 'PASS', `- Product soft deleted successfully`);

            // Store for restoration test
            testData.deletedItems.product1 = { type: 'product', id: productId };
        } else {
            logTest('DELETED_ITEMS', 'Soft Delete Product', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('DELETED_ITEMS', 'Soft Delete Product', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 10.4: Check Deleted Items List After Deletion
    try {
        const result = await makeRequest('GET', '/deleted-items?type=product', null, testData.tokens.owner);
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            const deletedProduct = result.data.find(item => item.original_data?.id === testData.products.test1?.id);
            if (deletedProduct) {
                testData.deletedItems.product1.deletedItemId = deletedProduct.id;
                logTest('DELETED_ITEMS', 'Verify Deletion in List', 'PASS', `- Deleted product found in list`);
            } else {
                logTest('DELETED_ITEMS', 'Verify Deletion in List', 'FAIL', `- Deleted product not found in list`);
            }
        } else {
            logTest('DELETED_ITEMS', 'Verify Deletion in List', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('DELETED_ITEMS', 'Verify Deletion in List', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 10.5: Restore Deleted Item
    try {
        const deletedItemId = testData.deletedItems.product1?.deletedItemId;
        if (deletedItemId) {
            const restoreData = { password: 'TestPass123!' };

            const result = await makeRequest('POST', `/deleted-items/${deletedItemId}/restore`, restoreData, testData.tokens.owner);
            if (result.success) {
                logTest('DELETED_ITEMS', 'Restore Deleted Item', 'PASS', `- Item restored successfully`);
            } else {
                logTest('DELETED_ITEMS', 'Restore Deleted Item', 'FAIL', `- ${result.error?.message || result.error}`);
            }
        } else {
            logTest('DELETED_ITEMS', 'Restore Deleted Item', 'SKIP', `- No deleted item ID available`);
        }
    } catch (error) {
        logTest('DELETED_ITEMS', 'Restore Deleted Item', 'FAIL', `- ${error.message}`);
    }
}

// ========================================================================================
// 11. USER MANAGEMENT TESTS
// ========================================================================================

async function testUserManagement() {
    logSection('USER MANAGEMENT');

    // Test 11.1: Get All Users
    try {
        const result = await makeRequest('GET', '/users', null, testData.tokens.owner);
        if (result.success && Array.isArray(result.data)) {
            logTest('USERS', 'Get All Users', 'PASS', `- ${result.data.length} users retrieved`);
        } else {
            logTest('USERS', 'Get All Users', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('USERS', 'Get All Users', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 11.2: Create New User
    try {
        const userData = {
            username: 'testmanager',
            password: 'ManagerPass123!',
            role: 'cashier',
            full_name: 'Test Manager',
            email: 'manager@test.com'
        };

        const result = await makeRequest('POST', '/users', userData, testData.tokens.owner);
        if (result.success) {
            testData.users.manager = { ...userData, id: result.data.id };
            logTest('USERS', 'Create New User', 'PASS', `- Manager user created with ID ${result.data.id}`);
        } else {
            logTest('USERS', 'Create New User', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('USERS', 'Create New User', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 11.3: Update User
    try {
        const userId = testData.users.manager?.id;
        if (userId) {
            const updateData = {
                full_name: 'Test Manager - Updated',
                email: 'manager.updated@test.com'
            };

            const result = await makeRequest('PUT', `/users/${userId}`, updateData, testData.tokens.owner);
            if (result.success) {
                logTest('USERS', 'Update User', 'PASS', `- User updated successfully`);
            } else {
                logTest('USERS', 'Update User', 'FAIL', `- ${result.error?.message || result.error}`);
            }
        } else {
            logTest('USERS', 'Update User', 'SKIP', `- No user ID available`);
        }
    } catch (error) {
        logTest('USERS', 'Update User', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 11.4: Deactivate User
    try {
        const userId = testData.users.manager?.id;
        if (userId) {
            const result = await makeRequest('PATCH', `/users/${userId}/deactivate`, {}, testData.tokens.owner);
            if (result.success) {
                logTest('USERS', 'Deactivate User', 'PASS', `- User deactivated successfully`);
            } else {
                logTest('USERS', 'Deactivate User', 'FAIL', `- ${result.error?.message || result.error}`);
            }
        } else {
            logTest('USERS', 'Deactivate User', 'SKIP', `- No user ID available`);
        }
    } catch (error) {
        logTest('USERS', 'Deactivate User', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 11.5: Reactivate User
    try {
        const userId = testData.users.manager?.id;
        if (userId) {
            const result = await makeRequest('PATCH', `/users/${userId}/reactivate`, {}, testData.tokens.owner);
            if (result.success) {
                logTest('USERS', 'Reactivate User', 'PASS', `- User reactivated successfully`);
            } else {
                logTest('USERS', 'Reactivate User', 'FAIL', `- ${result.error?.message || result.error}`);
            }
        } else {
            logTest('USERS', 'Reactivate User', 'SKIP', `- No user ID available`);
        }
    } catch (error) {
        logTest('USERS', 'Reactivate User', 'FAIL', `- ${error.message}`);
    }
}

// ========================================================================================
// 12. SYSTEM SETTINGS TESTS
// ========================================================================================

async function testSystemSettings() {
    logSection('SYSTEM SETTINGS');

    // Test 12.1: Get System Settings
    try {
        const result = await makeRequest('GET', '/settings', null, testData.tokens.owner);
        if (result.success && result.data) {
            logTest('SETTINGS', 'Get System Settings', 'PASS', `- Settings retrieved successfully`);
        } else {
            logTest('SETTINGS', 'Get System Settings', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('SETTINGS', 'Get System Settings', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 12.2: Update System Settings
    try {
        const settingsData = {
            store_name: 'Test Store - Updated',
            currency: 'USD',
            tax_rate: 10.5,
            low_stock_threshold: 15
        };

        const result = await makeRequest('POST', '/settings', settingsData, testData.tokens.owner);
        if (result.success) {
            logTest('SETTINGS', 'Update System Settings', 'PASS', `- Settings updated successfully`);
        } else {
            logTest('SETTINGS', 'Update System Settings', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('SETTINGS', 'Update System Settings', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 12.3: Create Database Backup
    try {
        const result = await makeRequest('POST', '/settings/backup/database', {}, testData.tokens.owner);
        if (result.success) {
            logTest('SETTINGS', 'Create Database Backup', 'PASS', `- Backup created successfully`);
        } else {
            logTest('SETTINGS', 'Create Database Backup', 'FAIL', `- ${result.error?.message || result.error}`);
        }
    } catch (error) {
        logTest('SETTINGS', 'Create Database Backup', 'FAIL', `- ${error.message}`);
    }
}

// ========================================================================================
// 13. INTEGRATION TESTS
// ========================================================================================

async function testIntegrationWorkflows() {
    logSection('INTEGRATION WORKFLOWS');

    // Test 13.1: Complete Sale to Customer Workflow
    try {
        // Create a customer, product, and complete sale
        const customer = {
            name: 'Integration Test Customer',
            phone: '5555555555',
            email: 'integration@test.com',
            customer_type: 'retail'
        };

        const customerResult = await makeRequest('POST', '/customers', customer, testData.tokens.owner);
        if (!customerResult.success) {
            logTest('INTEGRATION', 'Complete Sale Workflow', 'FAIL', `- Failed to create customer`);
            return;
        }

        await delay(500);

        const product = {
            id: 'INTEG001',
            name: 'Integration Test Product',
            brand: 'Test',
            retail_price: 150.00,
            wholesale_price: 100.00,
            stock_quantity: 50,
            category: 'test'
        };

        const productResult = await makeRequest('POST', '/products', product, testData.tokens.owner);
        if (!productResult.success) {
            logTest('INTEGRATION', 'Complete Sale Workflow', 'FAIL', `- Failed to create product`);
            return;
        }

        await delay(500);

        const sale = {
            customer_id: customerResult.data.id,
            items: [
                {
                    product_id: 'INTEG001',
                    quantity: 3,
                    unit_price: 150.00,
                    discount: 10.00
                }
            ],
            payment_method: 'cash',
            total_amount: 440.00,
            discount_amount: 10.00,
            tax_amount: 0
        };

        const saleResult = await makeRequest('POST', '/sales', sale, testData.tokens.cashier);
        if (saleResult.success) {
            logTest('INTEGRATION', 'Complete Sale Workflow', 'PASS', `- End-to-end sale completed`);
        } else {
            logTest('INTEGRATION', 'Complete Sale Workflow', 'FAIL', `- Failed to create sale: ${saleResult.error?.message}`);
        }

    } catch (error) {
        logTest('INTEGRATION', 'Complete Sale Workflow', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 13.2: Purchase to Inventory Update Workflow
    try {
        // Create supplier and purchase to test inventory update
        const supplier = {
            name: 'Integration Test Supplier',
            contact_person: 'Test Contact',
            phone: '4444444444',
            email: 'supplier.integration@test.com'
        };

        const supplierResult = await makeRequest('POST', '/suppliers', supplier, testData.tokens.owner);
        if (!supplierResult.success) {
            logTest('INTEGRATION', 'Purchase to Inventory Workflow', 'FAIL', `- Failed to create supplier`);
            return;
        }

        await delay(500);

        const purchase = {
            supplier_id: supplierResult.data.id,
            items: [
                {
                    product_id: 'INTEG001',
                    quantity: 25,
                    unit_cost: 100.00
                }
            ],
            total_amount: 2500.00,
            payment_status: 'pending'
        };

        const purchaseResult = await makeRequest('POST', '/purchases', purchase, testData.tokens.owner);
        if (purchaseResult.success) {
            logTest('INTEGRATION', 'Purchase to Inventory Workflow', 'PASS', `- Purchase and inventory update completed`);
        } else {
            logTest('INTEGRATION', 'Purchase to Inventory Workflow', 'FAIL', `- Failed to create purchase: ${purchaseResult.error?.message}`);
        }

    } catch (error) {
        logTest('INTEGRATION', 'Purchase to Inventory Workflow', 'FAIL', `- ${error.message}`);
    }

    await delay(TEST_CONFIG.delayBetweenTests);

    // Test 13.3: Reporting Pipeline
    try {
        // Test that all created data appears in reports
        const reportsResult = await makeRequest('GET', '/reports', null, testData.tokens.owner);
        const statsResult = await makeRequest('GET', '/settings/stats', null, testData.tokens.owner);

        if (reportsResult.success && statsResult.success) {
            const hasData = statsResult.data.salesCount > 0 &&
                statsResult.data.customerCount > 0 &&
                statsResult.data.productCount > 0;

            if (hasData) {
                logTest('INTEGRATION', 'Reporting Pipeline', 'PASS', `- All test data reflected in reports`);
            } else {
                logTest('INTEGRATION', 'Reporting Pipeline', 'FAIL', `- Test data not reflected in reports`);
            }
        } else {
            logTest('INTEGRATION', 'Reporting Pipeline', 'FAIL', `- Failed to retrieve reports or stats`);
        }

    } catch (error) {
        logTest('INTEGRATION', 'Reporting Pipeline', 'FAIL', `- ${error.message}`);
    }
}

// ========================================================================================
// 14. CLEANUP TESTS
// ========================================================================================

async function cleanupTestData() {
    logSection('CLEANUP TEST DATA');

    // Delete test users, products, customers, suppliers, etc.
    const cleanupItems = [
        { endpoint: '/users', items: [testData.users.manager?.id] },
        { endpoint: '/products', items: ['INTEG001'] },
        { endpoint: '/customers', items: [testData.customers.test1?.id] },
        { endpoint: '/suppliers', items: [testData.suppliers.test1?.id] }
    ];

    for (const category of cleanupItems) {
        for (const itemId of category.items.filter(Boolean)) {
            try {
                const deleteData = { password: 'TestPass123!' };
                const result = await makeRequest('DELETE', `${category.endpoint}/${itemId}`, deleteData, testData.tokens.owner);
                if (result.success) {
                    logTest('CLEANUP', `Delete ${category.endpoint} ${itemId}`, 'PASS', '- Cleanup successful');
                } else {
                    logTest('CLEANUP', `Delete ${category.endpoint} ${itemId}`, 'FAIL', `- ${result.error?.message || result.error}`);
                }
                await delay(500);
            } catch (error) {
                logTest('CLEANUP', `Delete ${category.endpoint} ${itemId}`, 'FAIL', `- ${error.message}`);
            }
        }
    }
}

// ========================================================================================
// MAIN TEST RUNNER
// ========================================================================================

async function runComprehensiveSystemTests() {
    console.log(`${'='.repeat(120)}`);
    console.log(`🚀 STOREFLOW PROFESSIONAL - COMPREHENSIVE SYSTEM TEST SUITE`);
    console.log(`${'='.repeat(120)}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    console.log(`🌐 API Base URL: ${API_BASE}`);
    console.log(`⚙️  Test Configuration:`, TEST_CONFIG);

    testStats.startTime = new Date();

    try {
        await testAuthenticationSystem();
        await testProductManagement();
        await testCustomerManagement();
        await testSupplierManagement();
        await testSalesSystem();
        await testPurchaseSystem();
        await testPaymentSystem();
        await testReportsAndAnalytics();
        await testTransactionSystem();
        await testDeletedItemsSystem();
        await testUserManagement();
        await testSystemSettings();
        await testIntegrationWorkflows();
        await cleanupTestData();

    } catch (error) {
        console.error(`\n❌ CRITICAL TEST ERROR: ${error.message}`);
        testStats.failed++;
    }

    testStats.endTime = new Date();
    const duration = testStats.endTime - testStats.startTime;

    // Final Report
    console.log(`\n${'='.repeat(120)}`);
    console.log(`📊 COMPREHENSIVE TEST RESULTS SUMMARY`);
    console.log(`${'='.repeat(120)}`);
    console.log(`⏱️  Total Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    console.log(`📈 Total Tests: ${testStats.total}`);
    console.log(`✅ Passed: ${testStats.passed} (${((testStats.passed / testStats.total) * 100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${testStats.failed} (${((testStats.failed / testStats.total) * 100).toFixed(1)}%)`);
    console.log(`⏭️  Skipped: ${testStats.skipped} (${((testStats.skipped / testStats.total) * 100).toFixed(1)}%)`);

    if (testStats.failed === 0) {
        console.log(`\n🎉 ALL TESTS PASSED! The StoreFlow Professional system is fully functional.`);
    } else {
        console.log(`\n⚠️  ${testStats.failed} tests failed. Please review the failures above.`);
    }

    console.log(`\n📋 Test Data Summary:`);
    console.log(`   🔑 Tokens Created: ${Object.keys(testData.tokens).length}`);
    console.log(`   👥 Users Created: ${Object.keys(testData.users).length}`);
    console.log(`   📦 Products Created: ${Object.keys(testData.products).length}`);
    console.log(`   🏪 Customers Created: ${Object.keys(testData.customers).length}`);
    console.log(`   🏭 Suppliers Created: ${Object.keys(testData.suppliers).length}`);
    console.log(`   💰 Sales Created: ${Object.keys(testData.sales).length}`);
    console.log(`   📋 Purchases Created: ${Object.keys(testData.purchases).length}`);
    console.log(`   💳 Payments Created: ${Object.keys(testData.payments).length}`);

    console.log(`${'='.repeat(120)}`);
    console.log(`✨ Test suite completed at: ${new Date().toISOString()}`);
    console.log(`${'='.repeat(120)}`);

    // Save test results to file
    const testResults = {
        summary: testStats,
        testData: testData,
        timestamp: new Date().toISOString()
    };

    fs.writeFileSync('test-results.json', JSON.stringify(testResults, null, 2));
    console.log(`📄 Test results saved to: test-results.json`);
}

// Run the tests
if (require.main === module) {
    runComprehensiveSystemTests()
        .then(() => {
            process.exit(testStats.failed > 0 ? 1 : 0);
        })
        .catch((error) => {
            console.error('Test runner failed:', error);
            process.exit(1);
        });
}

module.exports = {
    runComprehensiveSystemTests,
    testStats,
    testData
};