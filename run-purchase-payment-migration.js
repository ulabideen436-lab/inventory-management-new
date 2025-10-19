const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    // Database configuration
    const dbConfig = {
        host: 'localhost',
        user: 'root',
        password: '', // Update if you have a password
        database: 'storeflow'
    };

    try {
        // Connect to database
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');

        // Read migration file
        const migrationPath = path.join(__dirname, 'db', 'migrations', '2025-10-02-add-purchase-payment-fields.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Split by semicolon and execute each statement
        const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);

        for (const statement of statements) {
            try {
                await connection.execute(statement.trim());
                console.log('✅ Executed:', statement.trim().substring(0, 50) + '...');
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log('⚠️  Field already exists:', statement.trim().substring(0, 50) + '...');
                } else {
                    throw error;
                }
            }
        }

        console.log('✅ Migration completed successfully');
        await connection.end();

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();