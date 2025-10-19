const axios = require('axios');

async function testSearchAPI() {
    try {
        console.log('Testing search API...');

        // First login to get a token
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful, got token');

        // Now test the search
        const response = await axios.get('http://localhost:5000/products?search=mutton', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Search API response:', response.data);

        if (response.data && response.data.length > 0) {
            console.log('✅ Search API is working');
            console.log('Sample product:', response.data[0]);
        } else {
            console.log('❌ Search API returned no results');
        }
    } catch (error) {
        console.error('❌ Search API error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
} testSearchAPI();