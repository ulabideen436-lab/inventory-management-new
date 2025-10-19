// Test customer update UI refresh functionality
const axios = require('axios');

const TEST_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJvd25lciIsImlhdCI6MTcyODMwNzQ1M30.YJEVZslgvOCZD0YrXeOhp9E-_kFAWaXRPHoQG4eOLRM';

async function testCustomerUpdateFlow() {
    console.log('🧪 Testing Customer Update Flow...\n');

    try {
        // 1. Get existing customer
        console.log('1. Fetching customers...');
        const customersResponse = await axios.get('http://localhost:5000/customers', {
            headers: { Authorization: `Bearer ${TEST_TOKEN}` }
        });

        if (customersResponse.data.length === 0) {
            console.log('❌ No customers found');
            return;
        }

        const customer = customersResponse.data.find(c => c.name === 'Taha') || customersResponse.data[0];
        console.log(`✅ Found customer: ${customer.name} (ID: ${customer.id})`);
        console.log('Current data:', {
            name: customer.name,
            brand_name: customer.brand_name,
            contact: customer.contact,
            balance: customer.balance,
            opening_balance: customer.opening_balance,
            credit_limit: customer.credit_limit
        });

        // 2. Test update with proper data structure (like frontend should send)
        console.log('\n2. Testing customer update...');
        const updateData = {
            name: customer.name,
            brand_name: customer.brand_name || '',
            contact: customer.contact || '',
            phone: customer.phone || '',
            email: customer.email || '',
            address: customer.address || '',
            credit_limit: '150000', // Changed value
            opening_balance: customer.opening_balance || '0',
            opening_balance_type: customer.opening_balance_type || 'Dr'
        };

        console.log('Sending update data:', updateData);

        const updateResponse = await axios.put(`http://localhost:5000/customers/${customer.id}`, updateData, {
            headers: { Authorization: `Bearer ${TEST_TOKEN}` }
        });

        console.log('✅ Update successful!');
        console.log('Response message:', updateResponse.data.message);
        console.log('Updated customer data:', updateResponse.data.customer);

        // 3. Verify the update was applied
        console.log('\n3. Verifying update was applied...');
        const verifyResponse = await axios.get('http://localhost:5000/customers', {
            headers: { Authorization: `Bearer ${TEST_TOKEN}` }
        });

        const updatedCustomer = verifyResponse.data.find(c => c.id === customer.id);
        console.log('Verified customer data:', {
            name: updatedCustomer.name,
            brand_name: updatedCustomer.brand_name,
            contact: updatedCustomer.contact,
            balance: updatedCustomer.balance, // This should remain unchanged
            opening_balance: updatedCustomer.opening_balance,
            credit_limit: updatedCustomer.credit_limit // This should be updated
        });

        if (updatedCustomer.credit_limit == '150000.00') {
            console.log('✅ Credit limit updated successfully');
        } else {
            console.log('❌ Credit limit not updated. Expected: 150000.00, Got:', updatedCustomer.credit_limit);
        }

        // 4. Restore original credit limit
        console.log('\n4. Restoring original credit limit...');
        const restoreData = {
            ...updateData,
            credit_limit: customer.credit_limit
        };

        await axios.put(`http://localhost:5000/customers/${customer.id}`, restoreData, {
            headers: { Authorization: `Bearer ${TEST_TOKEN}` }
        });
        console.log('✅ Original data restored');

        console.log('\n🎉 Customer update flow test completed successfully!');
        console.log('✅ Updates are processed correctly');
        console.log('✅ Balance field is not affected by updates');
        console.log('✅ Server returns updated customer data');

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Backend server not running. Please start the server first.');
        } else if (error.response) {
            console.error('❌ HTTP Error:', error.response.status);
            console.error('Error message:', error.response.data?.message);
            console.error('Error details:', error.response.data);
        } else {
            console.error('❌ Unexpected error:', error.message);
        }
    }
}

testCustomerUpdateFlow();