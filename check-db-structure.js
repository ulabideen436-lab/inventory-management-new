const mysql = require('mysql2/promise');

async function checkTablesStructure() {
    console.log('🔍 Checking database structure...');

    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Zafaryaqoob.com786',
        database: 'storeflow'
    });

    try {
        // Check sales table structure
        const [salesCols] = await connection.query('DESCRIBE sales');
        console.log('\n📋 Sales table columns:');
        salesCols.forEach(col => {
            console.log(`- ${col.Field} (${col.Type})`);
        });

        // Check sale_items table structure
        const [itemsCols] = await connection.query('DESCRIBE sale_items');
        console.log('\n📦 Sale_items table columns:');
        itemsCols.forEach(col => {
            console.log(`- ${col.Field} (${col.Type})`);
        });

        // Get recent sales using correct column name
        const [sales] = await connection.query('SELECT id FROM sales ORDER BY id DESC LIMIT 3');
        console.log('\n📋 Recent sales:', sales.map(s => s.id));

        if (sales.length > 0) {
            const saleId = sales[0].id;
            console.log(`\n🔍 Examining sale ID: ${saleId}`);

            // Get sale items with specific fields we care about
            const [items] = await connection.query(`
        SELECT product_id, product_name, product_brand, product_uom, quantity, price 
        FROM sale_items 
        WHERE sale_id = ?
      `, [saleId]);

            console.log('\n📦 Sale items data:');
            items.forEach((item, index) => {
                console.log(`Item ${index + 1}:`, {
                    product_id: item.product_id,
                    product_name: item.product_name || 'NULL',
                    product_brand: item.product_brand || 'NULL',
                    product_uom: item.product_uom || 'NULL',
                    quantity: item.quantity,
                    price: item.price
                });
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkTablesStructure();