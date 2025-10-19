import axios from 'axios';

async function quickSupplierTest() {
    try {
        const loginRes = await axios.post('http://127.0.0.1:5000/auth/login', {
            username: 'admin',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('✅ Logged in\n');

        const res = await axios.get('http://127.0.0.1:5000/suppliers/20/history', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Supplier History Response:');
        console.log(JSON.stringify(res.data, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

quickSupplierTest();
