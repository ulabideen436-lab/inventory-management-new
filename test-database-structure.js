const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

async function checkDatabase() {
    try {
        console.log('🔍 Checking database structure...');

        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'storeflow',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // Check if tables exist
        const tables = ['sales', 'sale_items', 'purchases', 'purchase_items', 'payments', 'customers', 'suppliers', 'products'];

        for (const table of tables) {
            try {
                const [rows] = await pool.query(`DESCRIBE ${table}`);
                console.log(`✅ Table ${table} exists with columns:`, rows.map(r => r.Field).join(', '));
            } catch (err) {
                console.log(`❌ Table ${table} does not exist or has issues:`, err.message);
            }
        }

        // Test a simple query from each table
        console.log('\n🧪 Testing simple queries...');

        try {
            const [sales] = await pool.query('SELECT COUNT(*) as count FROM sales');
            console.log(`✅ Sales table has ${sales[0].count} records`);
        } catch (err) {
            console.log('❌ Sales query failed:', err.message);
        }

        try {
            const [purchases] = await pool.query('SELECT COUNT(*) as count FROM purchases');
            console.log(`✅ Purchases table has ${purchases[0].count} records`);
        } catch (err) {
            console.log('❌ Purchases query failed:', err.message);
        }

        try {
            const [payments] = await pool.query('SELECT COUNT(*) as count FROM payments');
            console.log(`✅ Payments table has ${payments[0].count} records`);
        } catch (err) {
            console.log('❌ Payments query failed:', err.message);
        }

        await pool.end();

    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    }
}

checkDatabase();