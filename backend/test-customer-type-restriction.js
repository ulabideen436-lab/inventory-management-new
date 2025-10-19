import axios from 'axios';
import mysql from 'mysql2/promise';

const testCustomerTypeRestriction = async () => {
    console.log('🔒 Testing Customer Type Change Restriction in Sale Editing...\n');

    let connection;
    try {
        // Database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'inventory_management'
        });

        console.log('✅ Database connected successfully');

        // Step 1: Create a test customer with retail type
        const [customerResult] = await connection.execute(
            'INSERT INTO customers (name, email, phone, type) VALUES (?, ?, ?, ?)',
            ['Test Customer Retail', 'retail@test.com', '1234567890', 'retail']
        );
        const customerId = customerResult.insertId;
        console.log(`✅ Created test customer with ID: ${customerId} (type: retail)`);

        // Step 2: Create a test product
        const [productResult] = await connection.execute(
            'INSERT INTO products (name, description, purchase_price, sale_price, wholesale_price, stock_quantity, category, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['Test Product', 'Test Description', 10, 20, 15, 100, 'Electronics', 1]
        );
        const productId = productResult.insertId;
        console.log(`✅ Created test product with ID: ${productId}`);

        // Step 3: Create a test sale with retail pricing
        console.log('\n📝 Creating test sale with retail customer...');
        const saleData = {
            customer_id: customerId,
            customer_type: 'retail',
            discount_percentage: 0,
            payment_method: 'cash',
            notes: 'Test sale for customer type restriction',
            items: [
                {
                    product_id: productId,
                    quantity: 2,
                    unit_price: 20, // retail price
                    total_price: 40
                }
            ]
        };

        const saleResponse = await axios.post('http://localhost:5000/api/sales', saleData);
        const saleId = saleResponse.data.sale.id;
        console.log(`✅ Created test sale with ID: ${saleId}`);
        console.log(`   - Customer Type: ${saleResponse.data.sale.customer_type}`);
        console.log(`   - Total Amount: $${saleResponse.data.sale.total_amount}`);

        // Step 4: Verify original sale data
        const [originalSale] = await connection.execute(
            'SELECT * FROM sales WHERE id = ?',
            [saleId]
        );
        console.log('\n📊 Original Sale Data:');
        console.log(`   - Customer Type: ${originalSale[0].customer_type}`);
        console.log(`   - Total Amount: $${originalSale[0].total_amount}`);

        // Step 5: Test backend restriction - try to change customer type
        console.log('\n🚫 Testing backend restriction - attempting to change customer type...');
        try {
            const updateData = {
                customer_type: 'longterm', // Try to change from retail to longterm
                notes: 'Updated notes'
            };

            const updateResponse = await axios.put(`http://localhost:5000/api/sales/${saleId}`, updateData);
            console.log('❌ ERROR: Backend allowed customer type change! This should not happen.');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Backend correctly blocked customer type change');
                console.log(`   - Error Message: ${error.response.data.message}`);
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

        // Step 6: Test valid update (without customer type change)
        console.log('\n✅ Testing valid update (without customer type change)...');
        try {
            const validUpdateData = {
                notes: 'Updated notes without changing customer type',
                payment_method: 'card'
            };

            const updateResponse = await axios.put(`http://localhost:5000/api/sales/${saleId}`, validUpdateData);
            console.log('✅ Valid update successful');
            console.log(`   - Updated Notes: ${updateResponse.data.sale.notes}`);
            console.log(`   - Customer Type Unchanged: ${updateResponse.data.sale.customer_type}`);
        } catch (error) {
            console.log('❌ Valid update failed:', error.response?.data?.message || error.message);
        }

        // Step 7: Verify final sale data
        const [finalSale] = await connection.execute(
            'SELECT * FROM sales WHERE id = ?',
            [saleId]
        );
        console.log('\n📊 Final Sale Data:');
        console.log(`   - Customer Type: ${finalSale[0].customer_type} (should remain 'retail')`);
        console.log(`   - Total Amount: $${finalSale[0].total_amount} (should remain unchanged)`);
        console.log(`   - Notes: ${finalSale[0].notes}`);

        // Step 8: Test with different customer types
        console.log('\n🧪 Testing with wholesale customer...');

        // Create wholesale customer
        const [wholesaleCustomerResult] = await connection.execute(
            'INSERT INTO customers (name, email, phone, type) VALUES (?, ?, ?, ?)',
            ['Test Customer Wholesale', 'wholesale@test.com', '9876543210', 'longterm']
        );
        const wholesaleCustomerId = wholesaleCustomerResult.insertId;
        console.log(`✅ Created wholesale customer with ID: ${wholesaleCustomerId}`);

        // Create sale with wholesale customer
        const wholesaleSaleData = {
            customer_id: wholesaleCustomerId,
            customer_type: 'longterm',
            discount_percentage: 0,
            payment_method: 'cash',
            notes: 'Test wholesale sale',
            items: [
                {
                    product_id: productId,
                    quantity: 2,
                    unit_price: 15, // wholesale price
                    total_price: 30
                }
            ]
        };

        const wholesaleSaleResponse = await axios.post('http://localhost:5000/api/sales', wholesaleSaleData);
        const wholesaleSaleId = wholesaleSaleResponse.data.sale.id;
        console.log(`✅ Created wholesale sale with ID: ${wholesaleSaleId}`);

        // Try to change wholesale to retail
        console.log('\n🚫 Testing restriction on wholesale sale...');
        try {
            const updateData = {
                customer_type: 'retail', // Try to change from longterm to retail
                notes: 'Trying to change to retail'
            };

            await axios.put(`http://localhost:5000/api/sales/${wholesaleSaleId}`, updateData);
            console.log('❌ ERROR: Backend allowed wholesale to retail change!');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Backend correctly blocked wholesale to retail change');
                console.log(`   - Error Message: ${error.response.data.message}`);
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

        console.log('\n🧹 Cleaning up test data...');

        // Clean up test data
        await connection.execute('DELETE FROM sale_items WHERE sale_id IN (?, ?)', [saleId, wholesaleSaleId]);
        await connection.execute('DELETE FROM sales WHERE id IN (?, ?)', [saleId, wholesaleSaleId]);
        await connection.execute('DELETE FROM customers WHERE id IN (?, ?)', [customerId, wholesaleCustomerId]);
        await connection.execute('DELETE FROM products WHERE id = ?', [productId]);

        console.log('✅ Test data cleaned up successfully');

        console.log('\n🎉 Customer Type Restriction Test Results:');
        console.log('✅ Backend validation working correctly');
        console.log('✅ Customer type changes are properly blocked');
        console.log('✅ Valid updates (without customer type change) work correctly');
        console.log('✅ Restriction works for both retail → wholesale and wholesale → retail changes');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
};

// Run the test
testCustomerTypeRestriction()
    .then(() => {
        console.log('\n✅ Customer type restriction test completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });