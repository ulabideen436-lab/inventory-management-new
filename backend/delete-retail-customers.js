import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function deleteRetailCustomers() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'storeflow'
    });

    try {
        console.log('🔍 Checking for retail customers...\n');

        const [retailCustomers] = await connection.query(
            "SELECT id, name, type, phone FROM customers WHERE type = 'retail' OR type IS NULL OR type = ''"
        );

        console.log(`📊 Found ${retailCustomers.length} retail customers:\n`);
        retailCustomers.forEach((customer, index) => {
            console.log(`${index + 1}. ID: ${customer.id}, Name: ${customer.name}, Type: ${customer.type || 'NULL'}, Phone: ${customer.phone || 'N/A'}`);
        });

        if (retailCustomers.length === 0) {
            console.log('\n✅ No retail customers found.');
            return;
        }

        console.log('\n⚠️  Proceeding with deletion in 3 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));

        await connection.beginTransaction();

        const [salesCheck] = await connection.query(
            `SELECT COUNT(*) as count FROM sales WHERE customer_id IN (
        SELECT id FROM customers WHERE type = 'retail' OR type IS NULL OR type = ''
      )`
        );

        console.log(`📋 ${salesCheck[0].count} sales linked to retail customers will be converted to walk-in sales.\n`);

        const [updateResult] = await connection.query(
            `UPDATE sales SET customer_id = NULL 
       WHERE customer_id IN (
         SELECT * FROM (
           SELECT id FROM customers WHERE type = 'retail' OR type IS NULL OR type = ''
         ) AS temp
       )`
        );

        if (updateResult.affectedRows > 0) {
            console.log(`✅ Updated ${updateResult.affectedRows} sales\n`);
        }

        const [deleteResult] = await connection.query(
            "DELETE FROM customers WHERE type = 'retail' OR type IS NULL OR type = ''"
        );

        await connection.commit();

        console.log(`\n🎉 SUCCESS: Deleted ${deleteResult.affectedRows} retail customers!`);

    } catch (error) {
        await connection.rollback();
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

deleteRetailCustomers()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Failed:', error);
        process.exit(1);
    });
