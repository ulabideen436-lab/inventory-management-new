const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

async function testTransactionQueries() {
    try {
        console.log('🧪 Testing specific transaction queries...');

        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'storeflow',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        const startDate = '2025-01-01';
        const endDate = '2025-12-31';

        // Test sales query
        console.log('🔍 Testing sales query...');
        try {
            const [sales] = await pool.query(
                `SELECT s.id, s.date, s.total_amount, s.status, c.name as customer_name, c.phone as customer_phone
                 FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
                 WHERE DATE(s.date) >= ? AND DATE(s.date) <= ?
                 ORDER BY s.date DESC`,
                [startDate, endDate]
            );
            console.log(`✅ Sales query successful: ${sales.length} records`);
            if (sales.length > 0) {
                console.log('   Sample sale:', sales[0]);
            }
        } catch (err) {
            console.log('❌ Sales query failed:', err.message);
        }

        // Test sale_items query
        console.log('\n🔍 Testing sale_items query...');
        try {
            const [items] = await pool.query(`
                SELECT si.quantity, si.price, si.item_discount_value, si.item_discount_type, p.name as product_name, p.id as product_id
                FROM sale_items si 
                LEFT JOIN products p ON si.product_id = p.id 
                WHERE si.sale_id = 1
            `);
            console.log(`✅ Sale items query successful: ${items.length} records`);
            if (items.length > 0) {
                console.log('   Sample item:', items[0]);
            }
        } catch (err) {
            console.log('❌ Sale items query failed:', err.message);
        }

        // Test purchases query
        console.log('\n🔍 Testing purchases query...');
        try {
            const [purchases] = await pool.query(
                `SELECT p.id, p.date, p.total_cost, s.name as supplier_name, s.contact_info as supplier_contact
                 FROM purchases p LEFT JOIN suppliers s ON p.supplier_id = s.id
                 WHERE DATE(p.date) >= ? AND DATE(p.date) <= ?
                 ORDER BY p.date DESC`,
                [startDate, endDate]
            );
            console.log(`✅ Purchases query successful: ${purchases.length} records`);
            if (purchases.length > 0) {
                console.log('   Sample purchase:', purchases[0]);
            }
        } catch (err) {
            console.log('❌ Purchases query failed:', err.message);
        }

        // Test payments query
        console.log('\n🔍 Testing payments query...');
        try {
            const [payments] = await pool.query(
                `SELECT pay.id, pay.date, pay.amount, pay.description, s.name as supplier_name, s.contact_info as supplier_contact
                 FROM payments pay LEFT JOIN suppliers s ON pay.supplier_id = s.id
                 WHERE DATE(pay.date) >= ? AND DATE(pay.date) <= ?
                 ORDER BY pay.date DESC`,
                [startDate, endDate]
            );
            console.log(`✅ Payments query successful: ${payments.length} records`);
            if (payments.length > 0) {
                console.log('   Sample payment:', payments[0]);
            }
        } catch (err) {
            console.log('❌ Payments query failed:', err.message);
        }

        await pool.end();

    } catch (error) {
        console.error('❌ Query test failed:', error.message);
    }
}

testTransactionQueries();