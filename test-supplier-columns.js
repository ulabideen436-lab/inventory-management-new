const axios = require('axios');

async function testSupplierColumns() {
    try {
        console.log('🧪 Testing Supplier Table Columns...');

        // First, login to get auth token
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'password'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Get all suppliers to see what columns are returned
        const suppliersResponse = await axios.get('http://localhost:5000/suppliers', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Suppliers retrieved successfully');
        console.log('📊 Suppliers data:', JSON.stringify(suppliersResponse.data, null, 2));

        if (suppliersResponse.data.length > 0) {
            console.log('📋 Available columns:', Object.keys(suppliersResponse.data[0]));
        }

    } catch (error) {
        console.log('❌ Test failed:');
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Data:', error.response.data);
        } else {
            console.log('   Error:', error.message);
        }
    }
}

testSupplierColumns();