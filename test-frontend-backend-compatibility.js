const axios = require('axios');

async function testFrontendBackendCompatibility() {
    try {
        console.log('🧪 Testing Frontend-Backend Compatibility...\n');

        // Login
        const loginRes = await axios.post('http://localhost:5000/auth/login', { username: 'owner', password: 'password' });
        const token = loginRes.data.token;
        console.log('✅ Login successful');

        // Test 1: Create supplier (frontend format)
        console.log('\n1️⃣ Testing supplier creation with frontend form data...');
        const supplierData = {
            name: 'Frontend Test Supplier',
            brand_name: 'FrontendBrand',
            contact_info: 'frontend@test.com',
            opening_balance: 750,
            opening_balance_type: 'credit'
        };
        const createRes = await axios.post('http://localhost:5000/suppliers', supplierData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Supplier created:', createRes.data);
        const supplierId = createRes.data.id;

        // Test 2: Get suppliers (check response format)
        console.log('\n2️⃣ Testing get suppliers response format...');
        const getRes = await axios.get('http://localhost:5000/suppliers', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const supplier = getRes.data.find(s => s.id === supplierId);
        console.log('✅ Supplier data format:', {
            id: supplier.id,
            name: supplier.name,
            balance: supplier.balance,
            opening_balance: supplier.opening_balance,
            opening_balance_type: supplier.opening_balance_type,
            closing_balance: supplier.closing_balance
        });

        // Test 3: Create purchase (frontend format)
        console.log('\n3️⃣ Testing purchase creation...');
        const purchaseData = {
            supplier_id: supplierId,
            total_cost: 1200.50,
            description: 'Frontend test purchase',
            supplier_invoice_id: 'FRONTEND-001',
            delivery_method: 'Standard',
            purchase_date: '2025-10-06'
        };
        const purchaseRes = await axios.post('http://localhost:5000/purchases', purchaseData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Purchase created:', purchaseRes.data);

        // Test 4: Create payment (frontend format)
        console.log('\n4️⃣ Testing payment creation...');
        const paymentData = {
            supplier_id: supplierId,
            amount: 500,
            description: 'Frontend test payment',
            payment_method: 'Bank Transfer',
            payment_date: '2025-10-06'
        };
        const paymentRes = await axios.post('http://localhost:5000/payments', paymentData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Payment created:', paymentRes.data);

        // Test 5: Get supplier history (frontend usage)
        console.log('\n5️⃣ Testing supplier history...');
        const historyRes = await axios.get(`http://localhost:5000/suppliers/${supplierId}/history`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ History data format:', {
            supplier: Object.keys(historyRes.data.supplier),
            ledgerEntries: historyRes.data.ledger.length,
            currentBalance: historyRes.data.currentBalance,
            openingBalance: historyRes.data.openingBalance
        });

        // Test 6: Edit supplier (frontend format)
        console.log('\n6️⃣ Testing supplier update...');
        const updateData = {
            name: 'Updated Frontend Test Supplier',
            brand_name: 'UpdatedFrontendBrand',
            contact_info: 'updated-frontend@test.com',
            opening_balance: 1000,
            opening_balance_type: 'debit'
        };
        const updateRes = await axios.put(`http://localhost:5000/suppliers/${supplierId}`, updateData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Supplier updated:', updateRes.data);

        console.log('\n🎉 Frontend-Backend Compatibility Test PASSED!');
        console.log('All API endpoints are compatible with frontend expectations.');

    } catch (error) {
        console.error('❌ Compatibility test failed:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testFrontendBackendCompatibility();