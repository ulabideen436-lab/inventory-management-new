const axios = require('axios');

async function checkProductsTableStructure() {
    console.log('🔍 Checking Products Table Structure');

    try {
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });
        const token = loginResponse.data.token;

        const productsResponse = await axios.get('http://localhost:5000/products', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (productsResponse.data.length > 0) {
            const sampleProduct = productsResponse.data[0];
            console.log('Sample product structure:');
            console.log(JSON.stringify(sampleProduct, null, 2));
        }

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

checkProductsTableStructure();