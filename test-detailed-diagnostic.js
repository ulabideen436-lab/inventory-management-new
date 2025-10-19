const axios = require('axios');

async function detailedDiagnostic() {
    try {
        console.log('Detailed diagnostic of sales vs sale_items...\n');

        // Login
        const loginResponse = await axios.post('http://127.0.0.1:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });

        const token = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // Get sales data with the new calculations
        const salesResponse = await axios.get('http://127.0.0.1:5000/sales', { headers });
        const sales = salesResponse.data;

        console.log('DETAILED SALES ANALYSIS:');
        console.log(`Total sales returned: ${sales.length}`);

        // Check if the new calculated fields are present
        if (sales.length > 0) {
            const firstSale = sales[0];
            console.log('Sample sale object keys:', Object.keys(firstSale));

            if (firstSale.calculated_net_amount !== undefined) {
                console.log('✅ New calculated fields are present');

                let totalCalculatedNet = 0;
                let totalStoredAmount = 0;
                let salesWithItems = 0;

                sales.forEach(sale => {
                    if (sale.calculated_net_amount !== null) {
                        totalCalculatedNet += parseFloat(sale.calculated_net_amount || 0);
                        salesWithItems++;
                    }
                    totalStoredAmount += parseFloat(sale.total_amount || 0);
                });

                console.log(`Sales with items: ${salesWithItems}`);
                console.log(`Total calculated net amount: PKR ${totalCalculatedNet.toFixed(2)}`);
                console.log(`Total stored amount: PKR ${totalStoredAmount.toFixed(2)}`);

                // Show sample of calculated vs stored
                console.log('\nSample sales (first 5):');
                sales.slice(0, 5).forEach((sale, i) => {
                    console.log(`${i + 1}. ID ${sale.id}:`);
                    console.log(`   Stored total_amount: PKR ${sale.total_amount}`);
                    console.log(`   Calculated net: PKR ${sale.calculated_net_amount || 'null'}`);
                    console.log(`   Calculated gross: PKR ${sale.calculated_gross_amount || 'null'}`);
                    console.log(`   Item discounts: PKR ${sale.calculated_item_discounts || 'null'}`);
                    console.log(`   Items count: ${sale.items ? sale.items.length : 'unknown'}`);
                });

            } else {
                console.log('❌ Calculated fields are missing - query might have failed');
            }
        }

        // Get sold products for comparison
        const soldProductsResponse = await axios.get('http://127.0.0.1:5000/sales/sold-products', { headers });
        const soldProducts = soldProductsResponse.data;

        console.log(`\nSOLD PRODUCTS COMPARISON:`);
        console.log(`Unique transactions: ${soldProducts.summary.totalTransactions}`);
        console.log(`Net revenue: PKR ${soldProducts.summary.totalRevenue.toFixed(2)}`);

        console.log('\nCONCLUSION:');
        if (sales.length === soldProducts.summary.totalTransactions) {
            console.log('✅ Transaction counts match after filtering orphaned sales');
        } else {
            console.log(`❌ Transaction count mismatch: ${sales.length} vs ${soldProducts.summary.totalTransactions}`);
        }

    } catch (error) {
        console.error('Diagnostic failed:', error.response ? error.response.data : error.message);
    }
}

detailedDiagnostic();