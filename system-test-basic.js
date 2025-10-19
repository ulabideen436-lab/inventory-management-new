import axios from 'axios';
import fs from 'fs';

// Test configuration
const baseURL = 'http://localhost:5000';
const testResults = {
    timestamp: new Date().toISOString(),
    results: []
};

// Test user credentials (assuming you have a test user)
const testCredentials = {
    username: 'admin', // Change this to your test username
    password: 'admin123' // Change this to your test password
};

let authToken = null;

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
        // Test login
        const loginResponse = await axios.post(`${baseURL}/auth/login`, testCredentials);
        authToken = loginResponse.data.token;

        logTest(
            'User Login',
            true,
            `Successfully logged in. Token length: ${authToken.length}`
        );

        // Test protected route with token
        const protectedResponse = await axios.get(`${baseURL}/products`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        logTest(
            'Protected Route Access',
            true,
            `Successfully accessed protected route. Status: ${protectedResponse.status}`
        );

    } catch (error) {
        logTest('Authentication', false, '', error);
        return false;
    }

    return true;
}

// Products CRUD testing
async function testProductsCRUD() {
    console.log('📦 TESTING PRODUCTS CRUD OPERATIONS');
    console.log('====================================');

    const headers = { Authorization: `Bearer ${authToken}` };
    let testProductId = null;

    try {
        // Test CREATE product
        const newProduct = {
            id: 'TEST001',
            name: 'Test Product',
            brand: 'Test Brand',
            design_no: 'TD001',
            location: 'Test Location',
            uom: 'pcs',
            retail_price: 100.00,
            wholesale_price: 80.00,
            cost_price: 60.00,
            stock_quantity: 50,
            supplier: 'Test Supplier'
        };

        const createResponse = await axios.post(`${baseURL}/products`, newProduct, { headers });
        testProductId = newProduct.id;

        logTest(
            'Product Creation',
            true,
            `Product created with ID: ${testProductId}`
        );

        // Test READ products
        const readResponse = await axios.get(`${baseURL}/products`, { headers });
        const foundProduct = readResponse.data.find(p => p.id === testProductId);

        logTest(
            'Product Reading',
            !!foundProduct,
            `Found ${readResponse.data.length} products, test product ${foundProduct ? 'found' : 'not found'}`
        );

        // Test UPDATE product
        const updatedProduct = { ...newProduct, name: 'Updated Test Product', retail_price: 120.00 };
        const updateResponse = await axios.put(`${baseURL}/products/${testProductId}`, updatedProduct, { headers });

        logTest(
            'Product Update',
            true,
            `Product updated successfully`
        );

        // Test product search functionality
        const searchResponse = await axios.get(`${baseURL}/products?search=Test`, { headers });

        logTest(
            'Product Search',
            searchResponse.data.length > 0,
            `Search returned ${searchResponse.data.length} results`
        );

        // Test DELETE product (cleanup)
        const deleteResponse = await axios.delete(`${baseURL}/products/${testProductId}`, { headers });

        logTest(
            'Product Deletion',
            true,
            `Test product deleted successfully`
        );

    } catch (error) {
        logTest('Products CRUD', false, '', error);

        // Cleanup on error
        if (testProductId) {
            try {
                await axios.delete(`${baseURL}/products/${testProductId}`, { headers });
            } catch (cleanupError) {
                console.log('Cleanup failed:', cleanupError.message);
            }
        }
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 COMPREHENSIVE INVENTORY MANAGEMENT SYSTEM TESTING');
    console.log('====================================================');
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log('');

    const authSuccess = await testAuthentication();

    if (authSuccess) {
        await testProductsCRUD();
    } else {
        console.log('❌ Authentication failed. Skipping remaining tests.');
    }

    // Generate summary
    console.log('📋 TEST SUMMARY');
    console.log('================');

    const totalTests = testResults.results.length;
    const passedTests = testResults.results.filter(r => r.status === 'PASS').length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ✅ ${passedTests}`);
    console.log(`Failed: ❌ ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log('');

    // Save detailed results to file
    fs.writeFileSync(
        'd:/Inventory managment/test-results-basic.json',
        JSON.stringify(testResults, null, 2)
    );

    console.log('📄 Test results saved to: test-results-basic.json');
    console.log(`Completed at: ${new Date().toISOString()}`);
}

// Run all tests
runAllTests().catch(console.error);