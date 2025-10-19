/**
 * Test script to delete the test sale (ID: 42)
 * This will safely remove the test transaction from the database
 */

const axios = require('axios');

async function deleteTestSale() {
    try {
        console.log('🗑️ Deleting Test Sale (ID: 42)...\n');

        // Test authentication first
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });

        if (!loginResponse.data.token) {
            throw new Error('Failed to get authentication token');
        }

        const token = loginResponse.data.token;
        console.log('✅ Authentication successful');

        // First, let's check if the sale exists
        try {
            const checkResponse = await axios.get('http://localhost:5000/sales/42', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Found test sale:', {
                id: checkResponse.data.id,
                total_amount: checkResponse.data.total_amount,
                date: checkResponse.data.date,
                customer_id: checkResponse.data.customer_id
            });
        } catch (err) {
            if (err.response?.status === 404) {
                console.log('ℹ️ Sale with ID 42 not found - it may have already been deleted');
                return true;
            }
            throw err;
        }

        // Delete the sale with owner password verification
        console.log('\n🔐 Attempting to delete sale with password verification...');

        try {
            const deleteResponse = await axios.delete('http://localhost:5000/sales/42', {
                headers: { Authorization: `Bearer ${token}` },
                data: { password: 'owner123' } // Required for deletion
            });

            console.log('✅ Test sale deleted successfully!');
            console.log('Response:', deleteResponse.data);

            // Verify deletion by trying to fetch the sale again
            try {
                await axios.get('http://localhost:5000/sales/42', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('❌ Sale still exists after deletion attempt');
                return false;
            } catch (err) {
                if (err.response?.status === 404) {
                    console.log('✅ Verified: Sale has been completely removed from database');
                    return true;
                }
                throw err;
            }

        } catch (deleteErr) {
            if (deleteErr.response?.status === 403) {
                console.log('❌ Password verification failed');
                console.log('💡 Trying alternative deletion method...');

                // Alternative: Direct database cleanup if password fails
                console.log('\n🔧 Attempting database cleanup...');

                // We could add a special cleanup endpoint, but for now let's report the issue
                console.log('⚠️ Manual intervention required. The sale requires owner password verification.');
                console.log('💡 Alternative solutions:');
                console.log('1. Use the correct owner password');
                console.log('2. Delete via database directly');
                console.log('3. Add a test cleanup endpoint');

                return false;
            }
            throw deleteErr;
        }

    } catch (error) {
        console.error('❌ Deletion failed:', error.message);

        if (error.response) {
            console.error(`HTTP ${error.response.status}: ${error.response.data?.message || 'Unknown error'}`);
        }

        console.log('\n💡 Alternative Solution:');
        console.log('If the sale cannot be deleted through the API, you can:');
        console.log('1. Connect to the MySQL database directly');
        console.log('2. Run: DELETE FROM sale_items WHERE sale_id = 42;');
        console.log('3. Run: DELETE FROM sales WHERE id = 42;');

        return false;
    }
}

// Run the deletion
deleteTestSale().then(success => {
    if (success) {
        console.log('\n🎉 Test sale cleanup completed successfully!');
    } else {
        console.log('\n⚠️ Test sale cleanup requires manual intervention.');
    }
    process.exit(success ? 0 : 1);
});