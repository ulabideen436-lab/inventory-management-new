const axios = require('axios');

async function investigateRevenueCalculation() {
    try {
        console.log('Investigating revenue calculation for sale #37...\n');

        const loginRes = await axios.post('http://127.0.0.1:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });
        const token = loginRes.data.token;

        // Get the specific sale #37
        try {
            const saleRes = await axios.get('http://127.0.0.1:5000/sales/37', {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('SALE #37 DETAILS:');
            console.log('- ID:', saleRes.data.id);
            console.log('- Original total_amount:', saleRes.data.total_amount);
            console.log('- Calculated net amount:', saleRes.data.calculated_net_amount);
            console.log('- Calculated gross amount:', saleRes.data.calculated_gross_amount);
            console.log('- Calculated item discounts:', saleRes.data.calculated_item_discounts);
            console.log('- Discount:', saleRes.data.discount);
            console.log('- Customer:', saleRes.data.customer_name);

            if (saleRes.data.items) {
                console.log('\nITEMS BREAKDOWN:');
                saleRes.data.items.forEach((item, index) => {
                    console.log(`Item ${index + 1}: ${item.name}`);
                    console.log(`  - Quantity: ${item.quantity}`);
                    console.log(`  - Price: ${item.price}`);
                    console.log(`  - Gross: ${item.quantity * item.price}`);
                    console.log(`  - Item discount amount: ${item.item_discount_amount || 0}`);
                    console.log(`  - Legacy discount: ${item.discount || 0}`);
                    console.log(`  - Net: ${(item.quantity * item.price) - (item.item_discount_amount || 0)}`);
                });

                // Manual calculation
                let totalGross = 0;
                let totalItemDiscounts = 0;
                saleRes.data.items.forEach(item => {
                    totalGross += item.quantity * item.price;
                    totalItemDiscounts += parseFloat(item.item_discount_amount || 0);
                });

                console.log('\nMANUAL CALCULATION:');
                console.log(`- Total gross: ${totalGross}`);
                console.log(`- Total item discounts: ${totalItemDiscounts}`);
                console.log(`- Expected net: ${totalGross - totalItemDiscounts}`);
                console.log(`- Stored total_amount: ${saleRes.data.total_amount}`);
                console.log(`- Difference: ${Math.abs((totalGross - totalItemDiscounts) - saleRes.data.total_amount)}`);
            }

        } catch (error) {
            console.log('Could not get individual sale, checking in sales list...');

            // Get all sales and find #37
            const salesRes = await axios.get('http://127.0.0.1:5000/sales', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const sale37 = salesRes.data.find(sale => sale.id === 37);
            if (sale37) {
                console.log('SALE #37 FROM LIST:');
                console.log('- ID:', sale37.id);
                console.log('- total_amount:', sale37.total_amount);
                console.log('- calculated_net_amount:', sale37.calculated_net_amount);
                console.log('- calculated_gross_amount:', sale37.calculated_gross_amount);
                console.log('- calculated_item_discounts:', sale37.calculated_item_discounts);
                console.log('- discount:', sale37.discount);
                console.log('- Items count:', sale37.items ? sale37.items.length : 'No items');

                if (sale37.items) {
                    console.log('\nITEMS:');
                    sale37.items.forEach((item, index) => {
                        console.log(`${index + 1}. ${item.name}: ${item.quantity} x ${item.price} = ${item.quantity * item.price}`);
                        console.log(`   Item discount: ${item.item_discount_amount || 0}`);
                    });
                }
            }

            // Also check the summary calculation
            console.log('\nSUMMARY CALCULATION:');
            let totalRevenue = salesRes.data.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);
            console.log(`- Total revenue from all sales: PKR ${totalRevenue.toFixed(2)}`);
            console.log(`- Number of sales: ${salesRes.data.length}`);

            // Check if filtering is affecting the count
            console.log('\nFILTERING CHECK:');
            const completedSales = salesRes.data.filter(sale => sale.status === 'completed');
            const completedRevenue = completedSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);
            console.log(`- Completed sales count: ${completedSales.length}`);
            console.log(`- Completed sales revenue: PKR ${completedRevenue.toFixed(2)}`);
        }

    } catch (error) {
        console.error('Investigation failed:', error.response?.data || error.message);
    }
}

investigateRevenueCalculation();