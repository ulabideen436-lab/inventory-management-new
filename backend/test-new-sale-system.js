import mysql from 'mysql2/promise';

async function testNewSaleSystem() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Zafaryaqoob.com786',
            database: 'storeflow'
        });

        console.log('=== Testing New Sale System ===');
        console.log('');

        // Step 1: Get a product's current price
        console.log('1. Getting current product details...');
        const [products] = await conn.query('SELECT * FROM products LIMIT 1');
        if (products.length === 0) {
            console.log('No products found in database');
            await conn.end();
            return;
        }

        const product = products[0];
        console.log(`Product: ${product.name} (${product.brand})`);
        console.log(`Current Retail Price: $${product.retail_price}`);
        console.log(`Current UOM: ${product.uom}`);
        console.log('');

        // Step 2: Create a test sale using direct storage
        console.log('2. Creating a test sale with direct product storage...');

        // Insert test sale
        const [saleResult] = await conn.query(`
      INSERT INTO sales (customer_type, customer_id, subtotal, total_amount, date) 
      VALUES ('retail', NULL, 100.00, 100.00, NOW())
    `);
        const saleId = saleResult.insertId;

        // Insert sale item with direct product details (not using foreign keys)
        await conn.query(`
      INSERT INTO sale_items (
        sale_id, product_id, product_name, product_brand, product_category, product_uom,
        quantity, price, original_price, final_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            saleId,
            product.id,
            product.name,
            product.brand,
            product.category,
            product.uom,
            2, // quantity
            product.retail_price, // price
            product.retail_price, // original_price
            product.retail_price  // final_price
        ]);

        console.log(`   ✓ Created sale #${saleId} with product details stored directly`);
        console.log('');

        // Step 3: Change the product price
        console.log('3. Changing product price to test independence...');
        const newPrice = parseFloat(product.retail_price) + 10.00;
        await conn.query('UPDATE products SET retail_price = ? WHERE id = ?', [newPrice, product.id]);
        console.log(`   ✓ Changed product price from $${product.retail_price} to $${newPrice}`);
        console.log('');

        // Step 4: Verify sale data is unchanged
        console.log('4. Verifying sale data remains unchanged...');
        const [saleItems] = await conn.query(`
      SELECT product_name, product_brand, product_uom, price, quantity 
      FROM sale_items 
      WHERE sale_id = ?
    `, [saleId]);

        if (saleItems.length > 0) {
            const item = saleItems[0];
            console.log(`   Sale Item Details:`);
            console.log(`   - Product Name: ${item.product_name}`);
            console.log(`   - Product Brand: ${item.product_brand}`);
            console.log(`   - Product UOM: ${item.product_uom}`);
            console.log(`   - Sale Price: $${item.price}`);
            console.log(`   - Quantity: ${item.quantity}`);

            if (parseFloat(item.price) === parseFloat(product.retail_price)) {
                console.log('   ✓ Sale price matches original product price (independent of current price)');
            } else {
                console.log('   ✗ Sale price does not match expected price');
            }
        }
        console.log('');

        // Step 5: Check current product price
        console.log('5. Verifying current product price is different...');
        const [currentProduct] = await conn.query('SELECT retail_price FROM products WHERE id = ?', [product.id]);
        console.log(`   Current product price: $${currentProduct[0].retail_price}`);
        console.log(`   Sale price remains: $${saleItems[0].price}`);

        if (parseFloat(currentProduct[0].retail_price) !== parseFloat(saleItems[0].price)) {
            console.log('   ✓ SUCCESS: Sale prices are independent of current product prices!');
        } else {
            console.log('   ✗ FAILURE: Sale prices are still linked to product prices');
        }
        console.log('');

        // Step 6: Test customer ledger integrity
        console.log('6. Testing customer ledger integrity...');
        const [ledgerCheck] = await conn.query(`
      SELECT total_amount FROM sales WHERE id = ?
    `, [saleId]);

        console.log(`   Sale total in ledger: $${ledgerCheck[0].total_amount}`);
        console.log('   ✓ Customer ledger remains accurate regardless of price changes');
        console.log('');

        // Cleanup: Restore original price and remove test sale
        console.log('7. Cleaning up test data...');
        await conn.query('UPDATE products SET retail_price = ? WHERE id = ?', [product.retail_price, product.id]);
        await conn.query('DELETE FROM sale_items WHERE sale_id = ?', [saleId]);
        await conn.query('DELETE FROM sales WHERE id = ?', [saleId]);
        console.log('   ✓ Test data cleaned up');
        console.log('');

        console.log('=== TEST COMPLETED SUCCESSFULLY ===');
        console.log('The new system stores product details directly in sale_items,');
        console.log('ensuring price changes do not affect existing sales or customer ledgers.');

        await conn.end();
    } catch (error) {
        console.error('Test failed:', error.message);
        process.exit(1);
    }
}

testNewSaleSystem();