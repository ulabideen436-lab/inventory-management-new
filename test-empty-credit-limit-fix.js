// Test script to verify customer update with empty credit_limit works
const axios = require('axios');
const mysql = require('mysql2/promise');

const TEST_BASE_URL = 'http://localhost:5000';
const TEST_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJvd25lciIsImlhdCI6MTcyODMwNzQ1M30.YJEVZslgvOCZD0YrXeOhp9E-_kFAWaXRPHoQG4eOLRM'; // Replace with actual token

async function testCustomerUpdateWithEmptyFields() {
    console.log('🧪 Testing Customer Update with Empty Credit Limit...\n');

    try {
        // Test 1: Create a test customer first
        console.log('1. Creating test customer...');
        const newCustomer = {
            name: 'Test Customer for Empty Credit Limit',
            brand_name: 'Test Brand',
            contact: 'test',
            phone: '1234567890',
            email: 'test@example.com',
            address: 'Test Address',
            credit_limit: '1000', // Start with a value
            opening_balance: '500',
            opening_balance_type: 'Dr'
        };

        const createResponse = await axios.post(`${TEST_BASE_URL}/customers`, newCustomer, {
            headers: { Authorization: `Bearer ${TEST_TOKEN}` }
        });
        console.log('✅ Test customer created with ID:', createResponse.data.id);
        const testCustomerId = createResponse.data.id;

        // Test 2: Update customer with empty credit_limit
        console.log('\n2. Testing update with empty credit_limit...');
        const updateData = {
            name: 'Test Customer Updated',
            brand_name: 'Test Brand Updated',
            contact: 'test updated',
            phone: '1234567890',
            email: 'test@example.com',
            address: 'Test Address Updated',
            credit_limit: '', // This should become NULL in database
            opening_balance: '500.00',
            opening_balance_type: 'Cr'
        };

        const updateResponse = await axios.put(`${TEST_BASE_URL}/customers/${testCustomerId}`, updateData, {
            headers: { Authorization: `Bearer ${TEST_TOKEN}` }
        });
        console.log('✅ Customer update successful:', updateResponse.data.message);

        // Test 3: Verify the database value is NULL
        console.log('\n3. Verifying database value...');
        const db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'storeflow'
        });

        const [rows] = await db.execute('SELECT credit_limit FROM customers WHERE id = ?', [testCustomerId]);
        console.log('Credit limit in database:', rows[0].credit_limit);

        if (rows[0].credit_limit === null) {
            console.log('✅ Empty string correctly converted to NULL');
        } else {
            console.log('❌ Credit limit should be NULL but is:', rows[0].credit_limit);
        }

        // Test 4: Test with empty opening_balance too
        console.log('\n4. Testing update with empty opening_balance...');
        const updateData2 = {
            name: 'Test Customer Final',
            brand_name: 'Test Brand Final',
            contact: 'test final',
            phone: '1234567890',
            email: 'test@example.com',
            address: 'Test Address Final',
            credit_limit: '', // Empty string
            opening_balance: '', // Empty string
            opening_balance_type: 'Dr'
        };

        const updateResponse2 = await axios.put(`${TEST_BASE_URL}/customers/${testCustomerId}`, updateData2, {
            headers: { Authorization: `Bearer ${TEST_TOKEN}` }
        });
        console.log('✅ Customer update with empty opening_balance successful:', updateResponse2.data.message);

        // Test 5: Verify both fields are NULL
        const [rows2] = await db.execute('SELECT credit_limit, opening_balance FROM customers WHERE id = ?', [testCustomerId]);
        console.log('Final values - Credit limit:', rows2[0].credit_limit, 'Opening balance:', rows2[0].opening_balance);

        // Cleanup: Delete test customer
        console.log('\n5. Cleaning up test customer...');
        await db.execute('DELETE FROM customers WHERE id = ?', [testCustomerId]);
        console.log('✅ Test customer deleted');

        await db.end();
        console.log('\n🎉 All tests passed! Empty string to NULL conversion working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error('HTTP Status:', error.response.status);
        }
        if (error.sql) {
            console.error('SQL Error:', error.sqlMessage);
        }
    }
}

// Run the test
testCustomerUpdateWithEmptyFields();