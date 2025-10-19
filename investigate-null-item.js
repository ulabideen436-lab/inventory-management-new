const axios = require('axios');

async function investigateNullItem() {
    console.log('🔍 Investigating the remaining null item...');

    try {
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });
        const token = loginResponse.data.token;

        // Check if product zy0000000002 exists
        try {
            const productResponse = await axios.get('http://localhost:5000/products/zy0000000002', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Product zy0000000002 exists:', productResponse.data);
        } catch (productError) {
            console.log('❌ Product zy0000000002 does not exist in products table');
            console.log('   This explains why it shows as null - no product data to join with');
        }

        // Get all products to see what we have
        const allProductsResponse = await axios.get('http://localhost:5000/products', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('\n📦 Available products:');
        allProductsResponse.data.forEach(product => {
            console.log(`   ${product.id}: ${product.name}`);
        });

        // Check the specific sale with the null item
        const salesResponse = await axios.get('http://localhost:5000/sales', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const saleWithNullItem = salesResponse.data.find(sale =>
            sale.items && sale.items.some(item =>
                item.product_id === 'zy0000000002' && (item.name === 'null' || !item.name)
            )
        );

        if (saleWithNullItem) {
            console.log(`\n🔍 Found the problematic sale #${saleWithNullItem.id}`);
            const nullItem = saleWithNullItem.items.find(item =>
                item.product_id === 'zy0000000002'
            );
            console.log('Null item details:', {
                product_id: nullItem.product_id,
                name: nullItem.name,
                stored_name: nullItem.product_name,
                uom: nullItem.uom,
                stored_uom: nullItem.product_uom
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

investigateNullItem();