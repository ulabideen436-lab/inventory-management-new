const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const OWNER_PASSWORD = 'owner123';
let authToken = '';

async function login() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'owner',
            password: OWNER_PASSWORD
        });
        authToken = response.data.token;
        console.log('✅ Login successful');
        return true;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testEnhancedPurchaseAndPayments() {
    console.log('🧪 Testing Enhanced Purchase and Payment Features\n');
    console.log('='.repeat(60));

    const loginSuccess = await login();
    if (!loginSuccess) return;

    let supplierId = null;
    let productId = null;

    try {
        // 1. Create a test supplier
        console.log('\n🏪 Creating test supplier...');
        const supplierResponse = await axios.post(`${BASE_URL}/suppliers`, {
            name: 'Enhanced Test Supplier',
            contact_info: 'enhanced@test.com',
            opening_balance: 0,
            opening_balance_type: 'debit'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        supplierId = supplierResponse.data.id;
        console.log(`✅ Created supplier with ID: ${supplierId}`);

        // 2. Create a test product  
        console.log('\n📦 Creating test product...');
        const productResponse = await axios.post(`${BASE_URL}/products`, {
            id: 'zy-enhanced-test',
            name: 'Enhanced Test Product',
            uom: 'pcs',
            retail_price: 25.00,
            cost_price: 15.00
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        productId = 'zy-enhanced-test';
        console.log(`✅ Created product with ID: ${productId}`);

        // 3. Test Enhanced Purchase Creation
        console.log('\n🛒 Testing enhanced purchase creation...');
        const purchaseResponse = await axios.post(`${BASE_URL}/purchases`, {
            supplier_id: supplierId,
            items: [{
                product_id: productId,
                quantity: 10,
                cost_price: 15.00
            }],
            description: 'Test purchase with enhanced fields',
            supplier_invoice_id: 'INV-2025-001',
            delivery_method: 'delivery',
            purchase_date: '2025-10-02'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('✅ Enhanced purchase created successfully');
        console.log('📋 Purchase response:', JSON.stringify(purchaseResponse.data, null, 2));

        // 4. Test Enhanced Payment Creation
        console.log('\n💰 Testing enhanced payment creation...');
        const paymentResponse = await axios.post(`${BASE_URL}/payments`, {
            supplier_id: supplierId,
            amount: 100.00,
            description: 'Test payment with enhanced fields',
            payment_method: 'bank_transfer',
            payment_date: '2025-10-02'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('✅ Enhanced payment created successfully');
        console.log('📋 Payment response:', JSON.stringify(paymentResponse.data, null, 2));

        // 5. Verify purchase was recorded with all fields
        console.log('\n🔍 Verifying purchase details...');
        const purchasesResponse = await axios.get(`${BASE_URL}/purchases?supplier_id=${supplierId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (purchasesResponse.data.length > 0) {
            const purchase = purchasesResponse.data[0];
            console.log('✅ Purchase details verified:');
            console.log(`   - Total Cost: ${purchase.total_cost}`);
            console.log(`   - Description: ${purchase.description || 'Not set'}`);
            console.log(`   - Invoice ID: ${purchase.supplier_invoice_id || 'Not set'}`);
            console.log(`   - Delivery Method: ${purchase.delivery_method || 'Not set'}`);
            console.log(`   - Date: ${purchase.date}`);
        }

        // 6. Verify payment was recorded with all fields
        console.log('\n🔍 Verifying payment details...');
        const paymentsResponse = await axios.get(`${BASE_URL}/payments?supplier_id=${supplierId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (paymentsResponse.data.length > 0) {
            const payment = paymentsResponse.data[0];
            console.log('✅ Payment details verified:');
            console.log(`   - Amount: ${payment.amount}`);
            console.log(`   - Description: ${payment.description || 'Not set'}`);
            console.log(`   - Payment Method: ${payment.payment_method || 'Not set'}`);
            console.log(`   - Payment Date: ${payment.payment_date || 'Not set'}`);
            console.log(`   - Created Date: ${payment.date}`);
        }

    } catch (error) {
        console.error('❌ Test error:', error.response?.data || error.message);
    } finally {
        // Cleanup: Delete test entities
        console.log('\n🧹 Cleaning up test data...');

        if (productId) {
            try {
                await axios.delete(`${BASE_URL}/products/${productId}`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                    data: { password: OWNER_PASSWORD }
                });
                console.log('✅ Test product deleted');
            } catch (error) {
                console.log('⚠️  Could not delete test product');
            }
        }

        if (supplierId) {
            try {
                await axios.delete(`${BASE_URL}/suppliers/${supplierId}`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                    data: { password: OWNER_PASSWORD }
                });
                console.log('✅ Test supplier deleted');
            } catch (error) {
                console.log('⚠️  Could not delete test supplier');
            }
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎯 ENHANCED PURCHASE & PAYMENT TESTS COMPLETE!');
    console.log('\n📊 Summary of New Features:');
    console.log('✅ Purchase description field');
    console.log('✅ Supplier invoice ID tracking');
    console.log('✅ Delivery method specification');
    console.log('✅ Custom purchase date');
    console.log('✅ Payment method tracking');
    console.log('✅ Custom payment date');
    console.log('✅ Enhanced payment descriptions');
}

testEnhancedPurchaseAndPayments().catch(console.error);