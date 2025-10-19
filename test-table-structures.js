const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTableStructures() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: 'Zafaryaqoob.com786',
        database: 'storeflow',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log('🧪 Checking table structures...');

        // Check payments table
        const [payments] = await pool.query('SELECT * FROM payments LIMIT 1');
        console.log('Payments columns:', payments.length > 0 ? Object.keys(payments[0]) : 'No payments found');

        // Check purchases table
        const [purchases] = await pool.query('SELECT * FROM purchases LIMIT 1');
        console.log('Purchases columns:', purchases.length > 0 ? Object.keys(purchases[0]) : 'No purchases found');

        // Try the specific query that's failing
        const [testPurchases] = await pool.query(`
            SELECT id, date, total_cost as amount, 'purchase' as type, date as created_at,
                   CONCAT('Purchase of goods - ID: ', id) as description
            FROM purchases 
            WHERE supplier_id = 3
            LIMIT 1
        `);
        console.log('Purchase query successful, result:', testPurchases);

        // Try payments query
        const [testPayments] = await pool.query(`
            SELECT id, date, amount, 'payment' as type, date as created_at,
                   'Payment to supplier' as description
            FROM payments 
            WHERE supplier_id = 3
            LIMIT 1
        `);
        console.log('Payment query successful, result:', testPayments);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('   Full error:', error);
    } finally {
        await pool.end();
    }
}

checkTableStructures();