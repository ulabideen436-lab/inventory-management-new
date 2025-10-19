import axios from 'axios';

async function testSupplierHistoryStep() {
    try {
        console.log('Testing supplier history step by step...\n');

        // Login
        const loginRes = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'admin123'
        });
        const token = loginRes.data.token;

        // Try to get a purchase directly
        console.log('Testing purchase endpoint...');
        try {
            const purchaseRes = await axios.get('http://localhost:5000/purchases/10', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✓ Purchase endpoint works');
            console.log('Purchase data:', purchaseRes.data);
        } catch (err) {
            console.log('❌ Purchase endpoint failed:', err.response?.data?.message || err.message);
        }

        // Try to get purchases list
        console.log('\nTesting purchases list...');
        try {
            const purchasesRes = await axios.get('http://localhost:5000/purchases', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✓ Purchases list works');
            console.log('Found purchases:', purchasesRes.data.length);
        } catch (err) {
            console.log('❌ Purchases list failed:', err.response?.data?.message || err.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testSupplierHistoryStep();