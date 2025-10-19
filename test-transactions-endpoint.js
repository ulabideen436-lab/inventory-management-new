const axios = require('axios');

async function testTransactionsEndpoint() {
    try {
        console.log('🧪 Testing transactions/detailed endpoint...');

        // First login to get token
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });

        if (loginResponse.status !== 200) {
            console.log('❌ Login failed');
            return;
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Test transactions/detailed endpoint
        const transactionsResponse = await axios.get('http://localhost:5000/transactions/detailed', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                from: '2025-01-01',
                to: '2025-12-31',
                types: ['sale-retail', 'sale-wholesale', 'purchase']
            }
        });

        if (transactionsResponse.status === 200) {
            console.log('✅ Transactions endpoint working!');
            console.log('📊 Response data keys:', Object.keys(transactionsResponse.data));
            console.log('📊 Data structure:', JSON.stringify(transactionsResponse.data, null, 2).substring(0, 500) + '...');
        } else {
            console.log('❌ Transactions failed:', transactionsResponse.status);
        }

    } catch (error) {
        console.log('❌ Test failed:', error.message);
        if (error.response) {
            console.log('❌ Response status:', error.response.status);
            console.log('❌ Response data:', error.response.data);
        }
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Server is not running. Please start the server first.');
        }
    }
}

testTransactionsEndpoint();