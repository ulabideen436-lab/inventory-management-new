const axios = require('axios');

async function analyzeSaleItemsStructure() {
    console.log('🔍 Analyzing Sale Items Data Structure');
    console.log('=====================================');

    try {
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });
        const token = loginResponse.data.token;

        // Get a few sales to examine their structure
        const salesResponse = await axios.get('http://localhost:5000/sales', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const sales = salesResponse.data;

        if (sales.length > 0) {
            const sampleSale = sales[0];
            console.log(`📋 Examining Sale #${sampleSale.id}:`);

            if (sampleSale.items && sampleSale.items.length > 0) {
                const sampleItem = sampleSale.items[0];
                console.log('\n📦 Current sale_items data structure:');
                console.log('Raw item data:', JSON.stringify(sampleItem, null, 2));

                // Check what historical data is stored vs current product data
                const productId = sampleItem.product_id;
                try {
                    const currentProductResponse = await axios.get(`http://localhost:5000/products/${productId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    const currentProduct = currentProductResponse.data;
                    console.log('\n🔄 Historical vs Current Comparison:');
                    console.log('┌─────────────────┬─────────────────┬─────────────────┐');
                    console.log('│ Field           │ Historical Sale │ Current Product │');
                    console.log('├─────────────────┼─────────────────┼─────────────────┤');
                    console.log(`│ Name            │ ${(sampleItem.product_name || 'null').padEnd(15)} │ ${(currentProduct.name || 'null').padEnd(15)} │`);
                    console.log(`│ Price (stored)  │ ${String(sampleItem.price || 'null').padEnd(15)} │ ${String(currentProduct.price || 'null').padEnd(15)} │`);
                    console.log(`│ Brand           │ ${(sampleItem.product_brand || 'null').padEnd(15)} │ ${(currentProduct.brand || 'null').padEnd(15)} │`);
                    console.log(`│ UOM             │ ${(sampleItem.product_uom || 'null').padEnd(15)} │ ${(currentProduct.uom || 'null').padEnd(15)} │`);
                    console.log('└─────────────────┴─────────────────┴─────────────────┘');

                    // Check for discrepancies
                    const hasNameChange = (sampleItem.product_name || sampleItem.name) !== currentProduct.name;
                    const hasPriceChange = parseFloat(sampleItem.price) !== parseFloat(currentProduct.price);
                    const hasBrandChange = (sampleItem.product_brand || sampleItem.brand) !== currentProduct.brand;
                    const hasUomChange = (sampleItem.product_uom || sampleItem.uom) !== currentProduct.uom;

                    console.log('\n⚠️  Changes Detected:');
                    if (hasNameChange) console.log(`   🔄 Name changed from "${sampleItem.product_name || sampleItem.name}" to "${currentProduct.name}"`);
                    if (hasPriceChange) console.log(`   💰 Price changed from ${sampleItem.price} to ${currentProduct.price}`);
                    if (hasBrandChange) console.log(`   🏷️  Brand changed from "${sampleItem.product_brand || sampleItem.brand}" to "${currentProduct.brand}"`);
                    if (hasUomChange) console.log(`   📏 UOM changed from "${sampleItem.product_uom || sampleItem.uom}" to "${currentProduct.uom}"`);

                    if (!hasNameChange && !hasPriceChange && !hasBrandChange && !hasUomChange) {
                        console.log('   ✅ No changes detected - product data is consistent');
                    }

                } catch (productError) {
                    console.log('\n❌ Product has been DELETED from the system');
                    console.log('   This sale contains a reference to a deleted product');
                    console.log(`   Product ID: ${productId}`);
                    console.log(`   Historical data: name="${sampleItem.product_name || sampleItem.name}", price=${sampleItem.price}`);
                }
            }
        }

        // Check what fields are available in sale_items
        console.log('\n📊 Available fields in sale_items:');
        if (sales.length > 0 && sales[0].items && sales[0].items.length > 0) {
            const fields = Object.keys(sales[0].items[0]);
            fields.forEach(field => {
                const value = sales[0].items[0][field];
                const valuePreview = String(value).length > 20 ? String(value).substring(0, 20) + '...' : String(value);
                console.log(`   ${field}: ${valuePreview}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

analyzeSaleItemsStructure();