import bcrypt from 'bcrypt';
import { pool } from './backend/src/models/db.js';

async function createTestUser() {
    try {
        // Check if test user already exists
        const [existingUsers] = await pool.execute(
            'SELECT * FROM users WHERE username = ?',
            ['testowner']
        );

        if (existingUsers.length > 0) {
            console.log('Test user already exists');
            return;
        }

        // Create test user
        const hashedPassword = await bcrypt.hash('admin123', 10);

        await pool.execute(
            'INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)',
            ['testowner', hashedPassword, 'owner', 'Test Owner', 'test@owner.com']
        );

        console.log('Test user created successfully');
        console.log('Username: testowner');
        console.log('Password: admin123');
        console.log('Role: owner');

    } catch (error) {
        console.error('Error creating test user:', error.message);
    } finally {
        process.exit(0);
    }
}

createTestUser();