import axios from 'axios';

async function testUserFetch() {
    try {
        console.log('Testing user fetch issue...');

        // First, try to login to get a valid token
        console.log('1. Attempting login...');
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'admin123'
        });

        console.log('Login successful, got token');
        const token = loginResponse.data.token;

        // Now try to fetch users with the valid token
        console.log('2. Attempting to fetch users...');
        const usersResponse = await axios.get('http://localhost:5000/users', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('✅ Users fetch successful!');
        console.log('Users found:', usersResponse.data.length);
        console.log('Users:', usersResponse.data.map(u => ({ id: u.id, username: u.username, role: u.role })));

    } catch (error) {
        console.log('❌ Error occurred:');
        console.log('Status:', error.response?.status);
        console.log('Message:', error.response?.data?.message || error.message);
        console.log('Full error:', error.response?.data);
    }
}

testUserFetch();