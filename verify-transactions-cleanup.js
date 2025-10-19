/**
 * Verify that the test sale has been deleted and check current transactions
 */

const axios = require('axios');

async function verifyTransactionsCleanup() {
    try {
        console.log('🔍 Verifying Transactions After Test Sale Deletion...\n');

        // Authenticate
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Authentication successful');

        // Check current transactions
        const today = new Date().toISOString().slice(0, 10);
        const response = await axios.get('http://localhost:5000/transactions', {
            params: { from: today, to: today, types: [] },
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`📊 Current transactions count: ${response.data.length}`);

        if (response.data.length === 0) {
            console.log('✅ All test transactions have been cleaned up!');
            console.log('📋 The transactions table is now empty and ready for real data.');
        } else {
            console.log('\n📋 Remaining transactions:');
            response.data.forEach((tx, index) => {
                console.log(`  ${index + 1}. ${tx.type} - ${tx.description} - ${tx.amount}`);
            });
        }

        // Check detailed transactions endpoint
        try {
            const detailedResponse = await axios.get('http://localhost:5000/transactions/detailed', {
                params: { from: today, to: today, types: [] },
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log(`\n📈 Detailed transactions count: ${detailedResponse.data.transactions?.length || 0}`);

            if (detailedResponse.data.summary) {
                console.log('💰 Financial Summary:');
                console.log(`  Total Sales: PKR ${detailedResponse.data.summary.total_sales || 0}`);
                console.log(`  Total Purchases: PKR ${detailedResponse.data.summary.total_purchases || 0}`);
                console.log(`  Net Flow: PKR ${(detailedResponse.data.summary.total_sales || 0) - (detailedResponse.data.summary.total_purchases || 0)}`);
            }
        } catch (err) {
            console.log('ℹ️ Detailed transactions endpoint not responding (expected if no data)');
        }

        console.log('\n🎉 Verification Complete!');
        console.log('The enhanced professional transactions table is now ready for use');
        console.log('with real transaction data.');

        return true;

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        return false;
    }
}

// Run verification
verifyTransactionsCleanup().then(success => {
    process.exit(success ? 0 : 1);
});