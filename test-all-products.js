const axios = require('axios');

async function testGetAllProducts() {
    console.log('🔍 Testing all products...');

    try {
        // First login to get a token
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });
        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Get all products
        const productsResponse = await axios.get('http://localhost:5000/products', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const products = productsResponse.data;
        console.log('\n📦 Total products:', products.length);

        if (products.length > 0) {
            console.log('\nFirst few products:');
            products.slice(0, 5).forEach((product, index) => {
                console.log(`Product ${index + 1}:`);
                console.log(`  ID: ${product.id}`);
                console.log(`  Name: ${product.name}`);
                console.log(`  Brand: ${product.brand}`);
                console.log(`  UOM: ${product.uom}`);
            });
        }

        // Check if there's a product with ID similar to zy0000000001
        const productWithSimilarId = products.find(p => p.id && p.id.includes('zy'));
        if (productWithSimilarId) {
            console.log('\nFound product with similar ID:');
            console.log('  ID:', productWithSimilarId.id);
            console.log('  Name:', productWithSimilarId.name);
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testGetAllProducts();