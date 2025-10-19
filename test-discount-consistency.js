const axios = require('axios');

async function testDiscountConsistency() {
    try {
        console.log('Testing discount calculation consistency between endpoints...\n');

        // Login first
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });

        const token = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // Get sales data
        const salesResponse = await axios.get('http://localhost:5000/sales', { headers });
        const sales = salesResponse.data;

        // Calculate totals from sales endpoint
        let salesTotalRevenue = 0;
        let salesTotalDiscount = 0;

        sales.forEach(sale => {
            salesTotalRevenue += parseFloat(sale.total_amount || 0);
            salesTotalDiscount += parseFloat(sale.discount || 0);
        });

        console.log('SALES ENDPOINT TOTALS:');
        console.log(`Total Revenue: PKR ${salesTotalRevenue.toFixed(2)}`);
        console.log(`Total Discounts: PKR ${salesTotalDiscount.toFixed(2)}`);
        console.log(`Total Transactions: ${sales.length}`);
        console.log();

        // Get sold products data
        const soldProductsResponse = await axios.get('http://localhost:5000/sales/sold-products', { headers });
        const soldProductsData = soldProductsResponse.data;

        console.log('SOLD PRODUCTS ENDPOINT TOTALS:');
        console.log(`Total Gross Revenue: PKR ${soldProductsData.summary.totalGrossRevenue.toFixed(2)}`);
        console.log(`Total Item Discounts: PKR ${soldProductsData.summary.totalItemDiscounts.toFixed(2)}`);
        console.log(`Total Sale Discounts: PKR ${soldProductsData.summary.totalSaleDiscounts.toFixed(2)}`);
        console.log(`Total Net Revenue: PKR ${soldProductsData.summary.totalRevenue.toFixed(2)}`);
        console.log(`Total Transactions: ${soldProductsData.summary.totalTransactions}`);
        console.log();

        // Compare the results
        const revenueDiff = Math.abs(salesTotalRevenue - soldProductsData.summary.totalRevenue);
        const discountDiff = Math.abs(salesTotalDiscount - soldProductsData.summary.totalSaleDiscounts);

        console.log('COMPARISON RESULTS:');
        console.log(`Revenue Difference: PKR ${revenueDiff.toFixed(2)}`);
        console.log(`Sale Discount Difference: PKR ${discountDiff.toFixed(2)}`);

        if (revenueDiff < 0.01 && discountDiff < 0.01) {
            console.log('✅ SUCCESS: Revenue and discount calculations are now consistent!');
        } else {
            console.log('❌ DISCREPANCY: Still differences in calculations');
        }

        // Show discount breakdown
        console.log(`\nDISCOUNT BREAKDOWN:`);
        console.log(`- Item-level discounts: PKR ${soldProductsData.summary.totalItemDiscounts.toFixed(2)}`);
        console.log(`- Sale-level discounts: PKR ${soldProductsData.summary.totalSaleDiscounts.toFixed(2)}`);
        console.log(`- Total discounts: PKR ${soldProductsData.summary.totalDiscount.toFixed(2)}`);

        // Show some sample products for verification
        console.log(`\nSAMPLE SOLD PRODUCTS (first 3):`);
        soldProductsData.soldProducts.slice(0, 3).forEach((product, index) => {
            console.log(`${index + 1}. ${product.product_name}`);
            console.log(`   Gross Revenue: PKR ${product.total_gross_revenue.toFixed(2)}`);
            console.log(`   Item Discounts: PKR ${product.total_item_discounts.toFixed(2)}`);
            console.log(`   Sale Discounts: PKR ${product.total_sale_discounts.toFixed(2)}`);
            console.log(`   Net Revenue: PKR ${product.total_net_revenue.toFixed(2)}`);
        });

    } catch (error) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    }
}

testDiscountConsistency();