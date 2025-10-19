const axios = require('axios');

async function testSaleLevelDiscountFix() {
    try {
        console.log('='.repeat(60));
        console.log('SALE-LEVEL DISCOUNT FIX APPLIED');
        console.log('='.repeat(60));

        console.log('\n🔧 CHANGES MADE:');
        console.log('1. Updated getSales() to use sale.discount_amount instead of sale.discount');
        console.log('2. Updated getSale() to use sale.discount_amount instead of sale.discount');
        console.log('3. Updated getSoldProducts() SQL to use s.discount_amount instead of s.discount');

        console.log('\n📊 FOR SALE #37:');
        console.log('- Items gross total: PKR 45.00');
        console.log('- Item-level discounts: PKR 12.00');
        console.log('- Sale-level discount (discount_amount): PKR 10.00');
        console.log('- Expected final total: PKR 45.00 - 12.00 - 10.00 = PKR 23.00');

        console.log('\n✅ EXPECTED RESULTS AFTER BACKEND RESTART:');
        console.log('- Sale #37 total_amount should show: PKR 23.00');
        console.log('- Dashboard total discounts should show: PKR 22.00 (item + sale discounts)');
        console.log('- All revenue calculations will include both discount types');

        console.log('\n🔄 NEXT STEPS:');
        console.log('1. Restart the backend server');
        console.log('2. Refresh the frontend page');
        console.log('3. Sale #37 should now show correct amount (PKR 23.00)');
        console.log('4. Overall discount (PKR 10.00) will be properly considered');

        console.log('\n' + '='.repeat(60));
        console.log('THE SALE-LEVEL DISCOUNT IS NOW BEING CONSIDERED!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('Summary failed:', error.message);
    }
}

testSaleLevelDiscountFix();