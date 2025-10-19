import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function debugSalesIntegrity() {
    console.log('\n🔍 Debugging Sales Data Integrity...\n');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'storeflow'
    });

    // Check sales integrity
    const [salesIntegrity] = await connection.query(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN customer_type = 'retail' AND customer_id IS NULL THEN 1 ELSE 0 END) as valid_retail,
            SUM(CASE WHEN customer_type = 'longterm' AND customer_id IS NOT NULL THEN 1 ELSE 0 END) as valid_wholesale,
            SUM(CASE WHEN customer_type = 'retail' AND customer_id IS NOT NULL THEN 1 ELSE 0 END) as invalid_retail,
            SUM(CASE WHEN customer_type = 'longterm' AND customer_id IS NULL THEN 1 ELSE 0 END) as invalid_wholesale
        FROM sales 
        WHERE deleted_at IS NULL
    `);

    const integrity = salesIntegrity[0];
    console.log('📊 Sales Integrity Check:');
    console.table(integrity);

    const validSales = Number(integrity.valid_retail) + Number(integrity.valid_wholesale);
    const totalSales = Number(integrity.total);

    console.log(`\n✅ Valid Sales: ${validSales}/${totalSales}`);
    console.log(`❌ Invalid Retail (has customer): ${integrity.invalid_retail}`);
    console.log(`❌ Invalid Wholesale (no customer): ${integrity.invalid_wholesale}`);

    // Check if there are sales with 'long-term' instead of 'longterm'
    const [alternateTypes] = await connection.query(`
        SELECT customer_type, COUNT(*) as count
        FROM sales
        WHERE deleted_at IS NULL
        GROUP BY customer_type
    `);

    console.log('\n📈 Customer Type Variations:');
    console.table(alternateTypes);

    // Get sample invalid sales if any
    if (integrity.invalid_retail > 0) {
        const [invalidRetail] = await connection.query(`
            SELECT id, customer_id, customer_type, total_amount
            FROM sales
            WHERE customer_type = 'retail' AND customer_id IS NOT NULL AND deleted_at IS NULL
            LIMIT 5
        `);
        console.log('\n⚠️  Sample Invalid Retail Sales (should not have customer):');
        console.table(invalidRetail);
    }

    if (integrity.invalid_wholesale > 0) {
        const [invalidWholesale] = await connection.query(`
            SELECT id, customer_id, customer_type, total_amount
            FROM sales
            WHERE customer_type = 'longterm' AND customer_id IS NULL AND deleted_at IS NULL
            LIMIT 5
        `);
        console.log('\n⚠️  Sample Invalid Wholesale Sales (should have customer):');
        console.table(invalidWholesale);
    }

    await connection.end();
}

debugSalesIntegrity().catch(console.error);
