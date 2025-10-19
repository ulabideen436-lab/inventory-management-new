const axios = require('axios');

async function testAuthCredentials() {
    console.log('Testing various password combinations...');
    const credentials = [
        { username: 'owner', password: 'owner123' },
        { username: 'owner', password: 'password' },
        { username: 'owner', password: 'admin' }
    ];

    for (const creds of credentials) {
        try {
            const response = await axios.post('http://127.0.0.1:5000/auth/login', creds);
            console.log(`✅ SUCCESS: ${creds.username}/${creds.password} works!`);
            console.log(`   Token received: ${response.data.token ? 'Yes' : 'No'}`);
            return creds;
        } catch (error) {
            console.log(`❌ FAILED: ${creds.username}/${creds.password} - ${error.response?.data?.message || error.message}`);
        }
    }
    console.log('❌ No valid credentials found');
}

testAuthCredentials();