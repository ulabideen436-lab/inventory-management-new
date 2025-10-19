const axios = require('axios');

async function testExport() {
    try {
        console.log('🧪 Testing export endpoint after fix...');

        // First login to get token
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });

        if (loginResponse.status !== 200) {
            console.log('❌ Login failed');
            return;
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Test export endpoint
        const exportResponse = await axios.get('http://localhost:5000/export/data', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (exportResponse.status === 200) {
            console.log('✅ Export endpoint working!');
            console.log('📊 Export contains:');
            console.log(`   - ${exportResponse.data.users?.length || 0} users`);
            console.log(`   - ${exportResponse.data.customers?.length || 0} customers`);
            console.log(`   - ${exportResponse.data.suppliers?.length || 0} suppliers`);
            console.log(`   - ${exportResponse.data.products?.length || 0} products`);
            console.log(`   - ${exportResponse.data.sales?.length || 0} sales`);
            console.log(`   - ${exportResponse.data.systemSettings?.length || 0} settings`);
        } else {
            console.log('❌ Export failed:', exportResponse.status);
        }

    } catch (error) {
        console.log('❌ Test failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Server is not running. Please start the server first.');
        }
    }
}

testExport();