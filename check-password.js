import bcrypt from 'bcrypt';
import { pool } from './backend/src/models/db.js';

async function checkPassword() {
    try {
        // Check the actual password for the owner user
        const [users] = await pool.execute('SELECT id, username, password FROM users WHERE username = ?', ['owner']);

        if (users.length === 0) {
            console.log('Owner user not found');
            return;
        }

        const user = users[0];
        console.log(`User found: ${user.username}`);

        // Test common passwords
        const testPasswords = ['admin123', 'password', 'owner', 'admin', '123456', 'password123'];

        for (const password of testPasswords) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                console.log(`✅ Password found: ${password}`);
                return;
            }
        }

        console.log('❌ None of the test passwords match');
        console.log('Creating new password for owner...');

        // Update the password to admin123
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await pool.execute('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, 'owner']);
        console.log('✅ Password updated to: admin123');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        process.exit(0);
    }
}

checkPassword();