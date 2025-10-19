import axios from 'axios';

async function checkSaleItems() {
    try {
        const loginRes = await axios.post('http://localhost:5000/auth/login', {
            username: 'admin',
            password: 'admin123'
        });
        const token = loginRes.data.token;

        // Check sale #85
        const saleRes = await axios.get('http://localhost:5000/sales/85', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Sale #85 Details:');
        console.log(JSON.stringify(saleRes.data, null, 2));

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

checkSaleItems();
