const axios = require('axios');

async function quickTest() {
    try {
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });
        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        const salesResponse = await axios.get('http://localhost:5000/sales', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`📋 Found ${salesResponse.data.length} sales`);

        if (salesResponse.data.length > 0) {
            const sale = salesResponse.data[0];
            console.log(`Sale #${sale.id} has ${sale.items?.length || 0} items`);

            if (sale.items && sale.items.length > 0) {
                const item = sale.items[0];
                console.log('Item details:');
                console.log(`  Name: ${item.name}`);
                console.log(`  UOM: ${item.uom}`);
                console.log(`  Deleted: ${item.product_deleted}`);
                console.log(`  Changed: ${item.has_changes}`);
            }
        }

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

quickTest();