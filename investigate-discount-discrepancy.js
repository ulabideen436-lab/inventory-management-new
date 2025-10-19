const axios = require('axios');

async function investigateDiscountDiscrepancy() {
    try {
        const loginRes = await axios.post('http://127.0.0.1:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });
        const token = loginRes.data.token;

        console.log('Investigating discount discrepancy...\n');

        // Get sold products data
        const soldProductsRes = await axios.get('http://127.0.0.1:5000/sales/sold-products', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const summary = soldProductsRes.data.summary;
        console.log('SOLD PRODUCTS ENDPOINT DISCOUNTS:');
        console.log(`- Total Item Discounts: PKR ${summary.totalItemDiscounts?.toFixed(2) || '0.00'}`);
        console.log(`- Total Sale Discounts: PKR ${summary.totalSaleDiscounts?.toFixed(2) || '0.00'}`);
        console.log(`- Total Combined Discounts: PKR ${summary.totalDiscount?.toFixed(2) || '0.00'}`);

        // Get sales data for comparison
        const salesRes = await axios.get('http://127.0.0.1:5000/sales', {
            headers: { Authorization: `Bearer ${token}` }
        });

        let totalSalesDiscounts = 0;
        let totalCalculatedItemDiscounts = 0;
        let totalCalculatedSaleDiscounts = 0;

        salesRes.data.forEach(sale => {
            totalSalesDiscounts += parseFloat(sale.discount || 0);
            totalCalculatedItemDiscounts += parseFloat(sale.calculated_item_discounts || 0);
            totalCalculatedSaleDiscounts += parseFloat(sale.calculated_sale_discounts || 0);
        });

        console.log(`\nSALES ENDPOINT DISCOUNTS:`);
        console.log(`- Total Sale-level Discounts: PKR ${totalSalesDiscounts.toFixed(2)}`);
        console.log(`- Total Calculated Item Discounts: PKR ${totalCalculatedItemDiscounts.toFixed(2)}`);
        console.log(`- Total Calculated Sale Discounts: PKR ${totalCalculatedSaleDiscounts.toFixed(2)}`);
        console.log(`- Total All Calculated: PKR ${(totalCalculatedItemDiscounts + totalCalculatedSaleDiscounts).toFixed(2)}`);

        console.log(`\nDISCREPANCY ANALYSIS:`);
        console.log(`- Dashboard shows: Rs 56.60`);
        console.log(`- Sold Products shows: PKR ${summary.totalDiscount?.toFixed(2) || '0.00'}`);
        console.log(`- Difference: PKR ${(56.60 - (summary.totalDiscount || 0)).toFixed(2)}`);

        // Check if there are other endpoints that might feed the dashboard
        console.log(`\nTesting other possible discount sources...`);

        // Check if there's a reports or dashboard-specific endpoint
        try {
            const reportsRes = await axios.get('http://127.0.0.1:5000/reports', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('- Reports endpoint exists, might contain different discount calculation');
        } catch (e) {
            console.log('- No reports endpoint found');
        }

        console.log(`\nPOSSIBLE CAUSES:`);
        console.log(`1. Dashboard might be pulling from a different API endpoint`);
        console.log(`2. Frontend might be calculating discounts differently`);
        console.log(`3. Dashboard might be including legacy discount data`);
        console.log(`4. There might be cached data in the frontend`);

    } catch (error) {
        console.error('Investigation failed:', error.response?.data || error.message);
    }
}

investigateDiscountDiscrepancy();