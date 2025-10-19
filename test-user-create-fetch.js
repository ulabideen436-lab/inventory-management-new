import axios from 'axios';

async function testUserCreateAndFetch() {
    console.log('Testing user creation followed by user fetch...\n');

    try {
        // First, login to get a fresh token
        console.log('1. Getting fresh token...');
        const loginResponse = await axios.post('http://127.0.0.1:5000/auth/login', {
            username: 'owner',
            password: 'admin123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Token obtained');

        // Create a test user
        console.log('2. Creating a test user...');
        const createResponse = await axios.post('http://127.0.0.1:5000/users', {
            username: 'testuser' + Date.now(),
            password: 'testpass123',
            role: 'cashier',
            email: 'test@example.com',
            full_name: 'Test User'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ User created successfully');

        // Immediately try to fetch users (like the frontend does)
        console.log('3. Fetching users immediately after creation...');
        const fetchResponse = await axios.get('http://127.0.0.1:5000/users', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Users fetched successfully');
        console.log('Users count:', fetchResponse.data.length);

        // Wait a bit and try again
        console.log('4. Waiting 1 second and trying again...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        const fetchResponse2 = await axios.get('http://127.0.0.1:5000/users', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Second fetch successful');
        console.log('Users count:', fetchResponse2.data.length);

    } catch (error) {
        console.log('❌ Error occurred:');
        console.log('Status:', error.response?.status);
        console.log('Message:', error.response?.data?.message || error.message);
        console.log('Step failed at:', error.config?.url);

        if (error.response?.status === 429) {
            console.log('\n💡 Rate limiting is still affecting API calls');
        } else if (error.response?.status === 401) {
            console.log('\n💡 Authentication issue - token might be invalid');
        }
    }
}

testUserCreateAndFetch();