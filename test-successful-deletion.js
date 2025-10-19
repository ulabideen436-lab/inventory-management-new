const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const OWNER_PASSWORD = 'owner123';
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

async function testSuccessfulDeletion() {
    console.log('🧪 Testing Successful Deletion with Correct Password\n');
    console.log('='.repeat(60));

    // Login first
    const loginSuccess = await login();
    if (!loginSuccess) return;

    try {
        // Create a test supplier specifically for deletion
        const supplierResponse = await axios.post(`${BASE_URL}/suppliers`, {
            name: 'Test Delete Supplier',
            contact_info: 'delete@test.com',
            opening_balance: 0,
            opening_balance_type: 'debit'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const supplierId = supplierResponse.data.id;
        console.log(`✅ Created test supplier with ID: ${supplierId}`);

        // Test successful deletion with correct password
        console.log('\n📝 Testing deletion with correct password...');
        const deleteResponse = await axios.delete(`${BASE_URL}/suppliers/${supplierId}`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { password: OWNER_PASSWORD }
        });

        console.log('✅ Successfully deleted supplier with correct password');
        console.log('📋 Response:', deleteResponse.data);

    } catch (error) {
        console.error('❌ Error during successful deletion test:', error.response?.data || error.message);
    }

    try {
        // Create a test product specifically for deletion
        const productResponse = await axios.post(`${BASE_URL}/products`, {
            id: 'zy-delete-test',
            name: 'Test Delete Product',
            uom: 'pcs',
            retail_price: 15.00,
            cost_price: 8.00
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log(`✅ Created test product with ID: zy-delete-test`);

        // Test successful deletion with correct password
        console.log('\n📝 Testing product deletion with correct password...');
        const deleteResponse = await axios.delete(`${BASE_URL}/products/zy-delete-test`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { password: OWNER_PASSWORD }
        });

        console.log('✅ Successfully deleted product with correct password');
        console.log('📋 Response:', deleteResponse.data);

    } catch (error) {
        console.error('❌ Error during product deletion test:', error.response?.data || error.message);
    } console.log('\n' + '='.repeat(60));
    console.log('🎯 Successful Deletion Tests Complete!');
}

// Test edge cases
async function testEdgeCases() {
    console.log('\n🔍 Testing Edge Cases\n');
    console.log('='.repeat(50));

    // Test with empty password
    console.log('📝 Test: Empty password string');
    try {
        await axios.delete(`${BASE_URL}/suppliers/999`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { password: '' }
        });
        console.log('❌ Should have failed with empty password');
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('✅ Correctly rejected empty password');
        } else {
            console.log('❌ Wrong error for empty password:', error.response?.data);
        }
    }

    // Test with null password
    console.log('\n📝 Test: Null password');
    try {
        await axios.delete(`${BASE_URL}/suppliers/999`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { password: null }
        });
        console.log('❌ Should have failed with null password');
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('✅ Correctly rejected null password');
        } else {
            console.log('❌ Wrong error for null password:', error.response?.data);
        }
    }

    // Test unauthorized access (no token)
    console.log('\n📝 Test: No authorization token');
    try {
        await axios.delete(`${BASE_URL}/suppliers/999`, {
            data: { password: OWNER_PASSWORD }
        });
        console.log('❌ Should have failed without auth token');
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Correctly rejected request without auth token');
        } else {
            console.log('❌ Wrong error for missing auth:', error.response?.data);
        }
    }

    // Test deleting non-existent entity with correct password
    console.log('\n📝 Test: Delete non-existent entity with correct password');
    try {
        await axios.delete(`${BASE_URL}/suppliers/99999`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { password: OWNER_PASSWORD }
        });
        console.log('❌ Should have failed for non-existent entity');
    } catch (error) {
        if (error.response?.status === 404) {
            console.log('✅ Correctly returned 404 for non-existent entity');
        } else {
            console.log('❌ Wrong error for non-existent entity:', error.response?.data);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎯 Edge Case Tests Complete!');
}

async function runComprehensiveTests() {
    await testSuccessfulDeletion();
    await testEdgeCases();
}

runComprehensiveTests().catch(console.error);