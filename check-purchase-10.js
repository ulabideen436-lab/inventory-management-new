import axios from 'axios';

async function checkPurchaseData() {
    try {
        // Login
        const loginRes = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'admin123'
        });

        const token = loginRes.data.token;

        // Get purchase details
        const purchaseRes = await axios.get('http://localhost:5000/purchases/10', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Purchase #10 Data from API:');
        console.log(JSON.stringify(purchaseRes.data, null, 2));

        // Also get supplier history to see what's being sent
        const historyRes = await axios.get('http://localhost:5000/suppliers/18/history', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const purchase10InLedger = historyRes.data.ledger.find(l => l.id === 10 && l.type === 'purchase');
        console.log('\nPurchase #10 in Ledger:');
        console.log(JSON.stringify(purchase10InLedger, null, 2));

    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkPurchaseData();
