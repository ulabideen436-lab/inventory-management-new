import axios from 'axios';

async function testCustomerHistoryWithItems() {
    console.log('🧪 Testing Customer History with Sale Items\n');

    try {
        // Login
        const loginRes = await axios.post('http://127.0.0.1:5000/auth/login', {
            username: 'admin',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('✅ Authenticated\n');

        // Get customer with history (using Zain Ul Abideen - ID 4)
        const customerId = 4;

        console.log('📊 Fetching customer history...\n');
        const historyRes = await axios.get(`http://127.0.0.1:5000/customers/${customerId}/history`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const history = historyRes.data;

        console.log(`Total history entries: ${history.length}\n`);
        console.log('='.repeat(80));
        console.log('CUSTOMER HISTORY WITH ITEMS');
        console.log('='.repeat(80));

        history.forEach((entry, index) => {
            console.log(`\n${index + 1}. ${entry.trans_no || 'N/A'}`);
            console.log(`   Date: ${entry.date || 'N/A'}`);
            console.log(`   Type: ${entry.transaction_type}`);
            console.log(`   Description: ${entry.description}`);

            if (entry.debit > 0) {
                console.log(`   Debit: PKR ${entry.debit.toFixed(2)}`);
            }
            if (entry.credit > 0) {
                console.log(`   Credit: PKR ${entry.credit.toFixed(2)}`);
            }
            console.log(`   Balance: PKR ${entry.running_balance.toFixed(2)} ${entry.running_balance >= 0 ? 'Dr' : 'Cr'}`);

            // Show items if available
            if (entry.items && entry.items.length > 0) {
                console.log('   Items:');
                entry.items.forEach(item => {
                    console.log(`     - ${item.product_name}: ${item.quantity} x ${item.unit_price} = ${item.total_price}`);
                });
            }
        });

        console.log('\n' + '='.repeat(80));
        console.log('\n📋 Fetching customer ledger...\n');

        const ledgerRes = await axios.get(`http://127.0.0.1:5000/customers/${customerId}/ledger`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const ledger = ledgerRes.data;

        console.log(`Total ledger entries: ${ledger.length}\n`);
        console.log('='.repeat(80));
        console.log('CUSTOMER LEDGER WITH ITEMS');
        console.log('='.repeat(80));

        ledger.forEach((entry, index) => {
            console.log(`\n${index + 1}. ${entry.date}`);
            console.log(`   Description: ${entry.description}`);
            console.log(`   Type: ${entry.type}`);
            console.log(`   Amount: PKR ${entry.amount.toFixed(2)}`);
        });

        console.log('\n' + '='.repeat(80));
        console.log('\n✅ Test completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testCustomerHistoryWithItems();
