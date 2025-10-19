import { pool } from './backend/src/models/db.js';

async function checkUsers() {
    try {
        const [users] = await pool.execute('SELECT id, username, role FROM users');
        console.log('Existing users:');
        users.forEach(user => {
            console.log(`- ID: ${user.id}, Username: ${user.username}, Role: ${user.role}`);
        });

        if (users.length === 0) {
            console.log('No users found in database');
        }

    } catch (error) {
        console.error('Error checking users:', error.message);
    } finally {
        process.exit(0);
    }
}

checkUsers();