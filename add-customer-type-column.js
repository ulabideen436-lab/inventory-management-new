const mysql = require('mysql2/promise');

async function addCustomerTypeColumn() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '', // Assuming no password based on previous tests
        database: 'storeflow',
        multipleStatements: true
    });

    try {
        console.log('Adding customer_type column to sales table...');

        // Check if column already exists
        const [columns] = await pool.query("SHOW COLUMNS FROM sales LIKE 'customer_type'");

        if (columns.length > 0) {
            console.log('✅ customer_type column already exists');
        } else {
            // Add the column
            await pool.query("ALTER TABLE sales ADD COLUMN customer_type ENUM('retail', 'long-term') DEFAULT 'retail' AFTER customer_id");
            console.log('✅ customer_type column added successfully');
        }

        // Update existing sales to have customer_type based on customer data if available
        console.log('Updating existing sales with customer_type...');

        // For walk-in customers, set as retail
        await pool.query("UPDATE sales SET customer_type = 'retail' WHERE customer_id IS NULL OR customer_id = 'Walk-in'");

        // For existing customers, we can set a default or check customer data
        // For now, let's set all existing customer sales as retail
        await pool.query("UPDATE sales SET customer_type = 'retail' WHERE customer_type IS NULL");

        console.log('✅ Existing sales updated');

        // Show updated table structure
        const [structure] = await pool.query('DESCRIBE sales');
        console.log('\nUpdated sales table structure:');
        structure.forEach(row => console.log(`${row.Field}: ${row.Type}`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

addCustomerTypeColumn();