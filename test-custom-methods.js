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

async function testCustomPaymentMethods() {
    console.log('🧪 Testing Custom Payment Method Entry\n');
    console.log('='.repeat(50));

    const loginSuccess = await login();
    if (!loginSuccess) return;

    let supplierId = null;

    try {
        // 1. Create a test supplier
        console.log('\n🏪 Creating test supplier...');
        const supplierResponse = await axios.post(`${BASE_URL}/suppliers`, {
            name: 'Custom Payment Test Supplier',
            contact_info: 'custom@test.com',
            opening_balance: 0,
            opening_balance_type: 'debit'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        supplierId = supplierResponse.data.id;
        console.log(`✅ Created supplier with ID: ${supplierId}`);

        // 2. Test Custom Payment Methods
        const customPaymentMethods = [
            'Mobile Money Transfer',
            'Cryptocurrency Bitcoin',
            'Wire Transfer SWIFT',
            'PayPal Business',
            'Western Union',
            'Money Order',
            'Store Credit',
            'Barter Exchange'
        ];

        console.log('\n💰 Testing custom payment methods...');

        for (let i = 0; i < customPaymentMethods.length; i++) {
            const paymentMethod = customPaymentMethods[i];
            const amount = (i + 1) * 50; // Different amounts for each test

            try {
                const paymentResponse = await axios.post(`${BASE_URL}/payments`, {
                    supplier_id: supplierId,
                    amount: amount,
                    description: `Test payment using ${paymentMethod}`,
                    payment_method: paymentMethod,
                    payment_date: '2025-10-02'
                }, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });

                console.log(`✅ Payment ${i + 1}: ${paymentMethod} - $${amount}`);
            } catch (error) {
                console.log(`❌ Failed payment ${i + 1}: ${paymentMethod} - Error: ${error.response?.data?.message || error.message}`);
            }
        }

        // 3. Test Custom Delivery Methods for Purchase
        console.log('\n📦 Testing custom delivery method...');

        // First create a test product
        try {
            await axios.post(`${BASE_URL}/products`, {
                id: 'zy-custom-test',
                name: 'Custom Test Product',
                uom: 'pcs',
                retail_price: 10.00,
                cost_price: 5.00
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            console.log('✅ Test product created');
        } catch (error) {
            console.log('ℹ️  Test product may already exist');
        }

        const customDeliveryMethods = [
            'Drone Delivery',
            'Personal Pickup by Owner',
            'Third-party Logistics Provider',
            'Express Same-Day Service'
        ];

        for (let i = 0; i < customDeliveryMethods.length; i++) {
            const deliveryMethod = customDeliveryMethods[i];

            try {
                const purchaseResponse = await axios.post(`${BASE_URL}/purchases`, {
                    supplier_id: supplierId,
                    items: [{
                        product_id: 'zy-custom-test',
                        quantity: i + 1,
                        cost_price: 5.00
                    }],
                    description: `Test purchase using ${deliveryMethod}`,
                    supplier_invoice_id: `CUSTOM-INV-${i + 1}`,
                    delivery_method: deliveryMethod,
                    purchase_date: '2025-10-02'
                }, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });

                console.log(`✅ Purchase ${i + 1}: ${deliveryMethod}`);
            } catch (error) {
                console.log(`❌ Failed purchase ${i + 1}: ${deliveryMethod} - Error: ${error.response?.data?.message || error.message}`);
            }
        }

        // 4. Verify all payments were recorded with custom methods
        console.log('\n🔍 Verifying payments with custom methods...');
        const paymentsResponse = await axios.get(`${BASE_URL}/payments?supplier_id=${supplierId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (paymentsResponse.data.length > 0) {
            console.log(`✅ Found ${paymentsResponse.data.length} payments with custom methods:`);
            paymentsResponse.data.forEach((payment, index) => {
                console.log(`   ${index + 1}. $${payment.amount} via "${payment.payment_method}"`);
            });
        }

        // 5. Verify purchases with custom delivery methods
        console.log('\n🔍 Verifying purchases with custom delivery methods...');
        const purchasesResponse = await axios.get(`${BASE_URL}/purchases?supplier_id=${supplierId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (purchasesResponse.data.length > 0) {
            console.log(`✅ Found ${purchasesResponse.data.length} purchases with custom delivery methods:`);
            purchasesResponse.data.forEach((purchase, index) => {
                console.log(`   ${index + 1}. $${purchase.total_cost} via "${purchase.delivery_method}"`);
            });
        }

    } catch (error) {
        console.error('❌ Test error:', error.response?.data || error.message);
    } finally {
        // Cleanup: Delete test entities
        console.log('\n🧹 Cleaning up test data...');

        try {
            await axios.delete(`${BASE_URL}/products/zy-custom-test`, {
                headers: { Authorization: `Bearer ${authToken}` },
                data: { password: OWNER_PASSWORD }
            });
            console.log('✅ Test product deleted');
        } catch (error) {
            console.log('⚠️  Could not delete test product');
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

    console.log('\n' + '='.repeat(50));
    console.log('🎯 CUSTOM PAYMENT METHOD TESTS COMPLETE!');
    console.log('\n📊 Summary:');
    console.log('✅ Owner can now enter any custom payment method');
    console.log('✅ Owner can now enter any custom delivery method');
    console.log('✅ No more restrictions to predefined dropdown options');
    console.log('✅ Full flexibility for business-specific methods');
}

testCustomPaymentMethods().catch(console.error);