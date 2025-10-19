const mysql = require('mysql2/promise');

async function debugSaleItems() {
    console.log('🔍 Debugging sale items data...');

    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Zafaryaqoob.com786',
        database: 'storeflow'
    });

    try {
        // Get a recent sale to examine
        const [sales] = await connection.query('SELECT id FROM sales ORDER BY created_at DESC LIMIT 5');
        console.log('📋 Recent sales:', sales.map(s => s.id));

        if (sales.length > 0) {
            const saleId = sales[0].id;
            console.log(`\n🔍 Examining sale ID: ${saleId}`);

            // Get raw sale items data
            const [items] = await connection.query('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);
            console.log('\n📦 Raw sale items data:');
            items.forEach((item, index) => {
                console.log(`Item ${index + 1}:`, {
                    product_id: item.product_id,
                    product_name: item.product_name,
                    product_brand: item.product_brand,
                    product_uom: item.product_uom,
                    quantity: item.quantity,
                    price: item.price
                });
            });

            // Test the mapping logic like the backend does
            const mappedItems = items.map(item => ({
                ...item,
                name: item.product_name,
                brand: item.product_brand,
                category: item.product_category,
                uom: item.product_uom
            }));

            console.log('\n🔄 Mapped items (backend logic):');
            mappedItems.forEach((item, index) => {
                console.log(`Item ${index + 1}:`, {
                    product_id: item.product_id,
                    name: item.name, // This should be the product name
                    product_name: item.product_name,
                    uom: item.uom,
                    quantity: item.quantity
                });
            });

            // Test frontend logic
            console.log('\n🎯 Frontend cart item names would be:');
            mappedItems.forEach((item, index) => {
                const frontendName = item.product_name || item.name;
                console.log(`Item ${index + 1}: "${frontendName}" (product_name: "${item.product_name}", name: "${item.name}", uom: "${item.uom}")`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

debugSaleItems();