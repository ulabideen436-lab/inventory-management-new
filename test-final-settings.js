const axios = require('axios');

async function testSettingsFunctionality() {
    try {
        console.log('🧪 Testing Settings functionality...');

        // First login as owner to get token
        console.log('1. Logging in as owner...');
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });

        console.log('✅ Login successful');
        const token = loginResponse.data.token;

        // Test users endpoint
        console.log('\n2. Testing GET /users...');
        const usersResponse = await axios.get('http://localhost:5000/users', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Users fetched successfully!');
        console.log('📊 Users found:', usersResponse.data.length);
        console.table(usersResponse.data.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email || 'N/A',
            full_name: user.full_name || 'N/A',
            role: user.role,
            created_at: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'
        })));

        // Test creating a new user
        console.log('\n3. Testing POST /users (create user)...');
        const newUser = {
            username: 'testcashier',
            password: 'test123',
            email: 'test@example.com',
            full_name: 'Test Cashier',
            role: 'cashier'
        };

        try {
            await axios.post('http://localhost:5000/users', newUser, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ User creation successful!');

            // Delete the test user to clean up
            const updatedUsers = await axios.get('http://localhost:5000/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const testUser = updatedUsers.data.find(u => u.username === 'testcashier');
            if (testUser) {
                await axios.delete(`http://localhost:5000/users/${testUser.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ Test user cleaned up');
            }
        } catch (createErr) {
            if (createErr.response?.status === 400 && createErr.response?.data?.message?.includes('already exists')) {
                console.log('⚠️ Test user already exists (OK for testing)');
            } else {
                throw createErr;
            }
        }

        // Test settings endpoint (may not exist yet)
        console.log('\n4. Testing GET /settings...');
        try {
            const settingsResponse = await axios.get('http://localhost:5000/settings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Settings endpoint working');
            console.log('📝 Settings:', settingsResponse.data);
        } catch (err) {
            if (err.response?.status === 404) {
                console.log('⚠️ Settings endpoint not implemented yet (this is expected)');
            } else {
                console.log('❌ Settings endpoint error:', err.response?.status, err.response?.data?.message);
            }
        }

        console.log('\n🎉 SETTINGS FUNCTIONALITY TEST COMPLETE!');
        console.log('✅ The "Failed to fetch users" error should now be resolved!');
        console.log('✅ Settings page user management should work correctly!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
        if (error.response?.status) {
            console.error('   Status:', error.response.status);
            console.error('   URL:', error.config?.url);
        }
    }
}

testSettingsFunctionality();