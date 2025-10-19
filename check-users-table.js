const mysql = require('mysql2/promise');

async function checkUsersTable() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Zafaryaqoob.com786',
            database: 'storeflow'
        });

        console.log('Checking users table structure...');

        // Check if table exists
        const [tables] = await conn.query("SHOW TABLES LIKE 'users'");
        if (tables.length === 0) {
            console.log('❌ Users table does not exist!');
            console.log('Creating users table...');

            await conn.query(`
                CREATE TABLE users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    email VARCHAR(100) UNIQUE NULL,
                    full_name VARCHAR(100) NULL,
                    role ENUM('cashier', 'manager', 'owner') DEFAULT 'cashier',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP NULL
                )
            `);
            console.log('✅ Users table created successfully!');
        } else {
            console.log('✅ Users table exists');
        }

        // Check table structure
        const [structure] = await conn.query('DESCRIBE users');
        console.log('\nUsers table structure:');
        console.table(structure);

        // Check if there are any users
        const [users] = await conn.query('SELECT id, username, role, created_at FROM users');
        console.log(`\nFound ${users.length} users in the table:`);
        if (users.length > 0) {
            console.table(users);
        } else {
            console.log('No users found. You may need to create an owner account.');
        }

        await conn.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkUsersTable();