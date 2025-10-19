const axios = require('axios');

async function createUserAndTest() {
    const baseURL = 'http://localhost:5000';

    try {
        console.log('🔧 Creating user and testing created_at...\n');

        // Try to register a new user first
        console.log('1. Attempting to register a new user...');
        try {
            const registerResponse = await axios.post(`${baseURL}/auth/register`, {
                username: 'testuser',
                password: 'TestPass123!',
                role: 'owner'
            });
            console.log('✅ User registration successful');
        } catch (err) {
            console.log('❌ Registration failed:', err.response?.data?.message || err.message);
            // If registration fails, let's try to login with the user that might already exist
        }

        // Try to login with the user we just created or that might exist
        console.log('\n2. Attempting to login...');
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            username: 'testuser',
            password: 'TestPass123!'
        });

        if (!loginResponse.data.token) {
            throw new Error('Failed to get authentication token');
        }

        const token = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✅ Login successful\n');

        // Fetch customers to check created_at field
        console.log('3. Fetching customers to check created_at field...');
        const customersResponse = await axios.get(`${baseURL}/customers`, { headers });
        const customers = customersResponse.data;

        console.log(`Found ${customers.length} customers`);

        if (customers.length > 0) {
            const firstCustomer = customers[0];
            console.log('\n📋 First customer object keys:', Object.keys(firstCustomer));
            console.log('📋 First customer created_at value:', firstCustomer.created_at);

            if (!firstCustomer.created_at) {
                console.log('❌ created_at field is missing or null!');
            } else {
                console.log('✅ created_at field is present:', firstCustomer.created_at);
            }
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
            console.log('✅ Test customer created with ID:', createResponse.data.id);

            // Fetch the newly created customer by ID
            const newCustomerResponse = await axios.get(`${baseURL}/customers/${createResponse.data.id}`, { headers });
            const newCustomer = newCustomerResponse.data;

            console.log('\n📋 New customer object keys:', Object.keys(newCustomer));
            console.log('📋 New customer created_at value:', newCustomer.created_at);

            if (!newCustomer.created_at) {
                console.log('❌ created_at field is missing or null in newly created customer!');
            } else {
                console.log('✅ created_at field is present in new customer:', newCustomer.created_at);
            }

            // Also fetch all customers to see if created_at appears in list
            const updatedResponse = await axios.get(`${baseURL}/customers`, { headers });
            const updatedCustomers = updatedResponse.data;

            if (updatedCustomers.length > 0) {
                const listCustomer = updatedCustomers.find(c => c.id === createResponse.data.id);
                if (listCustomer) {
                    console.log('\n📋 Customer in list - created_at value:', listCustomer.created_at);
                    if (!listCustomer.created_at) {
                        console.log('❌ created_at field is missing in customers list!');
                    } else {
                        console.log('✅ created_at field is present in customers list');
                    }
                }
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
        if (error.response?.data) {
            console.error('📋 Error details:', error.response.data);
        }
    }
}

createUserAndTest();