import mysql from 'mysql2/promise';

async function fixSaleItemsProductIdColumn() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Zafaryaqoob.com786',
            database: 'storeflow'
        });

        console.log('🔧 FIXING SALE_ITEMS PRODUCT_ID COLUMN');
        console.log('=======================================');

        // Check current column size
        const [before] = await connection.query("SHOW COLUMNS FROM sale_items WHERE Field = 'product_id'");
        console.log(`📊 Current product_id column: ${before[0].Type}`);

        // Update the column to match products.id
        console.log('\n🔄 Updating product_id column to varchar(36)...');
        await connection.query("ALTER TABLE sale_items MODIFY product_id varchar(36)");

        // Verify the change
        const [after] = await connection.query("SHOW COLUMNS FROM sale_items WHERE Field = 'product_id'");
        console.log(`✅ Updated product_id column: ${after[0].Type}`);

        console.log('\n✅ Fix completed successfully!');
        console.log('   sale_items.product_id can now handle product IDs up to 36 characters');

        await connection.end();

    } catch (error) {
        console.error('❌ Fix failed:', error.message);
    }
}

fixSaleItemsProductIdColumn();