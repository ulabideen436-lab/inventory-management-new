import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function checkUsers() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'storeflow'
    });

    console.log('\n🔍 Checking users in database...\n');

    const [users] = await connection.query(`
        SELECT id, username, role, created_at 
        FROM users 
        ORDER BY created_at DESC
    `);

    console.log('📋 Found users:');
    console.table(users);

    console.log('\n💡 To run API tests, update test-system.js line 344-345 with one of these usernames and the correct password.\n');

    await connection.end();
}

checkUsers().catch(console.error);
