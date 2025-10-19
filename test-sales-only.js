import axios from 'axios';

async function testSalesTransactionOnly() {
    const baseURL = 'http://localhost:5000';
    console.log('🔍 Testing only sales transaction functionality...');

    try {
        // Login
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            username: 'owner',
            password: 'admin123'
        });
        const token = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✅ Authentication successful');

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create test product with unique ID
        const testRunId = Date.now().toString().slice(-4); // Use last 4 digits
        const productData = {
            id: `T${testRunId}`, // T + 4 digits = 5 characters (under 12 limit)
            name: 'Final Test Product',
            uom: 'pcs',
            retail_price: 100.00,
            cost_price: 80.00,
            stock_quantity: 50
        };

        console.log('📦 Creating test product...');
        const productResponse = await axios.post(`${baseURL}/products`, productData, { headers });
        console.log('✅ Product created:', productData.id);

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create test customer
        const customerData = {
            name: 'Final Test Customer',
            email: `finaltest${testRunId}@example.com`,
            phone: '1234567890',
            address: 'Test Address',
            customer_type: 'retail',
            balance: 0.00
        };

        console.log('👤 Creating test customer...');
        const customerResponse = await axios.post(`${baseURL}/customers`, customerData, { headers });
        const customerId = customerResponse.data.id || customerResponse.data.customer_id;
        console.log('✅ Customer created:', customerId);

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create sale with correct price
        const saleData = {
            customer_id: customerId,
            items: [{
                product_id: productData.id,
                quantity: 2,
                price: 100.00  // Use the actual retail price
            }],
            total_amount: 200.00
        };

        console.log('💰 Creating sale...');
        console.log('Sale data:', JSON.stringify(saleData, null, 2));
        const saleResponse = await axios.post(`${baseURL}/sales`, saleData, { headers });
        console.log('✅ Sale created successfully:', saleResponse.data);

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verify stock reduction
        console.log('📊 Verifying stock reduction...');
        const productCheck = await axios.get(`${baseURL}/products/${productData.id}`, { headers });
        const currentStock = productCheck.data.stock_quantity;
        const expectedStock = 50 - 2; // 48

        if (currentStock === expectedStock) {
            console.log(`✅ Stock verification passed: ${currentStock} (expected ${expectedStock})`);
        } else {
            console.log(`❌ Stock verification failed: ${currentStock} (expected ${expectedStock})`);
        }

        // Cleanup
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('🧹 Cleaning up...');
        try {
            await axios.delete(`${baseURL}/products/${productData.id}`, {
                headers,
                data: { password: 'admin123' }
            });
            await axios.delete(`${baseURL}/customers/${customerId}`, {
                headers,
                data: { password: 'admin123' }
            });
            console.log('✅ Cleanup completed');
        } catch (cleanupError) {
            console.log('⚠️ Cleanup warning:', cleanupError.message);
        }

    } catch (error) {
        console.log('❌ Test failed:', error.response?.status, error.response?.data);
        console.log('Full error:', error.message);
    }
}

testSalesTransactionOnly();