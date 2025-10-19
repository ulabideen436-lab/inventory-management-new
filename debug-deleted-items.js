import axios from 'axios';

async function debugDeletedItems() {
    try {
        // Login
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'admin',
            password: 'admin123'
        });
        const token = loginResponse.data.token;

        // Test deleted items endpoint
        const response = await axios.get('http://localhost:5000/deleted-items', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Success:', response.data.length, 'items found');

        if (response.data.length > 0) {
            console.log('First item:', JSON.stringify(response.data[0], null, 2));
        }
    } catch (error) {
        console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
        if (error.response?.data?.stack) {
            console.log('Stack trace:', error.response.data.stack);
        }
    }
}

debugDeletedItems();