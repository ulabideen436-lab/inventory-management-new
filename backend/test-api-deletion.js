import axios from 'axios';

// Test configuration
const baseURL = 'http://localhost:5000';
const testCredentials = {
    username: 'admin',
    password: 'admin123'
};

async function testAPIDeletion() {
    try {
        console.log('🔍 TESTING API DELETION ISSUES');
        console.log('===============================');

        // Login first
        const loginResponse = await axios.post(`${baseURL}/auth/login`, testCredentials);
        const authToken = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${authToken}` };

        console.log('✅ Authentication successful');

        // Create a test product via API
        const timestamp = Date.now();
        const testProduct = {
            id: `API_TEST_${timestamp}`,
            name: `API Test Product ${timestamp}`,
            uom: 'pcs',
            retail_price: 100.00,
            wholesale_price: 80.00,
            cost_price: 60.00,
            stock_quantity: 10
        };

        console.log(`\n📦 Creating test product via API: ${testProduct.id}`);
        try {
            const createResponse = await axios.post(`${baseURL}/products`, testProduct, { headers });
            console.log(`✅ Product created successfully. Status: ${createResponse.status}`);
        } catch (createError) {
            console.log(`❌ Product creation failed: ${createError.response?.status} - ${createError.response?.data?.message || createError.message}`);
            return;
        }

        // Try to delete the product via API
        console.log(`\n🗑️ Attempting to delete product via API: ${testProduct.id}`);
        try {
            const deleteResponse = await axios.delete(`${baseURL}/products/${testProduct.id}`, { headers });
            console.log(`✅ Product deletion successful. Status: ${deleteResponse.status}`);
            console.log(`   Response: ${deleteResponse.data.message}`);
        } catch (deleteError) {
            console.log(`❌ Product deletion failed: ${deleteError.response?.status} - ${deleteError.response?.data?.message || deleteError.message}`);
            console.log('   Full error response:', deleteError.response?.data);

            // If deletion failed, check if product still exists
            try {
                const checkResponse = await axios.get(`${baseURL}/products`, { headers });
                const productExists = checkResponse.data.find(p => p.id === testProduct.id);
                console.log(`   Product still exists in database: ${productExists ? 'YES' : 'NO'}`);
            } catch (checkError) {
                console.log('   Could not verify product existence');
            }
        }

        // Test customer deletion
        console.log(`\n👥 Testing customer deletion via API`);
        const testCustomer = {
            name: `API Test Customer ${timestamp}`,
            phone: `123${timestamp.toString().slice(-7)}`,
            type: 'retail'
        };

        try {
            const createCustomerResponse = await axios.post(`${baseURL}/customers`, testCustomer, { headers });
            const customerId = createCustomerResponse.data.id || createCustomerResponse.data.insertId;
            console.log(`✅ Customer created with ID: ${customerId}`);

            // Try to delete customer
            try {
                const deleteCustomerResponse = await axios.delete(`${baseURL}/customers/${customerId}`, { headers });
                console.log(`✅ Customer deletion successful. Status: ${deleteCustomerResponse.status}`);
            } catch (deleteCustomerError) {
                console.log(`❌ Customer deletion failed: ${deleteCustomerError.response?.status} - ${deleteCustomerError.response?.data?.message || deleteCustomerError.message}`);
                console.log('   Full customer delete error:', deleteCustomerError.response?.data);
            }

        } catch (customerError) {
            console.log(`❌ Customer creation failed: ${customerError.response?.status} - ${customerError.response?.data?.message || customerError.message}`);
        }

    } catch (error) {
        console.error('❌ API deletion test failed:', error.message);
    }
}

testAPIDeletion();