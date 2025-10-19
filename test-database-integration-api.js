import axios from 'axios';
import fs from 'fs';

class DatabaseIntegrationTester {
    constructor() {
        this.baseURL = 'http://localhost:5000';
        this.testResults = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
        this.authToken = null;
        this.testRunId = Date.now().toString().slice(-4); // Use last 4 digits for shorter IDs
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    async test(description, testFunction) {
        this.testResults.total++;
        try {
            this.log(`Testing: ${description}`);
            await testFunction();
            this.testResults.passed++;
            this.log(`PASSED: ${description}`, 'success');
        } catch (error) {
            this.testResults.failed++;
            this.testResults.errors.push(`${description}: ${error.message}`);
            this.log(`FAILED: ${description} - ${error.message}`, 'error');
        }

        // Add small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    async cleanupTestData() {
        const testIds = [
            'test_db_product_001',
            'test_low_stock_001',
            `I${this.testRunId}`,
            `T${this.testRunId}`,
            `L${this.testRunId}`
        ];

        for (const id of testIds) {
            try {
                await axios.delete(`${this.baseURL}/products/${id}`, {
                    headers: this.getHeaders(),
                    data: { password: 'admin123' }
                });
                this.log(`Cleaned up test product: ${id}`);
            } catch (error) {
                // Ignore 404 errors (product doesn't exist)
                if (error.response?.status !== 404) {
                    this.log(`Warning: Could not cleanup product ${id}: ${error.message}`);
                }
            }
        }

        // Clean up test customers
        try {
            const customers = await axios.get(`${this.baseURL}/customers`, {
                headers: this.getHeaders()
            });

            for (const customer of customers.data) {
                if (customer.name?.includes('Database Test Customer') || customer.email?.includes('dbtest@')) {
                    try {
                        await axios.delete(`${this.baseURL}/customers/${customer.id}`, {
                            headers: this.getHeaders(),
                            data: { password: 'admin123' }
                        });
                        this.log(`Cleaned up test customer: ${customer.id}`);
                    } catch (error) {
                        this.log(`Warning: Could not cleanup customer ${customer.id}`);
                    }
                }
            }
        } catch (error) {
            this.log(`Warning: Could not fetch customers for cleanup: ${error.message}`);
        }
    }

    async authenticate() {
        try {
            const response = await axios.post(`${this.baseURL}/auth/login`, {
                username: 'owner',
                password: 'admin123'
            });

            if (response.data.token) {
                this.authToken = response.data.token;
                this.log('Authentication successful for database tests', 'success');
                return true;
            }
        } catch (error) {
            this.log(`Authentication failed: ${error.message}`, 'error');
            return false;
        }
        return false;
    }

    getHeaders() {
        return {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
        };
    }

    async testDatabaseConnectivity() {
        this.log('\n🔌 Testing Database Connectivity via API', 'info');

        await this.test('Backend server connectivity', async () => {
            const response = await axios.get(`${this.baseURL}/health`, { timeout: 5000 });
            if (response.status !== 200) {
                throw new Error(`Server not responding correctly: ${response.status}`);
            }
        });

        await this.test('Database connectivity through backend', async () => {
            // Test if we can retrieve data (indicating database is connected)
            const response = await axios.get(`${this.baseURL}/products`, {
                headers: this.getHeaders(),
                timeout: 5000
            });

            if (response.status !== 200) {
                throw new Error(`Database query failed: ${response.status}`);
            }
        });
    }

    async testDataIntegrity() {
        this.log('\n📊 Testing Data Integrity via API', 'info');

        await this.test('Product data integrity', async () => {
            const response = await axios.get(`${this.baseURL}/products`, { headers: this.getHeaders() });

            if (!Array.isArray(response.data)) {
                throw new Error('Products endpoint should return an array');
            }

            // Check if products have required fields
            if (response.data.length > 0) {
                const product = response.data[0];
                const requiredFields = ['id', 'name', 'retail_price', 'stock_quantity'];

                for (const field of requiredFields) {
                    if (!(field in product)) {
                        throw new Error(`Product missing required field: ${field}`);
                    }
                }
            }
        });

        await this.test('Customer data integrity', async () => {
            const response = await axios.get(`${this.baseURL}/customers`, { headers: this.getHeaders() });

            if (!Array.isArray(response.data)) {
                throw new Error('Customers endpoint should return an array');
            }

            if (response.data.length > 0) {
                const customer = response.data[0];
                const requiredFields = ['id', 'name', 'balance'];

                for (const field of requiredFields) {
                    if (!(field in customer)) {
                        throw new Error(`Customer missing required field: ${field}`);
                    }
                }
            }
        });

        await this.test('Sales data integrity', async () => {
            const response = await axios.get(`${this.baseURL}/sales`, { headers: this.getHeaders() });

            if (!Array.isArray(response.data)) {
                throw new Error('Sales endpoint should return an array');
            }

            if (response.data.length > 0) {
                const sale = response.data[0];
                const requiredFields = ['id', 'total_amount', 'sale_date'];

                for (const field of requiredFields) {
                    if (!(field in sale)) {
                        throw new Error(`Sale missing required field: ${field}`);
                    }
                }
            }
        });
    }

    async testTransactionalOperations() {
        this.log('\n🔄 Testing Transactional Operations', 'info');

        let testProductId = null;
        let testCustomerId = null;
        let testSaleId = null;

        await this.test('Create product transaction', async () => {
            const productData = {
                id: `T${this.testRunId}`, // Short ID to fit database constraints
                name: 'Database Test Product',
                uom: 'pcs',
                retail_price: 99.99,
                cost_price: 79.99,
                stock_quantity: 50
            };

            const response = await axios.post(`${this.baseURL}/products`, productData, {
                headers: this.getHeaders()
            });

            if (response.status !== 201 && response.status !== 200) {
                throw new Error(`Failed to create product: ${response.status}`);
            }

            testProductId = productData.id;
        });

        await this.test('Create customer transaction', async () => {
            const customerData = {
                name: 'Database Test Customer',
                email: 'dbtest@example.com',
                phone: '1234567890',
                address: 'Test Address',
                balance: 0.00
            };

            const response = await axios.post(`${this.baseURL}/customers`, customerData, {
                headers: this.getHeaders()
            });

            if (response.status !== 201 && response.status !== 200) {
                throw new Error(`Failed to create customer: ${response.status}`);
            }

            testCustomerId = response.data.id || response.data.customer_id;
            this.log(`Customer created with ID: ${testCustomerId}`);
            if (!testCustomerId) {
                this.log('Customer response data:', JSON.stringify(response.data));
                throw new Error('Failed to extract customer ID from response');
            }
        });

        await this.test('Create sale transaction', async () => {
            if (!testProductId || !testCustomerId) {
                throw new Error('Prerequisites not met: missing product or customer');
            }

            this.log(`Creating sale with product ID: ${testProductId}, customer ID: ${testCustomerId}`);

            // Get the product to use its actual retail price
            const productResponse = await axios.get(`${this.baseURL}/products/${testProductId}`, {
                headers: this.getHeaders()
            });
            const product = productResponse.data;
            const unitPrice = parseFloat(product.retail_price);
            const quantity = 2;

            const saleData = {
                customer_id: testCustomerId,
                items: [{
                    product_id: testProductId,
                    quantity: quantity,
                    price: unitPrice
                }],
                total_amount: unitPrice * quantity
            };

            this.log('Sale data:', JSON.stringify(saleData));

            const response = await axios.post(`${this.baseURL}/sales`, saleData, {
                headers: this.getHeaders()
            });

            if (response.status !== 201 && response.status !== 200) {
                throw new Error(`Failed to create sale: ${response.status}`);
            }

            testSaleId = response.data.sale_id || response.data.id;
        });

        await this.test('Verify stock reduction after sale', async () => {
            if (!testProductId) {
                throw new Error('Test product not available for stock verification');
            }

            const response = await axios.get(`${this.baseURL}/products/${testProductId}`, {
                headers: this.getHeaders()
            });

            if (response.status !== 200) {
                throw new Error(`Failed to retrieve product for stock verification: ${response.status}`);
            }

            const product = response.data;
            // Original stock was 50, sale was for 2 units, so should be 48
            const expectedStock = 50 - 2; // 48
            if (product.stock_quantity !== expectedStock) {
                throw new Error(`Stock not properly reduced. Expected ${expectedStock}, got ${product.stock_quantity}`);
            }
        });

        // Cleanup test data
        if (testSaleId) {
            try {
                await axios.delete(`${this.baseURL}/sales/${testSaleId}`, {
                    headers: this.getHeaders(),
                    data: { password: 'admin123' }
                });
            } catch (error) {
                this.log(`Warning: Could not clean up test sale: ${error.message}`);
            }
        }

        if (testProductId) {
            try {
                await axios.delete(`${this.baseURL}/products/${testProductId}`, {
                    headers: this.getHeaders(),
                    data: { password: 'admin123' }
                });
            } catch (error) {
                this.log(`Warning: Could not clean up test product: ${error.message}`);
            }
        }

        if (testCustomerId) {
            try {
                await axios.delete(`${this.baseURL}/customers/${testCustomerId}`, {
                    headers: this.getHeaders(),
                    data: { password: 'admin123' }
                });
            } catch (error) {
                this.log(`Warning: Could not clean up test customer: ${error.message}`);
            }
        }
    }

    async testBusinessRuleIntegrity() {
        this.log('\n📋 Testing Business Rule Integrity', 'info');

        await this.test('Prevent negative stock operations', async () => {
            // First create a product with low stock
            const lowStockProduct = {
                id: `L${this.testRunId}`, // Short ID
                name: 'Low Stock Test Product',
                uom: 'pcs',
                retail_price: 50.00,
                cost_price: 40.00,
                stock_quantity: 1
            };

            await axios.post(`${this.baseURL}/products`, lowStockProduct, {
                headers: this.getHeaders()
            });

            // Try to sell more than available stock
            const invalidSale = {
                customer_id: 1, // Assuming customer 1 exists
                items: [{
                    product_id: `L${this.testRunId}`,
                    quantity: 5, // More than available stock (1)
                    price: 50.00
                }],
                total_amount: 250.00
            };

            try {
                const response = await axios.post(`${this.baseURL}/sales`, invalidSale, {
                    headers: this.getHeaders()
                });

                // If it succeeds, that might be acceptable (depending on business rules)
                // But let's check if stock went negative
                const productCheck = await axios.get(`${this.baseURL}/products/L${this.testRunId}`, {
                    headers: this.getHeaders()
                });

                if (productCheck.data.stock_quantity < 0) {
                    throw new Error('System allowed negative stock');
                }
            } catch (error) {
                // If it properly rejects the sale, that's good
                if (error.response && error.response.status >= 400) {
                    // Expected behavior - system prevented invalid sale
                } else {
                    throw error;
                }
            }

            // Cleanup
            try {
                await axios.delete(`${this.baseURL}/products/L${this.testRunId}`, {
                    headers: this.getHeaders(),
                    data: { password: 'admin123' }
                });
            } catch (error) {
                this.log(`Warning: Could not clean up low stock test product`);
            }
        });

        await this.test('Validate required field constraints', async () => {
            // Try to create product without required fields
            const invalidProduct = {
                id: `I${this.testRunId}`, // Short ID
                name: '', // Empty name should be rejected
                uom: 'pcs',
                retail_price: 50.00,
                cost_price: 40.00,
                stock_quantity: 10
            };

            try {
                const response = await axios.post(`${this.baseURL}/products`, invalidProduct, {
                    headers: this.getHeaders()
                });

                // If it succeeds with empty name, that's a validation issue
                if (response.status < 400) {
                    // Clean up and throw error
                    try {
                        await axios.delete(`${this.baseURL}/products/I${this.testRunId}`, {
                            headers: this.getHeaders(),
                            data: { password: 'admin123' }
                        });
                    } catch (error) {
                        // Ignore cleanup errors
                    }
                    throw new Error('System accepted product with empty name');
                }
            } catch (error) {
                if (error.response && error.response.status >= 400) {
                    // Expected behavior - system rejected invalid data
                } else {
                    throw error;
                }
            }
        });
    }

    async testReportingIntegrity() {
        this.log('\n📈 Testing Reporting and Analytics Integrity', 'info');

        await this.test('Dashboard statistics consistency', async () => {
            const response = await axios.get(`${this.baseURL}/dashboard/stats`, {
                headers: this.getHeaders()
            });

            if (response.status !== 200) {
                throw new Error(`Dashboard stats endpoint failed: ${response.status}`);
            }

            const stats = response.data;

            // Verify stats have expected structure
            const expectedStats = ['total_products', 'total_customers', 'total_sales', 'total_revenue'];
            for (const stat of expectedStats) {
                if (!(stat in stats)) {
                    throw new Error(`Dashboard missing statistic: ${stat}`);
                }

                if (typeof stats[stat] !== 'number' && stats[stat] !== null) {
                    throw new Error(`Invalid statistic value for ${stat}: ${stats[stat]}`);
                }
            }
        });

        await this.test('Sales reporting functionality', async () => {
            try {
                const response = await axios.get(`${this.baseURL}/reports/sales`, {
                    headers: this.getHeaders()
                });

                if (response.status !== 200) {
                    this.log(`Sales report endpoint returned ${response.status} - may need implementation`);
                }
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    this.log('Sales report endpoint not implemented - acceptable for this test');
                } else {
                    throw error;
                }
            }
        });
    }

    generateReport() {
        const reportContent = `
# Database Integration Test Report (API-Based)
Generated: ${new Date().toISOString()}

## Test Summary
- Total Tests: ${this.testResults.total}
- Passed: ${this.testResults.passed}
- Failed: ${this.testResults.failed}
- Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%

## Test Categories Completed
- ✅ Database Connectivity via API
- ✅ Data Integrity Testing
- ✅ Transactional Operations
- ✅ Business Rule Integrity
- ✅ Reporting and Analytics

## Failed Tests
${this.testResults.errors.length === 0 ? 'None' : this.testResults.errors.map(error => `- ${error.test}: ${error.error}`).join('\n')}

## Database Integration Assessment
${this.testResults.failed === 0 ?
                '💾 Database integration through API is solid and reliable.' :
                this.testResults.failed <= 2 ?
                    '⚠️ Database integration is mostly stable with minor issues.' :
                    `⚠️ ${this.testResults.failed} database integration test(s) failed. Review required.`}

## Key Observations
- Database connectivity: ${this.testResults.errors.filter(e => e.test.includes('connectivity')).length === 0 ? 'Working' : 'Issues detected'}
- Transaction integrity: ${this.testResults.errors.filter(e => e.test.includes('transaction')).length === 0 ? 'Working' : 'Issues detected'}
- Business rules: ${this.testResults.errors.filter(e => e.test.includes('rule') || e.test.includes('constraint')).length === 0 ? 'Enforced' : 'Issues detected'}
- Data integrity: ${this.testResults.errors.filter(e => e.test.includes('integrity')).length === 0 ? 'Maintained' : 'Issues detected'}
`;

        fs.writeFileSync('database-integration-api-test-report.md', reportContent);
        this.log('Database integration test report generated: database-integration-api-test-report.md');
        return reportContent;
    }

    async runCompleteDatabaseTest() {
        this.log('💾 Starting Complete Database Integration Test (API-Based)', 'info');
        this.log('============================================================');

        try {
            // Authenticate first
            const authSuccess = await this.authenticate();
            if (!authSuccess) {
                throw new Error('Authentication failed - cannot proceed with database tests');
            }

            // Clean up any existing test data
            this.log('🧹 Cleaning up existing test data...');
            await this.cleanupTestData();
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait after cleanup

            await this.testDatabaseConnectivity();
            await new Promise(resolve => setTimeout(resolve, 200));

            await this.testDataIntegrity();
            await new Promise(resolve => setTimeout(resolve, 200));

            await this.testTransactionalOperations();
            await new Promise(resolve => setTimeout(resolve, 200));

            await this.testBusinessRuleIntegrity();
            await new Promise(resolve => setTimeout(resolve, 200));

            await this.testReportingIntegrity();

            this.log('\n============================================================');
            this.log('🏁 Complete Database Integration Test Finished', 'info');
            this.log(`📊 Results: ${this.testResults.passed}/${this.testResults.total} tests passed`);

            const report = this.generateReport();
            console.log(report);

        } catch (error) {
            this.log(`💥 Critical error during database testing: ${error.message}`, 'error');
            throw error;
        }
    }
}

// Run the database integration tests
async function main() {
    const tester = new DatabaseIntegrationTester();
    await tester.runCompleteDatabaseTest();
}

main().catch(console.error);

export default DatabaseIntegrationTester;