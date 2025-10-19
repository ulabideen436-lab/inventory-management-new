// Test script to verify customer API endpoints are working
const axios = require('axios');

const TEST_BASE_URL = 'http://localhost:5000';
const TEST_TOKEN = 'YOUR_TOKEN_HERE'; // Replace with actual token

async function testCustomerOperations() {
    console.log('🧪 Testing Customer API Operations...\n');

    try {
        // Test 1: Fetch customers
        console.log('1. Testing customer fetch...');
        const fetchResponse = await axios.get(`${TEST_BASE_URL}/customers`, {
            headers: { Authorization: `Bearer ${TEST_TOKEN}` }
        });
        console.log('✅ Customer fetch successful:', fetchResponse.data.length, 'customers found');

        if (fetchResponse.data.length > 0) {
            const testCustomer = fetchResponse.data[0];
            console.log('📝 Test customer:', testCustomer.name, '(ID:', testCustomer.id + ')');

            // Test 2: Update customer
            console.log('\n2. Testing customer update...');
            const updateData = {
                ...testCustomer,
                name: testCustomer.name + ' (Updated)',
                opening_balance_type: 'Dr' // Test the balance type mapping
            };

            const updateResponse = await axios.put(`${TEST_BASE_URL}/customers/${testCustomer.id}`, updateData, {
                headers: { Authorization: `Bearer ${TEST_TOKEN}` }
            });
            console.log('✅ Customer update successful:', updateResponse.data.message);

            // Test 3: Revert the name change
            console.log('\n3. Reverting name change...');
            await axios.put(`${TEST_BASE_URL}/customers/${testCustomer.id}`, testCustomer, {
                headers: { Authorization: `Bearer ${TEST_TOKEN}` }
            });
            console.log('✅ Customer reverted successfully');

            // Test 4: Fetch customer ledger
            console.log('\n4. Testing customer ledger fetch...');
            const ledgerResponse = await axios.get(`${TEST_BASE_URL}/customers/${testCustomer.id}/ledger`, {
                headers: { Authorization: `Bearer ${TEST_TOKEN}` }
            });
            console.log('✅ Customer ledger fetch successful:', ledgerResponse.data.length, 'ledger entries');

            // Test 5: Fetch customer history
            console.log('\n5. Testing customer history fetch...');
            const historyResponse = await axios.get(`${TEST_BASE_URL}/customers/${testCustomer.id}/history`, {
                headers: { Authorization: `Bearer ${TEST_TOKEN}` }
            });
            console.log('✅ Customer history fetch successful:', historyResponse.data.length, 'history entries');
        }

        console.log('\n🎉 All customer operations tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
        if (error.response?.status) {
            console.error('HTTP Status:', error.response.status);
        }
    }
}

// Instructions for running the test
console.log('📋 Instructions:');
console.log('1. Make sure the backend server is running on http://localhost:5000');
console.log('2. Replace TEST_TOKEN with a valid JWT token');
console.log('3. Run: node test-customer-api-endpoints.js\n');

// Only run if token is provided
if (TEST_TOKEN !== 'YOUR_TOKEN_HERE') {
    testCustomerOperations();
} else {
    console.log('⚠️  Please set TEST_TOKEN before running the test');
}