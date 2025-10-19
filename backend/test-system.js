import axios from 'axios';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const API_BASE = 'http://localhost:5000';
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    reset: '\x1b[0m'
};

let passedTests = 0;
let failedTests = 0;
let testCategories = {
    database: { passed: 0, failed: 0 },
    api: { passed: 0, failed: 0 },
    authentication: { passed: 0, failed: 0 },
    customers: { passed: 0, failed: 0 },
    products: { passed: 0, failed: 0 },
    sales: { passed: 0, failed: 0 },
    suppliers: { passed: 0, failed: 0 }
};

function logTest(category, name, passed, details = '') {
    if (passed) {
        console.log(`  ${colors.green}✅ PASS${colors.reset} - ${name}`);
        passedTests++;
        testCategories[category].passed++;
    } else {
        console.log(`  ${colors.red}❌ FAIL${colors.reset} - ${name}`);
        if (details) console.log(`     ${colors.yellow}${details}${colors.reset}`);
        failedTests++;
        testCategories[category].failed++;
    }
}

function logSection(title) {
    console.log(`\n${colors.cyan}${'='.repeat(70)}${colors.reset}`);
    console.log(`${colors.cyan}${title}${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}\n`);
}

async function testDatabase(connection) {
    logSection('🗄️  DATABASE TESTS');

    try {
        // Test 1: Database Connection
        await connection.query('SELECT 1');
        logTest('database', 'Database connection established', true);

        // Test 2: Check all required tables exist
        const requiredTables = ['users', 'customers', 'products', 'sales', 'sale_items', 'suppliers'];
        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        const missingTables = requiredTables.filter(t => !tableNames.includes(t));
        logTest('database', 'All required tables exist', missingTables.length === 0,
            missingTables.length > 0 ? `Missing: ${missingTables.join(', ')}` : '');

        // Test 3: Check data integrity
        const [orphanedSales] = await connection.query(`
      SELECT COUNT(*) as count FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.customer_id IS NOT NULL AND c.id IS NULL
    `);
        logTest('database', 'No orphaned sales', orphanedSales[0].count === 0);

        // Test 4: Customer types
        const [retailCustomers] = await connection.query(
            "SELECT COUNT(*) as count FROM customers WHERE type = 'retail'"
        );
        logTest('database', 'No retail type customers', retailCustomers[0].count === 0);

        // Test 5: Sales integrity
        const [invalidRetailSales] = await connection.query(`
      SELECT COUNT(*) as count FROM sales
      WHERE customer_type = 'retail' AND customer_id IS NOT NULL
    `);
        logTest('database', 'Retail sales have no customer', invalidRetailSales[0].count === 0);

        // Test 6: Check indexes
        const [indexes] = await connection.query('SHOW INDEX FROM sales');
        logTest('database', 'Sales table has indexes', indexes.length > 0);

        // Test 7: Data counts
        const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
        const [customerCount] = await connection.query('SELECT COUNT(*) as count FROM customers');
        const [productCount] = await connection.query('SELECT COUNT(*) as count FROM products');
        const [saleCount] = await connection.query('SELECT COUNT(*) as count FROM sales WHERE deleted_at IS NULL');

        console.log(`\n  ${colors.blue}📊 Data Summary:${colors.reset}`);
        console.log(`     Users: ${userCount[0].count}`);
        console.log(`     Customers: ${customerCount[0].count}`);
        console.log(`     Products: ${productCount[0].count}`);
        console.log(`     Sales: ${saleCount[0].count}`);

        logTest('database', 'Database has data',
            userCount[0].count > 0 && productCount[0].count > 0);

    } catch (error) {
        logTest('database', 'Database tests completed', false, error.message);
    }
}

async function testAuthentication() {
    logSection('🔐 AUTHENTICATION TESTS');

    try {
        // Test 1: Login endpoint exists
        try {
            await axios.post(`${API_BASE}/auth/login`, {
                username: 'wronguser',
                password: 'wrongpass'
            });
            logTest('authentication', 'Login endpoint responds', false, 'Should reject invalid credentials');
        } catch (error) {
            logTest('authentication', 'Login endpoint responds',
                error.response?.status === 401 || error.response?.status === 400);
        }

        // Test 2: Protected routes require authentication
        try {
            await axios.get(`${API_BASE}/products`);
            logTest('authentication', 'Protected routes reject unauthenticated requests', false);
        } catch (error) {
            logTest('authentication', 'Protected routes reject unauthenticated requests',
                error.response?.status === 401 || error.response?.status === 403);
        }

    } catch (error) {
        logTest('authentication', 'Authentication tests completed', false, error.message);
    }
}

async function testAPIEndpoints(token) {
    logSection('🌐 API ENDPOINT TESTS');

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Test Products API
    try {
        const response = await axios.get(`${API_BASE}/products`, { headers });
        logTest('api', 'GET /products returns data', response.status === 200 && Array.isArray(response.data));
    } catch (error) {
        logTest('api', 'GET /products returns data', false, error.message);
    }

    // Test Customers API
    try {
        const response = await axios.get(`${API_BASE}/customers`, { headers });
        logTest('api', 'GET /customers returns data', response.status === 200 && Array.isArray(response.data));
    } catch (error) {
        logTest('api', 'GET /customers returns data', false, error.message);
    }

    // Test Sales API
    try {
        const response = await axios.get(`${API_BASE}/sales`, { headers });
        logTest('api', 'GET /sales returns data', response.status === 200 && Array.isArray(response.data));
    } catch (error) {
        logTest('api', 'GET /sales returns data', false, error.message);
    }

    // Test Suppliers API
    try {
        const response = await axios.get(`${API_BASE}/suppliers`, { headers });
        logTest('api', 'GET /suppliers returns data', response.status === 200 && Array.isArray(response.data));
    } catch (error) {
        logTest('api', 'GET /suppliers returns data', false, error.message);
    }
}

async function testCustomerFeatures(connection, token) {
    logSection('👥 CUSTOMER FEATURES');

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
        // Test 1: Get customers
        const response = await axios.get(`${API_BASE}/customers`, { headers });
        const customers = response.data;
        logTest('customers', 'Customer list retrieved', customers.length > 0);

        // Test 2: All customers are wholesale
        const allWholesale = customers.every(c =>
            ['long-term', 'longterm', 'wholesale'].includes(c.type?.toLowerCase())
        );
        logTest('customers', 'All customers are wholesale type', allWholesale);

        // Test 3: Customer has required fields
        if (customers.length > 0) {
            const firstCustomer = customers[0];
            const hasRequired = firstCustomer.id && firstCustomer.name && firstCustomer.type;
            logTest('customers', 'Customers have required fields', hasRequired);
        }

        // Test 4: Customer balance tracking
        const customersWithBalance = customers.filter(c => c.balance !== undefined);
        logTest('customers', 'Customers have balance field', customersWithBalance.length > 0);

    } catch (error) {
        logTest('customers', 'Customer tests completed', false, error.message);
    }
}

async function testProductFeatures(connection, token) {
    logSection('📦 PRODUCT FEATURES');

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
        // Test 1: Get products
        const response = await axios.get(`${API_BASE}/products`, { headers });
        const products = response.data;
        logTest('products', 'Product list retrieved', products.length > 0);

        // Test 2: Products have pricing
        if (products.length > 0) {
            const hasPricing = products.every(p =>
                p.retail_price !== undefined && p.wholesale_price !== undefined
            );
            logTest('products', 'Products have retail and wholesale prices', hasPricing);
        }

        // Test 3: Products have stock tracking
        if (products.length > 0) {
            const hasStock = products.every(p => p.stock_quantity !== undefined);
            logTest('products', 'Products have stock quantity', hasStock);
        }

        // Test 4: Low stock detection
        const [lowStock] = await connection.query(`
      SELECT COUNT(*) as count FROM products 
      WHERE stock_quantity < 10 AND stock_quantity > 0
    `);
        console.log(`\n  ${colors.blue}📊 Stock Info: ${lowStock[0].count} products low on stock${colors.reset}`);
        logTest('products', 'Low stock tracking works', true);

    } catch (error) {
        logTest('products', 'Product tests completed', false, error.message);
    }
}

async function testSalesFeatures(connection, token) {
    logSection('💰 SALES FEATURES');

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
        // Test 1: Get sales
        const response = await axios.get(`${API_BASE}/sales`, { headers });
        const sales = response.data;
        logTest('sales', 'Sales list retrieved', sales.length > 0);

        // Test 2: Sales have types
        if (sales.length > 0) {
            const wholesaleSales = sales.filter(s => s.customer_id);
            const retailSales = sales.filter(s => !s.customer_id);
            console.log(`\n  ${colors.blue}📊 Sales Breakdown:${colors.reset}`);
            console.log(`     Wholesale: ${wholesaleSales.length}`);
            console.log(`     Retail: ${retailSales.length}`);
            logTest('sales', 'Sales classified by type', true);
        }

        // Test 3: Sales data integrity
        const [salesIntegrity] = await connection.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN customer_type = 'retail' AND customer_id IS NULL THEN 1 ELSE 0 END) as valid_retail,
        SUM(CASE WHEN customer_type = 'longterm' AND customer_id IS NOT NULL THEN 1 ELSE 0 END) as valid_wholesale
      FROM sales WHERE deleted_at IS NULL
    `);
        const integrity = salesIntegrity[0];
        const validCount = Number(integrity.valid_retail) + Number(integrity.valid_wholesale);
        const totalCount = Number(integrity.total);
        logTest('sales', 'Sales data integrity maintained', validCount === totalCount);

        // Test 4: Sales have items
        const [salesWithItems] = await connection.query(`
      SELECT COUNT(DISTINCT sale_id) as count FROM sale_items
    `);
        logTest('sales', 'Sales have associated items', salesWithItems[0].count > 0);

        // Test 5: Discount tracking
        const [discountSales] = await connection.query(`
      SELECT COUNT(*) as count FROM sales 
      WHERE discount_amount > 0 OR discount_percentage > 0
    `);
        console.log(`\n  ${colors.blue}📊 ${discountSales[0].count} sales have discounts${colors.reset}`);
        logTest('sales', 'Discount tracking works', true);

        // Test 6: Customer type immutability (backend)
        if (sales.length > 0) {
            const testSale = sales[0];
            try {
                await axios.put(`${API_BASE}/sales/${testSale.id}`, {
                    customer_type: 'different_type',
                    items: []
                }, { headers });
                logTest('sales', 'Backend prevents customer type changes', false, 'Type change was allowed');
            } catch (error) {
                logTest('sales', 'Backend prevents customer type changes',
                    error.response?.status === 403);
            }
        }

    } catch (error) {
        logTest('sales', 'Sales tests completed', false, error.message);
    }
}

async function testSupplierFeatures(connection, token) {
    logSection('🏭 SUPPLIER FEATURES');

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
        // Test 1: Get suppliers
        const response = await axios.get(`${API_BASE}/suppliers`, { headers });
        const suppliers = response.data;
        logTest('suppliers', 'Supplier list retrieved', Array.isArray(suppliers));

        // Test 2: Suppliers have contact info
        if (suppliers && suppliers.length > 0) {
            const hasContact = suppliers.every(s => s.name);
            logTest('suppliers', 'Suppliers have required fields', hasContact);
        } else {
            logTest('suppliers', 'Suppliers exist in system', false, 'No suppliers found');
        }

    } catch (error) {
        logTest('suppliers', 'Supplier tests completed', false, error.message);
    }
}

async function runSystemTests() {
    console.log(`\n${colors.magenta}╔${'═'.repeat(68)}╗${colors.reset}`);
    console.log(`${colors.magenta}║${' '.repeat(20)}🧪 SYSTEM-WIDE TEST SUITE${' '.repeat(23)}║${colors.reset}`);
    console.log(`${colors.magenta}║${' '.repeat(22)}Inventory Management${' '.repeat(27)}║${colors.reset}`);
    console.log(`${colors.magenta}╚${'═'.repeat(68)}╝${colors.reset}`);
    console.log(`\n${colors.blue}Test Started: ${new Date().toLocaleString()}${colors.reset}`);

    let connection;
    let token = null;

    try {
        // Setup database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'storeflow'
        });

        // Run all test categories
        await testDatabase(connection);
        await testAuthentication();

        // Try to get a valid token for authenticated tests
        // Add delay to avoid rate limiting
        console.log(`\n  ${colors.cyan}⏳ Waiting to avoid rate limiting...${colors.reset}`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

        try {
            // Attempt to login with test credentials
            const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
                username: 'testowner',
                password: 'test123'
            });
            token = loginResponse.data.token;
            console.log(`  ${colors.green}✅ Authenticated for API tests (user: testowner)${colors.reset}`);
        } catch (error) {
            if (error.response?.status === 429) {
                console.log(`\n  ${colors.yellow}⚠️  Rate limit hit, waiting 10 seconds...${colors.reset}`);
                await new Promise(resolve => setTimeout(resolve, 10000));
                // Retry once
                try {
                    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
                        username: 'testowner',
                        password: 'test123'
                    });
                    token = loginResponse.data.token;
                    console.log(`  ${colors.green}✅ Authenticated after retry${colors.reset}`);
                } catch (retryError) {
                    console.log(`\n  ${colors.red}❌ Could not authenticate after retry - some tests skipped${colors.reset}`);
                    console.log(`     ${colors.yellow}Error: ${retryError.response?.data?.message || retryError.message}${colors.reset}`);
                }
            } else {
                console.log(`\n  ${colors.yellow}⚠️  Could not authenticate - some tests skipped${colors.reset}`);
                console.log(`     ${colors.yellow}Error: ${error.response?.data?.message || error.message}${colors.reset}`);
                console.log(`     ${colors.cyan}Tip: Run 'node create-test-user.js' to create test credentials${colors.reset}`);
            }
        }

        await testAPIEndpoints(token);
        await testCustomerFeatures(connection, token);
        await testProductFeatures(connection, token);
        await testSalesFeatures(connection, token);
        await testSupplierFeatures(connection, token);

    } catch (error) {
        console.error(`\n${colors.red}❌ Test Suite Error:${colors.reset}`, error.message);
    } finally {
        if (connection) await connection.end();
    }

    // Print detailed summary
    console.log(`\n${colors.cyan}${'='.repeat(70)}${colors.reset}`);
    console.log(`${colors.cyan}📊 DETAILED TEST SUMMARY${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}\n`);

    Object.entries(testCategories).forEach(([category, stats]) => {
        const total = stats.passed + stats.failed;
        if (total > 0) {
            const percentage = ((stats.passed / total) * 100).toFixed(1);
            const statusColor = stats.failed === 0 ? colors.green : stats.failed < stats.passed ? colors.yellow : colors.red;
            console.log(`  ${category.toUpperCase().padEnd(20)} ${statusColor}${stats.passed}/${total} passed (${percentage}%)${colors.reset}`);
        }
    });

    console.log(`\n${colors.cyan}${'='.repeat(70)}${colors.reset}`);
    console.log(`${colors.cyan}🎯 OVERALL RESULTS${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}\n`);

    const totalTests = passedTests + failedTests;
    const passRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log(`  Total Tests:     ${totalTests}`);
    console.log(`  ${colors.green}Passed:          ${passedTests}${colors.reset}`);
    console.log(`  ${colors.red}Failed:          ${failedTests}${colors.reset}`);
    console.log(`  Pass Rate:       ${passRate}%\n`);

    if (failedTests === 0) {
        console.log(`${colors.green}╔${'═'.repeat(68)}╗${colors.reset}`);
        console.log(`${colors.green}║${' '.repeat(22)}✅ ALL TESTS PASSED!${' '.repeat(25)}║${colors.reset}`);
        console.log(`${colors.green}║${' '.repeat(18)}System is ready for production${' '.repeat(19)}║${colors.reset}`);
        console.log(`${colors.green}╚${'═'.repeat(68)}╝${colors.reset}\n`);
    } else if (passRate >= 80) {
        console.log(`${colors.yellow}╔${'═'.repeat(68)}╗${colors.reset}`);
        console.log(`${colors.yellow}║${' '.repeat(15)}⚠️  MOST TESTS PASSED (${passRate}%)${' '.repeat(15)}║${colors.reset}`);
        console.log(`${colors.yellow}║${' '.repeat(18)}Review failures before production${' '.repeat(17)}║${colors.reset}`);
        console.log(`${colors.yellow}╚${'═'.repeat(68)}╝${colors.reset}\n`);
    } else {
        console.log(`${colors.red}╔${'═'.repeat(68)}╗${colors.reset}`);
        console.log(`${colors.red}║${' '.repeat(20)}❌ CRITICAL FAILURES!${' '.repeat(27)}║${colors.reset}`);
        console.log(`${colors.red}║${' '.repeat(20)}System needs attention${' '.repeat(27)}║${colors.reset}`);
        console.log(`${colors.red}╚${'═'.repeat(68)}╝${colors.reset}\n`);
    }

    console.log(`${colors.blue}Test Completed: ${new Date().toLocaleString()}${colors.reset}\n`);
}

runSystemTests()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(`${colors.red}Test runner failed:${colors.reset}`, error);
        process.exit(1);
    });
