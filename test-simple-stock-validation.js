/**
 * SIMPLE STOCK VALIDATION TEST
 * 
 * Basic test to verify zero stock prevention is working
 */

import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5000';
const LOGIN_URL = `${BASE_URL}/auth/login`;
const PRODUCTS_URL = `${BASE_URL}/products`;
const SALES_URL = `${BASE_URL}/sales`;

async function testZeroStockValidation() {
    console.log('🧪 TESTING ZERO STOCK VALIDATION\n');

    try {
        // Authenticate
        console.log('Authenticating...');
        const authResponse = await axios.post(LOGIN_URL, {
            username: 'admin',
            password: 'admin123'
        });

        if (!authResponse.data.token) {
            console.log('❌ Authentication failed');
            return;
        }

        const authToken = authResponse.data.token;
        console.log('✅ Authentication successful\n');

        // Get products
        console.log('Fetching products...');
        const productsResponse = await axios.get(PRODUCTS_URL, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const products = productsResponse.data;
        console.log(`✅ Found ${products.length} products\n`);

        // Find zero stock product
        const zeroStockProduct = products.find(p => parseInt(p.stock_quantity) === 0);

        if (!zeroStockProduct) {
            console.log('⚠️  No zero-stock products found');
            return;
        }

        console.log(`🎯 Testing with zero-stock product: ${zeroStockProduct.name} (Stock: ${zeroStockProduct.stock_quantity})\n`);

        // Attempt to sell zero-stock product
        const saleData = {
            customer_id: null,
            customer_type: 'retail',
            items: [{
                product_id: zeroStockProduct.id,
                quantity: 1,
                price: parseFloat(zeroStockProduct.retail_price)
            }],
            subtotal: parseFloat(zeroStockProduct.retail_price),
            discount_type: 'none',
            discount_value: 0,
            discount_amount: 0,
            total_amount: parseFloat(zeroStockProduct.retail_price),
            payment_method: 'cash',
            paid_amount: parseFloat(zeroStockProduct.retail_price)
        };

        console.log('Attempting to sell zero-stock product...');

        const response = await axios.post(SALES_URL, saleData, {
            headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        // If we reach here, the sale was allowed (which should NOT happen)
        console.log('🚨 CRITICAL ERROR: Zero-stock sale was allowed!');
        console.log(`Sale ID: ${response.data.sale_id}`);

    } catch (error) {
        if (error.response?.status === 400) {
            const errorMessage = error.response.data.message;
            if (errorMessage.includes('out of stock') || errorMessage.includes('Insufficient stock')) {
                console.log('✅ SUCCESS: Zero-stock sale was correctly rejected');
                console.log(`Rejection reason: ${errorMessage}`);
                console.log('\n🎉 ZERO STOCK PREVENTION IS WORKING CORRECTLY!');
            } else {
                console.log(`❌ Unexpected validation error: ${errorMessage}`);
            }
        } else {
            console.log(`❌ Error: ${error.message}`);
        }
    }
}

testZeroStockValidation();