import { pool } from './src/models/db.js';

async function testDatabase() {
    try {
        console.log('Testing database connection...');

        // Test basic connection
        const [result] = await pool.query('SELECT 1 as test');
        console.log('✅ Database connection works:', result);

        // Check if deleted_items table exists
        const [tables] = await pool.query("SHOW TABLES LIKE 'deleted_items'");
        console.log('✅ deleted_items table exists:', tables.length > 0);

        if (tables.length > 0) {
            // Check table structure
            const [structure] = await pool.query('DESCRIBE deleted_items');
            console.log('✅ Table structure:', structure);

            // Check if there are any records
            const [count] = await pool.query('SELECT COUNT(*) as count FROM deleted_items');
            console.log('✅ Records in deleted_items:', count[0].count);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Database error:', error);
        process.exit(1);
    }
}

testDatabase();