import mysql from 'mysql2/promise';

async function checkSaleItemsStructure() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Zafaryaqoob.com786',
            database: 'storeflow'
        });

        const [rows] = await conn.query('DESCRIBE sale_items');
        console.log('sale_items table structure:');
        console.table(rows);

        await conn.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkSaleItemsStructure();