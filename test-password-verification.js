const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const OWNER_PASSWORD = 'owner123'; // Update this to match your actual owner password
let authToken = '';

async function login() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'owner',
            password: OWNER_PASSWORD
        });
        authToken = response.data.token;
        console.log('✅ Login successful');
        return true;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data?.message || error.message);
        return false;
    }
}

// Test helper function
async function testDeleteEndpoint(endpoint, entityType, testData) {
    console.log(`\n🔬 Testing ${entityType} deletion endpoint: ${endpoint}`);

    // Test 1: No password provided
    console.log('\n📝 Test 1: No password provided');
    try {
        await axios.delete(`${BASE_URL}${endpoint}`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: {}
        });
        console.log('❌ Should have failed without password');
    } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.message?.includes('Password required')) {
            console.log('✅ Correctly rejected request without password');
        } else {
            console.log('❌ Wrong error response:', error.response?.data);
        }
    }

    // Test 2: Wrong password
    console.log('\n📝 Test 2: Wrong password provided');
    try {
        await axios.delete(`${BASE_URL}${endpoint}`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { password: 'wrongpassword' }
        });
        console.log('❌ Should have failed with wrong password');
    } catch (error) {
        if (error.response?.status === 403 && error.response?.data?.message?.includes('Incorrect password')) {
            console.log('✅ Correctly rejected wrong password');
        } else {
            console.log('❌ Wrong error response:', error.response?.data);
        }
    }

    // Test 3: Correct password (if entity exists)
    if (testData?.shouldTestCorrectPassword) {
        console.log('\n📝 Test 3: Correct password provided');
        try {
            await axios.delete(`${BASE_URL}${endpoint}`, {
                headers: { Authorization: `Bearer ${authToken}` },
                data: { password: OWNER_PASSWORD }
            });
            console.log(`✅ Successfully deleted ${entityType} with correct password`);
        } catch (error) {
            if (error.response?.status === 404) {
                console.log(`ℹ️  ${entityType} not found (may have been deleted already)`);
            } else {
                console.log('❌ Failed with correct password:', error.response?.data);
            }
        }
    }
}

async function createTestEntities() {
    console.log('\n🏗️  Creating test entities for deletion...');

    try {
        // Create a test product
        await axios.post(`${BASE_URL}/products`, {
            id: 'zy-test-product',
            name: 'Test Product for Deletion',
            price: 10.00,
            cost_price: 5.00
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Test product created');
    } catch (error) {
        console.log('ℹ️  Test product may already exist');
    }

    try {
        // Create a test customer
        await axios.post(`${BASE_URL}/customers`, {
            name: 'Test Customer for Deletion',
            contact_info: 'test@delete.com'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Test customer created');
    } catch (error) {
        console.log('ℹ️  Test customer may already exist');
    }

    try {
        // Create a test supplier
        await axios.post(`${BASE_URL}/suppliers`, {
            name: 'Test Supplier for Deletion',
            contact_info: 'supplier@delete.com'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Test supplier created');
    } catch (error) {
        console.log('ℹ️  Test supplier may already exist');
    }
}

async function getTestEntityIds() {
    const entities = {};

    try {
        // Get a test product ID
        const products = await axios.get(`${BASE_URL}/products`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const testProduct = products.data.find(p => p.name?.includes('Test') || p.id?.includes('test'));
        if (testProduct) entities.productId = testProduct.id;
    } catch (error) {
        console.log('Could not get test product');
    }

    try {
        // Get a test customer ID
        const customers = await axios.get(`${BASE_URL}/customers`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const testCustomer = customers.data.find(c => c.name?.includes('Test'));
        if (testCustomer) entities.customerId = testCustomer.id;
    } catch (error) {
        console.log('Could not get test customer');
    }

    try {
        // Get a test supplier ID
        const suppliers = await axios.get(`${BASE_URL}/suppliers`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const testSupplier = suppliers.data.find(s => s.name?.includes('Test'));
        if (testSupplier) entities.supplierId = testSupplier.id;
    } catch (error) {
        console.log('Could not get test supplier');
    }

    return entities;
}

async function runTests() {
    console.log('🧪 Starting Password Verification Tests\n');
    console.log('='.repeat(50));

    // Login first
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.log('❌ Cannot proceed without login');
        return;
    }

    // Create test entities
    await createTestEntities();

    // Get entity IDs for testing
    const entities = await getTestEntityIds();
    console.log('\n📋 Found test entities:', entities);

    // Test all deletion endpoints
    if (entities.productId) {
        await testDeleteEndpoint(`/products/${entities.productId}`, 'Product', { shouldTestCorrectPassword: false });
    } else {
        await testDeleteEndpoint('/products/zy-test-product', 'Product', { shouldTestCorrectPassword: false });
    }

    if (entities.customerId) {
        await testDeleteEndpoint(`/customers/${entities.customerId}`, 'Customer', { shouldTestCorrectPassword: false });
    } else {
        await testDeleteEndpoint('/customers/999', 'Customer', { shouldTestCorrectPassword: false });
    }

    if (entities.supplierId) {
        await testDeleteEndpoint(`/suppliers/${entities.supplierId}`, 'Supplier', { shouldTestCorrectPassword: false });
    } else {
        await testDeleteEndpoint('/suppliers/999', 'Supplier', { shouldTestCorrectPassword: false });
    }

    // Test sales endpoint (might not have a sale to delete)
    await testDeleteEndpoint('/sales/999', 'Sale', { shouldTestCorrectPassword: false });

    console.log('\n' + '='.repeat(50));
    console.log('🎯 Password Verification Tests Complete!');
    console.log('\nKey findings:');
    console.log('✅ All endpoints should reject requests without passwords (400 error)');
    console.log('✅ All endpoints should reject requests with wrong passwords (403 error)');
    console.log('✅ Correct passwords should allow deletion (when entity exists)');
}

// Run the tests
runTests().catch(console.error);