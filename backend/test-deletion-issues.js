import mysql from 'mysql2/promise';

async function testDeletionIssues() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Zafaryaqoob.com786',
            database: 'storeflow'
        });

        console.log('🔍 TESTING DELETION ISSUES');
        console.log('===========================');

        // Create a test product
        const testProductId = `DELETE_TEST_${Date.now()}`;
        console.log(`\n📦 Creating test product: ${testProductId}`);

        try {
            await connection.query(`
                INSERT INTO products (id, name, uom, retail_price, stock_quantity) 
                VALUES (?, 'Test Delete Product', 'pcs', 100.00, 10)
            `, [testProductId]);
            console.log('✅ Test product created successfully');
        } catch (error) {
            console.log('❌ Failed to create test product:', error.message);
            return;
        }

        // Check if product has any sales
        const [salesCheck] = await connection.query(`
            SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?
        `, [testProductId]);
        console.log(`📊 Sales count for test product: ${salesCheck[0].count}`);

        // Test direct deletion from products table
        try {
            console.log('\n🗑️ Testing direct deletion...');
            await connection.query('DELETE FROM products WHERE id = ?', [testProductId]);
            console.log('✅ Direct deletion successful');
        } catch (error) {
            console.log('❌ Direct deletion failed:', error.message);

            // Try soft deletion instead
            console.log('\n🔄 Testing soft deletion...');
            try {
                await connection.query('UPDATE products SET deleted_at = NOW() WHERE id = ?', [testProductId]);
                console.log('✅ Soft deletion successful');

                // Try to insert into deleted_items
                try {
                    await connection.query(`
                        INSERT INTO deleted_items (item_type, item_id, original_data, deleted_by, deletion_reason)
                        VALUES ('product', ?, '{"test": "data"}', 1, 'Test deletion')
                    `, [testProductId]);
                    console.log('✅ Deleted items record created successfully');
                } catch (delError) {
                    console.log('❌ Failed to create deleted_items record:', delError.message);
                }
            } catch (softError) {
                console.log('❌ Soft deletion failed:', softError.message);
            }
        }

        // Cleanup
        try {
            await connection.query('DELETE FROM deleted_items WHERE item_id = ?', [testProductId]);
            await connection.query('DELETE FROM products WHERE id = ?', [testProductId]);
            console.log('\n🧹 Cleanup completed');
        } catch (cleanupError) {
            console.log('\n⚠️ Cleanup had issues:', cleanupError.message);
        }

        // Test customer deletion
        console.log('\n👥 Testing customer deletion...');
        try {
            const testCustomerName = `Test Delete Customer ${Date.now()}`;
            const [customerResult] = await connection.query(`
                INSERT INTO customers (name, type) VALUES (?, 'retail')
            `, [testCustomerName]);

            const testCustomerId = customerResult.insertId;
            console.log(`✅ Test customer created with ID: ${testCustomerId}`);

            // Check if customer has sales
            const [customerSales] = await connection.query(`
                SELECT COUNT(*) as count FROM sales WHERE customer_id = ?
            `, [testCustomerId]);
            console.log(`📊 Sales count for test customer: ${customerSales[0].count}`);

            // Try to delete customer
            if (customerSales[0].count === 0) {
                await connection.query('DELETE FROM customers WHERE id = ?', [testCustomerId]);
                console.log('✅ Customer deletion successful');
            } else {
                console.log('⚠️ Customer has sales, testing soft delete...');
                await connection.query('UPDATE customers SET deleted_at = NOW() WHERE id = ?', [testCustomerId]);
                console.log('✅ Customer soft deletion successful');
            }

        } catch (customerError) {
            console.log('❌ Customer deletion test failed:', customerError.message);
        }

        await connection.end();

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testDeletionIssues();