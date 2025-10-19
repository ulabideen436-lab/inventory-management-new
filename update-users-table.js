const mysql = require('mysql2/promise');

async function updateUsersTable() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Zafaryaqoob.com786',
            database: 'storeflow'
        });

        console.log('Updating users table structure...');

        // Add missing columns
        console.log('1. Adding email column...');
        try {
            await conn.query(`ALTER TABLE users ADD COLUMN email VARCHAR(100) UNIQUE NULL AFTER password`);
            console.log('   ✅ Email column added');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('   ✅ Email column already exists');
            } else {
                throw err;
            }
        }

        console.log('2. Adding full_name column...');
        try {
            await conn.query(`ALTER TABLE users ADD COLUMN full_name VARCHAR(100) NULL AFTER email`);
            console.log('   ✅ Full_name column added');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('   ✅ Full_name column already exists');
            } else {
                throw err;
            }
        }

        console.log('3. Updating role enum to include manager...');
        try {
            await conn.query(`ALTER TABLE users MODIFY COLUMN role ENUM('cashier', 'manager', 'owner') DEFAULT 'cashier'`);
            console.log('   ✅ Role enum updated');
        } catch (err) {
            console.log('   ⚠️ Role enum update error:', err.message);
        }

        // Check final structure
        console.log('\nFinal users table structure:');
        const [structure] = await conn.query('DESCRIBE users');
        console.table(structure);

        // Update existing users with default values
        console.log('\n4. Updating existing users with default values...');
        await conn.query(`
            UPDATE users 
            SET full_name = COALESCE(full_name, CONCAT(UPPER(SUBSTRING(username, 1, 1)), SUBSTRING(username, 2)))
            WHERE full_name IS NULL
        `);
        console.log('   ✅ Added default full names');

        // Show updated users
        const [users] = await conn.query('SELECT id, username, email, full_name, role, created_at FROM users');
        console.log('\nUpdated users:');
        console.table(users);

        await conn.end();
        console.log('\n✅ Users table update completed successfully!');
    } catch (error) {
        console.error('❌ Error updating users table:', error.message);
    }
}

updateUsersTable();