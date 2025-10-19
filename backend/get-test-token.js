import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'http://localhost:5000';

async function getToken() {
    console.log('🔐 Attempting to get authentication token...\n');

    try {
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            username: 'testowner',
            password: 'test123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Successfully obtained token!\n');
        console.log('Token:', token);
        console.log('\n📋 You can use this token for manual API testing:');
        console.log('Authorization: Bearer ' + token);
        console.log('\n💡 Token will be valid for the session duration.');

        return token;

    } catch (error) {
        if (error.response?.status === 429) {
            console.error('❌ Rate limit exceeded (429)');
            console.log('\n⏰ The auth endpoint allows 20 requests per 15 minutes.');
            console.log('   Please wait a few minutes and try again.');
            console.log('\n💡 Alternative: Restart the backend server to reset rate limits:');
            console.log('   cd "d:\\Inventory managment\\backend"');
            console.log('   npm start');
        } else if (error.response?.status === 401) {
            console.error('❌ Invalid credentials (401)');
            console.log('\n💡 Run this to create/update the test user:');
            console.log('   node create-test-user.js');
        } else {
            console.error('❌ Error:', error.response?.data?.message || error.message);
        }
        process.exit(1);
    }
}

getToken();
