const mysql = require('mysql2/promise');

async function checkSalesTable() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'storeflow',
        multipleStatements: true
    });

    try {
        const [rows] = await pool.query('DESCRIBE sales');
        console.log('Sales table structure:');
        rows.forEach(row => console.log(`${row.Field}: ${row.Type}`));

        // Also check the most recent sale record
        const [sampleSale] = await pool.query('SELECT * FROM sales ORDER BY id DESC LIMIT 1');
        console.log('\nMost recent sale record:');
        console.log(sampleSale[0]);

    } catch (error) {
        console.error('Error:', error);
    }
    process.exit();
} checkSalesTable();