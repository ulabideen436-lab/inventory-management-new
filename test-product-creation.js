import axios from 'axios';

async function testProductCreation() {
    try {
        // Login first
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'admin123'
        });

        const token = loginResponse.data.token;

        // Test product creation
        const productData = {
            name: 'Test Product',
            sku: 'TEST001',
            uom: 'pcs',
            retail_price: 100.00,
            cost_price: 80.00,
            stock_quantity: 50
        };

        console.log('Testing product creation with data:', productData);

        const productResponse = await axios.post('http://localhost:5000/products', productData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Product creation response:', productResponse.status, productResponse.data);

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testProductCreation();