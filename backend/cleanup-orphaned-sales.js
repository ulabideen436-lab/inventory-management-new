import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function cleanupOrphanedSales() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'storeflow'
    });

    try {
        console.log('🔍 Checking for sales with deleted customers...\n');

        // Find sales with customer_id that don't exist in customers table
        const [orphanedSales] = await connection.query(`
      SELECT s.id, s.customer_id, s.customer_type, s.total_amount
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.customer_id IS NOT NULL AND c.id IS NULL
    `);

        console.log(`📊 Found ${orphanedSales.length} sales with deleted customers:\n`);
        orphanedSales.forEach((sale, index) => {
            console.log(`${index + 1}. Sale #${sale.id} - Customer ID: ${sale.customer_id}, Type: ${sale.customer_type} - Amount: ${sale.total_amount}`);
        }); if (orphanedSales.length === 0) {
            console.log('\n✅ No orphaned sales found. Database is clean!');
            return;
        }

        console.log('\n⚠️  Cleaning up in 3 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));

        await connection.beginTransaction();

        // Set customer_id to NULL and customer_type to 'retail' for orphaned sales
        const [updateResult] = await connection.query(`
      UPDATE sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      SET 
        s.customer_id = NULL,
        s.customer_type = 'retail'
      WHERE s.customer_id IS NOT NULL AND c.id IS NULL
    `); await connection.commit();

        console.log(`\n🎉 SUCCESS: Cleaned up ${updateResult.affectedRows} sales!`);
        console.log('✅ All orphaned sales have been converted to walk-in (retail) sales.');

    } catch (error) {
        await connection.rollback();
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

cleanupOrphanedSales()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Failed:', error);
        process.exit(1);
    });
