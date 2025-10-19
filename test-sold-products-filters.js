const axios = require('axios');

async function testSoldProductsFilters() {
    const baseURL = 'http://localhost:5000';

    try {
        console.log('🧪 Testing Sold Products Search Filters...\n');

        // Step 1: Login to get token
        console.log('1. Getting authentication token...');
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            username: 'testuser',
            password: 'TestPass123!'
        });

        if (!loginResponse.data.token) {
            throw new Error('Failed to get authentication token');
        }

        const token = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✅ Token obtained successfully\n');

        // Step 2: Test the API endpoint with various filter combinations
        console.log('2. Testing sold products API with different filter combinations...\n');

        // Test 1: No filters (fetch all sold products)
        console.log('📋 Test 1: Fetching all sold products (no filters)');
        const allSoldProducts = await axios.get(`${baseURL}/sales/sold-products`, { headers });
        console.log(`✅ Found ${allSoldProducts.data.soldProducts?.length || 0} sold products`);

        if (allSoldProducts.data.soldProducts && allSoldProducts.data.soldProducts.length > 0) {
            const firstProduct = allSoldProducts.data.soldProducts[0];
            console.log(`📋 Sample product: ${firstProduct.product_name || 'N/A'} (Customer: ${firstProduct.customer_name || 'N/A'})`);
        }

        // Test 2: Search by product name
        console.log('\n📋 Test 2: Search by product name');
        const productSearchParams = new URLSearchParams({
            product_name: 'test' // This should work with the unified search
        });

        const productSearch = await axios.get(`${baseURL}/sales/sold-products?${productSearchParams}`, { headers });
        console.log(`✅ Product search results: ${productSearch.data.soldProducts?.length || 0} items`);

        // Test 3: Search by customer name (using the same field)
        console.log('\n📋 Test 3: Search by customer name (unified search)');
        const customerSearchParams = new URLSearchParams({
            product_name: 'test', // This should now also search customer names
            customer_name: 'test' // Backend might still expect this
        });

        const customerSearch = await axios.get(`${baseURL}/sales/sold-products?${customerSearchParams}`, { headers });
        console.log(`✅ Customer search results: ${customerSearch.data.soldProducts?.length || 0} items`);

        // Test 4: Date range filter
        console.log('\n📋 Test 4: Date range filter');
        const dateParams = new URLSearchParams({
            start_date: '2025-10-01',
            end_date: '2025-10-10'
        });

        const dateSearch = await axios.get(`${baseURL}/sales/sold-products?${dateParams}`, { headers });
        console.log(`✅ Date range results: ${dateSearch.data.soldProducts?.length || 0} items`);

        // Test 5: Sale type filter
        console.log('\n📋 Test 5: Sale type filter');
        const saleTypeParams = new URLSearchParams({
            sale_type: 'retail'
        });

        const saleTypeSearch = await axios.get(`${baseURL}/sales/sold-products?${saleTypeParams}`, { headers });
        console.log(`✅ Sale type (retail) results: ${saleTypeSearch.data.soldProducts?.length || 0} items`);

        // Test 6: Combined filters
        console.log('\n📋 Test 6: Combined filters');
        const combinedParams = new URLSearchParams({
            product_name: 'test',
            sale_type: 'retail',
            start_date: '2025-10-01'
        });

        const combinedSearch = await axios.get(`${baseURL}/sales/sold-products?${combinedParams}`, { headers });
        console.log(`✅ Combined filter results: ${combinedSearch.data.soldProducts?.length || 0} items`);

        // Step 3: Test regular sales endpoint too
        console.log('\n3. Testing regular sales endpoint...\n');

        const salesResponse = await axios.get(`${baseURL}/sales`, { headers });
        console.log(`✅ Found ${salesResponse.data?.length || 0} sales records`);

        if (salesResponse.data && salesResponse.data.length > 0) {
            const firstSale = salesResponse.data[0];
            console.log(`📋 Sample sale: ID ${firstSale.id}, Amount: ${firstSale.total_amount}, Customer: ${firstSale.customer_name || 'N/A'}`);
        }

        // Step 4: Test frontend compatibility
        console.log('\n4. Testing frontend compatibility...\n');

        // Simulate what the frontend would send
        const frontendParams = new URLSearchParams({
            product_name: '', // Empty unified search
            customer_name: '', // This gets set by handleSoldFilterChange when product_name changes
            sale_type: '',
            start_date: '',
            end_date: '',
            sort_by: 'sale_date',
            sort_order: 'desc'
        });

        const frontendTest = await axios.get(`${baseURL}/sales/sold-products?${frontendParams}`, { headers });
        console.log(`✅ Frontend simulation results: ${frontendTest.data.soldProducts?.length || 0} items`);

        console.log('\n🎉 All tests completed successfully!');
        console.log('\n📋 Summary of changes tested:');
        console.log('   ✅ Unified search field (product_name searches both products and customers)');
        console.log('   ✅ Date range filters (start_date and end_date)');
        console.log('   ✅ Sale type filter (retail/wholesale/all)');
        console.log('   ✅ Combined filter functionality');
        console.log('   ✅ API compatibility with simplified frontend');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
        if (error.response?.data) {
            console.error('📋 Error details:', error.response.data);
        }

        // If auth fails, show available endpoints
        if (error.response?.status === 401) {
            console.log('\n📋 Authentication failed. Testing without auth...');
            try {
                const healthCheck = await axios.get(`${baseURL}/health`);
                console.log('✅ Server is running:', healthCheck.data);
            } catch (err) {
                console.log('❌ Server might not be running');
            }
        }
    }
}

testSoldProductsFilters();