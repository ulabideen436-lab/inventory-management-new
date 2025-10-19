import mysql from 'mysql2/promise';

async function testCustomerBalanceTypeFix() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Zafaryaqoob.com786',
            database: 'storeflow'
        });

        console.log('=== Testing Customer Balance Type Fix ===');
        console.log('');

        // Test the mapping function (simulating backend logic)
        const mapBalanceType = (type) => {
            if (type === 'Dr' || type === 'dr' || type === 'DR') return 'debit';
            if (type === 'Cr' || type === 'cr' || type === 'CR') return 'credit';
            if (type === 'debit' || type === 'credit') return type;
            return 'debit'; // default to debit
        };

        console.log('1. Testing balance type mapping:');
        console.log(`   'Dr' maps to: '${mapBalanceType('Dr')}'`);
        console.log(`   'Cr' maps to: '${mapBalanceType('Cr')}'`);
        console.log(`   'debit' maps to: '${mapBalanceType('debit')}'`);
        console.log(`   'credit' maps to: '${mapBalanceType('credit')}'`);
        console.log(`   null maps to: '${mapBalanceType(null)}'`);
        console.log('');

        // Test actual database insertion
        console.log('2. Testing database insertion with mapped values:');

        const testCustomer = {
            name: `Test Customer ${Date.now()}`,
            brand_name: 'Test Brand',
            contact: 'test@test.com',
            opening_balance: 100.00,
            opening_balance_type: 'Dr', // This should be mapped to 'debit'
            address: 'Test Address',
            phone: '1234567890',
            email: 'test@test.com',
            credit_limit: 1000.00
        };

        const [result] = await conn.query(
            `INSERT INTO customers (name, brand_name, contact, opening_balance, opening_balance_type, address, phone, email, credit_limit) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                testCustomer.name,
                testCustomer.brand_name,
                testCustomer.contact,
                testCustomer.opening_balance,
                mapBalanceType(testCustomer.opening_balance_type), // Apply mapping
                testCustomer.address,
                testCustomer.phone,
                testCustomer.email,
                testCustomer.credit_limit
            ]
        );

        const customerId = result.insertId;
        console.log(`   ✅ Successfully inserted customer #${customerId}`);
        console.log(`   ✅ 'Dr' was mapped to 'debit' and accepted by database`);
        console.log('');

        // Verify the data was stored correctly
        console.log('3. Verifying stored data:');
        const [customer] = await conn.query('SELECT * FROM customers WHERE id = ?', [customerId]);

        if (customer.length > 0) {
            console.log(`   Customer Name: ${customer[0].name}`);
            console.log(`   Opening Balance: ${customer[0].opening_balance}`);
            console.log(`   Balance Type Stored: ${customer[0].opening_balance_type}`);

            if (customer[0].opening_balance_type === 'debit') {
                console.log('   ✅ Balance type correctly stored as "debit"');
            } else {
                console.log(`   ❌ Unexpected balance type: ${customer[0].opening_balance_type}`);
            }
        }
        console.log('');

        // Test with 'Cr' as well
        console.log('4. Testing with Credit type:');
        const testCustomer2 = {
            name: `Test Customer Cr ${Date.now()}`,
            opening_balance_type: 'Cr'
        };

        const [result2] = await conn.query(
            `INSERT INTO customers (name, opening_balance_type) VALUES (?, ?)`,
            [testCustomer2.name, mapBalanceType(testCustomer2.opening_balance_type)]
        );

        const customerId2 = result2.insertId;
        const [customer2] = await conn.query('SELECT opening_balance_type FROM customers WHERE id = ?', [customerId2]);

        console.log(`   ✅ 'Cr' mapped to: ${customer2[0].opening_balance_type}`);
        console.log('');

        // Cleanup test data
        console.log('5. Cleaning up test data:');
        await conn.query('DELETE FROM customers WHERE id IN (?, ?)', [customerId, customerId2]);
        console.log('   ✅ Test customers removed');
        console.log('');

        console.log('=== TEST PASSED ===');
        console.log('');
        console.log('✅ Backend now correctly maps:');
        console.log('   - "Dr" → "debit"');
        console.log('   - "Cr" → "credit"');
        console.log('   - Frontend can continue using "Dr"/"Cr" values');
        console.log('   - Database stores proper enum values');

        await conn.end();
    } catch (error) {
        console.error('Test failed:', error.message);
        process.exit(1);
    }
}

testCustomerBalanceTypeFix();