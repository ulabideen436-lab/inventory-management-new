import axios from 'axios';

async function testApiDirectly() {
    console.log('Testing API connectivity directly...\n');

    try {
        // First, try to login to get a fresh token
        console.log('1. Testing login...');
        const loginResponse = await axios.post('http://127.0.0.1:5000/auth/login', {
            username: 'owner',
            password: 'admin123'
        });

        console.log('✅ Login successful');
        const token = loginResponse.data.token;

        // Now test the users endpoint
        console.log('2. Testing users endpoint...');
        const usersResponse = await axios.get('http://127.0.0.1:5000/users', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Users endpoint successful');
        console.log('Users count:', usersResponse.data.length);
        console.log('Users:', usersResponse.data.map(u => ({
            id: u.id,
            username: u.username,
            role: u.role,
            active: u.active
        })));

        // Test if it's a CORS issue by checking response headers
        console.log('\n3. Response headers check:');
        console.log('Content-Type:', usersResponse.headers['content-type']);
        console.log('Status:', usersResponse.status);

    } catch (error) {
        console.log('❌ Error occurred:');
        console.log('Status:', error.response?.status);
        console.log('Status Text:', error.response?.statusText);
        console.log('Message:', error.response?.data?.message || error.message);
        console.log('Full Response:', error.response?.data);

        if (error.response?.status === 429) {
            console.log('\n💡 Rate limiting detected');
        } else if (error.response?.status === 401) {
            console.log('\n💡 Authentication issue');
        } else if (error.response?.status === 500) {
            console.log('\n💡 Server error - check backend logs');
        }
    }
}

testApiDirectly();