import axios from 'axios';

async function testReports() {
    try {
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'admin123'
        });
        const token = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        const reportsResponse = await axios.get('http://localhost:5000/reports', { headers });
        console.log('✅ Reports SUCCESS:', reportsResponse.status);
        console.log('Data keys:', Object.keys(reportsResponse.data));

        // Test sales report specifically
        const salesReportsResponse = await axios.get('http://localhost:5000/reports/sales', { headers });
        console.log('✅ Sales Reports SUCCESS:', salesReportsResponse.status);
        console.log('Sales data length:', salesReportsResponse.data.length);
    } catch (error) {
        console.log('❌ Reports ERROR:', error.response?.status);
        console.log('Error message:', error.response?.data);
        console.log('Full error:', error.message);
    }
}

testReports();