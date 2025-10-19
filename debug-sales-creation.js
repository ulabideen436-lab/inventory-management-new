import axios from 'axios';

async function testSalesCreation() {
    try {
        // Login
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'admin123'
        });
        const token = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // Get available products and customers
        const products = await axios.get('http://localhost:5000/products', { headers });
        const customers = await axios.get('http://localhost:5000/customers', { headers });

        console.log('Available products:', products.data.slice(0, 2).map(p => ({ id: p.id, name: p.name, stock: p.stock_quantity })));
        console.log('Available customers:', customers.data.slice(0, 2).map(c => ({ id: c.id, name: c.name })));

        if (products.data.length > 0 && customers.data.length > 0) {
            const product = products.data[0];
            const customer = customers.data[0];

            const saleData = {
                customer_id: customer.id,
                items: [{
                    product_id: product.id,
                    quantity: 2,
                    price: 99.99
                }],
                total_amount: 199.98
            };

            console.log('Attempting to create sale with data:', saleData);

            const saleResponse = await axios.post('http://localhost:5000/sales', saleData, { headers });
            console.log('✅ Sale created successfully:', saleResponse.data);
        }

    } catch (error) {
        console.log('❌ Sales creation failed:', error.response?.status);
        console.log('Error details:', error.response?.data);
        console.log('Full error:', error.message);
    }
}

testSalesCreation();