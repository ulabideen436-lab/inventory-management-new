import axios from 'axios';

const baseURL = 'http://localhost:5000';
const testCredentials = { username: 'admin', password: 'admin123' };

// Simple edge case tests
const edgeCaseResults = {
    timestamp: new Date().toISOString(),
    results: [],
    summary: { passed: 0, failed: 0, total: 0 }
};

function logEdgeCaseTest(testName, passed, details = '', error = null) {
    const result = {
        test: testName,
        status: passed ? 'PASS' : 'FAIL',
        details,
        error: error?.message || '',
        timestamp: new Date().toISOString()
    };

    edgeCaseResults.results.push(result);
    if (passed) edgeCaseResults.summary.passed++;
    else edgeCaseResults.summary.failed++;
    edgeCaseResults.summary.total++;

    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${testName}: ${passed ? 'PASS' : 'FAIL'}`);
    if (details) console.log(`   Details: ${details}`);
    if (error) console.log(`   Error: ${error.message}`);
}

// Test edge cases and error handling
async function testEdgeCases() {
    console.log('🔍 COMPREHENSIVE EDGE CASE TESTING');
    console.log('===================================');
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log('');

    try {
        // Wait a moment for rate limiting to reset
        console.log('⏳ Waiting for rate limit reset...');
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute

        const loginResponse = await axios.post(`${baseURL}/auth/login`, testCredentials);
        const authToken = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${authToken}` };

        console.log('🔍 TESTING BOUNDARY CONDITIONS');
        console.log('===============================');

        // Test null/undefined values
        try {
            await axios.post(`${baseURL}/products`, {
                id: null,
                name: null,
                uom: null
            }, { headers });
            logEdgeCaseTest('Null Values Handling', false, 'Should have rejected null values');
        } catch (error) {
            logEdgeCaseTest(
                'Null Values Handling',
                error.response?.status >= 400,
                `Correctly rejected null values with status ${error.response?.status}`
            );
        }

        // Test extremely long strings
        const longString = 'A'.repeat(1000);
        try {
            await axios.post(`${baseURL}/products`, {
                id: `LONG_${Date.now()}`,
                name: longString,
                brand: longString,
                uom: 'pcs',
                retail_price: 100,
                wholesale_price: 80,
                cost_price: 60,
                stock_quantity: 10
            }, { headers });
            logEdgeCaseTest('Long String Handling', true, 'Long strings accepted and handled properly');
        } catch (error) {
            logEdgeCaseTest(
                'Long String Handling',
                error.response?.status >= 400,
                `Long strings properly rejected with status ${error.response?.status}`
            );
        }

        // Test negative values
        try {
            await axios.post(`${baseURL}/products`, {
                id: `NEG_${Date.now()}`,
                name: 'Negative Test Product',
                uom: 'pcs',
                retail_price: -100,
                wholesale_price: -80,
                cost_price: -60,
                stock_quantity: -10
            }, { headers });
            logEdgeCaseTest('Negative Values Handling', false, 'Should have rejected negative values');
        } catch (error) {
            logEdgeCaseTest(
                'Negative Values Handling',
                error.response?.status >= 400,
                `Correctly rejected negative values with status ${error.response?.status}`
            );
        }

        // Test extremely large numbers
        try {
            await axios.post(`${baseURL}/products`, {
                id: `LARGE_${Date.now()}`,
                name: 'Large Number Test Product',
                uom: 'pcs',
                retail_price: 999999999999,
                wholesale_price: 999999999999,
                cost_price: 999999999999,
                stock_quantity: 999999999999
            }, { headers });
            logEdgeCaseTest('Large Number Handling', true, 'Large numbers accepted');
        } catch (error) {
            logEdgeCaseTest(
                'Large Number Handling',
                error.response?.status >= 400,
                `Large numbers rejected with status ${error.response?.status}`
            );
        }

        console.log('');
        console.log('📊 TESTING API ENDPOINT CONTRACTS');
        console.log('==================================');

        // Test non-existent endpoints
        try {
            await axios.get(`${baseURL}/nonexistent`, { headers });
            logEdgeCaseTest('Non-existent Endpoint', false, 'Should return 404');
        } catch (error) {
            logEdgeCaseTest(
                'Non-existent Endpoint',
                error.response?.status === 404,
                `Correctly returned 404 for non-existent endpoint`
            );
        }

        // Test malformed JSON
        try {
            await axios.post(`${baseURL}/products`, '{"invalid": json}', {
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
            logEdgeCaseTest('Malformed JSON Handling', false, 'Should reject malformed JSON');
        } catch (error) {
            logEdgeCaseTest(
                'Malformed JSON Handling',
                error.response?.status >= 400,
                `Correctly rejected malformed JSON with status ${error.response?.status}`
            );
        }

        // Test missing required headers
        try {
            await axios.get(`${baseURL}/products`); // No auth header
            logEdgeCaseTest('Missing Auth Header', false, 'Should require authentication');
        } catch (error) {
            logEdgeCaseTest(
                'Missing Auth Header',
                error.response?.status === 401,
                `Correctly required authentication with status ${error.response?.status}`
            );
        }

        console.log('');
        console.log('🔄 TESTING ERROR RECOVERY');
        console.log('==========================');

        // Test duplicate ID handling
        const testId = `DUP_${Date.now()}`;
        try {
            // Create first product
            await axios.post(`${baseURL}/products`, {
                id: testId,
                name: 'First Product',
                uom: 'pcs',
                retail_price: 100,
                wholesale_price: 80,
                cost_price: 60,
                stock_quantity: 10
            }, { headers });

            // Try to create duplicate
            await axios.post(`${baseURL}/products`, {
                id: testId,
                name: 'Duplicate Product',
                uom: 'pcs',
                retail_price: 200,
                wholesale_price: 160,
                cost_price: 120,
                stock_quantity: 20
            }, { headers });

            logEdgeCaseTest('Duplicate ID Prevention', false, 'Should prevent duplicate IDs');
        } catch (error) {
            logEdgeCaseTest(
                'Duplicate ID Prevention',
                error.response?.status >= 400,
                `Correctly prevented duplicate ID with status ${error.response?.status}`
            );
        }

        // Cleanup test product
        try {
            await axios.delete(`${baseURL}/products/${testId}`, {
                headers,
                data: { password: testCredentials.password }
            });
        } catch (cleanupError) {
            console.log('Cleanup error for duplicate test:', cleanupError.message);
        }

        // Test updating non-existent resource
        try {
            await axios.put(`${baseURL}/products/NONEXISTENT_ID`, {
                name: 'Updated Product'
            }, { headers });
            logEdgeCaseTest('Non-existent Resource Update', false, 'Should return 404');
        } catch (error) {
            logEdgeCaseTest(
                'Non-existent Resource Update',
                error.response?.status === 404,
                `Correctly returned 404 for non-existent resource`
            );
        }

    } catch (error) {
        logEdgeCaseTest('Edge Case Testing Setup', false, '', error);
    }

    // Generate summary
    console.log('');
    console.log('🔍 EDGE CASE TEST SUMMARY');
    console.log('==========================');
    console.log(`Total Tests: ${edgeCaseResults.summary.total}`);
    console.log(`✅ Passed: ${edgeCaseResults.summary.passed}`);
    console.log(`❌ Failed: ${edgeCaseResults.summary.failed}`);
    console.log(`📊 Success Rate: ${((edgeCaseResults.summary.passed / edgeCaseResults.summary.total) * 100).toFixed(1)}%`);
    console.log('');

    if (edgeCaseResults.summary.failed > 0) {
        console.log('❌ EDGE CASES THAT NEED ATTENTION:');
        edgeCaseResults.results
            .filter(r => r.status === 'FAIL')
            .forEach(r => console.log(`   • ${r.test}: ${r.details || r.error}`));
    } else {
        console.log('🔍 ALL EDGE CASES HANDLED PROPERLY!');
    }

    // Save detailed results
    const fs = await import('fs');
    fs.writeFileSync('edge-case-test-results.json', JSON.stringify(edgeCaseResults, null, 2));
    console.log('📄 Detailed edge case test results saved to: edge-case-test-results.json');
    console.log(`🏁 Edge case testing completed at: ${new Date().toISOString()}`);
}

testEdgeCases().catch(console.error);