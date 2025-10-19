const axios = require('axios');

async function findOrphanedRecords() {
    try {
        console.log('Finding orphaned records...\n');

        // Login
        const loginResponse = await axios.post('http://127.0.0.1:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });

        const token = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // Get all sales directly from the database using raw SQL query
        console.log('Checking database for orphaned records...');

        // Try to access the database through a custom endpoint or create a test query
        // For now, let's analyze the existing data more carefully

        const salesResponse = await axios.get('http://127.0.0.1:5000/sales', { headers });
        const sales = salesResponse.data;

        const soldProductsResponse = await axios.get('http://127.0.0.1:5000/sales/sold-products', { headers });
        const soldProducts = soldProductsResponse.data;

        console.log('Sales endpoint analysis:');
        console.log(`- Total sales records: ${sales.length}`);
        console.log(`- Total revenue: PKR ${sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0).toFixed(2)}`);
        console.log(`- Sales with null discount: ${sales.filter(s => s.discount === null).length}`);
        console.log(`- Sales with zero discount: ${sales.filter(s => s.discount === 0).length}`);
        console.log(`- Sales with positive discount: ${sales.filter(s => s.discount > 0).length}`);

        console.log('\nSold products endpoint analysis:');
        console.log(`- Unique transactions: ${soldProducts.summary.totalTransactions}`);
        console.log(`- Gross revenue: PKR ${soldProducts.summary.totalGrossRevenue.toFixed(2)}`);
        console.log(`- Item discounts: PKR ${soldProducts.summary.totalItemDiscounts.toFixed(2)}`);
        console.log(`- Net revenue: PKR ${soldProducts.summary.totalRevenue.toFixed(2)}`);

        // The issue seems to be that sales.total_amount might not equal the calculated net amount
        console.log('\nHypothesis testing:');
        console.log('If sales.total_amount should equal gross_revenue - item_discounts:');

        const expectedFromSales = soldProducts.summary.totalGrossRevenue - soldProducts.summary.totalItemDiscounts;
        const actualFromSales = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);

        console.log(`Expected total_amount sum: PKR ${expectedFromSales.toFixed(2)}`);
        console.log(`Actual total_amount sum: PKR ${actualFromSales.toFixed(2)}`);
        console.log(`Difference: PKR ${Math.abs(expectedFromSales - actualFromSales).toFixed(2)}`);

        if (Math.abs(expectedFromSales - actualFromSales) < 0.01) {
            console.log('✅ The issue is resolved! Revenue calculations are consistent.');
        } else {
            console.log('❌ There might be data inconsistency in the database.');
            console.log('\nPossible causes:');
            console.log('1. Some sales.total_amount values are incorrect');
            console.log('2. Some sale_items have wrong prices or discount amounts');
            console.log('3. Database integrity issues');
        }

    } catch (error) {
        console.error('Analysis failed:', error.response ? error.response.data : error.message);
    }
}

findOrphanedRecords();