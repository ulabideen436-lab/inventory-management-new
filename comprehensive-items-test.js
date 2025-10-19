const axios = require('axios');

async function comprehensiveItemsTest() {
    console.log('🔍 Comprehensive Sales Items Display Test');
    console.log('=========================================');

    try {
        // Login
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });
        const token = loginResponse.data.token;
        console.log('✅ Login successful\n');

        // Test 1: Get all sales and check for null items
        console.log('Test 1: Sales List API - Checking for null items');
        console.log('------------------------------------------------');

        const salesResponse = await axios.get('http://localhost:5000/sales', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const sales = salesResponse.data;
        console.log(`📋 Total sales found: ${sales.length}`);

        let nullItemsFound = 0;
        let properItemsFound = 0;
        let totalItems = 0;

        sales.forEach((sale, index) => {
            if (sale.items && sale.items.length > 0) {
                sale.items.forEach(item => {
                    totalItems++;
                    if (item.name === 'null' || item.name === null || !item.name) {
                        nullItemsFound++;
                        console.log(`❌ Found null item in Sale #${sale.id}: product_id=${item.product_id}`);
                    } else {
                        properItemsFound++;
                        if (index < 3) { // Show first few examples
                            const brandPart = item.brand ? ` (${item.brand})` : '';
                            const uomPart = item.uom ? ` ${item.uom}` : '';
                            const displayText = `${item.name}${uomPart}${brandPart} x ${item.quantity}`;
                            console.log(`✅ Sale #${sale.id}: "${displayText}"`);
                        }
                    }
                });
            }
        });

        console.log(`\n📊 Results Summary:`);
        console.log(`   Total items: ${totalItems}`);
        console.log(`   Proper items: ${properItemsFound}`);
        console.log(`   Null items: ${nullItemsFound}`);

        // Test 2: Test individual sale endpoint
        console.log('\nTest 2: Individual Sale API - Detailed Check');
        console.log('--------------------------------------------');

        if (sales.length > 0) {
            const testSale = sales[0];
            const saleResponse = await axios.get(`http://localhost:5000/sales/${testSale.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const saleDetail = saleResponse.data;
            console.log(`📋 Testing Sale #${saleDetail.id}:`);

            if (saleDetail.items && saleDetail.items.length > 0) {
                saleDetail.items.forEach((item, index) => {
                    console.log(`\nItem ${index + 1}:`);
                    console.log(`  Product ID: ${item.product_id}`);
                    console.log(`  Name: "${item.name}" (was stored as: "${item.product_name}")`);
                    console.log(`  UOM: "${item.uom}" (was stored as: "${item.product_uom}")`);
                    console.log(`  Brand: "${item.brand || 'N/A'}" (was stored as: "${item.product_brand || 'N/A'}")`);

                    const isFixed = item.name !== 'null' && item.name !== null && item.name;
                    console.log(`  Status: ${isFixed ? '✅ FIXED' : '❌ STILL NULL'}`);
                });
            }
        }

        // Test 3: Frontend simulation
        console.log('\nTest 3: Frontend Display Simulation');
        console.log('-----------------------------------');

        if (sales.length > 0) {
            const formatItems = (items) => {
                if (!items || items.length === 0) return 'No items';
                return items.map(item => {
                    const brandPart = item.brand ? ` (${item.brand})` : '';
                    const uomPart = item.uom ? ` ${item.uom}` : '';
                    return `${item.name}${uomPart}${brandPart} x ${item.quantity}`;
                }).join(', ');
            };

            console.log('How items will appear in the frontend:');
            sales.slice(0, 5).forEach(sale => {
                const itemsDisplay = formatItems(sale.items);
                console.log(`Sale #${sale.id}: ${itemsDisplay}`);
            });
        }

        // Final verdict
        console.log('\n🎯 FINAL VERDICT');
        console.log('================');

        if (nullItemsFound === 0) {
            console.log('🎉 SUCCESS! All items are displaying correctly.');
            console.log('✅ The null items issue has been completely resolved.');
            console.log('✅ Frontend will now show proper product names instead of "null x quantity".');
        } else {
            console.log('❌ ISSUE: Some items are still showing as null.');
            console.log(`   ${nullItemsFound} out of ${totalItems} items need attention.`);
        }

    } catch (error) {
        console.error('❌ Test Error:', error.response?.data || error.message);
    }
}

comprehensiveItemsTest();