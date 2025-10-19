// Comprehensive test for the customer update empty field fix
const axios = require('axios');

// Use the same token from the test files
const TEST_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJvd25lciIsImlhdCI6MTcyODMwNzQ1M30.YJEVZslgvOCZD0YrXeOhp9E-_kFAWaXRPHoQG4eOLRM';

async function testCustomerUpdateEmptyFields() {
    console.log('🧪 Testing Customer Update with Empty Decimal Fields...\n');

    try {
        // First, let's get an existing customer to update
        console.log('1. Fetching existing customers...');
        const customersResponse = await axios.get('http://localhost:5000/customers', {
            headers: { Authorization: `Bearer ${TEST_TOKEN}` }
        });

        if (customersResponse.data.length === 0) {
            console.log('❌ No customers found. Please create a customer first.');
            return;
        }

        const testCustomer = customersResponse.data[0];
        console.log(`✅ Found customer: ${testCustomer.name} (ID: ${testCustomer.id})`);

        // Test the problematic scenario: Update with empty credit_limit
        console.log('\n2. Testing update with empty credit_limit...');
        const updateData = {
            name: testCustomer.name,
            brand_name: testCustomer.brand_name || '',
            contact: testCustomer.contact || '',
            phone: testCustomer.phone || '',
            email: testCustomer.email || '',
            address: testCustomer.address || '',
            credit_limit: '', // This was causing the error
            opening_balance: testCustomer.opening_balance || '0',
            opening_balance_type: testCustomer.opening_balance_type || 'Dr'
        };

        console.log('Update data:', JSON.stringify(updateData, null, 2));

        const updateResponse = await axios.put(`http://localhost:5000/customers/${testCustomer.id}`, updateData, {
            headers: { Authorization: `Bearer ${TEST_TOKEN}` }
        });

        console.log('✅ Update successful!');
        console.log('Response:', updateResponse.data.message);

        // Test with empty opening_balance too
        console.log('\n3. Testing update with empty opening_balance...');
        const updateData2 = {
            ...updateData,
            opening_balance: '' // This should also work now
        };

        const updateResponse2 = await axios.put(`http://localhost:5000/customers/${testCustomer.id}`, updateData2, {
            headers: { Authorization: `Bearer ${TEST_TOKEN}` }
        });

        console.log('✅ Update with empty opening_balance successful!');
        console.log('Response:', updateResponse2.data.message);

        // Restore original values
        console.log('\n4. Restoring original customer data...');
        const restoreData = {
            name: testCustomer.name,
            brand_name: testCustomer.brand_name,
            contact: testCustomer.contact,
            phone: testCustomer.phone,
            email: testCustomer.email,
            address: testCustomer.address,
            credit_limit: testCustomer.credit_limit,
            opening_balance: testCustomer.opening_balance,
            opening_balance_type: testCustomer.opening_balance_type
        };

        await axios.put(`http://localhost:5000/customers/${testCustomer.id}`, restoreData, {
            headers: { Authorization: `Bearer ${TEST_TOKEN}` }
        });

        console.log('✅ Original data restored');

        console.log('\n🎉 All tests passed! The empty decimal field fix is working correctly.');
        console.log('✅ Empty credit_limit and opening_balance are now properly handled');

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Backend server not running. Please start the server first.');
            console.log('Run: cd backend && npm start');
        } else if (error.response) {
            console.error('❌ HTTP Error:', error.response.status);
            console.error('Error message:', error.response.data?.message);
            if (error.response.data?.error) {
                console.error('Backend error:', error.response.data.error);
            }
        } else {
            console.error('❌ Unexpected error:', error.message);
        }
    }
}

console.log('📋 This test verifies that updating customers with empty credit_limit');
console.log('    and opening_balance fields no longer causes database errors.\n');

testCustomerUpdateEmptyFields();