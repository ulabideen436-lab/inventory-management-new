const axios = require('axios');

// Test script to diagnose product update issues
async function testProductUpdate() {
    const baseURL = 'http://localhost:5000';

    // Test data
    const testProduct = {
        name: 'Test Product Update',
        brand: 'Test Brand',
        design_no: 'TEST001',
        location: 'Warehouse A',
        uom: 'pcs',
        retail_price: 100,
        wholesale_price: 80,
        cost_price: 60,
        stock_quantity: 50,
        supplier: 'Test Supplier'
    };

    try {
        console.log('🔍 Testing Product Update API...\n');

        // Step 1: Get authentication token (assuming owner login)
        console.log('Step 1: Authenticating...');
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            username: 'owner', // Replace with actual credentials
            password: 'password' // Replace with actual credentials
        });

        const token = loginResponse.data.token;
        console.log('✅ Authentication successful\n');

        // Step 2: Get all products to find one to update
        console.log('Step 2: Fetching products...');
        const productsResponse = await axios.get(`${baseURL}/products`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const products = productsResponse.data;
        if (products.length === 0) {
            console.log('❌ No products found to update');
            return;
        }

        const productToUpdate = products[0];
        console.log(`✅ Found product to update: ${productToUpdate.name} (ID: ${productToUpdate.id})\n`);

        // Step 3: Test the update
        console.log('Step 3: Testing product update...');
        console.log('Original product data:', JSON.stringify(productToUpdate, null, 2));

        const updateData = {
            ...testProduct,
            name: `${productToUpdate.name} - UPDATED ${new Date().toLocaleTimeString()}`
        };

        console.log('Update data:', JSON.stringify(updateData, null, 2));

        const updateResponse = await axios.put(`${baseURL}/products/${productToUpdate.id}`, updateData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Product update successful!');
        console.log('Response:', JSON.stringify(updateResponse.data, null, 2));

    } catch (error) {
        console.log('❌ Error occurred:');

        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Status Text:', error.response.statusText);
            console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
            console.log('Request Headers:', JSON.stringify(error.config.headers, null, 2));
            console.log('Request Data:', JSON.stringify(error.config.data, null, 2));
        } else if (error.request) {
            console.log('Network Error - No response received');
            console.log('Request:', error.request);
        } else {
            console.log('Error Message:', error.message);
        }
    }
}

// Run the test
testProductUpdate();