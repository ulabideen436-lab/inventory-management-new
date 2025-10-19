const axios = require('axios');

// Test the invoice discount display fix
async function testInvoiceDiscountDisplay() {
    try {
        console.log('Testing invoice discount display fix...\n');

        // First login to get token
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'owner',
            password: 'password'
        });

        const token = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // Get Sale #37 which we know has sale-level discount
        const saleResponse = await axios.get('http://localhost:5000/api/sales/37', { headers });
        const sale = saleResponse.data;

        console.log('Sale #37 Details:');
        console.log('Items:', sale.items?.length || 0);
        console.log('Sale discount_amount:', sale.discount_amount);
        console.log('Total amount:', sale.total_amount);

        // Calculate what the invoice should show
        let itemsGross = 0;
        let itemsDiscount = 0;

        if (sale.items) {
            sale.items.forEach(item => {
                const gross = Number(item.quantity) * Number(item.price);
                const discount = Number(item.item_discount_amount || 0);
                itemsGross += gross;
                itemsDiscount += discount;
                console.log(`  Item: ${item.name} - Qty: ${item.quantity}, Price: ${item.price}, Gross: ${gross}, Discount: ${discount}`);
            });
        }

        const subtotal = itemsGross - itemsDiscount;
        const saleDiscount = Number(sale.discount_amount || 0);
        const finalTotal = subtotal - saleDiscount;

        console.log('\nInvoice Calculation:');
        console.log('1. Items Gross Total:', itemsGross.toFixed(2));
        console.log('2. Less: Item Discounts:', itemsDiscount.toFixed(2));
        console.log('3. Subtotal:', subtotal.toFixed(2));
        console.log('4. Less: Overall Discount:', saleDiscount.toFixed(2));
        console.log('5. FINAL TOTAL:', finalTotal.toFixed(2));

        console.log('\nExpected invoice layout:');
        console.log('Items table with individual discounts');
        console.log('└── Subtotal: PKR', subtotal.toFixed(2));
        if (saleDiscount > 0) {
            console.log('└── Overall Discount: -PKR', saleDiscount.toFixed(2));
        }
        console.log('└── FINAL TOTAL: PKR', finalTotal.toFixed(2));

        // Verify this matches the stored total_amount
        if (Math.abs(finalTotal - Number(sale.total_amount)) < 0.01) {
            console.log('\n✅ Invoice calculation matches stored total_amount');
        } else {
            console.log('\n❌ Invoice calculation does NOT match stored total_amount');
            console.log('   Expected:', finalTotal.toFixed(2));
            console.log('   Stored:', Number(sale.total_amount).toFixed(2));
        }

    } catch (error) {
        console.error('Error testing invoice discount display:', error.response?.data || error.message);
    }
}

testInvoiceDiscountDisplay();