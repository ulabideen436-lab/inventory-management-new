const axios = require('axios');

async function verifyCalculations() {
    try {
        // First, authenticate
        console.log('🔐 Authenticating...');
        const authResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });
        const token = authResponse.data.token;

        // Get sold products data
        console.log('📊 Fetching sold products data...');
        const response = await axios.get('http://localhost:5000/sales/sold-products', {
            headers: { Authorization: `Bearer ${token}` },
            params: {
                start_date: '2025-09-11',
                end_date: '2025-10-11'
            }
        });

        const soldProducts = response.data.soldProducts;
        console.log(`\n📋 Found ${soldProducts.length} sold products\n`);

        // Verify calculations for each product
        for (let i = 0; i < soldProducts.length; i++) {
            const product = soldProducts[i];
            console.log(`🔍 PRODUCT ${i + 1}: ${product.display_name || product.product_name}`);
            console.log(`   ID: ${product.product_id}`);
            console.log(`   Deleted: ${product.is_deleted_product ? 'YES' : 'NO'}`);
            console.log('   ----------------------------------------');

            // Basic numbers
            const totalQty = parseInt(product.total_quantity_sold);
            const avgPrice = parseFloat(product.average_sale_price);
            const grossRevenue = parseFloat(product.total_gross_revenue);
            const itemDiscounts = parseFloat(product.total_item_discounts);
            const saleDiscounts = parseFloat(product.total_sale_discounts);
            const totalDiscounts = parseFloat(product.total_discounts_given);
            const netRevenue = parseFloat(product.total_net_revenue);
            const estimatedProfit = parseFloat(product.estimated_profit);
            const profitMargin = parseFloat(product.profit_margin_percentage);
            const costPrice = parseFloat(product.current_cost_price || 0);

            console.log(`   📦 Quantity Sold: ${totalQty}`);
            console.log(`   💰 Average Price: PKR ${avgPrice.toFixed(2)}`);
            console.log(`   📈 Gross Revenue: PKR ${grossRevenue.toFixed(2)}`);

            // Verify gross revenue calculation
            const calculatedGrossFromQtyPrice = totalQty * avgPrice;
            console.log(`   ✓ Gross Revenue Check: ${totalQty} × ${avgPrice.toFixed(2)} = PKR ${calculatedGrossFromQtyPrice.toFixed(2)}`);
            console.log(`   ${Math.abs(calculatedGrossFromQtyPrice - grossRevenue) < 1 ? '✅ MATCH' : '❌ MISMATCH'}`);

            // Verify discount calculations
            console.log(`   🏷️ Item Discounts: PKR ${itemDiscounts.toFixed(2)}`);
            console.log(`   🏷️ Sale Discounts: PKR ${saleDiscounts.toFixed(2)}`);
            console.log(`   🏷️ Total Discounts: PKR ${totalDiscounts.toFixed(2)}`);

            const calculatedTotalDiscounts = itemDiscounts + saleDiscounts;
            console.log(`   ✓ Total Discount Check: ${itemDiscounts.toFixed(2)} + ${saleDiscounts.toFixed(2)} = PKR ${calculatedTotalDiscounts.toFixed(2)}`);
            console.log(`   ${Math.abs(calculatedTotalDiscounts - totalDiscounts) < 0.01 ? '✅ MATCH' : '❌ MISMATCH'}`);

            // Verify net revenue calculation
            const calculatedNetRevenue = grossRevenue - totalDiscounts;
            console.log(`   💵 Net Revenue: PKR ${netRevenue.toFixed(2)}`);
            console.log(`   ✓ Net Revenue Check: ${grossRevenue.toFixed(2)} - ${totalDiscounts.toFixed(2)} = PKR ${calculatedNetRevenue.toFixed(2)}`);
            console.log(`   ${Math.abs(calculatedNetRevenue - netRevenue) < 0.01 ? '✅ MATCH' : '❌ MISMATCH'}`);

            // Verify profit calculation (only if cost price available)
            if (costPrice > 0) {
                const calculatedProfit = netRevenue - (totalQty * costPrice);
                console.log(`   💰 Cost Price: PKR ${costPrice.toFixed(2)} per unit`);
                console.log(`   💰 Total Cost: PKR ${(totalQty * costPrice).toFixed(2)}`);
                console.log(`   💰 Estimated Profit: PKR ${estimatedProfit.toFixed(2)}`);
                console.log(`   ✓ Profit Check: ${netRevenue.toFixed(2)} - ${(totalQty * costPrice).toFixed(2)} = PKR ${calculatedProfit.toFixed(2)}`);
                console.log(`   ${Math.abs(calculatedProfit - estimatedProfit) < 0.01 ? '✅ MATCH' : '❌ MISMATCH'}`);

                // Verify profit margin calculation
                const calculatedMargin = (estimatedProfit / (totalQty * costPrice)) * 100;
                console.log(`   📊 Profit Margin: ${profitMargin.toFixed(2)}%`);
                console.log(`   ✓ Margin Check: (${estimatedProfit.toFixed(2)} / ${(totalQty * costPrice).toFixed(2)}) × 100 = ${calculatedMargin.toFixed(2)}%`);
                console.log(`   ${Math.abs(calculatedMargin - profitMargin) < 0.1 ? '✅ MATCH' : '❌ MISMATCH'}`);
            } else {
                console.log(`   💰 Cost data unavailable (deleted product)`);
                console.log(`   💰 Estimated Profit: PKR ${estimatedProfit.toFixed(2)}`);
                console.log(`   📊 Profit Margin: ${profitMargin.toFixed(2)}%`);
            }

            console.log('\n');
        }

        // Verify summary calculations
        console.log('📊 SUMMARY VERIFICATION');
        console.log('========================');
        const summary = response.data.summary;

        const sumQuantity = soldProducts.reduce((sum, p) => sum + parseInt(p.total_quantity_sold), 0);
        const sumGrossRevenue = soldProducts.reduce((sum, p) => sum + parseFloat(p.total_gross_revenue), 0);
        const sumTotalDiscounts = soldProducts.reduce((sum, p) => sum + parseFloat(p.total_discounts_given), 0);
        const sumNetRevenue = soldProducts.reduce((sum, p) => sum + parseFloat(p.total_net_revenue), 0);
        const sumProfit = soldProducts.reduce((sum, p) => sum + parseFloat(p.estimated_profit), 0);

        console.log(`Total Quantity: ${summary.totalQuantity} (Calculated: ${sumQuantity}) ${summary.totalQuantity === sumQuantity ? '✅' : '❌'}`);
        console.log(`Total Gross Revenue: ${summary.totalGrossRevenue} (Calculated: ${sumGrossRevenue.toFixed(2)}) ${Math.abs(summary.totalGrossRevenue - sumGrossRevenue) < 0.01 ? '✅' : '❌'}`);
        console.log(`Total Discounts: ${summary.totalDiscount} (Calculated: ${sumTotalDiscounts.toFixed(2)}) ${Math.abs(summary.totalDiscount - sumTotalDiscounts) < 0.01 ? '✅' : '❌'}`);
        console.log(`Total Net Revenue: ${summary.totalRevenue} (Calculated: ${sumNetRevenue.toFixed(2)}) ${Math.abs(summary.totalRevenue - sumNetRevenue) < 0.01 ? '✅' : '❌'}`);
        console.log(`Total Profit: ${summary.totalProfit} (Calculated: ${sumProfit.toFixed(2)}) ${Math.abs(summary.totalProfit - sumProfit) < 0.01 ? '✅' : '❌'}`);

    } catch (error) {
        console.error('❌ Error verifying calculations:', error.response?.data || error.message);
    }
}

verifyCalculations();