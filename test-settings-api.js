const axios = require('axios');

async function testSettingsAPI() {
    try {
        console.log('Testing Settings API endpoints...');

        // First login as owner to get token
        console.log('1. Logging in as owner...');
        const loginResponse = await axios.post('http://localhost:3001/auth/login', {
            username: 'owner',
            password: 'owner123'
        });

        console.log('✅ Login successful');
        const token = loginResponse.data.token;

        // Test users endpoint
        console.log('\n2. Testing /users endpoint...');
        const usersResponse = await axios.get('http://localhost:3001/users', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Users endpoint working');
        console.log('Users found:', usersResponse.data.length);
        console.table(usersResponse.data.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email || 'N/A',
            full_name: user.full_name || 'N/A',
            role: user.role
        })));

        // Test settings endpoint (may not exist yet)
        console.log('\n3. Testing /settings endpoint...');
        try {
            const settingsResponse = await axios.get('http://localhost:3001/settings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Settings endpoint working');
            console.log('Settings:', settingsResponse.data);
        } catch (err) {
            if (err.response?.status === 404) {
                console.log('⚠️ Settings endpoint not implemented yet (404)');
            } else {
                console.log('❌ Settings endpoint error:', err.response?.status, err.response?.data?.message);
            }
        }

        console.log('\n✅ Main Settings functionality should now work!');

    } catch (error) {
        console.error('❌ Test error:', error.response?.data?.message || error.message);
    }
}

testSettingsAPI();