const mysql = require('mysql2/promise');

async function findSaleWithItems() {
    console.log('🔍 Finding sales with items...');

    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Zafaryaqoob.com786',
        database: 'storeflow'
    });

    try {
        // Find sales that have items
        const [salesWithItems] = await connection.query(`
      SELECT DISTINCT s.id, COUNT(si.id) as item_count 
      FROM sales s 
      LEFT JOIN sale_items si ON s.id = si.sale_id 
      GROUP BY s.id 
      HAVING item_count > 0
      ORDER BY s.id DESC 
      LIMIT 5
    `);

        console.log('📋 Sales with items:');
        salesWithItems.forEach(sale => {
            console.log(`Sale ${sale.id}: ${sale.item_count} items`);
        });

        if (salesWithItems.length > 0) {
            const saleId = salesWithItems[0].id;
            console.log(`\n🔍 Examining sale ID: ${saleId}`);

            // Get sale items with ALL fields
            const [items] = await connection.query(`SELECT * FROM sale_items WHERE sale_id = ?`, [saleId]);

            console.log('\n📦 Raw sale items data:');
            items.forEach((item, index) => {
                console.log(`\nItem ${index + 1}:`);
                console.log(`  product_id: ${item.product_id}`);
                console.log(`  product_name: "${item.product_name}"`);
                console.log(`  product_brand: "${item.product_brand}"`);
                console.log(`  product_uom: "${item.product_uom}"`);
                console.log(`  quantity: ${item.quantity}`);
                console.log(`  price: ${item.price}`);
            });

            // Test backend mapping
            console.log('\n🔄 After backend mapping:');
            items.forEach((item, index) => {
                const mappedItem = {
                    ...item,
                    name: item.product_name,
                    brand: item.product_brand,
                    category: item.product_category,
                    uom: item.product_uom
                };

                console.log(`\nItem ${index + 1} mapped:`);
                console.log(`  name: "${mappedItem.name}"`);
                console.log(`  product_name: "${mappedItem.product_name}"`);
                console.log(`  uom: "${mappedItem.uom}"`);

                // Test frontend logic
                const frontendName = mappedItem.product_name || mappedItem.name;
                console.log(`  Frontend will use: "${frontendName}"`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

findSaleWithItems();