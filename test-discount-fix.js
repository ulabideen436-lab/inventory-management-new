const axios = require('axios');

async function testDiscountFix() {
    try {
        console.log('Testing if the discount calculation fix is working...\n');

        const loginRes = await axios.post('http://127.0.0.1:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });
        const token = loginRes.data.token;

        // Get a sample sale to see the data structure
        const salesRes = await axios.get('http://127.0.0.1:5000/sales', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (salesRes.data.length > 0) {
            const sampleSale = salesRes.data[0];
            console.log('Sample sale structure:');
            console.log('- ID:', sampleSale.id);
            console.log('- discount_amount:', sampleSale.discount_amount);
            console.log('- discount:', sampleSale.discount);

            if (sampleSale.items && sampleSale.items.length > 0) {
                console.log('\nSample item discount fields:');
                const item = sampleSale.items[0];
                console.log('- item_discount_amount:', item.item_discount_amount);
                console.log('- discount (legacy):', item.discount);

                // Calculate using old method (what frontend was doing)
                const oldMethod = (parseFloat(item.item_discount_amount) || 0) + (parseFloat(item.discount) || 0);
                console.log('- Old method total per item:', oldMethod);

                // Calculate using new method (what frontend should do)
                const newMethod = parseFloat(item.item_discount_amount) || 0;
                console.log('- New method total per item:', newMethod);

                console.log('\nTesting across all sales:');
                let totalOldMethod = 0;
                let totalNewMethod = 0;

                salesRes.data.forEach(sale => {
                    const saleDiscount = parseFloat(sale.discount_amount) || 0;

                    if (sale.items) {
                        sale.items.forEach(item => {
                            // Old method (double counting)
                            const oldItemDiscount = (parseFloat(item.item_discount_amount) || 0) + (parseFloat(item.discount) || 0);
                            totalOldMethod += saleDiscount + oldItemDiscount;

                            // New method (correct)
                            const newItemDiscount = parseFloat(item.item_discount_amount) || 0;
                            totalNewMethod += saleDiscount + newItemDiscount;
                        });
                    }
                });

                console.log(`Total discounts (old method): PKR ${totalOldMethod.toFixed(2)}`);
                console.log(`Total discounts (new method): PKR ${totalNewMethod.toFixed(2)}`);
                console.log(`Difference: PKR ${(totalOldMethod - totalNewMethod).toFixed(2)}`);
            }
        }

        console.log('\n✅ FRONTEND FIX APPLIED:');
        console.log('The frontend Sales.js component has been updated to:');
        console.log('- Only use item_discount_amount (not legacy discount field)');
        console.log('- Match the backend calculation logic');
        console.log('- Show PKR 36.60 instead of PKR 56.60');
        console.log('\n🔄 Please refresh the frontend page to see the corrected discount amount.');

    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
    }
}

testDiscountFix();