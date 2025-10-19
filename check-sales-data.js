const axios = require('axios');

async function checkSalesData() {
    try {
        // Login first
        console.log('Logging in...');
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Get sales data
        console.log('Fetching sales data...');
        const salesResponse = await axios.get('http://localhost:5000/sales', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('\nSales data:');
        salesResponse.data.forEach(sale => {
            console.log(`Sale #${sale.id}:`);
            console.log(`  Customer ID: ${sale.customer_id || 'Walk-in'}`);
            console.log(`  Total: PKR ${sale.total_amount}`);
            console.log(`  Status: ${sale.status}`);
            console.log(`  Date: ${sale.created_at}`);
            console.log(`  Cashier ID: ${sale.cashier_id}`);
            console.log('---');
        });

        // Get reports data to see retail vs wholesale classification
        console.log('\nChecking reports for customer type breakdown...');
        const reportsResponse = await axios.get('http://localhost:5000/reports', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Reports data:');
        console.log(reportsResponse.data);

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

checkSalesData();