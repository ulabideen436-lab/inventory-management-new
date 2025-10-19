const mysql = require('mysql2/promise');

async function checkTableStructure() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Zafaryaqoob.com786',
            database: 'storeflow'
        });

        console.log('Checking sale_items table structure...');
        const [structure] = await conn.query('DESCRIBE sale_items');
        console.table(structure);

        await conn.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkTableStructure();