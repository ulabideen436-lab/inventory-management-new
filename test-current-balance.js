import axios from 'axios';

async function testCurrentBalance() {
    try {
        console.log('Testing current balance display...\n');

        // Login
        const loginRes = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'admin123'
        });
        const token = loginRes.data.token;

        // Force refresh supplier history to recalculate
        console.log('Getting fresh supplier history...');
        const historyRes = await axios.get(`http://localhost:5000/suppliers/18/history`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const { supplier, ledger } = historyRes.data;

        console.log('Frontend should display:');
        console.log(`Header Balance: PKR ${Math.abs(parseFloat(supplier.balance || 0)).toFixed(2)} ${parseFloat(supplier.balance || 0) >= 0 ? 'Dr' : 'Cr'}`);
        console.log(`Raw Balance Value: ${supplier.balance}`);

        // Check last ledger entry
        const lastEntry = ledger[ledger.length - 1];
        console.log(`Last Ledger Entry Balance: ${lastEntry.running_balance}`);

        // The grand total at bottom should show
        const grandTotalBalance = Math.abs(parseFloat(supplier.balance || 0)).toFixed(2);
        const grandTotalType = parseFloat(supplier.balance || 0) >= 0 ? 'Dr' : 'Cr';
        console.log(`Grand Total Should Show: ${grandTotalBalance} ${grandTotalType}`);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testCurrentBalance();