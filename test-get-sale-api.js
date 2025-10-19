const axios = require('axios');

async function testGetSaleAPI() {
    console.log('🔍 Testing getSale API endpoint...');

    try {
        // First login to get a token
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        }); const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Test getSale endpoint with sale ID 37 (we know it has items)
        const saleResponse = await axios.get('http://localhost:5000/sales/17', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const sale = saleResponse.data;
        console.log('\n📋 Sale data from API:');
        console.log('Sale ID:', sale.id);
        console.log('Items count:', sale.items ? sale.items.length : 0);

        if (sale.items && sale.items.length > 0) {
            console.log('\n📦 Items from API response:');
            sale.items.forEach((item, index) => {
                console.log(`\nItem ${index + 1}:`);
                console.log(`  product_id: ${item.product_id}`);
                console.log(`  name: "${item.name}"`);
                console.log(`  product_name: "${item.product_name}"`);
                console.log(`  uom: "${item.uom}"`);
                console.log(`  product_uom: "${item.product_uom}"`);
                console.log(`  quantity: ${item.quantity}`);
                console.log(`  price: ${item.price}`);

                // Test frontend cart logic
                const cartName = item.product_name || item.name;
                console.log(`  Cart name would be: "${cartName}"`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testGetSaleAPI();