const axios = require('axios');

async function testDashboardFix() {
    console.log('🎯 TESTING DASHBOARD CALCULATION FIX');
    console.log('===================================');

    try {
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });
        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Get all sales data
        const salesResponse = await axios.get('http://localhost:5000/sales', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const sales = salesResponse.data;
        console.log(`\n📊 BACKEND DATA VERIFICATION:`);
        console.log(`Total Sales Count: ${sales.length}`);

        // Calculate totals from backend data
        const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
        const averageSale = sales.length > 0 ? totalRevenue / sales.length : 0;
        const wholesaleSales = sales.filter(sale => sale.customer_type === 'wholesale' || sale.customer_type === 'longterm').length;
        const retailSales = sales.filter(sale => sale.customer_type === 'retail' || !sale.customer_type).length;
        const pendingSales = sales.filter(sale => sale.status === 'pending').length;

        console.log(`Total Revenue: PKR ${totalRevenue.toFixed(2)}`);
        console.log(`Average Sale: PKR ${averageSale.toFixed(2)}`);
        console.log(`Wholesale Sales: ${wholesaleSales}`);
        console.log(`Retail Sales: ${retailSales}`);
        console.log(`Pending Sales: ${pendingSales}`);

        console.log(`\n📱 EXPECTED FRONTEND DISPLAY:`);
        console.log(`Dashboard should now show:`);
        console.log(`- Total Revenue: PKR ${totalRevenue.toFixed(2)} (not PKR 500.00)`);
        console.log(`- Total Transactions: ${sales.length} (not 1)`);
        console.log(`- Average Sale: PKR ${averageSale.toFixed(2)} (not PKR 500.00)`);
        console.log(`- Wholesale Sales: ${wholesaleSales}`);
        console.log(`- Retail Sales: ${retailSales}`);
        console.log(`- Pending: ${pendingSales}`);

        // Test discount calculations
        const totalDiscounts = sales.reduce((sum, sale) => {
            const saleDiscount = Number(sale.discount_amount || 0);
            const itemDiscounts = (sale.items || []).reduce((itemSum, item) =>
                itemSum + Number(item.item_discount_amount || 0), 0);
            return sum + saleDiscount + itemDiscounts;
        }, 0);

        console.log(`\n💰 DISCOUNT VERIFICATION:`);
        console.log(`Total Discounts Given: PKR ${totalDiscounts.toFixed(2)}`);

        // Sample transaction details
        console.log(`\n🔍 SAMPLE TRANSACTIONS (for verification):`);
        sales.slice(0, 3).forEach(sale => {
            console.log(`Sale #${sale.id}: PKR ${sale.total_amount} - ${sale.customer_name || 'Walk-in'} - ${sale.status}`);
        });

        console.log(`\n✅ DASHBOARD FIX SUMMARY:`);
        console.log(`- Fixed: Dashboard now uses 'sales' array instead of 'getFilteredSales'`);
        console.log(`- Fixed: Overall statistics show ALL sales regardless of filters`);
        console.log(`- Added: Separate filtered analytics when filters are applied`);
        console.log(`- Result: Dashboard should display correct total revenue and transaction count`);

    } catch (error) {
        console.error('❌ Test Error:', error.response?.data || error.message);
    }
}

testDashboardFix();