const axios = require('axios');

async function testSoldProducts() {
    try {
        // First, authenticate to get a valid token
        console.log('Authenticating...');
        const authResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });

        const token = authResponse.data.token;
        console.log('Authentication successful!');

        console.log('Testing sold products endpoint...');

        const response = await axios.get('http://localhost:5000/sales/sold-products', {
            headers: {
                Authorization: `Bearer ${token}`
            },
            params: {
                start_date: '2025-09-11',
                end_date: '2025-10-11'
            }
        });

        console.log('Success! Response received:');
        console.log('Number of sold products:', response.data.soldProducts?.length || 0);
        console.log('Summary:', response.data.summary);

        if (response.data.soldProducts?.length > 0) {
            console.log('\nFirst product sample:');
            console.log(response.data.soldProducts[0]);
        }

    } catch (error) {
        console.error('Error testing sold products:', error.response?.data || error.message);
        if (error.response?.data?.sql) {
            console.error('SQL Error:', error.response.data.sql);
        }
    }
}

testSoldProducts();