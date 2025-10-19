import axios from 'axios';

// Test configuration
const baseURL = 'http://localhost:5000';
const testCredentials = {
    username: 'admin',
    password: 'admin123'
};

async function testSalesAPI() {
    try {
        console.log('🔍 TESTING SALES API SPECIFICALLY');
        console.log('==================================');

        // Login first
        const loginResponse = await axios.post(`${baseURL}/auth/login`, testCredentials);
        const authToken = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${authToken}` };

        console.log('✅ Authentication successful');

        const timestamp = Date.now();
        let testProductId = `SALETEST_${timestamp}`;
        let testCustomerId = null;
        let testSaleId = null;

        // Create test product for sale
        console.log('\n📦 Creating test product...');
        const testProduct = {
            id: testProductId,
            name: `Sale Test Product ${timestamp}`,
            brand: 'Test Brand',
            uom: 'pcs',
            retail_price: 150.00,
            wholesale_price: 120.00,
            cost_price: 90.00,
            stock_quantity: 100
        };

        try {
            await axios.post(`${baseURL}/products`, testProduct, { headers });
            console.log('✅ Test product created');
        } catch (productError) {
            console.log(`❌ Product creation failed: ${productError.response?.status} - ${productError.response?.data?.message || productError.message}`);
            return;
        }

        // Create test customer
        console.log('\n👥 Creating test customer...');
        const testCustomer = {
            name: `Sale Test Customer ${timestamp}`,
            phone: `987654${timestamp.toString().slice(-4)}`,
            type: 'retail'
        };

        try {
            const customerResponse = await axios.post(`${baseURL}/customers`, testCustomer, { headers });
            testCustomerId = customerResponse.data.id || customerResponse.data.insertId;
            console.log(`✅ Test customer created with ID: ${testCustomerId}`);
        } catch (customerError) {
            console.log(`❌ Customer creation failed: ${customerError.response?.status} - ${customerError.response?.data?.message || customerError.message}`);
            return;
        }

        // Test CREATE sale
        console.log('\n💰 Creating test sale...');
        const newSale = {
            customer_id: testCustomerId,
            items: [
                {
                    product_id: testProductId,
                    quantity: 2,
                    price: 150.00,
                    item_discount_type: 'percentage',
                    item_discount_value: 10,
                    item_discount_amount: 30.00
                }
            ],
            discount_type: 'percentage',
            discount_value: 5,
            payment_method: 'cash',
            notes: 'Test sale transaction'
        };

        try {
            const createSaleResponse = await axios.post(`${baseURL}/sales`, newSale, { headers });
            testSaleId = createSaleResponse.data.id || createSaleResponse.data.saleId;
            console.log(`✅ Sale created successfully with ID: ${testSaleId}`);
            console.log(`   Response data:`, createSaleResponse.data);
        } catch (saleError) {
            console.log(`❌ Sale creation failed: ${saleError.response?.status} - ${saleError.response?.data?.message || saleError.message}`);
            console.log('   Full error response:', saleError.response?.data);
            console.log('   Sale data sent:', JSON.stringify(newSale, null, 2));
        }

        // Test reading sales
        if (testSaleId) {
            console.log('\n📊 Testing sales retrieval...');
            try {
                const salesResponse = await axios.get(`${baseURL}/sales`, { headers });
                console.log(`✅ Sales list retrieved: ${salesResponse.data.length} sales found`);

                const saleDetailResponse = await axios.get(`${baseURL}/sales/${testSaleId}`, { headers });
                console.log(`✅ Sale detail retrieved for ID: ${testSaleId}`);
            } catch (readError) {
                console.log(`❌ Sales reading failed: ${readError.response?.status} - ${readError.response?.data?.message || readError.message}`);
            }
        }

        // Cleanup
        console.log('\n🧹 Cleaning up...');
        try {
            if (testSaleId) {
                await axios.delete(`${baseURL}/sales/${testSaleId}`, {
                    headers,
                    data: { password: testCredentials.password }
                });
                console.log('✅ Test sale deleted');
            }
        } catch (deleteSaleError) {
            console.log(`⚠️ Sale deletion failed: ${deleteSaleError.response?.status} - ${deleteSaleError.response?.data?.message || deleteSaleError.message}`);
        }

        try {
            await axios.delete(`${baseURL}/products/${testProductId}`, {
                headers,
                data: { password: testCredentials.password }
            });
            console.log('✅ Test product deleted');
        } catch (deleteProductError) {
            console.log(`⚠️ Product deletion failed: ${deleteProductError.response?.status} - ${deleteProductError.response?.data?.message || deleteProductError.message}`);
        }

        try {
            await axios.delete(`${baseURL}/customers/${testCustomerId}`, {
                headers,
                data: { password: testCredentials.password }
            });
            console.log('✅ Test customer deleted');
        } catch (deleteCustomerError) {
            console.log(`⚠️ Customer deletion failed: ${deleteCustomerError.response?.status} - ${deleteCustomerError.response?.data?.message || deleteCustomerError.message}`);
        }

    } catch (error) {
        console.error('❌ Sales API test failed:', error.message);
    }
}

testSalesAPI();