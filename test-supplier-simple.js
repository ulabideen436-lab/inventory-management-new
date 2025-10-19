import axios from 'axios';

async function testSupplierAPI() {
    try {
        console.log('Testing basic supplier API...\n');

        // Login
        const loginRes = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('✓ Login successful\n');

        // Get suppliers
        console.log('Getting suppliers...');
        const suppliersRes = await axios.get('http://localhost:5000/suppliers', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✓ Found ${suppliersRes.data.length} suppliers\n`);

        if (suppliersRes.data.length === 0) {
            console.log('No suppliers found');
            return;
        }

        const supplier = suppliersRes.data[0];
        console.log(`Testing with supplier: ${supplier.name} (ID: ${supplier.id})\n`);

        // Test supplier history
        console.log('Getting supplier history...');
        try {
            const historyRes = await axios.get(`http://localhost:5000/suppliers/${supplier.id}/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✓ Supplier history retrieved successfully');
            console.log('Ledger entries:', historyRes.data.ledger?.length || 0);
        } catch (historyError) {
            console.log('❌ Supplier history failed:');
            console.log('Status:', historyError.response?.status);
            console.log('Message:', historyError.response?.data?.message || historyError.message);
            console.log('Full error:', historyError.response?.data);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
    }
}

testSupplierAPI();