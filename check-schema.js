import { pool } from './backend/src/models/db.js';

async function checkSchema() {
    try {
        const conn = await pool.getConnection();
        console.log('=== SALES TABLE STRUCTURE ===');
        const [salesSchema] = await conn.query('DESCRIBE sales');
        console.table(salesSchema);

        console.log('\n=== SALES SAMPLE DATA ===');
        const [salesData] = await conn.query('SELECT * FROM sales LIMIT 3');
        console.table(salesData);

        conn.release();
        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkSchema();