import axios from 'axios';

async function testSalesCreation() {
    try {
        // Login first
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'admin123'
        });

        const token = loginResponse.data.token;

        // Get a customer ID and product ID from existing data
        const customersResponse = await axios.get('http://localhost:5000/customers', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const productsResponse = await axios.get('http://localhost:5000/products', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (customersResponse.data.length === 0 || productsResponse.data.length === 0) {
            console.log('No customers or products available for testing');
            return;
        }

        const customer = customersResponse.data[0];
        const product = productsResponse.data[0];

        console.log('Using customer:', customer.id, customer.name);
        console.log('Using product:', product.id, product.name, 'Retail price:', product.retail_price);

        // Test sales creation with proper data structure
        const saleData = {
            customer_id: customer.id,
            customer_type: 'retail',
            items: [{
                product_id: product.id,
                quantity: 2,
                price: parseFloat(product.retail_price)
            }],
            subtotal: parseFloat(product.retail_price) * 2,
            discount_type: 'none',
            discount_value: 0,
            discount_amount: 0,
            total_amount: parseFloat(product.retail_price) * 2
        };

        console.log('Testing sale creation with data:', JSON.stringify(saleData, null, 2));

        const saleResponse = await axios.post('http://localhost:5000/sales', saleData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Sale creation response:', saleResponse.status, saleResponse.data);

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testSalesCreation();