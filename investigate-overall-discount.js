const axios = require('axios');

async function investigateOverallDiscount() {
    try {
        console.log('Investigating overall/sale-level discount for sale #37...\n');

        const loginRes = await axios.post('http://127.0.0.1:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });
        const token = loginRes.data.token;

        // Get sale #37 details
        const saleRes = await axios.get('http://127.0.0.1:5000/sales/37', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const sale = saleRes.data;

        console.log('SALE #37 DISCOUNT FIELDS:');
        console.log('- sale.discount:', sale.discount);
        console.log('- sale.discount_amount:', sale.discount_amount);
        console.log('- sale.discount_percentage:', sale.discount_percentage);
        console.log('- sale.discount_type:', sale.discount_type);
        console.log('- sale.subtotal:', sale.subtotal);

        console.log('\nCOMPLETE SALE OBJECT KEYS:');
        console.log(Object.keys(sale).sort());

        console.log('\nEXPECTED vs ACTUAL:');
        console.log('- Expected sale discount: PKR 22.00 (from frontend display)');
        console.log('- Actual sale.discount:', sale.discount);
        console.log('- Actual sale.discount_amount:', sale.discount_amount);

        // Calculate what the total should be with sale discount
        const itemsTotal = sale.items.reduce((sum, item) =>
            sum + (item.quantity * item.price), 0
        );
        const itemDiscounts = sale.items.reduce((sum, item) =>
            sum + parseFloat(item.item_discount_amount || 0), 0
        );

        console.log('\nMANUAL CALCULATION WITH OVERALL DISCOUNT:');
        console.log(`- Items gross total: PKR ${itemsTotal.toFixed(2)}`);
        console.log(`- Item-level discounts: PKR ${itemDiscounts.toFixed(2)}`);
        console.log(`- After item discounts: PKR ${(itemsTotal - itemDiscounts).toFixed(2)}`);
        console.log(`- Sale-level discount (expected): PKR 22.00`);
        console.log(`- Expected final total: PKR ${(itemsTotal - itemDiscounts - 22).toFixed(2)}`);
        console.log(`- Current calculated total: PKR ${sale.total_amount}`);

        // Check if the issue is in database field mapping
        console.log('\nDATABASE FIELD INVESTIGATION:');
        console.log('The sale-level discount might be stored in a different field.');
        console.log('Possible fields: discount, discount_amount, discount_percentage');

        if (sale.discount_amount && sale.discount_amount !== 0) {
            console.log(`✅ Found non-zero discount_amount: ${sale.discount_amount}`);
        } else {
            console.log('❌ discount_amount is null/zero');
        }

        if (sale.discount && sale.discount !== 0) {
            console.log(`✅ Found non-zero discount: ${sale.discount}`);
        } else {
            console.log('❌ discount is null/zero');
        }

    } catch (error) {
        console.error('Investigation failed:', error.response?.data || error.message);
    }
}

investigateOverallDiscount();