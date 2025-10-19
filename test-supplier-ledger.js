const API_BASE = 'http://127.0.0.1:5000';

// Test the supplier ledger endpoint with an existing supplier
async function testSupplierLedger() {
    try {
        // Login first
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });

        if (!loginResponse.ok) {
            throw new Error('Login failed');
        }

        const { token } = await loginResponse.json();
        console.log('✅ Login successful');

        // Get all suppliers first
        const suppliersResponse = await fetch(`${API_BASE}/suppliers`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!suppliersResponse.ok) {
            throw new Error('Failed to get suppliers');
        }

        const suppliers = await suppliersResponse.json();
        console.log(`Found ${suppliers.length} suppliers`);

        if (suppliers.length === 0) {
            console.log('No suppliers found to test with');
            return;
        }

        // Test with the first supplier
        const testSupplierId = suppliers[0].id;
        console.log(`Testing supplier ledger for supplier ID: ${testSupplierId}`);

        const ledgerResponse = await fetch(`${API_BASE}/suppliers/${testSupplierId}/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!ledgerResponse.ok) {
            const errorText = await ledgerResponse.text();
            console.log('❌ Ledger error:', errorText);
            return;
        }

        const ledgerData = await ledgerResponse.json();
        console.log('✅ Supplier ledger retrieved successfully');
        console.log('Ledger data:', JSON.stringify(ledgerData, null, 2));

    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

testSupplierLedger();