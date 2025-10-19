const fetch = require('node-fetch');

async function testUsersAPI() {
    try {
        console.log('Testing users API...');

        // First login as owner to get token
        console.log('1. Logging in as owner...');
        const loginResponse = await fetch('http://localhost:3001/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'owner',
                password: 'owner123'
            })
        });

        if (!loginResponse.ok) {
            console.log('❌ Login failed:', loginResponse.status, loginResponse.statusText);
            return;
        }

        const loginData = await loginResponse.json();
        console.log('✅ Login successful');

        const token = loginData.token;
        console.log('Token received:', token ? 'Yes' : 'No');

        // Test users endpoint
        console.log('\n2. Fetching users...');
        const usersResponse = await fetch('http://localhost:3001/users', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', usersResponse.status);
        console.log('Response headers:', Object.fromEntries(usersResponse.headers.entries()));

        if (!usersResponse.ok) {
            const errorText = await usersResponse.text();
            console.log('❌ Users fetch failed:', usersResponse.status, usersResponse.statusText);
            console.log('Error body:', errorText);
            return;
        }

        const users = await usersResponse.json();
        console.log('✅ Users fetched successfully:');
        console.table(users);

    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

testUsersAPI();