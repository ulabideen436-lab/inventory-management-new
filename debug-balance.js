import axios from 'axios';

async function debugBalanceCalculation() {
    try {
        console.log('Debugging Balance Calculation...\n');

        // Login
        const loginRes = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'admin123'
        });
        const token = loginRes.data.token;

        // Get supplier 18 details from suppliers list
        const suppliersRes = await axios.get('http://localhost:5000/suppliers', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const supplier18 = suppliersRes.data.find(s => s.id === 18);
        console.log('Supplier 18 from suppliers list:');
        console.log(`- ID: ${supplier18.id}`);
        console.log(`- Name: ${supplier18.name}`);
        console.log(`- Balance: ${supplier18.balance}`);
        console.log(`- Opening Balance: ${supplier18.opening_balance}`);
        console.log(`- Opening Balance Type: ${supplier18.opening_balance_type}`);

        // Get supplier history
        const historyRes = await axios.get('http://localhost:5000/suppliers/18/history', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const { supplier: historySupplier, ledger, totals } = historyRes.data;

        console.log('\nSupplier from history endpoint:');
        console.log(`- Balance: ${historySupplier.balance}`);
        console.log(`- Opening Balance: ${historySupplier.opening_balance}`);
        console.log(`- Opening Balance Type: ${historySupplier.opening_balance_type}`);

        console.log('\nLedger entries:');
        ledger.forEach((entry, index) => {
            console.log(`${index + 1}. ${entry.type}: ${entry.description}`);
            console.log(`   Debit: ${entry.debit}, Credit: ${entry.credit}`);
            console.log(`   Running Balance: ${entry.running_balance}`);
        });

        console.log('\nTotals:');
        console.log(`- Total Debits: ${totals.totalDebits}`);
        console.log(`- Total Credits: ${totals.totalCredits}`);
        console.log(`- Calculated Balance: ${totals.calculatedBalance}`);
        console.log(`- Current Balance: ${totals.currentBalance}`);

        // Manual calculation check
        console.log('\n--- MANUAL CALCULATION CHECK ---');
        const openingBalance = supplier18.opening_balance_type === 'credit'
            ? -Math.abs(supplier18.opening_balance)
            : Math.abs(supplier18.opening_balance);

        console.log(`Opening Balance (adjusted): ${openingBalance}`);

        const purchaseAmount = 2500.75;
        const expectedBalance = openingBalance + purchaseAmount;

        console.log(`Expected Balance: ${openingBalance} + ${purchaseAmount} = ${expectedBalance}`);
        console.log(`Actual Balance: ${historySupplier.balance}`);
        console.log(`Match: ${expectedBalance === historySupplier.balance ? '✅' : '❌'}`);

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

debugBalanceCalculation();