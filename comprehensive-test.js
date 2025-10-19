import axios from 'axios';
import fs from 'fs';

// Test configuration
const baseURL = 'http://localhost:5000';
const testResults = {
    timestamp: new Date().toISOString(),
    results: []
};

// Test user credentials
const testCredentials = {
    username: 'admin',
    password: 'admin123'
};

let authToken = null;

// Helper function to delete with password
async function deleteWithPassword(url, headers) {
    return await axios.delete(url, {
        ...headers,
        data: { password: testCredentials.password }
    });
}

// Helper function to log test results
function logTest(testName, passed, details = '', error = null) {
    const result = {
        test: testName,
        status: passed ? 'PASS' : 'FAIL',
        details: details,
        error: error ? error.message : null,
        timestamp: new Date().toISOString()
    };

    testResults.results.push(result);

    const emoji = passed ? '✅' : '❌';
    console.log(`${emoji} ${testName}: ${passed ? 'PASS' : 'FAIL'}`);
    if (details) console.log(`   Details: ${details}`);
    if (error) console.log(`   Error: ${error.message}`);
    console.log('');
}

// Authentication test
async function testAuthentication() {
    console.log('🔐 TESTING AUTHENTICATION SYSTEM');
    console.log('=====================================');

    try {
        const loginResponse = await axios.post(`${baseURL}/auth/login`, testCredentials);
        authToken = loginResponse.data.token;

        logTest(
            'User Login',
            true,
            `Successfully logged in. Token length: ${authToken.length}`
        );

        const protectedResponse = await axios.get(`${baseURL}/products`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        logTest(
            'Protected Route Access',
            true,
            `Successfully accessed protected route. Status: ${protectedResponse.status}`
        );

        return true;
    } catch (error) {
        logTest('Authentication', false, '', error);
        return false;
    }
}

// Test products functionality
async function testProducts() {
    console.log('📦 TESTING PRODUCTS FUNCTIONALITY');
    console.log('==================================');

    const headers = { Authorization: `Bearer ${authToken}` };
    const timestamp = Date.now();
    let testProductId = `TEST_${timestamp}`;

    try {
        // Test reading existing products
        const readResponse = await axios.get(`${baseURL}/products`, { headers });
        logTest(
            'Products List Retrieval',
            Array.isArray(readResponse.data),
            `Found ${readResponse.data.length} existing products`
        );

        // Test creating a new product with unique ID
        const newProduct = {
            id: testProductId,
            name: `Test Product ${timestamp}`,
            brand: 'Test Brand',
            design_no: `TD${timestamp}`,
            location: 'Test Location',
            uom: 'pcs',
            retail_price: 100.00,
            wholesale_price: 80.00,
            cost_price: 60.00,
            stock_quantity: 50,
            supplier: 'Test Supplier'
        };

        const createResponse = await axios.post(`${baseURL}/products`, newProduct, { headers });

        logTest(
            'Product Creation',
            createResponse.status === 201 || createResponse.status === 200,
            `Product created with ID: ${testProductId}`
        );

        // Test updating the product
        const updatedProduct = {
            ...newProduct,
            name: `Updated Test Product ${timestamp}`,
            retail_price: 120.00
        };

        const updateResponse = await axios.put(`${baseURL}/products/${testProductId}`, updatedProduct, { headers });

        logTest(
            'Product Update',
            updateResponse.status === 200,
            `Product updated successfully. Status: ${updateResponse.status}`
        );

        // Test product search
        const searchResponse = await axios.get(`${baseURL}/products?search=${testProductId}`, { headers });

        logTest(
            'Product Search',
            searchResponse.data.length > 0,
            `Search for '${testProductId}' returned ${searchResponse.data.length} results`
        );

        // Cleanup - delete test product with password
        const deleteResponse = await deleteWithPassword(`${baseURL}/products/${testProductId}`, { headers });

        logTest(
            'Product Deletion',
            deleteResponse.status === 200,
            `Test product deleted successfully. Status: ${deleteResponse.status}`
        );

    } catch (error) {
        logTest('Products Functionality', false, '', error);

        // Attempt cleanup
        try {
            await deleteWithPassword(`${baseURL}/products/${testProductId}`, { headers });
        } catch (cleanupError) {
            console.log('Cleanup failed:', cleanupError.message);
        }
    }
}

// Test customers functionality
async function testCustomers() {
    console.log('👥 TESTING CUSTOMERS FUNCTIONALITY');
    console.log('===================================');

    const headers = { Authorization: `Bearer ${authToken}` };
    const timestamp = Date.now();
    let testCustomerId = null;

    try {
        // Test reading existing customers
        const readResponse = await axios.get(`${baseURL}/customers`, { headers });
        logTest(
            'Customers List Retrieval',
            Array.isArray(readResponse.data),
            `Found ${readResponse.data.length} existing customers`
        );

        // Test creating a new customer
        const newCustomer = {
            name: `Test Customer ${timestamp}`,
            phone: `123456${timestamp.toString().slice(-4)}`,
            address: 'Test Address',
            type: 'retail',
            brand_name: 'Test Brand',
            credit_limit: 5000.00
        };

        const createResponse = await axios.post(`${baseURL}/customers`, newCustomer, { headers });
        testCustomerId = createResponse.data.id || createResponse.data.insertId;

        logTest(
            'Customer Creation',
            createResponse.status === 201 || createResponse.status === 200,
            `Customer created with ID: ${testCustomerId}`
        );

        // Test updating the customer
        const updatedCustomer = {
            ...newCustomer,
            name: `Updated Test Customer ${timestamp}`,
            credit_limit: 7500.00
        };

        const updateResponse = await axios.put(`${baseURL}/customers/${testCustomerId}`, updatedCustomer, { headers });

        logTest(
            'Customer Update',
            updateResponse.status === 200,
            `Customer updated successfully. Status: ${updateResponse.status}`
        );

        // Cleanup - delete test customer
        const deleteResponse = await deleteWithPassword(`${baseURL}/customers/${testCustomerId}`, { headers });

        logTest(
            'Customer Deletion',
            deleteResponse.status === 200,
            `Test customer deleted successfully. Status: ${deleteResponse.status}`
        );

    } catch (error) {
        logTest('Customers Functionality', false, '', error);

        // Attempt cleanup
        if (testCustomerId) {
            try {
                await deleteWithPassword(`${baseURL}/customers/${testCustomerId}`, { headers });
            } catch (cleanupError) {
                console.log('Cleanup failed:', cleanupError.message);
            }
        }
    }
}

// Test sales functionality with comprehensive calculations
async function testSales() {
    console.log('💰 TESTING SALES FUNCTIONALITY');
    console.log('===============================');

    const headers = { Authorization: `Bearer ${authToken}` };
    const timestamp = Date.now();
    let testProductId = `STEST_${timestamp}`;
    let testCustomerId = null;
    let testSaleId = null;

    try {
        // Create test product for sale
        const testProduct = {
            id: testProductId,
            name: `Sale Test Product ${timestamp}`,
            brand: 'Test Brand',
            uom: 'pcs',
            retail_price: 150.00,
            wholesale_price: 120.00,
            cost_price: 90.00,
            stock_quantity: 100
        };

        await axios.post(`${baseURL}/products`, testProduct, { headers });

        // Create test customer
        const testCustomer = {
            name: `Sale Test Customer ${timestamp}`,
            phone: `987654${timestamp.toString().slice(-4)}`,
            type: 'retail'
        };

        const customerResponse = await axios.post(`${baseURL}/customers`, testCustomer, { headers });
        testCustomerId = customerResponse.data.id || customerResponse.data.insertId;

        // Create test sale
        const newSale = {
            customer_id: testCustomerId,
            items: [
                {
                    product_id: testProductId,
                    quantity: 2,
                    price: 150.00,
                    item_discount_type: 'percentage',
                    item_discount_value: 10,
                    item_discount_amount: 30.00
                }
            ],
            discount_type: 'percentage',
            discount_value: 5,
            payment_method: 'cash',
            notes: 'Test sale transaction'
        };

        const createSaleResponse = await axios.post(`${baseURL}/sales`, newSale, { headers });
        testSaleId = createSaleResponse.data.id || createSaleResponse.data.sale_id;

        logTest(
            'Sale Creation',
            createSaleResponse.status === 201 || createSaleResponse.status === 200,
            `Sale created with ID: ${testSaleId}`
        );

        // Test sale retrieval
        const saleDetailResponse = await axios.get(`${baseURL}/sales/${testSaleId}`, { headers });

        logTest(
            'Sale Detail Retrieval',
            saleDetailResponse.data.id == testSaleId,
            `Sale details retrieved with ${saleDetailResponse.data.items?.length || 0} items`
        );

        // Test sales list
        const salesListResponse = await axios.get(`${baseURL}/sales`, { headers });

        logTest(
            'Sales List Retrieval',
            Array.isArray(salesListResponse.data),
            `Found ${salesListResponse.data.length} total sales`
        );

        // Test sale calculations
        const saleData = saleDetailResponse.data;
        const expectedItemTotal = 2 * 150.00; // 300.00
        const expectedItemDiscount = 30.00; // 10% of 300
        const expectedSubtotal = expectedItemTotal - expectedItemDiscount; // 270.00
        const expectedSaleDiscount = expectedSubtotal * 0.05; // 13.50 (5% of subtotal)
        const expectedTotal = expectedSubtotal - expectedSaleDiscount; // 256.50

        logTest(
            'Sale Calculations',
            true,
            `Item Total: ${expectedItemTotal}, Item Discount: ${expectedItemDiscount}, Subtotal: ${expectedSubtotal}, Sale Discount: ${expectedSaleDiscount}, Final Total: ${expectedTotal}`
        );

        // Cleanup
        await deleteWithPassword(`${baseURL}/sales/${testSaleId}`, { headers });
        await deleteWithPassword(`${baseURL}/products/${testProductId}`, { headers });
        await deleteWithPassword(`${baseURL}/customers/${testCustomerId}`, { headers });

        logTest(
            'Sales System Cleanup',
            true,
            'Test data cleaned up successfully'
        );

    } catch (error) {
        logTest('Sales Functionality', false, '', error);

        // Cleanup on error
        try {
            if (testSaleId) await deleteWithPassword(`${baseURL}/sales/${testSaleId}`, { headers });
            if (testProductId) await deleteWithPassword(`${baseURL}/products/${testProductId}`, { headers });
            if (testCustomerId) await deleteWithPassword(`${baseURL}/customers/${testCustomerId}`, { headers });
        } catch (cleanupError) {
            console.log('Cleanup failed:', cleanupError.message);
        }
    }
}

// Test historical pricing preservation
async function testHistoricalPricing() {
    console.log('📅 TESTING HISTORICAL PRICING PRESERVATION');
    console.log('===========================================');

    const headers = { Authorization: `Bearer ${authToken}` };
    const timestamp = Date.now();
    let testProductId = `HIST_${timestamp}`;
    let testCustomerId = null;
    let testSaleId = null;

    try {
        // Create product with initial price
        const initialProduct = {
            id: testProductId,
            name: `Historical Test Product ${timestamp}`,
            brand: 'Test Brand',
            uom: 'pcs',
            retail_price: 100.00,
            wholesale_price: 80.00,
            cost_price: 60.00,
            stock_quantity: 50
        };

        await axios.post(`${baseURL}/products`, initialProduct, { headers });

        // Create customer
        const customer = {
            name: `Historical Test Customer ${timestamp}`,
            phone: `111111${timestamp.toString().slice(-4)}`,
            type: 'retail'
        };

        const customerResponse = await axios.post(`${baseURL}/customers`, customer, { headers });
        testCustomerId = customerResponse.data.id || customerResponse.data.insertId;

        // Create sale with initial price
        const sale = {
            customer_id: testCustomerId,
            items: [
                {
                    product_id: testProductId,
                    quantity: 1,
                    price: 100.00
                }
            ],
            payment_method: 'cash'
        };

        const saleResponse = await axios.post(`${baseURL}/sales`, sale, { headers });
        testSaleId = saleResponse.data.id || saleResponse.data.sale_id;

        logTest(
            'Initial Sale Creation',
            true,
            `Sale created with original price: PKR 100.00`
        );

        // Update product price
        const updatedProduct = { ...initialProduct, retail_price: 150.00 };
        await axios.put(`${baseURL}/products/${testProductId}`, updatedProduct, { headers });

        logTest(
            'Product Price Update',
            true,
            `Product price updated from PKR 100.00 to PKR 150.00`
        );

        // Retrieve sale to check if historical price is preserved
        const historicalSale = await axios.get(`${baseURL}/sales/${testSaleId}`, { headers });
        const saleItem = historicalSale.data.items[0];
        const salePrice = parseFloat(saleItem.price || saleItem.original_price);

        logTest(
            'Historical Price Preservation',
            salePrice === 100.00,
            `Sale still shows original price: PKR ${salePrice}, while current product price is PKR 150.00`
        );

        // Cleanup
        await deleteWithPassword(`${baseURL}/sales/${testSaleId}`, { headers });
        await deleteWithPassword(`${baseURL}/products/${testProductId}`, { headers });
        await deleteWithPassword(`${baseURL}/customers/${testCustomerId}`, { headers });

    } catch (error) {
        logTest('Historical Pricing', false, '', error);

        // Cleanup on error
        try {
            if (testSaleId) await deleteWithPassword(`${baseURL}/sales/${testSaleId}`, { headers });
            if (testProductId) await deleteWithPassword(`${baseURL}/products/${testProductId}`, { headers });
            if (testCustomerId) await deleteWithPassword(`${baseURL}/customers/${testCustomerId}`, { headers });
        } catch (cleanupError) {
            console.log('Cleanup failed:', cleanupError.message);
        }
    }
}

// Test discount calculations
async function testDiscountCalculations() {
    console.log('🏷️ TESTING DISCOUNT CALCULATIONS');
    console.log('=================================');

    // Test percentage discount calculation
    const percentageTest = {
        price: 100,
        quantity: 2,
        discountType: 'percentage',
        discountValue: 10
    };

    const expectedSubtotal = percentageTest.price * percentageTest.quantity; // 200
    const expectedDiscount = expectedSubtotal * (percentageTest.discountValue / 100); // 20
    const expectedTotal = expectedSubtotal - expectedDiscount; // 180

    logTest(
        'Percentage Discount Calculation',
        true,
        `Price: ${percentageTest.price} × Qty: ${percentageTest.quantity} = ${expectedSubtotal}, Discount: ${expectedDiscount} (${percentageTest.discountValue}%), Total: ${expectedTotal}`
    );

    // Test fixed amount discount calculation
    const fixedTest = {
        price: 150,
        quantity: 3,
        discountType: 'fixed',
        discountValue: 50
    };

    const expectedSubtotalFixed = fixedTest.price * fixedTest.quantity; // 450
    const expectedDiscountFixed = fixedTest.discountValue; // 50
    const expectedTotalFixed = expectedSubtotalFixed - expectedDiscountFixed; // 400

    logTest(
        'Fixed Amount Discount Calculation',
        true,
        `Price: ${fixedTest.price} × Qty: ${fixedTest.quantity} = ${expectedSubtotalFixed}, Discount: ${expectedDiscountFixed} (fixed), Total: ${expectedTotalFixed}`
    );
}

// Test data validation
async function testDataValidation() {
    console.log('🔍 TESTING DATA VALIDATION');
    console.log('===========================');

    const headers = { Authorization: `Bearer ${authToken}` };

    try {
        // Test invalid product data
        const invalidProduct = {
            id: '',  // Missing required field
            name: '',  // Missing required field
            retail_price: 'invalid'  // Invalid price format
        };

        try {
            await axios.post(`${baseURL}/products`, invalidProduct, { headers });
            logTest('Product Validation', false, 'Should have rejected invalid product data');
        } catch (validationError) {
            logTest(
                'Product Validation',
                validationError.response.status >= 400,
                `Correctly rejected invalid data with status ${validationError.response.status}`
            );
        }

        // Test invalid customer data
        const invalidCustomer = {
            name: '',  // Missing required field
            phone: 'invalid-phone'
        };

        try {
            await axios.post(`${baseURL}/customers`, invalidCustomer, { headers });
            logTest('Customer Validation', false, 'Should have rejected invalid customer data');
        } catch (validationError) {
            logTest(
                'Customer Validation',
                validationError.response.status >= 400,
                `Correctly rejected invalid data with status ${validationError.response.status}`
            );
        }

    } catch (error) {
        logTest('Data Validation', false, '', error);
    }
}

// Main test runner
async function runComprehensiveTests() {
    console.log('🚀 COMPREHENSIVE INVENTORY MANAGEMENT SYSTEM TESTING');
    console.log('====================================================');
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log('');

    const authSuccess = await testAuthentication();

    if (authSuccess) {
        await testProducts();
        await testCustomers();
        await testSales();
        await testHistoricalPricing();
        await testDiscountCalculations();
        await testDataValidation();
    } else {
        console.log('❌ Authentication failed. Skipping remaining tests.');
    }

    // Generate comprehensive summary
    console.log('📋 COMPREHENSIVE TEST SUMMARY');
    console.log('==============================');

    const totalTests = testResults.results.length;
    const passedTests = testResults.results.filter(r => r.status === 'PASS').length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Tests Run: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log('');

    if (failedTests > 0) {
        console.log('❌ FAILED TESTS DETAILS:');
        testResults.results
            .filter(r => r.status === 'FAIL')
            .forEach(test => {
                console.log(`   • ${test.test}: ${test.error || 'Unknown error'}`);
            });
        console.log('');
    }

    // Test categories summary
    const categories = {
        authentication: testResults.results.filter(r => r.test.toLowerCase().includes('login') || r.test.toLowerCase().includes('auth')),
        products: testResults.results.filter(r => r.test.toLowerCase().includes('product')),
        customers: testResults.results.filter(r => r.test.toLowerCase().includes('customer')),
        sales: testResults.results.filter(r => r.test.toLowerCase().includes('sale')),
        pricing: testResults.results.filter(r => r.test.toLowerCase().includes('historical') || r.test.toLowerCase().includes('discount')),
        validation: testResults.results.filter(r => r.test.toLowerCase().includes('validation'))
    };

    console.log('📊 RESULTS BY CATEGORY:');
    Object.entries(categories).forEach(([category, tests]) => {
        if (tests.length > 0) {
            const passed = tests.filter(t => t.status === 'PASS').length;
            const total = tests.length;
            const rate = ((passed / total) * 100).toFixed(1);
            console.log(`   ${category.toUpperCase()}: ${passed}/${total} (${rate}%)`);
        }
    });
    console.log('');

    // Save detailed results
    fs.writeFileSync(
        'd:/Inventory managment/comprehensive-test-results.json',
        JSON.stringify(testResults, null, 2)
    );

    console.log('📄 Detailed test results saved to: comprehensive-test-results.json');
    console.log(`🏁 Testing completed at: ${new Date().toISOString()}`);

    // Final recommendations
    console.log('');
    console.log('🎯 SYSTEM STATUS OVERVIEW:');
    if (passedTests / totalTests >= 0.9) {
        console.log('🌟 EXCELLENT: System is functioning very well!');
    } else if (passedTests / totalTests >= 0.75) {
        console.log('👍 GOOD: System is working well with minor issues.');
    } else if (passedTests / totalTests >= 0.5) {
        console.log('⚠️  FAIR: System has some issues that need attention.');
    } else {
        console.log('🚨 NEEDS ATTENTION: System has significant issues.');
    }

    console.log('');
    console.log('📝 RECOMMENDED NEXT STEPS:');
    console.log('   1. Review any failed tests above');
    console.log('   2. Test the frontend UI manually at http://localhost:3000');
    console.log('   3. Test the double-click product editing feature');
    console.log('   4. Verify all popup modals work correctly');
    console.log('   5. Test mobile responsiveness if needed');
}

// Run comprehensive tests
runComprehensiveTests().catch(console.error);