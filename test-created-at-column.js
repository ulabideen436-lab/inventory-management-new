const axios = require('axios');

async function testCreatedAtColumn() {
    const baseURL = 'http://localhost:5000';

    try {
        console.log('🔍 Testing Created At Column Issue...\n');

        // Try common credentials first
        const credentialOptions = [
            { username: 'admin', password: 'admin123' },
            { username: 'owner', password: 'password' },
            { username: 'admin', password: 'password' },
            { username: 'owner', password: 'admin123' }
        ];

        let token = null;
        let successfulCreds = null;

        for (const creds of credentialOptions) {
            try {
                console.log(`Trying credentials: ${creds.username} / ${creds.password}`);
                const loginResponse = await axios.post(`${baseURL}/auth/login`, creds);
                if (loginResponse.data.token) {
                    token = loginResponse.data.token;
                    successfulCreds = creds;
                    console.log(`✅ Login successful with: ${creds.username} / ${creds.password}\n`);
                    break;
                }
            } catch (err) {
                console.log(`❌ Failed: ${err.response?.data?.message || err.message}`);
            }
        }

        if (!token) {
            console.log('❌ Could not authenticate with any common credentials');
            return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // Fetch customers to check created_at field
        console.log('📋 Fetching customers to check created_at field...');
        const customersResponse = await axios.get(`${baseURL}/customers`, { headers });
        const customers = customersResponse.data;

        console.log(`Found ${customers.length} customers`);

        if (customers.length > 0) {
            const firstCustomer = customers[0];
            console.log('\n📋 First customer object keys:', Object.keys(firstCustomer));
            console.log('📋 First customer created_at value:', firstCustomer.created_at);
            console.log('📋 First customer full object:', JSON.stringify(firstCustomer, null, 2));
        } else {
            console.log('No customers found. Creating a test customer...');

            const testCustomer = {
                name: `Test Customer ${Date.now()}`,
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
            console.log('✅ Test customer created');

            // Fetch again
            const updatedResponse = await axios.get(`${baseURL}/customers`, { headers });
            const updatedCustomers = updatedResponse.data;

            if (updatedCustomers.length > 0) {
                const newCustomer = updatedCustomers[0];
                console.log('\n📋 New customer object keys:', Object.keys(newCustomer));
                console.log('📋 New customer created_at value:', newCustomer.created_at);
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
        if (error.response?.data) {
            console.error('📋 Error details:', error.response.data);
        }
    }
}

testCreatedAtColumn();