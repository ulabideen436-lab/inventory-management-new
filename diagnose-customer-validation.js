import axios from 'axios';

const baseURL = 'http://localhost:5000';
const testCredentials = { username: 'admin', password: 'admin123' };

async function diagnoseCustomerValidation() {
    console.log('🔍 DIAGNOSING CUSTOMER VALIDATION ISSUE');
    console.log('=======================================');

    try {
        // Step 1: Login
        const loginResponse = await axios.post(`${baseURL}/auth/login`, testCredentials);
        const authToken = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${authToken}` };

        console.log('✅ Authentication successful');

        // Step 2: Test invalid customer data
        const invalidCustomer = {
            name: '',  // Missing required field
            phone: 'invalid-phone'
        };

        console.log('📝 Testing invalid customer data...');
        console.log('Invalid customer data:', JSON.stringify(invalidCustomer, null, 2));

        try {
            const response = await axios.post(`${baseURL}/customers`, invalidCustomer, { headers });
            console.log('❌ VALIDATION FAILED - Customer was created despite invalid data!');
            console.log('Response status:', response.status);
            console.log('Response data:', JSON.stringify(response.data, null, 2));

            // Clean up the invalid customer that was incorrectly created
            const customerId = response.data.id || response.data.insertId;
            if (customerId) {
                try {
                    await axios.delete(`${baseURL}/customers/${customerId}`, {
                        headers,
                        data: { password: testCredentials.password }
                    });
                    console.log('🧹 Cleaned up invalid customer');
                } catch (cleanupError) {
                    console.log('Cleanup error:', cleanupError.message);
                }
            }
        } catch (validationError) {
            console.log('✅ VALIDATION WORKING - Customer was correctly rejected');
            console.log('Status:', validationError.response?.status);
            console.log('Error message:', validationError.response?.data?.message || validationError.message);
        }

        // Step 3: Test what fields are actually required
        console.log('\n🔍 Testing required fields...');

        const testCases = [
            { name: 'Test Customer', phone: '' }, // missing phone
            { name: '', phone: '1234567890' }, // missing name
            { phone: '1234567890' }, // missing name
            { name: 'Test Customer' }, // missing phone
        ];

        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            console.log(`\nTest ${i + 1}:`, JSON.stringify(testCase, null, 2));

            try {
                const response = await axios.post(`${baseURL}/customers`, testCase, { headers });
                console.log(`❌ Test ${i + 1} FAILED - Customer created despite missing data`);

                // Clean up
                const customerId = response.data.id || response.data.insertId;
                if (customerId) {
                    try {
                        await axios.delete(`${baseURL}/customers/${customerId}`, {
                            headers,
                            data: { password: testCredentials.password }
                        });
                    } catch (cleanupError) {
                        console.log('Cleanup error:', cleanupError.message);
                    }
                }
            } catch (error) {
                console.log(`✅ Test ${i + 1} PASSED - Correctly rejected with status ${error.response?.status}`);
            }
        }

    } catch (error) {
        console.log('❌ Diagnosis failed:');
        console.log('Error:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Response data:', error.response.data);
        }
    }
}

diagnoseCustomerValidation();