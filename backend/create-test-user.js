import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function createTestUser() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'storeflow'
    });

    console.log('\n🔧 Creating test user for automated testing...\n');

    const testUsername = 'testowner';
    const testPassword = 'test123';

    try {
        // Check if user already exists
        const [existing] = await connection.query(
            'SELECT id FROM users WHERE username = ?',
            [testUsername]
        );

        if (existing.length > 0) {
            console.log('⚠️  Test user already exists. Updating password...');
            const hashedPassword = await bcrypt.hash(testPassword, 10);
            await connection.query(
                'UPDATE users SET password = ? WHERE username = ?',
                [hashedPassword, testUsername]
            );
            console.log('✅ Test user password updated');
        } else {
            console.log('📝 Creating new test user...');
            const hashedPassword = await bcrypt.hash(testPassword, 10);
            await connection.query(
                `INSERT INTO users (username, password, role, created_at) 
                 VALUES (?, ?, 'owner', NOW())`,
                [testUsername, hashedPassword]
            );
            console.log('✅ Test user created successfully');
        }

        console.log('\n📋 Test User Credentials:');
        console.log('   Username: testowner');
        console.log('   Password: test123');
        console.log('   Role:     owner');
        console.log('\n💡 These credentials can now be used in test-system.js\n');

    } catch (error) {
        console.error('❌ Error creating test user:', error.message);
    } finally {
        await connection.end();
    }
}

createTestUser().catch(console.error);
