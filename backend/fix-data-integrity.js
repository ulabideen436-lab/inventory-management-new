import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function fixDataIntegrity() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'storeflow'
    });

    try {
        console.log('🔧 Fixing Data Integrity Issues...\n');

        await connection.beginTransaction();

        // Fix 1: Retail sales should have NO customer
        console.log('📋 Fix 1: Removing customers from retail sales...');
        const [retailFix] = await connection.query(`
      UPDATE sales 
      SET customer_id = NULL
      WHERE customer_type = 'retail' AND customer_id IS NOT NULL
      AND deleted_at IS NULL
    `);
        console.log(`✅ Fixed ${retailFix.affectedRows} retail sales\n`);

        // Fix 2: Wholesale sales without customers - convert to retail
        console.log('📋 Fix 2: Converting wholesale sales without customers to retail...');
        const [wholesaleFix] = await connection.query(`
      UPDATE sales 
      SET customer_type = 'retail', customer_id = NULL
      WHERE customer_type = 'longterm' AND customer_id IS NULL
      AND deleted_at IS NULL
    `);
        console.log(`✅ Converted ${wholesaleFix.affectedRows} wholesale sales to retail\n`);

        await connection.commit();

        console.log('🎉 Data integrity fixed successfully!\n');

    } catch (error) {
        await connection.rollback();
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

fixDataIntegrity()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Failed:', error);
        process.exit(1);
    });
