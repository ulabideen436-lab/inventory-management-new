import bcrypt from 'bcryptjs';
import { pool } from './src/models/db.js';

async function createTestOwner() {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Check if admin user exists
        const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', ['admin']);

        if (existing.length === 0) {
            await pool.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
                ['admin', hashedPassword, 'owner']);
            console.log('✅ Admin user created');
        } else {
            // Update password
            await pool.query('UPDATE users SET password = ? WHERE username = ?',
                [hashedPassword, 'admin']);
            console.log('✅ Admin password updated');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createTestOwner();