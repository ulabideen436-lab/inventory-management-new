const axios = require('axios');

async function testNewCustomerCreatedAt() {
    const baseURL = 'http://localhost:5000';

    try {
        console.log('🧪 Testing created_at for new customer creation...\n');

        // Login
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            username: 'testuser',
            password: 'TestPass123!'
        });

        const token = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✅ Login successful\n');

        // Create a new customer
        console.log('📝 Creating a new customer...');
        const newCustomer = {
            name: `Test Customer Created At ${Date.now()}`,
            brand_name: 'Test Brand',
            contact: '03001234567',
            opening_balance: 1000,
            opening_balance_type: 'Dr',
            address: '123 Test Street',
            phone: '03001234567',
            email: 'test@example.com',
            credit_limit: 25000
        };

        const createResponse = await axios.post(`${baseURL}/customers`, newCustomer, { headers });
        const newCustomerId = createResponse.data.id;
        console.log(`✅ Customer created with ID: ${newCustomerId}`);

        // Fetch the new customer to check created_at
        const fetchResponse = await axios.get(`${baseURL}/customers/${newCustomerId}`, { headers });
        const fetchedCustomer = fetchResponse.data;

        console.log('\n📋 New customer details:');
        console.log(`Name: ${fetchedCustomer.name}`);
        console.log(`Credit Limit: ${fetchedCustomer.credit_limit}`);
        console.log(`Created At: ${fetchedCustomer.created_at}`);

        if (fetchedCustomer.created_at) {
            const createdDate = new Date(fetchedCustomer.created_at);
            const now = new Date();
            const timeDiff = Math.abs(now - createdDate) / 1000; // seconds

            console.log(`\n✅ created_at field is working!`);
            console.log(`📅 Created: ${createdDate.toLocaleString()}`);
            console.log(`⏱️  Time difference: ${timeDiff.toFixed(1)} seconds ago`);

            if (timeDiff < 60) {
                console.log('✅ Timestamp is recent and accurate!');
            }
        } else {
            console.log('❌ created_at field is still missing for new customer!');
        }

        // Also check in the customers list
        const listResponse = await axios.get(`${baseURL}/customers`, { headers });
        const customersList = listResponse.data;
        const customerInList = customersList.find(c => c.id === newCustomerId);

        if (customerInList && customerInList.created_at) {
            console.log('✅ created_at field also appears correctly in customers list');
            console.log(`📋 List created_at: ${customerInList.created_at}`);
        } else {
            console.log('❌ created_at field missing in customers list');
        }

        // Cleanup
        console.log('\n🧹 Cleaning up test customer...');
        await axios.delete(`${baseURL}/customers/${newCustomerId}`, { headers });
        console.log('✅ Test customer deleted');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
        if (error.response?.data) {
            console.error('📋 Error details:', error.response.data);
        }
    }
}

testNewCustomerCreatedAt();