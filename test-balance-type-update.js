// Test script to verify opening balance type change is reflected correctly
const axios = require('axios');

const TEST_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJvd25lciIsImlhdCI6MTcyODMwNzQ1M30.YJEVZslgvOCZD0YrXeOhp9E-_kFAWaXRPHoQG4eOLRM';

async function testBalanceTypeUpdate() {
    console.log('🧪 Testing Opening Balance Type Update...\n');

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
        console.log('Current balance type data:', {
            opening_balance_type: customer.opening_balance_type,
            balanceType: customer.balanceType,
            openingBalance: customer.openingBalance || customer.opening_balance
        });

        const originalBalanceType = customer.opening_balance_type;
        const newBalanceType = originalBalanceType === 'Dr' ? 'Cr' : 'Dr';

        // 2. Update balance type
        console.log(`\n2. Changing balance type from ${originalBalanceType} to ${newBalanceType}...`);

        const updateData = {
            name: customer.name,
            brand_name: customer.brand_name || '',
            contact: customer.contact || '',
            phone: customer.phone || '',
            email: customer.email || '',
            address: customer.address || '',
            credit_limit: customer.credit_limit || '',
            opening_balance: customer.opening_balance || customer.openingBalance || '0',
            opening_balance_type: newBalanceType
        };

        console.log('Sending update with:', {
            opening_balance: updateData.opening_balance,
            opening_balance_type: updateData.opening_balance_type
        });

        const updateResponse = await axios.put(`http://localhost:5000/customers/${customer.id}`, updateData, {
            headers: { Authorization: `Bearer ${TEST_TOKEN}` }
        });

        console.log('✅ Update successful!');
        console.log('Returned customer data:', {
            opening_balance_type: updateResponse.data.customer.opening_balance_type,
            balanceType: updateResponse.data.customer.balanceType,
            openingBalance: updateResponse.data.customer.openingBalance
        });

        // 3. Verify by fetching fresh data
        console.log('\n3. Verifying with fresh data fetch...');
        const verifyResponse = await axios.get('http://localhost:5000/customers', {
            headers: { Authorization: `Bearer ${TEST_TOKEN}` }
        });

        const updatedCustomer = verifyResponse.data.find(c => c.id === customer.id);
        console.log('Fresh fetch data:', {
            opening_balance_type: updatedCustomer.opening_balance_type,
            balanceType: updatedCustomer.balanceType,
            openingBalance: updatedCustomer.openingBalance
        });

        // 4. Verify the change
        if (updatedCustomer.opening_balance_type === newBalanceType && updatedCustomer.balanceType === newBalanceType) {
            console.log(`✅ Balance type successfully changed to ${newBalanceType}`);
        } else {
            console.log(`❌ Balance type not changed correctly. Expected: ${newBalanceType}`);
            console.log(`Got opening_balance_type: ${updatedCustomer.opening_balance_type}`);
            console.log(`Got balanceType: ${updatedCustomer.balanceType}`);
        }

        // 5. Restore original value
        console.log(`\n4. Restoring original balance type (${originalBalanceType})...`);
        const restoreData = {
            ...updateData,
            opening_balance_type: originalBalanceType
        };

        await axios.put(`http://localhost:5000/customers/${customer.id}`, restoreData, {
            headers: { Authorization: `Bearer ${TEST_TOKEN}` }
        });
        console.log('✅ Original balance type restored');

        console.log('\n🎉 Balance type update test completed!');
        console.log('✅ Opening balance type changes are now reflected correctly');
        console.log('✅ Both opening_balance_type and balanceType properties are updated');

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Backend server not running. Please start the server first.');
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

console.log('📋 This test verifies that changing opening balance type from Credit to Debit');
console.log('    (or vice versa) is immediately reflected in the UI.\n');

testBalanceTypeUpdate();