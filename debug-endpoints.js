import axios from 'axios';

async function testIndividualEndpoints() {
    const baseURL = 'http://localhost:5000';

    try {
        // Test 1: Login to get auth token
        console.log('🔐 Testing login...');
        let loginResponse;
        const passwords = ['owner123', 'admin123', 'password', 'admin', 'owner', '123456'];

        for (const password of passwords) {
            try {
                console.log(`Trying password: ${password}`);
                loginResponse = await axios.post(`${baseURL}/auth/login`, {
                    username: 'owner',
                    password: password
                });
                console.log(`✅ Login successful with password: ${password}`);
                break;
            } catch (err) {
                console.log(`❌ Failed with password: ${password}`);
                if (password === passwords[passwords.length - 1]) {
                    throw err;
                }
            }
        }


        const token = loginResponse.data.token;
        console.log('✅ Authentication complete');

        const headers = { Authorization: `Bearer ${token}` };        // Test 2: Create a test product (this should fail with 409 if it already exists)
        console.log('\n📦 Testing product creation...');
        try {
            const productResponse = await axios.post(`${baseURL}/products`, {
                id: 'TEST001',
                name: 'Test Product',
                retail_price: 10.00,
                cost_price: 8.00,
                stock_quantity: 100,
                category: 'Test Category',
                uom: 'pcs'
            }, { headers });
            console.log('✅ Product created successfully');
        } catch (error) {
            if (error.response?.status === 409) {
                console.log('⚠️ Product already exists (409) - this is expected if running multiple times');
            } else {
                console.log('❌ Product creation failed:', error.response?.status, error.response?.data);
            }
        }

        // Test 3: Try to get dashboard stats
        console.log('\n📊 Testing dashboard stats...');
        try {
            const dashboardResponse = await axios.get(`${baseURL}/dashboard/stats`, { headers });
            console.log('✅ Dashboard stats retrieved successfully');
            console.log('Dashboard data keys:', Object.keys(dashboardResponse.data));
        } catch (error) {
            console.log('❌ Dashboard stats failed:', error.response?.status, error.response?.data);
        }

        // Test 4: Try sales reporting
        console.log('\n📈 Testing sales reporting...');
        try {
            const reportsResponse = await axios.get(`${baseURL}/reports`, { headers });
            console.log('✅ Sales reporting successful');
        } catch (error) {
            console.log('❌ Sales reporting failed:', error.response?.status, error.response?.data);
        }

        // Test 5: Check products list
        console.log('\n📋 Testing products list...');
        try {
            const productsResponse = await axios.get(`${baseURL}/products`, { headers });
            console.log('✅ Products list retrieved successfully');
            console.log(`Found ${productsResponse.data.length} products`);
        } catch (error) {
            console.log('❌ Products list failed:', error.response?.status, error.response?.data);
        }

    } catch (error) {
        console.error('❌ Test setup failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testIndividualEndpoints();