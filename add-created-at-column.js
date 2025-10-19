const mysql = require('mysql2/promise');

async function addCreatedAtColumn() {
    try {
        console.log('📝 Adding created_at column to customers table...\n');

        // Create connection
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Zafaryaqoob.com786',
            database: 'storeflow'
        });

        // Check if column already exists
        const [columns] = await connection.execute('DESCRIBE customers');
        const createdAtExists = columns.find(col => col.Field === 'created_at');

        if (createdAtExists) {
            console.log('✅ created_at column already exists!');
            await connection.end();
            return;
        }

        console.log('❌ created_at column not found. Adding it now...');

        // Add the created_at column
        await connection.execute(`
      ALTER TABLE customers 
      ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    `);

        console.log('✅ Successfully added created_at column!');

        // Update existing records to have created_at = NOW() if they have NULL values
        await connection.execute(`
      UPDATE customers 
      SET created_at = NOW() 
      WHERE created_at IS NULL
    `);

        console.log('✅ Updated existing records with current timestamp');

        // Verify the column was added
        const [updatedColumns] = await connection.execute('DESCRIBE customers');
        const newCreatedAtColumn = updatedColumns.find(col => col.Field === 'created_at');

        if (newCreatedAtColumn) {
            console.log('✅ Verification successful!');
            console.log('📋 New created_at column details:', newCreatedAtColumn);
        } else {
            console.log('❌ Verification failed - column not found');
        }

        // Show some sample data
        const [sampleData] = await connection.execute(`
      SELECT id, name, created_at 
      FROM customers 
      ORDER BY id 
      LIMIT 5
    `);

        console.log('\n📋 Sample customer data with created_at:');
        sampleData.forEach(customer => {
            console.log(`ID: ${customer.id}, Name: ${customer.name}, Created: ${customer.created_at}`);
        });

        await connection.end();

    } catch (error) {
        console.error('❌ Migration failed:', error.message);

        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️  Column already exists (duplicate field name)');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('❌ Access denied. Please check database credentials.');
        } else {
            console.log('📋 Full error details:', error);
        }
    }
}

addCreatedAtColumn();