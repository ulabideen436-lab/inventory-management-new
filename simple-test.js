import axios from 'axios';

async function simpleTest() {
    try {
        console.log('Testing basic health endpoint...');
        const healthResponse = await axios.get('http://localhost:5000/health');
        console.log('✅ Health check passed:', healthResponse.data);

        console.log('Testing login...');
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'admin',
            password: 'admin123'
        });
        console.log('✅ Login successful');

        console.log('Testing deleted items endpoint...');
        const token = loginResponse.data.token;
        const response = await axios.get('http://localhost:5000/deleted-items', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Deleted items endpoint working:', response.data);

    } catch (error) {
        console.error('❌ Error:', error.code, error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

simpleTest();