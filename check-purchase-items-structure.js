import { pool } from './backend/src/models/db.js';

async function checkPurchaseItemsStructure() {
    try {
        // Get table structure
        const [columns] = await pool.query('DESCRIBE purchase_items');
        console.log('\n📋 purchase_items table structure:');
        console.log(columns);

        // Get sample data
        const [sampleData] = await pool.query('SELECT * FROM purchase_items LIMIT 5');
        console.log('\n📦 Sample purchase items:');
        console.log(sampleData);

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkPurchaseItemsStructure();
