/**
 * SIMPLE CUSTOMER ID CHANGE TEST
 * 
 * This test specifically focuses on testing customer ID assignment
 * during sale edits to debug the server error.
 */

import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5000';
const LOGIN_URL = `${BASE_URL}/auth/login`;
const SALES_URL = `${BASE_URL}/sales`;
const CUSTOMERS_URL = `${BASE_URL}/customers`;
const PRODUCTS_URL = `${BASE_URL}/products`;

let authToken = '';

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

async function main() {
    console.log('🔍 Testing Customer ID Assignment in Sale Edits...\n');

    if (!(await authenticate())) {
        process.exit(1);
    }

    try {
        // Get customers
        const customersResponse = await axios.get(CUSTOMERS_URL, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const customers = customersResponse.data;
        console.log(`📝 Found ${customers.length} customers in system`);

        if (customers.length > 0) {
            console.log(`   First customer: ID ${customers[0].id}, Name: ${customers[0].name}`);
        }

        // Get a product for the test sale
        const productsResponse = await axios.get(PRODUCTS_URL, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const products = productsResponse.data;
        const testProduct = products.find(p => p.stock_quantity > 5);

        if (!testProduct) {
            console.log('❌ No suitable products found for test sale');
            return;
        }

        console.log(`📦 Using product: ${testProduct.name} (ID: ${testProduct.id}, Stock: ${testProduct.stock_quantity})`);

        // Create a sale without customer assignment
        const saleData = {
            customer_id: null,
            customer_type: 'retail',
            items: [{
                product_id: testProduct.id,
                quantity: 1,
                price: parseFloat(testProduct.retail_price)
            }],
            subtotal: parseFloat(testProduct.retail_price),
            discount_type: 'none',
            discount_value: 0,
            discount_amount: 0,
            total_amount: parseFloat(testProduct.retail_price),
            payment_method: 'cash',
            paid_amount: parseFloat(testProduct.retail_price)
        };

        console.log('\n🛒 Creating test sale...');
        const saleResponse = await axios.post(SALES_URL, saleData, {
            headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        const saleId = saleResponse.data.sale_id;
        console.log(`✅ Sale created - ID: ${saleId}`);

        // Get the created sale to see its structure
        console.log('\n📋 Getting sale details...');
        const getSaleResponse = await axios.get(`${SALES_URL}/${saleId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('Sale details:', JSON.stringify(getSaleResponse.data, null, 2));

        // Now try to update customer assignment
        if (customers.length > 0) {
            console.log(`\n✏️  Attempting to assign customer ${customers[0].id} to sale ${saleId}...`);

            const updateData = {
                customer_id: customers[0].id,
                items: [{
                    product_id: testProduct.id,
                    quantity: 1,
                    price: parseFloat(testProduct.retail_price)
                }]
            };

            console.log('Update data:', JSON.stringify(updateData, null, 2));

            const updateResponse = await axios.put(`${SALES_URL}/${saleId}`, updateData, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Customer assignment successful!');
            console.log('Updated sale:', JSON.stringify(updateResponse.data, null, 2));
        } else {
            console.log('⚠️  No customers available for assignment test');
        }

    } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
        console.log('Status:', error.response?.status);
        console.log('Error details:', JSON.stringify(error.response?.data, null, 2));
    }
}

main().catch(console.error);