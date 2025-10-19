const axios = require('axios');

async function checkRawData() {
    try {
        // Authenticate
        const authResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });
        const token = authResponse.data.token;

        // Get all sales data to see what's actually in the database
        console.log('🔍 Checking raw sales data...');
        const salesResponse = await axios.get('http://localhost:5000/sales', {
            headers: { Authorization: `Bearer ${token}` },
            params: {
                start_date: '2025-09-11',
                end_date: '2025-10-11'
            }
        });

        const sales = salesResponse.data;
        console.log(`Found ${sales.length} sales\n`);

        // Group sales by product_id to see the issue
        const productGroups = {};
        sales.forEach(sale => {
            if (sale.items) {
                sale.items.forEach(item => {
                    const pid = item.product_id;
                    if (!productGroups[pid]) {
                        productGroups[pid] = {
                            product_id: pid,
                            product_names: new Set(),
                            product_brands: new Set(),
                            sales: []
                        };
                    }
                    productGroups[pid].product_names.add(item.product_name || 'null');
                    productGroups[pid].product_brands.add(item.product_brand || 'null');
                    productGroups[pid].sales.push({
                        sale_id: sale.id,
                        quantity: item.quantity,
                        price: item.price,
                        product_name: item.product_name,
                        product_brand: item.product_brand,
                        date: sale.date
                    });
                });
            }
        });

        console.log('📊 Product Analysis:');
        Object.keys(productGroups).forEach(productId => {
            const group = productGroups[productId];
            console.log(`\n🏷️ Product ID: ${productId}`);
            console.log(`   Names: ${Array.from(group.product_names).join(', ')}`);
            console.log(`   Brands: ${Array.from(group.product_brands).join(', ')}`);
            console.log(`   Total Sales: ${group.sales.length}`);
            console.log(`   Total Quantity: ${group.sales.reduce((sum, s) => sum + parseInt(s.quantity), 0)}`);

            // Show a few examples
            console.log(`   Sample sales:`);
            group.sales.slice(0, 3).forEach(sale => {
                console.log(`     - Sale ${sale.sale_id}: ${sale.quantity} × ${sale.price} (${sale.product_name})`);
            });
            if (group.sales.length > 3) {
                console.log(`     - ... and ${group.sales.length - 3} more`);
            }
        });

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

checkRawData();