// Check users in database
import { pool } from './src/models/db.js';

async function checkUsers() {
    try {
        const [users] = await pool.execute('SELECT id, username, email, role FROM users');
        console.log('Users in database:');
        console.table(users);

        if (users.length === 0) {
            console.log('No users found. Creating admin user...');
            // Check if there's a create-admin script
            console.log('Please run: node create-admin.js');
        }
    } catch (error) {
        console.error('Error checking users:', error.message);
    } finally {
        process.exit(0);
    }
}

checkUsers();