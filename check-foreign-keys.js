const mysql = require('mysql2/promise');

async function checkTableStructures() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Zafaryaqoob.com786',
            database: 'storeflow'
        });

        console.log('🔍 Checking table structures for foreign key constraints...');

        // Check sales table
        console.log('\n📊 SALES table structure:');
        try {
            const [salesStructure] = await conn.query('DESCRIBE sales');
            console.table(salesStructure);

            // Check if there are any sales records
            const [salesCount] = await conn.query('SELECT COUNT(*) as count FROM sales');
            console.log(`📈 Total sales records: ${salesCount[0].count}`);

            if (salesCount[0].count > 0) {
                const [salesWithCashier] = await conn.query('SELECT cashier_id, COUNT(*) as count FROM sales GROUP BY cashier_id');
                console.log('💰 Sales by cashier:');
                console.table(salesWithCashier);
            }
        } catch (err) {
            console.log('❌ Sales table not found or error:', err.message);
        }

        // Check purchases table
        console.log('\n🛒 PURCHASES table structure:');
        try {
            const [purchasesStructure] = await conn.query('DESCRIBE purchases');
            console.table(purchasesStructure);

            const [purchasesCount] = await conn.query('SELECT COUNT(*) as count FROM purchases');
            console.log(`📈 Total purchase records: ${purchasesCount[0].count}`);
        } catch (err) {
            console.log('❌ Purchases table not found or error:', err.message);
        }

        // Check for foreign key constraints
        console.log('\n🔗 Foreign key constraints in database:');
        try {
            const [constraints] = await conn.query(`
                SELECT 
                    TABLE_NAME,
                    COLUMN_NAME,
                    CONSTRAINT_NAME,
                    REFERENCED_TABLE_NAME,
                    REFERENCED_COLUMN_NAME
                FROM information_schema.KEY_COLUMN_USAGE 
                WHERE REFERENCED_TABLE_SCHEMA = 'storeflow' 
                AND REFERENCED_TABLE_NAME = 'users'
            `);

            if (constraints.length > 0) {
                console.table(constraints);
            } else {
                console.log('⚠️ No foreign key constraints found referencing users table');
            }
        } catch (err) {
            console.log('❌ Error checking constraints:', err.message);
        }

        await conn.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkTableStructures();