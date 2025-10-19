const mysql = require('mysql2/promise');

async function checkCustomersTableStructure() {
    try {
        const db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Zafaryaqoob.com786',
            database: 'storeflow'
        }); const [rows] = await db.execute('DESCRIBE customers');
        console.log('📋 Customers table structure:\n');

        rows.forEach(row => {
            const isDecimal = row.Type.includes('decimal');
            const marker = isDecimal ? '💰' : '📝';
            console.log(`${marker} ${row.Field}: ${row.Type} (NULL: ${row.Null})`);
        });

        console.log('\n🔍 Decimal fields that need empty string sanitization:');
        const decimalFields = rows.filter(row => row.Type.includes('decimal'));
        decimalFields.forEach(field => {
            console.log(`  - ${field.Field}: ${field.Type}`);
        });

        await db.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkCustomersTableStructure();