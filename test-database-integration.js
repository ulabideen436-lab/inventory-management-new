import fs from 'fs';
import { pool } from './backend/src/models/db.js';

class DatabaseIntegrationTester {
    constructor() {
        this.testResults = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: []
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

    async testDatabaseConnection() {
        this.log('\n🔌 Testing Database Connection', 'info');

        await this.test('Database connection establishment', async () => {
            const connection = await pool.getConnection();
            await connection.ping();
            connection.release();
        });

        await this.test('Database connection pool functionality', async () => {
            const connections = [];
            for (let i = 0; i < 3; i++) {
                connections.push(await pool.getConnection());
            }

            // Test that all connections can execute queries
            await Promise.all(connections.map(conn => conn.query('SELECT 1 as test')));

            // Release all connections
            connections.forEach(conn => conn.release());
        });
    }

    async testTableStructure() {
        this.log('\n🏗️ Testing Table Structure', 'info');

        const expectedTables = [
            'users', 'products', 'customers', 'suppliers', 'sales', 'sale_items',
            'purchases', 'customer_payments', 'deleted_items'
        ];

        await this.test('All required tables exist', async () => {
            const [tables] = await pool.query('SHOW TABLES');
            const tableNames = tables.map(row => Object.values(row)[0]);

            for (const expectedTable of expectedTables) {
                if (!tableNames.includes(expectedTable)) {
                    throw new Error(`Missing required table: ${expectedTable}`);
                }
            }
        });

        await this.test('Products table structure', async () => {
            const [columns] = await pool.query('DESCRIBE products');
            const columnNames = columns.map(col => col.Field);

            const requiredColumns = ['id', 'name', 'uom', 'retail_price', 'cost_price', 'stock_quantity', 'deleted_at'];
            for (const col of requiredColumns) {
                if (!columnNames.includes(col)) {
                    throw new Error(`Missing column in products table: ${col}`);
                }
            }
        });

        await this.test('Sales table structure', async () => {
            const [columns] = await pool.query('DESCRIBE sales');
            const columnNames = columns.map(col => col.Field);

            const requiredColumns = ['id', 'customer_id', 'total_amount', 'sale_date', 'deleted_at'];
            for (const col of requiredColumns) {
                if (!columnNames.includes(col)) {
                    throw new Error(`Missing column in sales table: ${col}`);
                }
            }
        });

        await this.test('Customers table structure', async () => {
            const [columns] = await pool.query('DESCRIBE customers');
            const columnNames = columns.map(col => col.Field);

            const requiredColumns = ['id', 'name', 'balance', 'deleted_at'];
            for (const col of requiredColumns) {
                if (!columnNames.includes(col)) {
                    throw new Error(`Missing column in customers table: ${col}`);
                }
            }
        });
    }

    async testForeignKeyConstraints() {
        this.log('\n🔗 Testing Foreign Key Constraints', 'info');

        await this.test('Sale-Customer foreign key constraint', async () => {
            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();

                // Try to create a sale with non-existent customer
                try {
                    await conn.query(
                        'INSERT INTO sales (customer_id, total_amount, sale_date) VALUES (?, ?, NOW())',
                        [99999, 100.00] // Non-existent customer ID
                    );
                    await conn.rollback();
                    throw new Error('Should reject sale with non-existent customer');
                } catch (error) {
                    await conn.rollback();
                    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.message.includes('foreign key constraint')) {
                        // Expected behavior
                        return;
                    }
                    throw error;
                }
            } finally {
                conn.release();
            }
        });

        await this.test('Sale-Items-Product foreign key constraint', async () => {
            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();

                // Create a valid sale first
                const [result] = await conn.query(
                    'INSERT INTO sales (total_amount, sale_date) VALUES (?, NOW())',
                    [100.00]
                );
                const saleId = result.insertId;

                // Try to add sale item with non-existent product
                try {
                    await conn.query(
                        'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                        [saleId, 'nonexistent', 1, 100.00]
                    );
                    await conn.rollback();
                    throw new Error('Should reject sale item with non-existent product');
                } catch (error) {
                    await conn.rollback();
                    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.message.includes('foreign key constraint')) {
                        // Expected behavior
                        return;
                    }
                    throw error;
                }
            } finally {
                conn.release();
            }
        });
    }

    async testTransactionIntegrity() {
        this.log('\n🔄 Testing Transaction Integrity', 'info');

        await this.test('Transaction rollback on error', async () => {
            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();

                // Insert a test record
                await conn.query(
                    'INSERT INTO products (id, name, uom, retail_price, cost_price, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)',
                    ['test_rollback_1', 'Test Product', 'pcs', 100, 80, 10]
                );

                // Verify it exists
                const [beforeRollback] = await conn.query('SELECT * FROM products WHERE id = ?', ['test_rollback_1']);
                if (beforeRollback.length === 0) {
                    throw new Error('Test record not inserted');
                }

                // Rollback the transaction
                await conn.rollback();

                // Verify it doesn't exist after rollback
                const [afterRollback] = await conn.query('SELECT * FROM products WHERE id = ?', ['test_rollback_1']);
                if (afterRollback.length > 0) {
                    throw new Error('Transaction rollback failed - record still exists');
                }

            } finally {
                conn.release();
            }
        });

        await this.test('Transaction commit success', async () => {
            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();

                // Insert a test record
                await conn.query(
                    'INSERT INTO products (id, name, uom, retail_price, cost_price, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)',
                    ['test_commit_1', 'Test Commit Product', 'pcs', 100, 80, 10]
                );

                // Commit the transaction
                await conn.commit();

                // Verify it exists after commit
                const [afterCommit] = await pool.query('SELECT * FROM products WHERE id = ?', ['test_commit_1']);
                if (afterCommit.length === 0) {
                    throw new Error('Transaction commit failed - record does not exist');
                }

                // Cleanup
                await pool.query('DELETE FROM products WHERE id = ?', ['test_commit_1']);

            } finally {
                conn.release();
            }
        });

        await this.test('Complex transaction with multiple operations', async () => {
            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();

                // Create customer
                const [customerResult] = await conn.query(
                    'INSERT INTO customers (name, balance) VALUES (?, ?)',
                    ['Transaction Test Customer', 0.00]
                );
                const customerId = customerResult.insertId;

                // Create product
                await conn.query(
                    'INSERT INTO products (id, name, uom, retail_price, cost_price, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)',
                    ['test_trans_1', 'Transaction Test Product', 'pcs', 150, 100, 20]
                );

                // Create sale
                const [saleResult] = await conn.query(
                    'INSERT INTO sales (customer_id, total_amount, sale_date) VALUES (?, ?, NOW())',
                    [customerId, 300.00]
                );
                const saleId = saleResult.insertId;

                // Add sale item
                await conn.query(
                    'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                    [saleId, 'test_trans_1', 2, 150.00]
                );

                // Update product stock
                await conn.query(
                    'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                    [2, 'test_trans_1']
                );

                // Update customer balance
                await conn.query(
                    'UPDATE customers SET balance = balance + ? WHERE id = ?',
                    [300.00, customerId]
                );

                // Commit all operations
                await conn.commit();

                // Verify all changes
                const [product] = await pool.query('SELECT stock_quantity FROM products WHERE id = ?', ['test_trans_1']);
                const [customer] = await pool.query('SELECT balance FROM customers WHERE id = ?', [customerId]);
                const [sale] = await pool.query('SELECT total_amount FROM sales WHERE id = ?', [saleId]);

                if (product[0].stock_quantity !== 18) {
                    throw new Error('Product stock not updated correctly');
                }
                if (parseFloat(customer[0].balance) !== 300.00) {
                    throw new Error('Customer balance not updated correctly');
                }
                if (parseFloat(sale[0].total_amount) !== 300.00) {
                    throw new Error('Sale amount not recorded correctly');
                }

                // Cleanup
                await pool.query('DELETE FROM sale_items WHERE sale_id = ?', [saleId]);
                await pool.query('DELETE FROM sales WHERE id = ?', [saleId]);
                await pool.query('DELETE FROM products WHERE id = ?', ['test_trans_1']);
                await pool.query('DELETE FROM customers WHERE id = ?', [customerId]);

            } catch (error) {
                await conn.rollback();
                throw error;
            } finally {
                conn.release();
            }
        });
    }

    async testDataConsistency() {
        this.log('\n📊 Testing Data Consistency', 'info');

        await this.test('Product stock consistency', async () => {
            // Check for negative stock quantities
            const [negativeStock] = await pool.query(
                'SELECT COUNT(*) as count FROM products WHERE stock_quantity < 0 AND deleted_at IS NULL'
            );

            if (negativeStock[0].count > 0) {
                throw new Error(`Found ${negativeStock[0].count} products with negative stock`);
            }
        });

        await this.test('Sales-SaleItems relationship consistency', async () => {
            // Check for sales without sale items
            const [orphanSales] = await pool.query(`
                SELECT COUNT(*) as count 
                FROM sales s 
                LEFT JOIN sale_items si ON s.id = si.sale_id 
                WHERE si.sale_id IS NULL AND s.deleted_at IS NULL
            `);

            if (orphanSales[0].count > 0) {
                this.log(`Warning: Found ${orphanSales[0].count} sales without items`);
            }
        });

        await this.test('Customer balance calculation consistency', async () => {
            // This test checks if customer balances are reasonable
            const [customers] = await pool.query(
                'SELECT id, name, balance FROM customers WHERE deleted_at IS NULL'
            );

            for (const customer of customers) {
                if (isNaN(parseFloat(customer.balance))) {
                    throw new Error(`Customer ${customer.name} has invalid balance: ${customer.balance}`);
                }
            }
        });

        await this.test('Deleted items tracking consistency', async () => {
            // Check if deleted items table is properly maintained
            const [deletedItems] = await pool.query(
                'SELECT COUNT(*) as count FROM deleted_items'
            );

            // Should have some deleted items (from previous tests)
            if (deletedItems[0].count === 0) {
                this.log('Info: No deleted items found in tracking table');
            }
        });
    }

    async testIndexes() {
        this.log('\n📇 Testing Database Indexes', 'info');

        await this.test('Primary key indexes exist', async () => {
            const tables = ['users', 'products', 'customers', 'suppliers', 'sales'];

            for (const table of tables) {
                const [indexes] = await pool.query(`SHOW INDEXES FROM ${table} WHERE Key_name = 'PRIMARY'`);
                if (indexes.length === 0) {
                    throw new Error(`Missing primary key index on table: ${table}`);
                }
            }
        });

        await this.test('Foreign key indexes exist', async () => {
            // Check sale_items table has indexes on foreign keys
            const [saleItemsIndexes] = await pool.query(`SHOW INDEXES FROM sale_items`);
            const indexNames = saleItemsIndexes.map(idx => idx.Column_name);

            if (!indexNames.includes('sale_id')) {
                throw new Error('Missing index on sale_items.sale_id');
            }
            if (!indexNames.includes('product_id')) {
                throw new Error('Missing index on sale_items.product_id');
            }
        });
    }

    generateReport() {
        const reportContent = `
# Database Integration Test Report
Generated: ${new Date().toISOString()}

## Test Summary
- Total Tests: ${this.testResults.total}
- Passed: ${this.testResults.passed}
- Failed: ${this.testResults.failed}
- Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%

## Test Categories Completed
- ✅ Database Connection
- ✅ Table Structure
- ✅ Foreign Key Constraints
- ✅ Transaction Integrity
- ✅ Data Consistency
- ✅ Database Indexes

## Failed Tests
${this.testResults.errors.length === 0 ? 'None' : this.testResults.errors.map(error => `- ${error.test}: ${error.error}`).join('\n')}

## Database Health Assessment
${this.testResults.failed === 0 ?
                '💾 Database integration is solid and reliable.' :
                `⚠️ ${this.testResults.failed} database integration test(s) failed. Review required.`}
`;

        fs.writeFileSync('database-integration-test-report.md', reportContent);
        this.log('Database integration test report generated: database-integration-test-report.md');
        return reportContent;
    }

    async runCompleteDatabaseTest() {
        this.log('💾 Starting Complete Database Integration Test', 'info');
        this.log('================================================');

        try {
            await this.testDatabaseConnection();
            await this.testTableStructure();
            await this.testForeignKeyConstraints();
            await this.testTransactionIntegrity();
            await this.testDataConsistency();
            await this.testIndexes();

            this.log('\n================================================');
            this.log('🏁 Complete Database Integration Test Finished', 'info');
            this.log(`📊 Results: ${this.testResults.passed}/${this.testResults.total} tests passed`);

            const report = this.generateReport();
            console.log(report);

        } catch (error) {
            this.log(`💥 Critical error during database testing: ${error.message}`, 'error');
            throw error;
        } finally {
            // Close database connections
            await pool.end();
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