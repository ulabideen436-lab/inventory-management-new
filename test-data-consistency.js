const axios = require('axios');

async function analyzeDataConsistency() {
    try {
        console.log('Analyzing data consistency between sales and sale_items...\n');

        // Login
        const loginResponse = await axios.post('http://127.0.0.1:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });

        const token = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // Get sales data
        const salesResponse = await axios.get('http://127.0.0.1:5000/sales', { headers });
        const sales = salesResponse.data;

        console.log(`Sales table has ${sales.length} records`);

        // Check if all sales have sale_items
        const salesWithNullDiscount = sales.filter(sale => sale.discount === null);
        const salesWithPositiveDiscount = sales.filter(sale => sale.discount > 0);

        console.log(`Sales with null discount: ${salesWithNullDiscount.length}`);
        console.log(`Sales with positive discount: ${salesWithPositiveDiscount.length}`);

        // Get sold products data
        const soldProductsResponse = await axios.get('http://127.0.0.1:5000/sales/sold-products', { headers });
        const soldProductsData = soldProductsResponse.data;

        console.log(`\nSold products analysis reports ${soldProductsData.summary.totalTransactions} transactions`);
        console.log(`This suggests some sales may not have corresponding sale_items`);

        // Calculate what the difference might be
        const missingSalesCount = soldProductsData.summary.totalTransactions - sales.length;
        console.log(`\nPotential missing sales records: ${missingSalesCount}`);

        // Show recent sales IDs
        console.log(`\nRecent sales IDs: ${sales.slice(-5).map(s => s.id).join(', ')}`);

        // Calculate expected revenue if we use sold products gross minus item discounts
        const expectedRevenue = soldProductsData.summary.totalGrossRevenue - soldProductsData.summary.totalItemDiscounts;
        const actualRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);

        console.log(`\nRevenue Analysis:`);
        console.log(`Expected (Gross - Item Discounts): PKR ${expectedRevenue.toFixed(2)}`);
        console.log(`Actual (Sales table total_amount): PKR ${actualRevenue.toFixed(2)}`);
        console.log(`Difference: PKR ${Math.abs(expectedRevenue - actualRevenue).toFixed(2)}`);

        if (Math.abs(expectedRevenue - actualRevenue) < 0.01) {
            console.log('✅ Revenue calculations are now consistent!');
        } else {
            console.log('❌ Revenue calculations still have discrepancies');
        }

    } catch (error) {
        console.error('Analysis failed:', error.response ? error.response.data : error.message);
    }
}

analyzeDataConsistency();