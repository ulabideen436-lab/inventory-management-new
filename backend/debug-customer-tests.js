import axios from 'axios';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function debugCustomerIssues() {
    console.log('\n🔍 Debugging Customer Data Issues...\n');

    // Connect to database
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'storeflow'
    });

    // Check database customer types
    console.log('📊 Database Customer Types:');
    const [dbCustomers] = await connection.query(`
        SELECT id, name, type, balance
        FROM customers
        LIMIT 5
    `);
    console.table(dbCustomers);

    // Check customer type distribution
    const [typeDistribution] = await connection.query(`
        SELECT type, COUNT(*) as count
        FROM customers
        GROUP BY type
    `);
    console.log('\n📈 Customer Type Distribution:');
    console.table(typeDistribution);

    // Check for null or empty types
    const [nullTypes] = await connection.query(`
        SELECT COUNT(*) as count
        FROM customers
        WHERE type IS NULL OR type = ''
    `);
    console.log(`\n⚠️  Customers with NULL/empty type: ${nullTypes[0].count}`);

    // Now check API response
    console.log('\n🌐 API Response Check:');
    try {
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            username: 'testowner',
            password: 'test123'
        });
        const token = loginResponse.data.token;

        const response = await axios.get('http://localhost:5000/customers', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`   Total customers from API: ${response.data.length}`);

        if (response.data.length > 0) {
            console.log('\n   Sample Customer from API:');
            console.log(JSON.stringify(response.data[0], null, 2));

            // Check types in API response
            const apiTypes = {};
            response.data.forEach(c => {
                const type = c.type || 'NULL/EMPTY';
                apiTypes[type] = (apiTypes[type] || 0) + 1;
            });
            console.log('\n   API Customer Types:');
            console.table(apiTypes);

            // Check which customers are NOT wholesale
            const nonWholesale = response.data.filter(c =>
                !['long-term', 'longterm', 'wholesale'].includes(c.type?.toLowerCase())
            );
            if (nonWholesale.length > 0) {
                console.log(`\n   ⚠️  ${nonWholesale.length} customers are NOT wholesale type:`);
                console.table(nonWholesale.slice(0, 5).map(c => ({
                    id: c.id,
                    name: c.name,
                    type: c.type,
                    balance: c.balance
                })));
            }
        }
    } catch (error) {
        console.error('❌ API Error:', error.message);
    }

    await connection.end();
}

debugCustomerIssues().catch(console.error);
