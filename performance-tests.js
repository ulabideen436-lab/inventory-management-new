import axios from 'axios';

const baseURL = 'http://localhost:5000';
const testCredentials = { username: 'admin', password: 'admin123' };

// Performance test results collection
const performanceResults = {
    timestamp: new Date().toISOString(),
    results: [],
    summary: {
        passed: 0,
        failed: 0,
        total: 0,
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity
    }
};

function logPerformanceTest(testName, passed, details = '', responseTime = 0, error = null) {
    const result = {
        test: testName,
        status: passed ? 'PASS' : 'FAIL',
        details,
        responseTime: `${responseTime}ms`,
        error: error?.message || '',
        timestamp: new Date().toISOString()
    };

    performanceResults.results.push(result);
    if (passed) performanceResults.summary.passed++;
    else performanceResults.summary.failed++;
    performanceResults.summary.total++;

    // Update response time statistics
    if (responseTime > 0) {
        performanceResults.summary.maxResponseTime = Math.max(performanceResults.summary.maxResponseTime, responseTime);
        performanceResults.summary.minResponseTime = Math.min(performanceResults.summary.minResponseTime, responseTime);
    }

    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${testName}: ${passed ? 'PASS' : 'FAIL'} (${responseTime}ms)`);
    if (details) console.log(`   Details: ${details}`);
    if (error) console.log(`   Error: ${error.message}`);
}

// Test API response times
async function testAPIResponseTimes() {
    console.log('⚡ TESTING API RESPONSE TIMES');
    console.log('==============================');

    try {
        const loginResponse = await axios.post(`${baseURL}/auth/login`, testCredentials);
        const authToken = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${authToken}` };

        const endpoints = [
            { name: 'Products List', url: '/products', expected: 200 },
            { name: 'Customers List', url: '/customers', expected: 200 },
            { name: 'Sales List', url: '/sales', expected: 200 },
            { name: 'Dashboard Stats', url: '/dashboard/stats', expected: 200 },
            { name: 'Reports', url: '/reports', expected: 200 },
        ];

        for (const endpoint of endpoints) {
            const startTime = Date.now();
            try {
                const response = await axios.get(`${baseURL}${endpoint.url}`, { headers });
                const responseTime = Date.now() - startTime;

                const passed = response.status === endpoint.expected && responseTime < 2000; // Under 2 seconds
                logPerformanceTest(
                    `${endpoint.name} Response Time`,
                    passed,
                    `Status: ${response.status}, Data length: ${JSON.stringify(response.data).length} chars`,
                    responseTime
                );
            } catch (error) {
                const responseTime = Date.now() - startTime;
                logPerformanceTest(
                    `${endpoint.name} Response Time`,
                    false,
                    '',
                    responseTime,
                    error
                );
            }
        }

    } catch (error) {
        logPerformanceTest('API Response Time Setup', false, '', 0, error);
    }
}

// Test database performance with bulk operations
async function testDatabasePerformance() {
    console.log('💾 TESTING DATABASE PERFORMANCE');
    console.log('================================');

    try {
        const loginResponse = await axios.post(`${baseURL}/auth/login`, testCredentials);
        const authToken = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${authToken}` };

        // Test bulk product creation
        const startTime = Date.now();
        const testProducts = [];
        const timestamp = Date.now();

        for (let i = 0; i < 10; i++) {
            testProducts.push({
                id: `PERF_PROD_${timestamp}_${i}`,
                name: `Performance Test Product ${i}`,
                brand: 'Test Brand',
                uom: 'pcs',
                retail_price: 100 + i,
                wholesale_price: 80 + i,
                cost_price: 60 + i,
                stock_quantity: 100
            });
        }

        let successCount = 0;
        for (const product of testProducts) {
            try {
                await axios.post(`${baseURL}/products`, product, { headers });
                successCount++;
            } catch (error) {
                console.log(`Failed to create product ${product.id}:`, error.response?.data?.message || error.message);
            }
        }

        const bulkCreateTime = Date.now() - startTime;
        const passed = successCount === testProducts.length && bulkCreateTime < 5000; // Under 5 seconds for 10 products

        logPerformanceTest(
            'Bulk Product Creation',
            passed,
            `Created ${successCount}/${testProducts.length} products`,
            bulkCreateTime
        );

        // Test bulk retrieval performance
        const retrievalStartTime = Date.now();
        const response = await axios.get(`${baseURL}/products`, { headers });
        const retrievalTime = Date.now() - retrievalStartTime;

        const retrievalPassed = response.status === 200 && retrievalTime < 3000; // Under 3 seconds
        logPerformanceTest(
            'Bulk Data Retrieval',
            retrievalPassed,
            `Retrieved ${response.data.length} products`,
            retrievalTime
        );

        // Cleanup test products
        const cleanupStartTime = Date.now();
        let deleteCount = 0;
        for (const product of testProducts) {
            try {
                await axios.delete(`${baseURL}/products/${product.id}`, {
                    headers,
                    data: { password: testCredentials.password }
                });
                deleteCount++;
            } catch (error) {
                console.log(`Failed to delete product ${product.id}`);
            }
        }
        const cleanupTime = Date.now() - cleanupStartTime;

        const cleanupPassed = deleteCount === testProducts.length && cleanupTime < 5000;
        logPerformanceTest(
            'Bulk Product Deletion',
            cleanupPassed,
            `Deleted ${deleteCount}/${testProducts.length} products`,
            cleanupTime
        );

    } catch (error) {
        logPerformanceTest('Database Performance Setup', false, '', 0, error);
    }
}

// Test concurrent user operations
async function testConcurrentOperations() {
    console.log('👥 TESTING CONCURRENT OPERATIONS');
    console.log('=================================');

    try {
        const loginResponse = await axios.post(`${baseURL}/auth/login`, testCredentials);
        const authToken = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${authToken}` };

        // Simulate 5 concurrent users accessing products
        const startTime = Date.now();
        const concurrentRequests = Array(5).fill().map((_, i) =>
            axios.get(`${baseURL}/products`, { headers })
                .then(response => ({ success: true, status: response.status, user: i + 1 }))
                .catch(error => ({ success: false, error: error.message, user: i + 1 }))
        );

        const results = await Promise.all(concurrentRequests);
        const concurrentTime = Date.now() - startTime;

        const successfulRequests = results.filter(r => r.success).length;
        const passed = successfulRequests === 5 && concurrentTime < 3000; // All requests succeed under 3 seconds

        logPerformanceTest(
            'Concurrent User Access',
            passed,
            `${successfulRequests}/5 requests successful`,
            concurrentTime
        );

        // Test concurrent product creation
        const timestamp = Date.now();
        const concurrentCreateTime = Date.now();
        const createRequests = Array(3).fill().map((_, i) =>
            axios.post(`${baseURL}/products`, {
                id: `CONC_PROD_${timestamp}_${i}`,
                name: `Concurrent Test Product ${i}`,
                brand: 'Test Brand',
                uom: 'pcs',
                retail_price: 100,
                wholesale_price: 80,
                cost_price: 60,
                stock_quantity: 50
            }, { headers })
                .then(response => ({ success: true, status: response.status, user: i + 1 }))
                .catch(error => ({ success: false, error: error.message, user: i + 1 }))
        );

        const createResults = await Promise.all(createRequests);
        const createTime = Date.now() - concurrentCreateTime;

        const successfulCreates = createResults.filter(r => r.success).length;
        const createPassed = successfulCreates === 3 && createTime < 2000;

        logPerformanceTest(
            'Concurrent Product Creation',
            createPassed,
            `${successfulCreates}/3 creations successful`,
            createTime
        );

        // Cleanup concurrent test products
        for (let i = 0; i < 3; i++) {
            try {
                await axios.delete(`${baseURL}/products/CONC_PROD_${timestamp}_${i}`, {
                    headers,
                    data: { password: testCredentials.password }
                });
            } catch (error) {
                console.log(`Failed to cleanup concurrent test product ${i}`);
            }
        }

    } catch (error) {
        logPerformanceTest('Concurrent Operations Setup', false, '', 0, error);
    }
}

// Test memory usage and resource efficiency
async function testResourceUsage() {
    console.log('🧠 TESTING RESOURCE USAGE');
    console.log('==========================');

    try {
        const loginResponse = await axios.post(`${baseURL}/auth/login`, testCredentials);
        const authToken = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${authToken}` };

        // Test large data retrieval
        const startTime = Date.now();
        const response = await axios.get(`${baseURL}/products`, { headers });
        const responseTime = Date.now() - startTime;

        const dataSize = JSON.stringify(response.data).length;
        const passed = responseTime < 3000 && dataSize > 0; // Reasonable time and has data

        logPerformanceTest(
            'Large Data Retrieval Efficiency',
            passed,
            `Retrieved ${response.data.length} records (${(dataSize / 1024).toFixed(2)} KB)`,
            responseTime
        );

        // Test multiple sequential requests (simulating heavy usage)
        const sequentialStartTime = Date.now();
        let sequentialSuccessCount = 0;

        for (let i = 0; i < 10; i++) {
            try {
                await axios.get(`${baseURL}/products`, { headers });
                sequentialSuccessCount++;
            } catch (error) {
                console.log(`Sequential request ${i + 1} failed`);
            }
        }

        const sequentialTime = Date.now() - sequentialStartTime;
        const sequentialPassed = sequentialSuccessCount === 10 && sequentialTime < 5000;

        logPerformanceTest(
            'Sequential Request Handling',
            sequentialPassed,
            `${sequentialSuccessCount}/10 sequential requests successful`,
            sequentialTime
        );

    } catch (error) {
        logPerformanceTest('Resource Usage Setup', false, '', 0, error);
    }
}

// Main performance test runner
async function runPerformanceTests() {
    console.log('⚡ COMPREHENSIVE PERFORMANCE TESTING');
    console.log('=====================================');
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log('');

    await testAPIResponseTimes();
    await testDatabasePerformance();
    await testConcurrentOperations();
    await testResourceUsage();

    // Calculate average response time
    const responseTimes = performanceResults.results
        .map(r => parseInt(r.responseTime))
        .filter(t => !isNaN(t) && t > 0);

    if (responseTimes.length > 0) {
        performanceResults.summary.averageResponseTime = Math.round(
            responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        );
    }

    // Generate summary
    console.log('');
    console.log('⚡ PERFORMANCE TEST SUMMARY');
    console.log('============================');
    console.log(`Total Tests: ${performanceResults.summary.total}`);
    console.log(`✅ Passed: ${performanceResults.summary.passed}`);
    console.log(`❌ Failed: ${performanceResults.summary.failed}`);
    console.log(`📊 Success Rate: ${((performanceResults.summary.passed / performanceResults.summary.total) * 100).toFixed(1)}%`);
    console.log(`⏱️ Average Response Time: ${performanceResults.summary.averageResponseTime}ms`);
    console.log(`⏱️ Max Response Time: ${performanceResults.summary.maxResponseTime}ms`);
    console.log(`⏱️ Min Response Time: ${performanceResults.summary.minResponseTime === Infinity ? 'N/A' : performanceResults.summary.minResponseTime + 'ms'}`);
    console.log('');

    if (performanceResults.summary.failed > 0) {
        console.log('❌ PERFORMANCE ISSUES DETECTED:');
        performanceResults.results
            .filter(r => r.status === 'FAIL')
            .forEach(r => console.log(`   • ${r.test}: ${r.details || r.error}`));
    } else {
        console.log('⚡ ALL PERFORMANCE TESTS PASSED - SYSTEM IS OPTIMIZED!');
    }

    // Performance rating
    const successRate = (performanceResults.summary.passed / performanceResults.summary.total) * 100;
    const avgResponseTime = performanceResults.summary.averageResponseTime;

    let rating = 'POOR';
    if (successRate >= 90 && avgResponseTime < 1000) rating = 'EXCELLENT';
    else if (successRate >= 80 && avgResponseTime < 2000) rating = 'GOOD';
    else if (successRate >= 70 && avgResponseTime < 3000) rating = 'FAIR';

    console.log(`🎯 PERFORMANCE RATING: ${rating}`);

    // Save detailed results
    const fs = await import('fs');
    fs.writeFileSync('performance-test-results.json', JSON.stringify(performanceResults, null, 2));
    console.log('📄 Detailed performance test results saved to: performance-test-results.json');
    console.log(`🏁 Performance testing completed at: ${new Date().toISOString()}`);
}

runPerformanceTests().catch(console.error);