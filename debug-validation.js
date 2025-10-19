/**
 * DEBUG VALIDATION MIDDLEWARE
 * Quick test to see exact validation error messages
 */

import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5000';
const LOGIN_URL = `${BASE_URL}/auth/login`;
const SALES_URL = `${BASE_URL}/sales`;
const PRODUCTS_URL = `${BASE_URL}/products`;

let authToken = null;

async function authenticate() {
    try {
        const response = await axios.post(LOGIN_URL, {
            username: 'admin',
            password: 'admin123'
        });

        if (response.data.token) {
            authToken = response.data.token;
            console.log('✅ Authentication successful');
            return true;
        }
        return false;
    } catch (error) {
        console.log(`❌ Authentication failed: ${error.message}`);
        return false;
    }
}

async function testSingleValidTransaction() {
    try {
        // Get a product
        const productsResponse = await axios.get(PRODUCTS_URL, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const validProduct = productsResponse.data.find(p => p.retail_price > 0 && p.stock_quantity > 0);

        if (!validProduct) {
            console.log('❌ No valid products found');
            return;
        }

        console.log(`Using product: ${validProduct.name} (ID: ${validProduct.id}) - Price: ${validProduct.retail_price}`);

        // Create a minimal valid sale to see what exactly fails
        const testSale = {
            customer_id: null,
            customer_type: 'retail',
            items: [{
                product_id: validProduct.id,
                quantity: 1,
                price: parseFloat(validProduct.retail_price)
            }],
            subtotal: parseFloat(validProduct.retail_price),
            discount_type: 'none',
            discount_value: 0,
            discount_amount: 0,
            total_amount: parseFloat(validProduct.retail_price),
            payment_method: 'cash',
            paid_amount: parseFloat(validProduct.retail_price)
        };

        console.log('Sending sale data:', JSON.stringify(testSale, null, 2));

        const response = await axios.post(SALES_URL, testSale, {
            headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200 || response.status === 201) {
            console.log('✅ Transaction successful!');
            console.log('Response:', response.data);
        }

    } catch (error) {
        console.log('❌ Transaction failed');
        console.log('Status:', error.response?.status);
        console.log('Error message:', error.response?.data?.message);
        console.log('Full error data:', JSON.stringify(error.response?.data, null, 2));
    }
}

async function main() {
    console.log('🔍 DEBUGGING VALIDATION ERRORS\n');

    if (await authenticate()) {
        await testSingleValidTransaction();
    }
}

main().catch(console.error);