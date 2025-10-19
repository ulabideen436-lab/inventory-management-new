const axios = require('axios');

async function testDiscountConsistency() {
    try {
        console.log('Testing discount calculation consistency...\n');

        // Login
        const loginResponse = await axios.post('http://127.0.0.1:5000/api/auth/login', {
            username: 'owner',
            password: 'owner123'
        });

        const token = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // Get sales data
        const salesResponse = await axios.get('http://127.0.0.1:5000/api/sales', { headers });
        const sales = salesResponse.data;

        let salesTotalRevenue = 0;
        let salesTotalDiscount = 0;

        sales.forEach(sale => {
            salesTotalRevenue += parseFloat(sale.total_amount || 0);
            salesTotalDiscount += parseFloat(sale.discount || 0);
        });

        console.log('SALES ENDPOINT:');
        console.log(`Revenue: PKR ${salesTotalRevenue.toFixed(2)}`);
        console.log(`Discounts: PKR ${salesTotalDiscount.toFixed(2)}`);
        console.log(`Transactions: ${sales.length}\n`);

        // Get sold products data
        const soldProductsResponse = await axios.get('http://127.0.0.1:5000/api/sales/sold-products', { headers });
        const soldProductsData = soldProductsResponse.data;

        console.log('SOLD PRODUCTS ENDPOINT:');
        console.log(`Gross Revenue: PKR ${soldProductsData.summary.totalGrossRevenue.toFixed(2)}`);
        console.log(`Net Revenue: PKR ${soldProductsData.summary.totalRevenue.toFixed(2)}`);
        console.log(`Item Discounts: PKR ${soldProductsData.summary.totalItemDiscounts.toFixed(2)}`);
        console.log(`Sale Discounts: PKR ${soldProductsData.summary.totalSaleDiscounts.toFixed(2)}`);
        console.log(`Total Discounts: PKR ${soldProductsData.summary.totalDiscount.toFixed(2)}`);
        console.log(`Transactions: ${soldProductsData.summary.totalTransactions}\n`);

        // Compare
        const revenueDiff = Math.abs(salesTotalRevenue - soldProductsData.summary.totalRevenue);
        const discountDiff = Math.abs(salesTotalDiscount - soldProductsData.summary.totalSaleDiscounts);

        console.log('RESULTS:');
        console.log(`Revenue Difference: PKR ${revenueDiff.toFixed(2)}`);
        console.log(`Discount Difference: PKR ${discountDiff.toFixed(2)}`);

        if (revenueDiff < 0.01 && discountDiff < 0.01) {
            console.log('✅ SUCCESS: Calculations are consistent!');
        } else {
            console.log('❌ ISSUE: Still differences detected');
        }

    } catch (error) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    }
}

testDiscountConsistency();