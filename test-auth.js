const axios = require('axios');

async function testAuth() {
    try {
        console.log('Testing authentication...');
        const response = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'password'
        });
        console.log('Auth successful:', response.data);
    } catch (error) {
        console.log('Auth failed:', error.response?.data || error.message);
    }
}

testAuth();