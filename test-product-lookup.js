const axios = require('axios');

async function testProductLookup() {
    console.log('🔍 Testing product lookup...');

    try {
        // First login to get a token
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });
        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Get the product information for product_id zy0000000001
        const productResponse = await axios.get('http://localhost:5000/products/zy0000000001', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const product = productResponse.data;
        console.log('\n📦 Product data:');
        console.log('Product ID:', product.id);
        console.log('Name:', product.name);
        console.log('Brand:', product.brand);
        console.log('Category:', product.category);
        console.log('UOM:', product.uom);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testProductLookup();