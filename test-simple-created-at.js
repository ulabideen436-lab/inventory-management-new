const https = require('https');
const http = require('http');

// Simple HTTP request to test the API
const postData = JSON.stringify({
    username: 'testuser',
    password: 'TestPass123!'
});

const loginOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('🔍 Testing created_at field with simple HTTP...\n');

const loginReq = http.request(loginOptions, (loginRes) => {
    let loginData = '';

    loginRes.on('data', (chunk) => {
        loginData += chunk;
    });

    loginRes.on('end', () => {
        try {
            const loginResponse = JSON.parse(loginData);

            if (loginResponse.token) {
                console.log('✅ Login successful');

                // Now fetch customers
                const customersOptions = {
                    hostname: 'localhost',
                    port: 5000,
                    path: '/customers',
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${loginResponse.token}`
                    }
                };

                const customersReq = http.request(customersOptions, (customersRes) => {
                    let customersData = '';

                    customersRes.on('data', (chunk) => {
                        customersData += chunk;
                    });

                    customersRes.on('end', () => {
                        try {
                            const customers = JSON.parse(customersData);
                            console.log(`Found ${customers.length} customers`);

                            if (customers.length > 0) {
                                const firstCustomer = customers[0];
                                console.log('\n📋 First customer object keys:', Object.keys(firstCustomer));
                                console.log('📋 First customer created_at value:', firstCustomer.created_at);

                                if (!firstCustomer.created_at) {
                                    console.log('❌ created_at field is still missing!');
                                } else {
                                    console.log('✅ created_at field is now present:', firstCustomer.created_at);
                                }
                            } else {
                                console.log('No customers found');
                            }
                        } catch (err) {
                            console.error('Error parsing customers response:', err.message);
                            console.log('Raw response:', customersData);
                        }
                    });
                });

                customersReq.on('error', (err) => {
                    console.error('Customers request error:', err.message);
                });

                customersReq.end();

            } else {
                console.log('❌ Login failed:', loginResponse.message);
            }
        } catch (err) {
            console.error('Error parsing login response:', err.message);
            console.log('Raw response:', loginData);
        }
    });
});

loginReq.on('error', (err) => {
    console.error('Login request error:', err.message);
});

loginReq.write(postData);
loginReq.end();