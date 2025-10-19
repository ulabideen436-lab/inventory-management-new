// Comprehensive test for customer balance type visibility issue
const axios = require('axios');

const TEST_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJvd25lciIsImlhdCI6MTcyODMwNzQ1M30.YJEVZslgvOCZD0YrXeOhp9E-_kFAWaXRPHoQG4eOLRM';

async function testCompleteBalanceTypeFlow() {
    console.log('🧪 Complete Balance Type Update Flow Test...\n');

    try {
        // 1. Get customer data
        console.log('1. Fetching customer data...');
        const customersResponse = await axios.get('http://localhost:5000/customers', {
            headers: { Authorization: `Bearer ${TEST_TOKEN}` }
        });

        const customer = customersResponse.data.find(c => c.name === 'Taha') || customersResponse.data[0];
        console.log(`Found customer: ${customer.name}`);
        console.log('Initial state:', {
            opening_balance: customer.opening_balance,
            opening_balance_type: customer.opening_balance_type,
            balanceType: customer.balanceType,
            openingBalance: customer.openingBalance
        });

        // 2. Test Credit -> Debit change
        console.log('\n2. Testing Credit -> Debit change...');
        const updateToCreditData = {
            name: customer.name,
            brand_name: customer.brand_name || '',
            contact: customer.contact || '',
            phone: customer.phone || '',
            email: customer.email || '',
            address: customer.address || '',
            credit_limit: customer.credit_limit || '',
            opening_balance: '500.00',
            opening_balance_type: 'Cr' // Set to Credit first
        };

        await axios.put(`http://localhost:5000/customers/${customer.id}`, updateToCreditData, {
            headers: { Authorization: `Bearer ${TEST_TOKEN}` }
        });
        console.log('✅ Set to Credit (Cr)');

        // 3. Now change from Credit to Debit
        console.log('\n3. Now changing from Credit to Debit...');
        const updateToDebitData = {
            ...updateToCreditData,
            opening_balance_type: 'Dr' // Change to Debit
        };

        const debitResponse = await axios.put(`http://localhost:5000/customers/${customer.id}`, updateToDebitData, {
            headers: { Authorization: `Bearer ${TEST_TOKEN}` }
        });

        console.log('Update response:', {
            message: debitResponse.data.message,
            customer: {
                opening_balance: debitResponse.data.customer.opening_balance,
                opening_balance_type: debitResponse.data.customer.opening_balance_type,
                balanceType: debitResponse.data.customer.balanceType,
                openingBalance: debitResponse.data.customer.openingBalance
            }
        });

        // 4. Verify with fresh fetch
        console.log('\n4. Verifying with fresh data...');
        const freshResponse = await axios.get('http://localhost:5000/customers', {
            headers: { Authorization: `Bearer ${TEST_TOKEN}` }
        });

        const freshCustomer = freshResponse.data.find(c => c.id === customer.id);
        console.log('Fresh fetch result:', {
            opening_balance: freshCustomer.opening_balance,
            opening_balance_type: freshCustomer.opening_balance_type,
            balanceType: freshCustomer.balanceType,
            openingBalance: freshCustomer.openingBalance
        });

        // 5. Test customer history endpoint (this might be what the frontend uses)
        console.log('\n5. Testing customer history endpoint...');
        try {
            const historyResponse = await axios.get(`http://localhost:5000/customers/${customer.id}/history`, {
                headers: { Authorization: `Bearer ${TEST_TOKEN}` }
            });
            console.log('✅ History endpoint accessible, entries:', historyResponse.data.length);
        } catch (histError) {
            console.log('❌ History endpoint error:', histError.response?.status, histError.response?.data?.message);
        }

        // 6. Test customer ledger endpoint
        console.log('\n6. Testing customer ledger endpoint...');
        try {
            const ledgerResponse = await axios.get(`http://localhost:5000/customers/${customer.id}/ledger`, {
                headers: { Authorization: `Bearer ${TEST_TOKEN}` }
            });
            console.log('✅ Ledger endpoint accessible, entries:', ledgerResponse.data.length);
            if (ledgerResponse.data.length > 0) {
                const openingEntry = ledgerResponse.data.find(entry => entry.description === 'Opening Balance');
                if (openingEntry) {
                    console.log('Opening balance entry in ledger:', {
                        amount: openingEntry.amount,
                        type: openingEntry.type,
                        description: openingEntry.description
                    });
                }
            }
        } catch (ledgerError) {
            console.log('❌ Ledger endpoint error:', ledgerError.response?.status, ledgerError.response?.data?.message);
        }

        // 7. Final verification
        console.log('\n7. Final verification...');
        if (freshCustomer.opening_balance_type === 'Dr' && freshCustomer.balanceType === 'Dr') {
            console.log('✅ SUCCESS: Balance type correctly changed to Debit (Dr)');
            console.log('✅ Both opening_balance_type and balanceType properties are consistent');
        } else {
            console.log('❌ ISSUE: Balance type not properly updated');
            console.log(`Expected: Dr, Got opening_balance_type: ${freshCustomer.opening_balance_type}, balanceType: ${freshCustomer.balanceType}`);
        }

        console.log('\n🎉 Complete balance type flow test finished!');

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Backend server not running. Please start the server first.');
        } else if (error.response) {
            console.error('❌ HTTP Error:', error.response.status);
            console.error('Error message:', error.response.data?.message);
            console.error('Full error:', error.response.data);
        } else {
            console.error('❌ Unexpected error:', error.message);
        }
    }
}

testCompleteBalanceTypeFlow();