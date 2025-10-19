const axios = require('axios');

async function testCreditLimitWorkflow() {
    const baseURL = 'http://localhost:5000';

    try {
        console.log('🧪 Testing Credit Limit Workflow...\n');

        // Step 1: Login to get token
        console.log('1. Getting authentication token...');
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            username: 'admin',
            password: 'admin123'
        }); if (!loginResponse.data.token) {
            throw new Error('Failed to get authentication token');
        }

        const token = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✅ Token obtained successfully\n');

        // Step 2: Create a test customer with credit_limit
        console.log('2. Creating test customer with credit_limit...');
        const testCustomer = {
            name: `Test Customer Credit ${Date.now()}`,
            brand_name: 'Test Brand',
            contact: '03001234567',
            opening_balance: 1000,
            opening_balance_type: 'Dr',
            address: '123 Test Street',
            phone: '03001234567',
            email: 'test@example.com',
            credit_limit: 50000
        };

        const createResponse = await axios.post(`${baseURL}/customers`, testCustomer, { headers });
        const customerId = createResponse.data.id;
        console.log(`✅ Customer created with ID: ${customerId}`);
        console.log(`📋 Original credit_limit: ${testCustomer.credit_limit}\n`);

        // Step 3: Fetch customer to verify credit_limit was saved
        console.log('3. Fetching customer to verify credit_limit was saved...');
        const fetchResponse = await axios.get(`${baseURL}/customers/${customerId}`, { headers });
        const fetchedCustomer = fetchResponse.data;
        console.log(`📋 Fetched credit_limit: ${fetchedCustomer.credit_limit}`);

        if (fetchedCustomer.credit_limit === null || fetchedCustomer.credit_limit === undefined) {
            console.log('❌ Credit limit was not saved properly!');
        } else if (parseFloat(fetchedCustomer.credit_limit) === parseFloat(testCustomer.credit_limit)) {
            console.log('✅ Credit limit saved correctly\n');
        } else {
            console.log(`❌ Credit limit mismatch! Expected: ${testCustomer.credit_limit}, Got: ${fetchedCustomer.credit_limit}\n`);
        }

        // Step 4: Update customer credit_limit
        console.log('4. Updating customer credit_limit...');
        const updatedCreditLimit = 75000;
        const updateData = {
            name: fetchedCustomer.name,
            brand_name: fetchedCustomer.brand_name,
            contact: fetchedCustomer.contact,
            phone: fetchedCustomer.phone,
            email: fetchedCustomer.email,
            address: fetchedCustomer.address,
            credit_limit: updatedCreditLimit,
            opening_balance: fetchedCustomer.opening_balance,
            opening_balance_type: fetchedCustomer.opening_balance_type
        };

        const updateResponse = await axios.put(`${baseURL}/customers/${customerId}`, updateData, { headers });
        console.log(`📋 Update API response: ${updateResponse.data.message}`);

        if (updateResponse.data.customer && updateResponse.data.customer.credit_limit) {
            console.log(`📋 Updated credit_limit in response: ${updateResponse.data.customer.credit_limit}`);
        }

        // Step 5: Fetch customer again to verify update
        console.log('5. Fetching customer again to verify credit_limit update...');
        const verifyResponse = await axios.get(`${baseURL}/customers/${customerId}`, { headers });
        const verifiedCustomer = verifyResponse.data;
        console.log(`📋 Final credit_limit: ${verifiedCustomer.credit_limit}`);

        if (verifiedCustomer.credit_limit === null || verifiedCustomer.credit_limit === undefined) {
            console.log('❌ Credit limit update failed - field is null/undefined!');
        } else if (parseFloat(verifiedCustomer.credit_limit) === parseFloat(updatedCreditLimit)) {
            console.log('✅ Credit limit updated correctly\n');
        } else {
            console.log(`❌ Credit limit update failed! Expected: ${updatedCreditLimit}, Got: ${verifiedCustomer.credit_limit}\n`);
        }

        // Step 6: Check if credit_limit appears in customers list
        console.log('6. Checking if credit_limit appears in customers list...');
        const listResponse = await axios.get(`${baseURL}/customers`, { headers });
        const customersList = listResponse.data;
        const ourCustomer = customersList.find(c => c.id === customerId);

        if (!ourCustomer) {
            console.log('❌ Customer not found in list!');
        } else if (ourCustomer.credit_limit === null || ourCustomer.credit_limit === undefined) {
            console.log('❌ Credit limit not included in customers list response!');
            console.log('📋 Customer object keys:', Object.keys(ourCustomer));
        } else {
            console.log(`✅ Credit limit found in customers list: ${ourCustomer.credit_limit}`);
        }

        // Step 7: Clean up - delete test customer
        console.log('\n7. Cleaning up test customer...');
        await axios.delete(`${baseURL}/customers/${customerId}`, { headers });
        console.log('✅ Test customer deleted\n');

        console.log('🎉 Credit Limit Workflow Test Complete!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
        if (error.response?.data) {
            console.error('📋 Error details:', error.response.data);
        }
    }
}

testCreditLimitWorkflow();