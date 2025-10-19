import axios from 'axios';

async function testEndpoint() {
    try {
        // First login
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'admin',
            password: 'admin123'
        });
        const token = loginResponse.data.token;

        // Test deleted items endpoint
        const response = await axios.get('http://localhost:5000/deleted-items', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Deleted items endpoint working:', response.data.length, 'items found');
    } catch (error) {
        console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
    }
}

testEndpoint();