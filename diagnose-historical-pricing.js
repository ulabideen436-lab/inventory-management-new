import axios from 'axios';

const baseURL = 'http://localhost:5000';
const testCredentials = { username: 'admin', password: 'admin123' };

async function diagnoseHistoricalPricing() {
    console.log('🔍 DIAGNOSING HISTORICAL PRICING ISSUE');
    console.log('======================================');

    try {
        // Step 1: Login
        const loginResponse = await axios.post(`${baseURL}/auth/login`, testCredentials);
        const authToken = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${authToken}` };

        console.log('✅ Authentication successful');

        // Step 2: Create test product
        const timestamp = Date.now();
        const testProductId = `HIST_${timestamp}`;

        const initialProduct = {
            id: testProductId,
            name: `Historical Test Product ${timestamp}`,
            uom: 'pcs',
            retail_price: 100.00,
            stock_quantity: 50
        };

        console.log('📦 Creating test product...');
        const productResponse = await axios.post(`${baseURL}/products`, initialProduct, { headers });
        console.log('✅ Product created:', productResponse.status);

        // Step 3: Create test customer
        const customer = {
            name: `Historical Test Customer ${timestamp}`,
            phone: `111111${timestamp.toString().slice(-4)}`,
            type: 'retail'
        };

        console.log('👥 Creating test customer...');
        const customerResponse = await axios.post(`${baseURL}/customers`, customer, { headers });
        const testCustomerId = customerResponse.data.id || customerResponse.data.insertId;
        console.log('✅ Customer created with ID:', testCustomerId);

        // Step 4: Create sale
        const sale = {
            customer_id: testCustomerId,
            items: [
                {
                    product_id: testProductId,
                    quantity: 1,
                    price: 100.00
                }
            ],
            payment_method: 'cash'
        };

        console.log('💰 Creating test sale...');
        console.log('Sale data:', JSON.stringify(sale, null, 2));

        try {
            const saleResponse = await axios.post(`${baseURL}/sales`, sale, { headers });
            console.log('✅ Sale created:', saleResponse.status);
            console.log('Sale response:', JSON.stringify(saleResponse.data, null, 2));

            const testSaleId = saleResponse.data.id || saleResponse.data.sale_id;
            console.log('Sale ID extracted:', testSaleId);

            // Step 5: Update product price
            console.log('📈 Updating product price...');
            const updatedProduct = { ...initialProduct, retail_price: 150.00 };
            const updateResponse = await axios.put(`${baseURL}/products/${testProductId}`, updatedProduct, { headers });
            console.log('✅ Product price updated:', updateResponse.status);

            // Step 6: Retrieve sale to check historical pricing
            console.log('🔍 Checking historical pricing...');
            const historicalSale = await axios.get(`${baseURL}/sales/${testSaleId}`, { headers });
            console.log('Sale details:', JSON.stringify(historicalSale.data, null, 2));

            // Cleanup
            console.log('🧹 Cleaning up...');
            await axios.delete(`${baseURL}/sales/${testSaleId}`, {
                headers,
                data: { password: testCredentials.password }
            });
            await axios.delete(`${baseURL}/products/${testProductId}`, {
                headers,
                data: { password: testCredentials.password }
            });
            await axios.delete(`${baseURL}/customers/${testCustomerId}`, {
                headers,
                data: { password: testCredentials.password }
            });
            console.log('✅ Cleanup completed');

        } catch (saleError) {
            console.log('❌ Sale creation failed:');
            console.log('Status:', saleError.response?.status);
            console.log('Message:', saleError.message);
            console.log('Response data:', saleError.response?.data);

            // Cleanup products and customers
            try {
                await axios.delete(`${baseURL}/products/${testProductId}`, {
                    headers,
                    data: { password: testCredentials.password }
                });
                await axios.delete(`${baseURL}/customers/${testCustomerId}`, {
                    headers,
                    data: { password: testCredentials.password }
                });
            } catch (cleanupError) {
                console.log('Cleanup error:', cleanupError.message);
            }
        }

    } catch (error) {
        console.log('❌ Diagnosis failed:');
        console.log('Error:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Response data:', error.response.data);
        }
    }
}

diagnoseHistoricalPricing();