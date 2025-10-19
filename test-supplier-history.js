const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5000';

async function testSupplierHistory() {
    try {
        console.log('🧪 Testing Supplier History Endpoint...');

        // First, login to get auth token
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'owner',
            password: 'password'
        }); const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Get all suppliers to find one to test with
        const suppliersResponse = await axios.get(`${BASE_URL}/suppliers`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (suppliersResponse.data.length === 0) {
            console.log('❌ No suppliers found to test with');
            return;
        }

        const testSupplierId = suppliersResponse.data[0].id;
        console.log(`📋 Testing with supplier ID: ${testSupplierId}`);

        // Test supplier history endpoint
        const historyResponse = await axios.get(`${BASE_URL}/suppliers/${testSupplierId}/history`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Supplier history retrieved successfully');
        console.log('📊 History data:', JSON.stringify(historyResponse.data, null, 2));

    } catch (error) {
        console.log('❌ Supplier history test failed:');
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Data:', error.response.data);
        } else {
            console.log('   Error:', error.message);
        }
    }
}

testSupplierHistory();