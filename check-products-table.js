import mysql from 'mysql2/promise';

async function checkProductsTable() {
    try {
        const pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: 'your_password',
            database: 'inventory_management'
        });

        const conn = await pool.getConnection();
        const [columns] = await conn.query('DESCRIBE products');

        console.log('Products table columns:');
        columns.forEach(col => {
            console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
        });

        conn.release();
        pool.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkProductsTable();