import mysql from 'mysql2/promise';

async function checkSaleItemsStructure() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Zafaryaqoob.com786',
            database: 'storeflow'
        });

        console.log('🔍 CHECKING SALE_ITEMS TABLE STRUCTURE');
        console.log('=======================================');

        // Check sale_items table structure
        const [saleItemsStructure] = await connection.query('DESCRIBE sale_items');
        console.log('\n💰 SALE_ITEMS TABLE STRUCTURE:');
        saleItemsStructure.forEach(row => {
            console.log(`   ${row.Field}: ${row.Type} ${row.Null === 'YES' ? '(nullable)' : '(required)'} ${row.Key ? `[${row.Key}]` : ''}`);
        });

        // Check current products table for comparison
        const [productsStructure] = await connection.query('DESCRIBE products');
        const productIdField = productsStructure.find(row => row.Field === 'id');
        console.log(`\n📦 PRODUCTS.ID COLUMN: ${productIdField.Type}`);

        await connection.end();

    } catch (error) {
        console.error('Database check error:', error.message);
    }
}

checkSaleItemsStructure();