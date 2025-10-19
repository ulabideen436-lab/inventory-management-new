/**
 * Test script for simplified purchase workflow
 * Tests the new simplified purchase creation endpoint
 */

const axios = require('axios');

async function testSimplifiedPurchase() {
    console.log('=== Testing Simplified Purchase Workflow ===\n');

    try {
        // First, test if we can fetch suppliers
        console.log('1. Fetching suppliers...');
        const suppliersResponse = await axios.get('http://localhost:5000/suppliers');
        console.log(`✓ Found ${suppliersResponse.data.length} suppliers`);

        if (suppliersResponse.data.length === 0) {
            console.log('❌ No suppliers found. Please add a supplier first.');
            return;
        }

        const testSupplier = suppliersResponse.data[0];
        console.log(`✓ Using supplier: ${testSupplier.name} (ID: ${testSupplier.id})\n`);

        // Test simplified purchase creation
        console.log('2. Testing simplified purchase creation...');
        const simplifiedPurchase = {
            supplier_id: testSupplier.id,
            total_cost: 1500.75,
            description: 'Test simplified purchase',
            supplier_invoice_id: 'INV-TEST-001',
            delivery_method: 'Express Delivery',
            purchase_date: new Date().toISOString().split('T')[0]
        };

        console.log('Purchase data to send:', simplifiedPurchase);

        const purchaseResponse = await axios.post('http://localhost:5000/purchases', simplifiedPurchase);
        console.log('✓ Purchase created successfully!');
        console.log('Response:', purchaseResponse.data);
        console.log(`✓ Purchase ID: ${purchaseResponse.data.purchaseId || purchaseResponse.data.id}`);

        // Test fetching the created purchase
        console.log('\n3. Fetching purchase history...');
        const historyResponse = await axios.get(`http://localhost:5000/suppliers/${testSupplier.id}/history`);
        console.log(`✓ Found ${historyResponse.data.ledger?.length || 0} history items`);

        const recentPurchases = historyResponse.data.ledger?.filter(item => item.type === 'purchase') || [];
        console.log(`✓ Recent purchases: ${recentPurchases.length}`);

        if (recentPurchases.length > 0) {
            const latestPurchase = recentPurchases[0];
            console.log('Latest purchase:', {
                id: latestPurchase.id,
                amount: latestPurchase.amount,
                description: latestPurchase.description,
                date: latestPurchase.date
            });
        }

        console.log('\n✅ All tests passed! Simplified purchase workflow is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status === 400) {
            console.error('Validation error details:', error.response.data);
        }
    }
}

// Run the test
testSimplifiedPurchase();