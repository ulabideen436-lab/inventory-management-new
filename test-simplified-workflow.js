/**
 * Focused test for simplified purchase workflow
 * Tests only the basic supplier operations needed for the simplified purchase system
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let authToken = '';
let testSupplierId = null;

async function login() {
    try {
        console.log('🔐 Logging in...');
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'owner',
            password: 'owner123'
        });
        authToken = response.data.token;
        console.log('✅ Login successful');
        return true;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        return false;
    }
}

function getAuthHeaders() {
    return { Authorization: `Bearer ${authToken}` };
}

async function testSimplifiedWorkflow() {
    console.log('\n=== TESTING SIMPLIFIED SUPPLIER & PURCHASE WORKFLOW ===\n');

    // Step 1: Login
    if (!await login()) return;

    // Step 2: Add supplier
    try {
        console.log('📝 Adding test supplier...');
        const supplierData = {
            name: 'Quick Test Supplier',
            brand_name: 'QuickTest',
            contact_info: '555-TEST',
            balance: 500.00,
            opening_balance_type: 'credit'
        };

        const supplierResponse = await axios.post(`${BASE_URL}/suppliers`, supplierData, {
            headers: getAuthHeaders()
        });

        testSupplierId = supplierResponse.data.id;
        console.log(`✅ Supplier created (ID: ${testSupplierId})`);
    } catch (error) {
        console.error('❌ Supplier creation failed:', error.response?.data || error.message);
        return;
    }

    // Step 3: Test simplified purchase creation
    try {
        console.log('\n🛒 Testing simplified purchase creation...');
        const purchaseData = {
            supplier_id: testSupplierId,
            total_cost: 1250.50,
            description: 'Simple test purchase',
            supplier_invoice_id: 'SIMPLE-001',
            delivery_method: 'Pickup',
            purchase_date: new Date().toISOString().split('T')[0]
        };

        console.log('Request data:', JSON.stringify(purchaseData, null, 2));

        const purchaseResponse = await axios.post(`${BASE_URL}/purchases`, purchaseData, {
            headers: getAuthHeaders()
        });

        console.log('✅ Purchase created successfully!');
        console.log('Response:', JSON.stringify(purchaseResponse.data, null, 2));
    } catch (error) {
        console.error('❌ Purchase creation failed:');
        console.error('Status:', error.response?.status);
        console.error('Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Full error:', error.message);
    }

    // Step 4: Check supplier ledger
    try {
        console.log('\n📊 Checking supplier ledger...');
        const ledgerResponse = await axios.get(`${BASE_URL}/suppliers/${testSupplierId}/history`, {
            headers: getAuthHeaders()
        });

        console.log('✅ Ledger retrieved:');
        console.log('Current balance:', ledgerResponse.data.currentBalance);
        console.log('Ledger entries:', ledgerResponse.data.ledger?.length || 0);
    } catch (error) {
        console.error('❌ Ledger check failed:', error.response?.data || error.message);
    }

    // Step 5: Clean up - delete supplier
    try {
        console.log('\n🧹 Cleaning up...');
        await axios.delete(`${BASE_URL}/suppliers/${testSupplierId}`, {
            headers: getAuthHeaders(),
            data: { password: 'owner123' }
        });
        console.log('✅ Cleanup completed');
    } catch (error) {
        console.error('❌ Cleanup failed:', error.response?.data || error.message);
    }
}

// Run the test
testSimplifiedWorkflow().catch(console.error);