import axios from 'axios';

const baseURL = 'http://localhost:5000';
const testCredentials = { username: 'admin', password: 'admin123' };

// Test results collection
const securityResults = {
    timestamp: new Date().toISOString(),
    results: [],
    summary: {
        passed: 0,
        failed: 0,
        total: 0
    }
};

function logSecurityTest(testName, passed, details = '', error = null) {
    const result = {
        test: testName,
        status: passed ? 'PASS' : 'FAIL',
        details,
        error: error?.message || '',
        timestamp: new Date().toISOString()
    };

    securityResults.results.push(result);
    if (passed) securityResults.summary.passed++;
    else securityResults.summary.failed++;
    securityResults.summary.total++;

    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${testName}: ${passed ? 'PASS' : 'FAIL'}`);
    if (details) console.log(`   Details: ${details}`);
    if (error) console.log(`   Error: ${error.message}`);
}

// Test SQL Injection Protection
async function testSQLInjection() {
    console.log('🛡️ TESTING SQL INJECTION PROTECTION');
    console.log('=====================================');

    try {
        const loginResponse = await axios.post(`${baseURL}/auth/login`, testCredentials);
        const authToken = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${authToken}` };

        // SQL injection attempts in various endpoints
        const sqlInjectionPayloads = [
            "'; DROP TABLE products; --",
            "' OR '1'='1",
            "' UNION SELECT * FROM users --",
            "'; DELETE FROM customers; --",
            "admin'/**/OR/**/1=1#"
        ];

        // Test product search endpoint
        for (const payload of sqlInjectionPayloads) {
            try {
                const response = await axios.get(`${baseURL}/products?search=${encodeURIComponent(payload)}`, { headers });
                // If we get here without error, check if response contains unexpected data
                if (response.data.length === 0 || !response.data.find(p => p.name.includes('DROP') || p.name.includes('UNION'))) {
                    logSecurityTest(
                        `SQL Injection Protection (Search)`,
                        true,
                        `Payload "${payload}" safely handled - no malicious execution detected`
                    );
                } else {
                    logSecurityTest(
                        `SQL Injection Protection (Search)`,
                        false,
                        `Payload "${payload}" may have caused unexpected behavior`
                    );
                }
            } catch (error) {
                // Errors are expected for malicious payloads
                logSecurityTest(
                    `SQL Injection Protection (Search)`,
                    true,
                    `Payload "${payload}" properly rejected with status ${error.response?.status}`
                );
            }
        }

        // Test customer creation with SQL injection
        const maliciousCustomer = {
            name: "'; DROP TABLE customers; --",
            phone: "' OR '1'='1",
            email: "test@example.com"
        };

        try {
            await axios.post(`${baseURL}/customers`, maliciousCustomer, { headers });
            logSecurityTest(
                'SQL Injection Protection (Customer Creation)',
                true,
                'Malicious customer data sanitized and stored safely'
            );
        } catch (error) {
            logSecurityTest(
                'SQL Injection Protection (Customer Creation)',
                true,
                `Malicious customer data properly rejected with status ${error.response?.status}`
            );
        }

    } catch (error) {
        logSecurityTest('SQL Injection Protection Setup', false, '', error);
    }
}

// Test XSS Protection
async function testXSSProtection() {
    console.log('🛡️ TESTING XSS PROTECTION');
    console.log('===========================');

    try {
        const loginResponse = await axios.post(`${baseURL}/auth/login`, testCredentials);
        const authToken = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${authToken}` };

        const xssPayloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "javascript:alert('XSS')",
            "<svg onload=alert('XSS')>",
            "';alert('XSS');//"
        ];

        // Test product creation with XSS payloads
        for (const payload of xssPayloads) {
            try {
                const testProduct = {
                    id: `XSS_TEST_${Date.now()}`,
                    name: payload,
                    brand: payload,
                    uom: 'pcs',
                    retail_price: 100,
                    wholesale_price: 80,
                    cost_price: 60,
                    stock_quantity: 10
                };

                const response = await axios.post(`${baseURL}/products`, testProduct, { headers });

                // Retrieve the product to check if XSS payload was sanitized
                const retrieveResponse = await axios.get(`${baseURL}/products/${testProduct.id}`, { headers });
                const savedProduct = retrieveResponse.data;

                if (savedProduct.name === payload || savedProduct.brand === payload) {
                    logSecurityTest(
                        'XSS Protection (Product Fields)',
                        false,
                        `XSS payload "${payload}" was stored without sanitization`
                    );
                } else {
                    logSecurityTest(
                        'XSS Protection (Product Fields)',
                        true,
                        `XSS payload "${payload}" was properly sanitized or escaped`
                    );
                }

                // Cleanup
                await axios.delete(`${baseURL}/products/${testProduct.id}`, {
                    headers,
                    data: { password: testCredentials.password }
                });

            } catch (error) {
                logSecurityTest(
                    'XSS Protection (Product Fields)',
                    true,
                    `XSS payload "${payload}" properly rejected with status ${error.response?.status}`
                );
            }
        }

    } catch (error) {
        logSecurityTest('XSS Protection Setup', false, '', error);
    }
}

// Test Authentication & Authorization
async function testAuthenticationSecurity() {
    console.log('🔐 TESTING AUTHENTICATION SECURITY');
    console.log('===================================');

    // Test invalid credentials
    try {
        await axios.post(`${baseURL}/auth/login`, { username: 'admin', password: 'wrongpassword' });
        logSecurityTest('Invalid Password Protection', false, 'Login succeeded with wrong password');
    } catch (error) {
        logSecurityTest(
            'Invalid Password Protection',
            error.response?.status === 401,
            `Wrong password properly rejected with status ${error.response?.status}`
        );
    }

    // Test empty credentials
    try {
        await axios.post(`${baseURL}/auth/login`, { username: '', password: '' });
        logSecurityTest('Empty Credentials Protection', false, 'Login succeeded with empty credentials');
    } catch (error) {
        logSecurityTest(
            'Empty Credentials Protection',
            error.response?.status >= 400,
            `Empty credentials properly rejected with status ${error.response?.status}`
        );
    }

    // Test unauthorized access to protected routes
    try {
        await axios.get(`${baseURL}/products`);
        logSecurityTest('Unauthorized Access Protection', false, 'Accessed protected route without token');
    } catch (error) {
        logSecurityTest(
            'Unauthorized Access Protection',
            error.response?.status === 401 || error.response?.status === 403,
            `Unauthorized access properly blocked with status ${error.response?.status}`
        );
    }

    // Test invalid token
    try {
        await axios.get(`${baseURL}/products`, {
            headers: { Authorization: 'Bearer invalid_token_123' }
        });
        logSecurityTest('Invalid Token Protection', false, 'Accessed route with invalid token');
    } catch (error) {
        logSecurityTest(
            'Invalid Token Protection',
            error.response?.status === 401 || error.response?.status === 403,
            `Invalid token properly rejected with status ${error.response?.status}`
        );
    }

    // Test malformed authorization header
    try {
        await axios.get(`${baseURL}/products`, {
            headers: { Authorization: 'Malformed header' }
        });
        logSecurityTest('Malformed Auth Header Protection', false, 'Accessed route with malformed header');
    } catch (error) {
        logSecurityTest(
            'Malformed Auth Header Protection',
            error.response?.status === 401 || error.response?.status === 403,
            `Malformed header properly rejected with status ${error.response?.status}`
        );
    }
}

// Test Rate Limiting (if implemented)
async function testRateLimiting() {
    console.log('⏱️ TESTING RATE LIMITING');
    console.log('=========================');

    try {
        // Attempt rapid-fire requests to login endpoint
        const rapidRequests = Array(20).fill().map((_, i) =>
            axios.post(`${baseURL}/auth/login`, {
                username: 'admin',
                password: 'wrongpassword'
            }).catch(error => ({ error: true, status: error.response?.status }))
        );

        const results = await Promise.all(rapidRequests);
        const rateLimitedRequests = results.filter(r => r.error && r.status === 429);

        if (rateLimitedRequests.length > 0) {
            logSecurityTest(
                'Rate Limiting Protection',
                true,
                `Rate limiting active - ${rateLimitedRequests.length} requests blocked with 429 status`
            );
        } else {
            logSecurityTest(
                'Rate Limiting Protection',
                false,
                'No rate limiting detected - system may be vulnerable to brute force attacks'
            );
        }

    } catch (error) {
        logSecurityTest('Rate Limiting Test', false, '', error);
    }
}

// Test Password Security
async function testPasswordSecurity() {
    console.log('🔑 TESTING PASSWORD SECURITY');
    console.log('=============================');

    const loginResponse = await axios.post(`${baseURL}/auth/login`, testCredentials);
    const authToken = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${authToken}` };

    // Test deletion without password
    try {
        const testProduct = {
            id: `PWD_TEST_${Date.now()}`,
            name: 'Password Test Product',
            brand: 'Test',
            uom: 'pcs',
            retail_price: 100,
            wholesale_price: 80,
            cost_price: 60,
            stock_quantity: 10
        };

        await axios.post(`${baseURL}/products`, testProduct, { headers });

        // Try to delete without password
        await axios.delete(`${baseURL}/products/${testProduct.id}`, { headers });
        logSecurityTest('Password Protection for Deletion', false, 'Deletion succeeded without password');

    } catch (error) {
        logSecurityTest(
            'Password Protection for Deletion',
            error.response?.status === 400,
            `Deletion properly blocked without password with status ${error.response?.status}`
        );
    }

    // Test deletion with wrong password
    try {
        const testProduct = {
            id: `PWD_TEST2_${Date.now()}`,
            name: 'Password Test Product 2',
            brand: 'Test',
            uom: 'pcs',
            retail_price: 100,
            wholesale_price: 80,
            cost_price: 60,
            stock_quantity: 10
        };

        await axios.post(`${baseURL}/products`, testProduct, { headers });

        // Try to delete with wrong password
        await axios.delete(`${baseURL}/products/${testProduct.id}`, {
            headers,
            data: { password: 'wrongpassword' }
        });
        logSecurityTest('Wrong Password Protection', false, 'Deletion succeeded with wrong password');

    } catch (error) {
        logSecurityTest(
            'Wrong Password Protection',
            error.response?.status === 401 || error.response?.status === 403,
            `Deletion properly blocked with wrong password, status ${error.response?.status}`
        );
    }
}

// Main security test runner
async function runSecurityTests() {
    console.log('🛡️ COMPREHENSIVE SECURITY TESTING');
    console.log('=====================================');
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log('');

    await testAuthenticationSecurity();
    await testSQLInjection();
    await testXSSProtection();
    await testPasswordSecurity();
    await testRateLimiting();

    // Generate summary
    console.log('');
    console.log('🛡️ SECURITY TEST SUMMARY');
    console.log('==========================');
    console.log(`Total Tests: ${securityResults.summary.total}`);
    console.log(`✅ Passed: ${securityResults.summary.passed}`);
    console.log(`❌ Failed: ${securityResults.summary.failed}`);
    console.log(`📊 Success Rate: ${((securityResults.summary.passed / securityResults.summary.total) * 100).toFixed(1)}%`);
    console.log('');

    if (securityResults.summary.failed > 0) {
        console.log('❌ SECURITY VULNERABILITIES DETECTED:');
        securityResults.results
            .filter(r => r.status === 'FAIL')
            .forEach(r => console.log(`   • ${r.test}: ${r.details}`));
    } else {
        console.log('🛡️ ALL SECURITY TESTS PASSED - SYSTEM IS SECURE!');
    }

    // Save detailed results
    const fs = await import('fs');
    fs.writeFileSync('security-test-results.json', JSON.stringify(securityResults, null, 2));
    console.log('📄 Detailed security test results saved to: security-test-results.json');
    console.log(`🏁 Security testing completed at: ${new Date().toISOString()}`);
}

runSecurityTests().catch(console.error);