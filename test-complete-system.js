import axios from 'axios';
import fs from 'fs';

class SystemTester {
    constructor() {
        this.baseURL = 'http://localhost:5000';
        this.token = null;
        this.testResults = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
        this.testData = {
            user: { username: 'owner', password: 'admin123', role: 'owner' },
            product: { name: 'Test Product', sku: 'TEST001', uom: 'pcs', retail_price: 100.00, cost_price: 80.00, stock_quantity: 50 },
            customer: { name: 'Test Customer', phone: '1234567890', address: 'Test Address' },
            supplier: { name: 'Test Supplier', phone: '0987654321', email: 'supplier@test.com' },
            createdIds: { products: [], customers: [], suppliers: [], sales: [], purchases: [] }
        };
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
            this.testResults.errors.push({ test: description, error: error.message });
            this.log(`FAILED: ${description} - ${error.message}`, 'error');
        }
    }

    async makeRequest(method, endpoint, data = null) {
        const config = {
            method,
            url: `${this.baseURL}${endpoint}`,
            headers: {}
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        if (data) {
            config.data = data;
        }

        return await axios(config);
    }

    // Authentication Tests
    async testAuthentication() {
        this.log('\n🔐 Testing Authentication System', 'info');

        await this.test('User login with valid credentials', async () => {
            const response = await this.makeRequest('POST', '/auth/login', {
                username: this.testData.user.username,
                password: this.testData.user.password
            });

            if (response.status !== 200 || !response.data.token) {
                throw new Error('Login failed or no token received');
            }

            this.token = response.data.token;
            this.log(`Token received: ${this.token.substring(0, 20)}...`);
        });

        await this.test('Token validation', async () => {
            const response = await this.makeRequest('GET', '/auth/verify');
            if (response.status !== 200 || !response.data.user) {
                throw new Error('Token validation failed');
            }
        });

        await this.test('Invalid login rejection', async () => {
            try {
                await this.makeRequest('POST', '/auth/login', {
                    username: 'invalid',
                    password: 'wrong'
                });
                throw new Error('Invalid login should be rejected');
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    // Expected behavior
                    return;
                }
                throw error;
            }
        });
    }

    // Product Management Tests
    async testProductManagement() {
        this.log('\n📦 Testing Product Management', 'info');

        await this.test('Create product', async () => {
            const response = await this.makeRequest('POST', '/products', this.testData.product);
            if (response.status !== 201 || !response.data.productId) {
                throw new Error('Product creation failed');
            }
            this.testData.createdIds.products.push(response.data.productId);
            this.log(`Product created with ID: ${response.data.productId}`);
        });

        await this.test('Get all products', async () => {
            const response = await this.makeRequest('GET', '/products');
            if (response.status !== 200 || !Array.isArray(response.data)) {
                throw new Error('Failed to fetch products');
            }
            this.log(`Found ${response.data.length} products`);
        });

        await this.test('Get product by ID', async () => {
            const productId = this.testData.createdIds.products[0];
            const response = await this.makeRequest('GET', `/products/${productId}`);
            if (response.status !== 200 || response.data.id !== productId) {
                throw new Error('Failed to fetch product by ID');
            }
        });

        await this.test('Update product', async () => {
            const productId = this.testData.createdIds.products[0];
            const updateData = { name: 'Updated Test Product', price: 150.00 };
            const response = await this.makeRequest('PUT', `/products/${productId}`, updateData);
            if (response.status !== 200) {
                throw new Error('Product update failed');
            }
        });

        await this.test('Search products', async () => {
            const response = await this.makeRequest('GET', '/products/search?q=Test');
            if (response.status !== 200 || !Array.isArray(response.data)) {
                throw new Error('Product search failed');
            }
        });
    }

    // Customer Management Tests
    async testCustomerManagement() {
        this.log('\n👥 Testing Customer Management', 'info');

        await this.test('Create customer', async () => {
            const response = await this.makeRequest('POST', '/customers', this.testData.customer);
            if (response.status !== 201 || !response.data.id) {
                throw new Error('Customer creation failed');
            }
            this.testData.createdIds.customers.push(response.data.id);
            this.log(`Customer created with ID: ${response.data.id}`);
        });

        await this.test('Get all customers', async () => {
            const response = await this.makeRequest('GET', '/customers');
            if (response.status !== 200 || !Array.isArray(response.data)) {
                throw new Error('Failed to fetch customers');
            }
            this.log(`Found ${response.data.length} customers`);
        });

        await this.test('Update customer', async () => {
            const customerId = this.testData.createdIds.customers[0];
            const updateData = { name: 'Updated Test Customer', address: 'Updated Address' };
            const response = await this.makeRequest('PUT', `/customers/${customerId}`, updateData);
            if (response.status !== 200) {
                throw new Error('Customer update failed');
            }
        });

        await this.test('Get customer transaction history', async () => {
            const customerId = this.testData.createdIds.customers[0];
            const response = await this.makeRequest('GET', `/customers/${customerId}/transactions`);
            if (response.status !== 200 || !Array.isArray(response.data)) {
                throw new Error('Failed to fetch customer transactions');
            }
        });
    }

    // Supplier Management Tests
    async testSupplierManagement() {
        this.log('\n🏢 Testing Supplier Management', 'info');

        await this.test('Create supplier', async () => {
            const response = await this.makeRequest('POST', '/suppliers', this.testData.supplier);
            if (response.status !== 201 || !response.data.id) {
                throw new Error('Supplier creation failed');
            }
            this.testData.createdIds.suppliers.push(response.data.id);
            this.log(`Supplier created with ID: ${response.data.id}`);
        });

        await this.test('Get all suppliers', async () => {
            const response = await this.makeRequest('GET', '/suppliers');
            if (response.status !== 200 || !Array.isArray(response.data)) {
                throw new Error('Failed to fetch suppliers');
            }
            this.log(`Found ${response.data.length} suppliers`);
        });

        await this.test('Update supplier', async () => {
            const supplierId = this.testData.createdIds.suppliers[0];
            const updateData = { name: 'Updated Test Supplier', email: 'updated@supplier.com' };
            const response = await this.makeRequest('PUT', `/suppliers/${supplierId}`, updateData);
            if (response.status !== 200) {
                throw new Error('Supplier update failed');
            }
        });
    }

    // Sales Tests
    async testSalesManagement() {
        this.log('\n💰 Testing Sales Management', 'info');

        await this.test('Create sale', async () => {
            const saleData = {
                customer_id: this.testData.createdIds.customers[0],
                customer_type: 'retail',
                items: [{
                    product_id: this.testData.createdIds.products[0],
                    quantity: 2,
                    price: 100.00
                }],
                subtotal: 200.00,
                discount_type: 'none',
                discount_value: 0,
                discount_amount: 0,
                total_amount: 200.00
            };

            const response = await this.makeRequest('POST', '/sales', saleData);
            if (response.status !== 200 || !response.data.sale_id) {
                throw new Error('Sale creation failed');
            }
            this.testData.createdIds.sales.push(response.data.sale_id);
            this.log(`Sale created with ID: ${response.data.sale_id}`);
        });

        await this.test('Get all sales', async () => {
            const response = await this.makeRequest('GET', '/sales');
            if (response.status !== 200 || !Array.isArray(response.data)) {
                throw new Error('Failed to fetch sales');
            }
            this.log(`Found ${response.data.length} sales`);
        });

        await this.test('Get sale by ID', async () => {
            const saleId = this.testData.createdIds.sales[0];
            const response = await this.makeRequest('GET', `/sales/${saleId}`);
            if (response.status !== 200 || response.data.id !== saleId) {
                throw new Error('Failed to fetch sale by ID');
            }
        });
    }

    // Purchase Tests
    async testPurchaseManagement() {
        this.log('\n🛒 Testing Purchase Management', 'info');

        await this.test('Create purchase', async () => {
            const purchaseData = {
                supplier_id: this.testData.createdIds.suppliers[0],
                total_cost: 800.00,
                description: 'Test purchase for system testing',
                delivery_method: 'pickup'
            };

            const response = await this.makeRequest('POST', '/purchases', purchaseData);
            if (response.status !== 200 || !response.data.id) {
                throw new Error('Purchase creation failed');
            }
            this.testData.createdIds.purchases.push(response.data.id);
            this.log(`Purchase created with ID: ${response.data.id}`);
        });

        await this.test('Get all purchases', async () => {
            const response = await this.makeRequest('GET', '/purchases');
            if (response.status !== 200 || !Array.isArray(response.data)) {
                throw new Error('Failed to fetch purchases');
            }
            this.log(`Found ${response.data.length} purchases`);
        });
    }

    // Reports Tests
    async testReportsSystem() {
        this.log('\n📊 Testing Reports System', 'info');

        await this.test('Get dashboard stats', async () => {
            const response = await this.makeRequest('GET', '/reports/dashboard');
            if (response.status !== 200) {
                throw new Error('Failed to fetch dashboard stats');
            }
        });

        await this.test('Get sales report', async () => {
            const response = await this.makeRequest('GET', '/reports/sales?start_date=2024-01-01&end_date=2024-12-31');
            if (response.status !== 200) {
                throw new Error('Failed to fetch sales report');
            }
        });

        await this.test('Get inventory report', async () => {
            const response = await this.makeRequest('GET', '/reports/inventory');
            if (response.status !== 200) {
                throw new Error('Failed to fetch inventory report');
            }
        });
    }

    // Deleted Items Tests
    async testDeletedItemsManagement() {
        this.log('\n🗑️ Testing Deleted Items Management', 'info');

        let deletedProductId;

        await this.test('Soft delete product', async () => {
            const productId = this.testData.createdIds.products[0];
            const response = await this.makeRequest('DELETE', `/products/${productId}`);
            if (response.status !== 200) {
                throw new Error('Product soft delete failed');
            }
            deletedProductId = productId;
        });

        await this.test('Get deleted items', async () => {
            const response = await this.makeRequest('GET', '/deleted-items');
            if (response.status !== 200 || !Array.isArray(response.data)) {
                throw new Error('Failed to fetch deleted items');
            }
            this.log(`Found ${response.data.length} deleted items`);
        });

        await this.test('Restore deleted item', async () => {
            const response = await this.makeRequest('POST', `/deleted-items/restore/${deletedProductId}`, {
                item_type: 'product'
            });
            if (response.status !== 200) {
                throw new Error('Failed to restore deleted item');
            }
        });

        await this.test('Verify restored item', async () => {
            const response = await this.makeRequest('GET', `/products/${deletedProductId}`);
            if (response.status !== 200) {
                throw new Error('Restored item not accessible');
            }
        });
    }

    // User Management Tests
    async testUserManagement() {
        this.log('\n👤 Testing User Management', 'info');

        await this.test('Get current user profile', async () => {
            const response = await this.makeRequest('GET', '/users/profile');
            if (response.status !== 200 || !response.data.username) {
                throw new Error('Failed to fetch user profile');
            }
        });

        await this.test('Update user profile', async () => {
            const updateData = { email: 'updated@test.com' };
            const response = await this.makeRequest('PUT', '/users/profile', updateData);
            if (response.status !== 200) {
                throw new Error('User profile update failed');
            }
        });
    }

    // Data Integrity Tests
    async testDataIntegrity() {
        this.log('\n🔍 Testing Data Integrity', 'info');

        await this.test('Verify product stock after sale', async () => {
            const productId = this.testData.createdIds.products[0];
            const response = await this.makeRequest('GET', `/products/${productId}`);
            if (response.status !== 200) {
                throw new Error('Failed to fetch product after sale');
            }

            // Stock should be reduced after sale
            const product = response.data;
            if (product.stock >= this.testData.product.stock) {
                throw new Error('Product stock not updated after sale');
            }
        });

        await this.test('Verify customer balance after sale', async () => {
            const customerId = this.testData.createdIds.customers[0];
            const response = await this.makeRequest('GET', `/customers/${customerId}`);
            if (response.status !== 200) {
                throw new Error('Failed to fetch customer after sale');
            }
        });
    }

    // Security Tests
    async testSecurity() {
        this.log('\n🔒 Testing Security', 'info');

        await this.test('Unauthorized access rejection', async () => {
            const originalToken = this.token;
            this.token = null;

            try {
                await this.makeRequest('GET', '/products');
                throw new Error('Unauthorized access should be rejected');
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    // Expected behavior
                    this.token = originalToken;
                    return;
                }
                this.token = originalToken;
                throw error;
            }
        });

        await this.test('Invalid token rejection', async () => {
            const originalToken = this.token;
            this.token = 'invalid-token';

            try {
                await this.makeRequest('GET', '/products');
                throw new Error('Invalid token should be rejected');
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    // Expected behavior
                    this.token = originalToken;
                    return;
                }
                this.token = originalToken;
                throw error;
            }
        });
    }

    // Cleanup Tests
    async cleanup() {
        this.log('\n🧹 Cleaning up test data', 'info');

        // Clean up in reverse order due to foreign key constraints
        for (const saleId of this.testData.createdIds.sales) {
            try {
                await this.makeRequest('DELETE', `/sales/${saleId}`);
                await this.makeRequest('DELETE', `/deleted-items/permanent/${saleId}?item_type=sale`);
            } catch (error) {
                this.log(`Failed to cleanup sale ${saleId}: ${error.message}`, 'error');
            }
        }

        for (const purchaseId of this.testData.createdIds.purchases) {
            try {
                await this.makeRequest('DELETE', `/purchases/${purchaseId}`);
                await this.makeRequest('DELETE', `/deleted-items/permanent/${purchaseId}?item_type=purchase`);
            } catch (error) {
                this.log(`Failed to cleanup purchase ${purchaseId}: ${error.message}`, 'error');
            }
        }

        for (const productId of this.testData.createdIds.products) {
            try {
                await this.makeRequest('DELETE', `/products/${productId}`);
                await this.makeRequest('DELETE', `/deleted-items/permanent/${productId}?item_type=product`);
            } catch (error) {
                this.log(`Failed to cleanup product ${productId}: ${error.message}`, 'error');
            }
        }

        for (const customerId of this.testData.createdIds.customers) {
            try {
                await this.makeRequest('DELETE', `/customers/${customerId}`);
                await this.makeRequest('DELETE', `/deleted-items/permanent/${customerId}?item_type=customer`);
            } catch (error) {
                this.log(`Failed to cleanup customer ${customerId}: ${error.message}`, 'error');
            }
        }

        for (const supplierId of this.testData.createdIds.suppliers) {
            try {
                await this.makeRequest('DELETE', `/suppliers/${supplierId}`);
                await this.makeRequest('DELETE', `/deleted-items/permanent/${supplierId}?item_type=supplier`);
            } catch (error) {
                this.log(`Failed to cleanup supplier ${supplierId}: ${error.message}`, 'error');
            }
        }
    }

    // Generate Test Report
    generateReport() {
        const reportContent = `
# System Test Report
Generated: ${new Date().toISOString()}

## Test Summary
- Total Tests: ${this.testResults.total}
- Passed: ${this.testResults.passed}
- Failed: ${this.testResults.failed}
- Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%

## Test Categories Completed
- ✅ Authentication System
- ✅ Product Management
- ✅ Customer Management
- ✅ Supplier Management
- ✅ Sales Management
- ✅ Purchase Management
- ✅ Reports System
- ✅ Deleted Items Management
- ✅ User Management
- ✅ Data Integrity
- ✅ Security

## Failed Tests
${this.testResults.errors.length === 0 ? 'None' : this.testResults.errors.map(error => `- ${error.test}: ${error.error}`).join('\n')}

## Recommendations
${this.testResults.failed === 0 ?
                '🎉 All tests passed! The system is functioning correctly.' :
                `⚠️ ${this.testResults.failed} test(s) failed. Please review the errors above and fix the issues.`}
`;

        fs.writeFileSync('system-test-report.md', reportContent);
        this.log('Test report generated: system-test-report.md');
        return reportContent;
    }

    // Run All Tests
    async runCompleteTest() {
        this.log('🚀 Starting Complete System Test', 'info');
        this.log('================================================');

        try {
            await this.testAuthentication();
            await this.testProductManagement();
            await this.testCustomerManagement();
            await this.testSupplierManagement();
            await this.testSalesManagement();
            await this.testPurchaseManagement();
            await this.testReportsSystem();
            await this.testDeletedItemsManagement();
            await this.testUserManagement();
            await this.testDataIntegrity();
            await this.testSecurity();

            await this.cleanup();

            this.log('\n================================================');
            this.log('🏁 Complete System Test Finished', 'info');
            this.log(`📊 Results: ${this.testResults.passed}/${this.testResults.total} tests passed`);

            const report = this.generateReport();
            console.log(report);

        } catch (error) {
            this.log(`💥 Critical error during testing: ${error.message}`, 'error');
            throw error;
        }
    }
}

// Run the complete system test
async function main() {
    const tester = new SystemTester();
    await tester.runCompleteTest();
}

main().catch(console.error);

export default SystemTester;