const axios = require('axios');

async function testFrontendCartLogic() {
    console.log('🔍 Testing frontend cart creation logic...');

    try {
        // Login
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'owner',
            password: 'owner123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Get sale data (like frontend does)
        const response = await axios.get('http://localhost:5000/sales/37', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const sale = response.data;
        console.log('\n📋 Raw sale data:');
        console.log('Items count:', sale.items.length);

        // Simulate the exact frontend cart creation logic
        const cartItems = [];

        for (const item of sale.items) {
            console.log(`\n🔍 Processing item: ${item.product_id}`);
            console.log('Raw item data:', {
                product_id: item.product_id,
                product_name: item.product_name,
                name: item.name,
                uom: item.uom,
                product_uom: item.product_uom
            });

            // Simulate getting products data (like frontend fetchProducts)
            const productsResponse = await axios.get('http://localhost:5000/products', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const products = productsResponse.data;
            const currentProduct = products.find(p => p.id === item.product_id);

            console.log('Current product from products API:', currentProduct ? {
                id: currentProduct.id,
                name: currentProduct.name,
                uom: currentProduct.uom,
                brand: currentProduct.brand
            } : 'NOT FOUND');

            // Historical pricing calculation (simplified)
            const historicalPrice = parseFloat(item.price) || 0;
            const currentPrice = currentProduct ? parseFloat(currentProduct.retail_price) : 0;

            // Create cart item exactly like frontend does
            const cartItem = {
                id: item.product_id,
                name: item.product_name || item.name,  // THIS IS THE KEY LINE
                price: historicalPrice,
                quantity: parseInt(item.quantity) || 1,
                originalPrice: historicalPrice,
                historicalPrice: historicalPrice,
                currentPrice: currentPrice,
                priceUpdated: currentPrice !== historicalPrice,
                customerType: 'retail',
                itemDiscountType: 'none',
                itemDiscountValue: parseFloat(item.item_discount_value || item.discount_value) || 0,
                itemDiscountAmount: parseFloat(item.item_discount_amount || item.discount_amount) || 0,
                stock_quantity: item.stock_quantity || (currentProduct?.stock_quantity) || 999,
                uom: item.uom || (currentProduct?.uom) || 'pcs',
                brand: item.brand || (currentProduct?.brand) || ''
            };

            console.log('Created cart item:', {
                id: cartItem.id,
                name: cartItem.name,
                uom: cartItem.uom,
                quantity: cartItem.quantity
            });

            cartItems.push(cartItem);
        }

        console.log('\n🎯 Final cart for display:');
        cartItems.forEach((item, index) => {
            console.log(`Item ${index + 1}: "${item.name}" (${item.uom})`);
        });

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testFrontendCartLogic();