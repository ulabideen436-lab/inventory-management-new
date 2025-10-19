import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

let passedTests = 0;
let failedTests = 0;

function logTest(name, passed, details = '') {
    if (passed) {
        console.log(`${colors.green}✅ PASS${colors.reset} - ${name}`);
        passedTests++;
    } else {
        console.log(`${colors.red}❌ FAIL${colors.reset} - ${name}`);
        if (details) console.log(`   ${colors.yellow}Details: ${details}${colors.reset}`);
        failedTests++;
    }
}

async function runTests() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'storeflow'
    });

    try {
        console.log('\n🧪 Running Comprehensive Database Tests...\n');
        console.log('='.repeat(60));

        // Test 1: No Retail Customers
        console.log('\n📋 Test 1: Retail Customers Deleted');
        const [retailCustomers] = await connection.query(
            "SELECT COUNT(*) as count FROM customers WHERE type = 'retail'"
        );
        logTest(
            'No retail customers exist',
            retailCustomers[0].count === 0,
            retailCustomers[0].count > 0 ? `Found ${retailCustomers[0].count} retail customers` : ''
        );

        // Test 2: All Customers are Wholesale
        console.log('\n📋 Test 2: Customer Types');
        const [allCustomers] = await connection.query(
            "SELECT COUNT(*) as count FROM customers"
        );
        const [wholesaleCustomers] = await connection.query(
            "SELECT COUNT(*) as count FROM customers WHERE type IN ('long-term', 'longterm', 'wholesale')"
        );
        logTest(
            'All customers are wholesale type',
            allCustomers[0].count === wholesaleCustomers[0].count && allCustomers[0].count > 0,
            `Total: ${allCustomers[0].count}, Wholesale: ${wholesaleCustomers[0].count}`
        );

        // Test 3: No Orphaned Sales
        console.log('\n📋 Test 3: Orphaned Sales Check');
        const [orphanedSales] = await connection.query(`
      SELECT COUNT(*) as count FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.customer_id IS NOT NULL AND c.id IS NULL
    `);
        logTest(
            'No orphaned sales (sales with deleted customers)',
            orphanedSales[0].count === 0,
            orphanedSales[0].count > 0 ? `Found ${orphanedSales[0].count} orphaned sales` : ''
        );

        // Test 4: Sales Types Distribution
        console.log('\n📋 Test 4: Sales Type Distribution');
        const [salesTypes] = await connection.query(`
      SELECT 
        customer_type,
        COUNT(*) as count
      FROM sales
      WHERE deleted_at IS NULL
      GROUP BY customer_type
    `);
        console.log('   Sales breakdown:');
        salesTypes.forEach(row => {
            console.log(`   - ${row.customer_type || 'NULL'}: ${row.count} sales`);
        });
        logTest(
            'Sales have valid types',
            salesTypes.every(row => ['retail', 'longterm', null].includes(row.customer_type)),
            ''
        );

        // Test 5: Retail Sales Have No Customer
        console.log('\n📋 Test 5: Retail Sales Integrity');
        const [retailSalesWithCustomer] = await connection.query(`
      SELECT COUNT(*) as count FROM sales
      WHERE customer_type = 'retail' AND customer_id IS NOT NULL
      AND deleted_at IS NULL
    `);
        logTest(
            'Retail sales have no customer assigned',
            retailSalesWithCustomer[0].count === 0,
            retailSalesWithCustomer[0].count > 0 ? `Found ${retailSalesWithCustomer[0].count} retail sales with customers` : ''
        );

        // Test 6: Wholesale Sales Have Customer
        console.log('\n📋 Test 6: Wholesale Sales Integrity');
        const [wholesaleSalesWithoutCustomer] = await connection.query(`
      SELECT COUNT(*) as count FROM sales
      WHERE customer_type = 'longterm' AND customer_id IS NULL
      AND deleted_at IS NULL
    `);
        const [totalWholesale] = await connection.query(`
      SELECT COUNT(*) as count FROM sales
      WHERE customer_type = 'longterm'
      AND deleted_at IS NULL
    `);
        logTest(
            'Wholesale sales have customer assigned',
            wholesaleSalesWithoutCustomer[0].count === 0,
            wholesaleSalesWithoutCustomer[0].count > 0
                ? `Found ${wholesaleSalesWithoutCustomer[0].count}/${totalWholesale[0].count} wholesale sales without customers`
                : ''
        );

        // Test 7: Customer IDs Match Existing Customers
        console.log('\n📋 Test 7: Customer ID Validity');
        const [invalidCustomerIds] = await connection.query(`
      SELECT COUNT(*) as count FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.customer_id IS NOT NULL AND c.id IS NULL
      AND s.deleted_at IS NULL
    `);
        logTest(
            'All customer IDs reference existing customers',
            invalidCustomerIds[0].count === 0,
            invalidCustomerIds[0].count > 0 ? `Found ${invalidCustomerIds[0].count} invalid customer IDs` : ''
        );

        // Test 8: Database Constraints
        console.log('\n📋 Test 8: Database Schema');
        const [salesColumns] = await connection.query('DESCRIBE sales');
        const customerTypeColumn = salesColumns.find(col => col.Field === 'customer_type');
        logTest(
            'customer_type column exists',
            !!customerTypeColumn,
            !customerTypeColumn ? 'Column not found' : ''
        );

        if (customerTypeColumn) {
            logTest(
                'customer_type has correct enum values',
                customerTypeColumn.Type.includes('retail') && customerTypeColumn.Type.includes('longterm'),
                `Type: ${customerTypeColumn.Type}`
            );
        }

        // Test 9: Recent Sales Activity
        console.log('\n📋 Test 9: Recent Sales');
        const [recentSales] = await connection.query(`
      SELECT 
        id,
        customer_id,
        customer_type,
        total_amount,
        date
      FROM sales
      WHERE deleted_at IS NULL
      ORDER BY date DESC
      LIMIT 5
    `);
        console.log('   Recent 5 sales:');
        recentSales.forEach(sale => {
            const type = sale.customer_type || 'retail';
            const custId = sale.customer_id || 'Walk-in';
            console.log(`   - Sale #${sale.id}: ${type} (Customer: ${custId}) - PKR ${sale.total_amount}`);
        });
        logTest(
            'Recent sales data is consistent',
            recentSales.every(sale =>
                (sale.customer_type === 'retail' && !sale.customer_id) ||
                (sale.customer_type === 'longterm' && sale.customer_id) ||
                (!sale.customer_type && !sale.customer_id)
            ),
            ''
        );

        // Test 10: Customer Count
        console.log('\n📋 Test 10: Customer Statistics');
        const [customerStats] = await connection.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN type IN ('long-term', 'longterm', 'wholesale') THEN 1 END) as wholesale
      FROM customers
    `);
        console.log(`   Total customers: ${customerStats[0].total}`);
        console.log(`   Wholesale customers: ${customerStats[0].wholesale}`);
        logTest(
            'Have wholesale customers',
            customerStats[0].wholesale > 0,
            customerStats[0].wholesale === 0 ? 'No wholesale customers found' : ''
        );

    } catch (error) {
        console.error(`\n${colors.red}❌ Test Error:${colors.reset}`, error.message);
        failedTests++;
    } finally {
        await connection.end();
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 TEST SUMMARY\n');
    console.log(`   Total Tests: ${passedTests + failedTests}`);
    console.log(`   ${colors.green}Passed: ${passedTests}${colors.reset}`);
    console.log(`   ${colors.red}Failed: ${failedTests}${colors.reset}`);
    console.log(`   Pass Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%\n`);

    if (failedTests === 0) {
        console.log(`${colors.green}✅ ALL TESTS PASSED!${colors.reset}\n`);
    } else {
        console.log(`${colors.red}❌ SOME TESTS FAILED${colors.reset}\n`);
    }

    console.log('='.repeat(60) + '\n');
}

runTests()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
