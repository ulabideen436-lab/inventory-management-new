import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Load environment variables
dotenv.config({ path: './backend/.env' });

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'storeflow',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function deleteRetailCustomers() {
    const conn = await pool.getConnection(); try {
        console.log('🔍 Starting deletion of retail customers...\n');

        // First, check how many retail customers exist
        const [retailCustomers] = await conn.query(
            "SELECT id, name, type FROM customers WHERE type = 'retail' OR type IS NULL OR type = ''"
        );

        console.log(`📊 Found ${retailCustomers.length} retail customers:\n`);
        retailCustomers.forEach((customer, index) => {
            console.log(`${index + 1}. ID: ${customer.id}, Name: ${customer.name}, Type: ${customer.type || 'NULL/Empty'}`);
        });

        if (retailCustomers.length === 0) {
            console.log('\n✅ No retail customers found. Nothing to delete.');
            return;
        }

        console.log('\n⚠️  WARNING: This will permanently delete these customers!');
        console.log('Press Ctrl+C now to cancel, or wait 5 seconds to proceed...\n');

        // Wait 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));

        await conn.beginTransaction();

        // Check if any retail customers have sales
        const [salesCheck] = await conn.query(
            `SELECT COUNT(*) as count FROM sales WHERE customer_id IN (
        SELECT id FROM customers WHERE type = 'retail' OR type IS NULL OR type = ''
      )`
        );

        if (salesCheck[0].count > 0) {
            console.log(`⚠️  Warning: ${salesCheck[0].count} sales are linked to retail customers.`);
            console.log('These sales will have their customer_id set to NULL (converted to walk-in sales).\n');
        }

        // Update sales to remove customer references
        const [updateResult] = await conn.query(
            `UPDATE sales SET customer_id = NULL 
       WHERE customer_id IN (
         SELECT id FROM customers WHERE type = 'retail' OR type IS NULL OR type = ''
       )`
        );

        if (updateResult.affectedRows > 0) {
            console.log(`✅ Updated ${updateResult.affectedRows} sales (removed customer references)\n`);
        }

        // Delete retail customers
        const [deleteResult] = await conn.query(
            "DELETE FROM customers WHERE type = 'retail' OR type IS NULL OR type = ''"
        );

        await conn.commit();

        console.log(`\n✅ SUCCESS: Deleted ${deleteResult.affectedRows} retail customers!`);
        console.log('✅ All related sales have been converted to walk-in sales.');

    } catch (error) {
        await conn.rollback();
        console.error('❌ Error deleting retail customers:', error);
        throw error;
    } finally {
        conn.release();
        await pool.end();
    }
}

// Run the function
deleteRetailCustomers()
    .then(() => {
        console.log('\n🎉 Deletion completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Deletion failed:', error.message);
        process.exit(1);
    });
