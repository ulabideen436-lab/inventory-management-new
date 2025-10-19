const axios = require('axios');

async function testCalculations() {
    console.log('🧮 COMPREHENSIVE CALCULATION AUDIT');
    console.log('==================================');

    try {
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });
        const token = loginResponse.data.token;
        console.log('✅ Login successful\n');

        // Get all sales to analyze calculations
        const salesResponse = await axios.get('http://localhost:5000/sales', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const sales = salesResponse.data;
        console.log(`📋 Analyzing ${sales.length} sales for calculation accuracy\n`);

        let issuesFound = 0;
        const calculationIssues = [];

        sales.forEach((sale, index) => {
            if (index < 5) { // Analyze first 5 sales in detail
                console.log(`\n🔍 Sale #${sale.id} Analysis:`);

                // Check if sale has items
                if (!sale.items || sale.items.length === 0) {
                    console.log('   ❌ No items found in sale');
                    calculationIssues.push(`Sale #${sale.id}: No items`);
                    issuesFound++;
                    return;
                }

                // Manual calculation verification
                let manualSubtotal = 0;
                let manualItemDiscounts = 0;
                let manualGrossTotal = 0;

                console.log('   📦 Items breakdown:');
                sale.items.forEach((item, itemIndex) => {
                    const itemGross = parseFloat(item.quantity || 0) * parseFloat(item.original_price || item.price || 0);
                    const itemFinal = parseFloat(item.quantity || 0) * parseFloat(item.final_price || item.price || 0);
                    const itemDiscount = parseFloat(item.item_discount_amount || 0);

                    manualGrossTotal += itemGross;
                    manualSubtotal += itemFinal;
                    manualItemDiscounts += itemDiscount;

                    console.log(`     Item ${itemIndex + 1}: ${item.name || 'Unknown'}`);
                    console.log(`       Qty: ${item.quantity}, Original Price: ${item.original_price || item.price}`);
                    console.log(`       Final Price: ${item.final_price || item.price}, Item Discount: ${itemDiscount}`);
                    console.log(`       Item Gross: ${itemGross.toFixed(2)}, Item Net: ${itemFinal.toFixed(2)}`);

                    // Check for calculation errors in items
                    if (Math.abs(itemGross - itemFinal - itemDiscount) > 0.01) {
                        console.log(`       ⚠️  Item calculation mismatch: ${itemGross} - ${itemFinal} ≠ ${itemDiscount}`);
                        calculationIssues.push(`Sale #${sale.id} Item ${itemIndex + 1}: Item discount calculation error`);
                        issuesFound++;
                    }
                });

                // Check sale-level calculations
                console.log(`\n   💰 Sale-level calculations:`);
                console.log(`     Manual Gross Total: ${manualGrossTotal.toFixed(2)}`);
                console.log(`     Manual Subtotal (after item discounts): ${manualSubtotal.toFixed(2)}`);
                console.log(`     Manual Item Discounts: ${manualItemDiscounts.toFixed(2)}`);

                const storedSubtotal = parseFloat(sale.subtotal || 0);
                const saleDiscount = parseFloat(sale.discount_amount || 0);
                const storedTotal = parseFloat(sale.total_amount || 0);

                console.log(`     Stored Subtotal: ${storedSubtotal.toFixed(2)}`);
                console.log(`     Sale Discount: ${saleDiscount.toFixed(2)}`);
                console.log(`     Stored Total: ${storedTotal.toFixed(2)}`);

                // Expected final total
                const expectedTotal = manualSubtotal - saleDiscount;
                console.log(`     Expected Final Total: ${expectedTotal.toFixed(2)}`);

                // Check for discrepancies
                if (Math.abs(storedSubtotal - manualSubtotal) > 0.01) {
                    console.log(`     ❌ Subtotal mismatch: stored ${storedSubtotal} vs calculated ${manualSubtotal.toFixed(2)}`);
                    calculationIssues.push(`Sale #${sale.id}: Subtotal mismatch`);
                    issuesFound++;
                }

                if (Math.abs(storedTotal - expectedTotal) > 0.01) {
                    console.log(`     ❌ Total mismatch: stored ${storedTotal} vs expected ${expectedTotal.toFixed(2)}`);
                    calculationIssues.push(`Sale #${sale.id}: Total amount mismatch`);
                    issuesFound++;
                }

                // Check customer type pricing
                console.log(`     Customer Type: ${sale.customer_type || 'Not specified'}`);
                if (sale.customer_type === 'wholesale') {
                    console.log(`     ⚠️  Wholesale customer - verify pricing used wholesale rates`);
                }

                // Check discount consistency
                if (sale.discount_type === 'percentage' && sale.discount_percentage) {
                    const expectedDiscountAmount = (storedSubtotal * parseFloat(sale.discount_percentage)) / 100;
                    if (Math.abs(saleDiscount - expectedDiscountAmount) > 0.01) {
                        console.log(`     ❌ Percentage discount calculation error: ${saleDiscount} vs expected ${expectedDiscountAmount.toFixed(2)}`);
                        calculationIssues.push(`Sale #${sale.id}: Percentage discount calculation error`);
                        issuesFound++;
                    }
                }

                if (issuesFound === 0) {
                    console.log(`     ✅ All calculations appear correct`);
                }
            }
        });

        // Summary of calculation issues
        console.log(`\n\n📊 CALCULATION AUDIT SUMMARY`);
        console.log('============================');
        console.log(`Total sales analyzed: ${Math.min(sales.length, 5)}`);
        console.log(`Calculation issues found: ${issuesFound}`);

        if (calculationIssues.length > 0) {
            console.log(`\n❌ Issues identified:`);
            calculationIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        } else {
            console.log(`\n✅ No calculation issues found in analyzed sales!`);
        }

        // Test customer type pricing
        console.log(`\n🏷️  CUSTOMER TYPE PRICING TEST`);
        console.log('==============================');

        const retailSales = sales.filter(s => s.customer_type === 'retail' || !s.customer_type);
        const wholesaleSales = sales.filter(s => s.customer_type === 'wholesale');

        console.log(`Retail sales: ${retailSales.length}`);
        console.log(`Wholesale sales: ${wholesaleSales.length}`);

        if (wholesaleSales.length > 0 && retailSales.length > 0) {
            // Check if wholesale prices are generally lower
            const avgRetailPrice = retailSales.reduce((sum, sale) => {
                if (sale.items && sale.items.length > 0) {
                    const avgItemPrice = sale.items.reduce((itemSum, item) => itemSum + parseFloat(item.price || 0), 0) / sale.items.length;
                    return sum + avgItemPrice;
                }
                return sum;
            }, 0) / retailSales.length;

            const avgWholesalePrice = wholesaleSales.reduce((sum, sale) => {
                if (sale.items && sale.items.length > 0) {
                    const avgItemPrice = sale.items.reduce((itemSum, item) => itemSum + parseFloat(item.price || 0), 0) / sale.items.length;
                    return sum + avgItemPrice;
                }
                return sum;
            }, 0) / wholesaleSales.length;

            console.log(`Average retail item price: ${avgRetailPrice.toFixed(2)}`);
            console.log(`Average wholesale item price: ${avgWholesalePrice.toFixed(2)}`);

            if (avgWholesalePrice >= avgRetailPrice) {
                console.log(`⚠️  Wholesale prices appear to be same or higher than retail prices`);
                calculationIssues.push('Customer type pricing: Wholesale not consistently lower than retail');
            }
        }

        // Final recommendation
        console.log(`\n🎯 RECOMMENDATIONS`);
        console.log('==================');

        if (calculationIssues.length > 0) {
            console.log('❌ Calculation fixes needed:');
            console.log('   1. Standardize calculation logic across all functions');
            console.log('   2. Implement proper item-level discount calculations');
            console.log('   3. Fix sale-level discount calculations');
            console.log('   4. Ensure customer type pricing consistency');
            console.log('   5. Add calculation validation at time of sale creation');
        } else {
            console.log('✅ All calculations appear to be working correctly!');
        }

    } catch (error) {
        console.error('❌ Test Error:', error.response?.data || error.message);
    }
}

testCalculations();