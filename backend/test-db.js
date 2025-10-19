import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'storeflow',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testDb() {
    try {
        console.log('Testing database connection...');
        const [rows] = await pool.query('SELECT 1 as test');
        console.log('Database connection successful:', rows);

        // Test users table
        const [userRows] = await pool.query('SELECT COUNT(*) as count FROM users');
        console.log('Users table accessible, count:', userRows[0].count);

        // Test all users
        const [allUsers] = await pool.query('SELECT id, username, role, active FROM users');
        console.log('All users:', allUsers);
    } catch (error) {
        console.error('Database error:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

testDb();