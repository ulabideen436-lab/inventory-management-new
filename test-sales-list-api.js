const axios = require('axios');

async function testGetSalesAPI() {
    console.log('🔍 Testing getSales API endpoint...');

    try {
        // First login to get a token
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });
        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Test getSales endpoint
        const salesResponse = await axios.get('http://localhost:5000/sales', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const sales = salesResponse.data;
        console.log('\n📋 Sales list from API:');
        console.log('Total sales:', sales.length);

        if (sales.length > 0) {
            console.log('\n📦 First sale items from API response:');
            const firstSale = sales[0];
            console.log('Sale ID:', firstSale.id);

            if (firstSale.items && firstSale.items.length > 0) {
                firstSale.items.forEach((item, index) => {
                    console.log(`\nItem ${index + 1}:`);
                    console.log(`  name: "${item.name}"`);
                    console.log(`  uom: "${item.uom}"`);
                    console.log(`  quantity: ${item.quantity}`);

                    // Show what the frontend will display
                    const brandPart = item.brand ? ` (${item.brand})` : '';
                    const uomPart = item.uom ? ` ${item.uom}` : '';
                    const displayText = `${item.name}${uomPart}${brandPart} x ${item.quantity}`;
                    console.log(`  Frontend display: "${displayText}"`);
                });
            } else {
                console.log('No items in first sale');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testGetSalesAPI();