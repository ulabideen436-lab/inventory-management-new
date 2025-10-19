const axios = require('axios');

async function runCustomerTypeMigration() {
    try {
        // Login first
        console.log('Logging in...');
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Run the migration
        console.log('Running customer_type column migration...');
        const migrationResponse = await axios.post('http://localhost:5000/sales/migrate/add-customer-type', {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Migration response:', migrationResponse.data);

    } catch (error) {
        console.error('❌ Migration error:', error.response?.data || error.message);
    }
}

runCustomerTypeMigration();